/* Сервер сайту + адмінка галереї. Без залежностей: потрібен лише Node.js 18+.
 *
 *   node server.js                      → http://localhost:3000  (сайт)
 *                                         http://localhost:3000/admin/  (адмінка)
 *
 * Змінні середовища:
 *   PORT            порт (за замовчуванням 3000)
 *   ADMIN_PASSWORD  пароль адмінки. ОБОВ'ЯЗКОВИЙ, якщо сервер доступний з інтернету.
 *   ADMIN_USER      логін (за замовчуванням "admin")
 *   HOST            адреса прослуховування. Без пароля — лише 127.0.0.1 (тільки ваш комп'ютер).
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const USER = process.env.ADMIN_USER || 'admin';
const HOST = process.env.HOST || (PASSWORD ? '0.0.0.0' : '127.0.0.1');
const LOOPBACK = ['127.0.0.1', 'localhost', '::1'].includes(HOST);

if (!LOOPBACK && !PASSWORD) {
  console.error('✖ Сервер слухає не лише localhost, але ADMIN_PASSWORD не задано.');
  console.error('  Задайте пароль:  ADMIN_PASSWORD="ваш-довгий-пароль" node server.js');
  process.exit(1);
}

const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'gallery.json');
const PUBLIC_JS = path.join(ROOT, 'gallery-data.js');
const IMG_DIR = path.join(ROOT, 'images', 'gallery');
const ADMIN_DIR = path.join(ROOT, 'admin');

const MAX_UPLOAD = 20 * 1024 * 1024;   // 20 МБ на один файл (браузер стискає до ~1 МБ)
const MAX_PHOTOS_PER_ITEM = 40;
const ID_RE = /^[a-f0-9]{16}$/;

/* ───────────── дані ───────────── */

const DEFAULT_DATA = {
  categories: [
    { id: 'street', label: 'Стріт' },
    { id: 'portrait', label: 'Портретні' },
    { id: 'concert', label: 'Концерти' },
  ],
  items: [],
};

function loadData() {
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (Array.isArray(d.categories) && Array.isArray(d.items)) return d;
  } catch (e) { /* файлу ще немає — створимо */ }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

let data = loadData();

function atomicWrite(file, content) {
  const tmp = file + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

/* Публічна версія для сайту: додаємо шляхи до файлів. */
function publicData() {
  return {
    categories: data.categories,
    items: data.items.map((it) => ({
      id: it.id,
      title: it.title,
      cat: it.cat,
      photos: it.photos.map((p) => ({
        src: 'images/gallery/' + p.id + '.jpg',
        thumb: 'images/gallery/' + p.id + '-t.jpg',
        w: p.w, h: p.h, alt: p.alt,
      })),
    })),
  };
}

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  atomicWrite(DATA_FILE, JSON.stringify(data, null, 2));
  atomicWrite(PUBLIC_JS, 'window.GALLERY_DATA = ' + JSON.stringify(publicData()) + ';\n');
}

/* Усі зміни виконуються по черзі, щоб два запити не затерли один одного. */
let chain = Promise.resolve();
function locked(fn) {
  const p = chain.then(fn);
  chain = p.catch(() => {});
  return p;
}

function usedIds() {
  const s = new Set();
  data.items.forEach((it) => it.photos.forEach((p) => s.add(p.id)));
  return s;
}

function removePhotoFiles(id) {
  [id + '.jpg', id + '-t.jpg'].forEach((f) => {
    try { fs.unlinkSync(path.join(IMG_DIR, f)); } catch (e) { /* вже видалено */ }
  });
}

/* Файли, що були завантажені, але не потрапили в галерею (обрив зв'язку, закрита вкладка), старші за добу — видаляємо. */
function cleanOrphans() {
  try {
    const used = usedIds();
    fs.readdirSync(IMG_DIR).forEach((f) => {
      const m = /^([a-f0-9]{16})(-t)?\.jpg$/.exec(f);
      if (!m || used.has(m[1])) return;
      const full = path.join(IMG_DIR, f);
      if (Date.now() - fs.statSync(full).mtimeMs > 24 * 3600 * 1000) fs.unlinkSync(full);
    });
  } catch (e) { /* каталогу ще немає */ }
}

/* ───────────── валідація ───────────── */

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function str(v, max, field, required) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s) throw new HttpError(400, 'Заповніть поле: ' + field);
  if (s.length > max) throw new HttpError(400, 'Занадто довге поле: ' + field + ' (макс. ' + max + ' символів)');
  return s;
}

function cleanItem(body, ownIds) {
  const title = str(body.title, 120, 'назва', true);
  const cat = data.categories.find((c) => c.id === body.cat);
  if (!cat) throw new HttpError(400, 'Невідома категорія');
  if (!Array.isArray(body.photos) || !body.photos.length) throw new HttpError(400, 'Додайте хоча б одне фото');
  if (body.photos.length > MAX_PHOTOS_PER_ITEM) throw new HttpError(400, 'Забагато фото в одній каруселі (макс. ' + MAX_PHOTOS_PER_ITEM + ')');

  const used = usedIds();
  const seen = new Set();
  const photos = body.photos.map((p) => {
    if (!p || !ID_RE.test(p.id)) throw new HttpError(400, 'Некоректний ідентифікатор фото');
    if (seen.has(p.id)) throw new HttpError(400, 'Те саме фото додано двічі');
    seen.add(p.id);
    if (used.has(p.id) && !ownIds.has(p.id)) throw new HttpError(400, 'Це фото вже використано в іншому записі');
    if (!fs.existsSync(path.join(IMG_DIR, p.id + '.jpg')) || !fs.existsSync(path.join(IMG_DIR, p.id + '-t.jpg'))) {
      throw new HttpError(400, 'Файл фото не знайдено на сервері — завантажте його ще раз');
    }
    const w = Number(p.w), h = Number(p.h);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 20000 || h > 20000) {
      throw new HttpError(400, 'Некоректні розміри фото');
    }
    return { id: p.id, w, h, alt: str(p.alt, 200, 'опис фото', true) };
  });
  return { title, cat: cat.id, photos };
}

/* ───────────── HTTP-утиліти ───────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({}, SECURITY_HEADERS, headers));
  res.end(body);
}
function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, 'Файл завеликий')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const buf = await readBody(req, 1024 * 1024);
  try { return JSON.parse(buf.toString('utf8') || '{}'); }
  catch (e) { throw new HttpError(400, 'Некоректний JSON'); }
}

function safeEq(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function authorized(req) {
  if (!PASSWORD) return true;
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8');
  const i = decoded.indexOf(':');
  if (i < 0) return false;
  const okUser = safeEq(decoded.slice(0, i), USER);
  const okPass = safeEq(decoded.slice(i + 1), PASSWORD);
  return okUser && okPass;
}

/* Захист від DNS-rebinding (коли пароля немає) та CSRF (коли браузер сам підставляє пароль). */
function hostOk(req) {
  if (PASSWORD) return true;
  const host = String(req.headers.host || '').replace(/:\d+$/, '').toLowerCase();
  return ['localhost', '127.0.0.1', '[::1]'].includes(host);
}
function csrfOk(req) {
  if (req.headers['x-requested-with'] !== 'photo-admin') return false;
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return false; } catch (e) { return false; }
  }
  return true;
}

/* ───────────── статичні файли ───────────── */

const PUBLIC_FILES = new Set([
  'index.html', 'privacy.html', 'terms.html', '404.html', 'style.css', 'app.js', 'gallery.js',
  'gallery-data.js', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'robots.txt', 'sitemap.xml',
]);

function serveFile(res, file, extra) {
  fs.readFile(file, (err, buf) => {
    if (err) return serveNotFound(res);
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    send(res, 200, buf, Object.assign({ 'Content-Type': type, 'Cache-Control': 'no-cache' }, extra));
  });
}

function serveNotFound(res) {
  fs.readFile(path.join(ROOT, '404.html'), (err, buf) => {
    send(res, 404, err ? 'Not found' : buf, { 'Content-Type': 'text/html; charset=utf-8' });
  });
}

function within(base, target) {
  const rel = path.relative(base, target);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function handleStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { return serveNotFound(res); }
  if (rel === '/') rel = '/index.html';
  rel = rel.replace(/^\/+/, '');

  if (rel.startsWith('images/')) {
    const file = path.join(ROOT, rel);
    if (!within(path.join(ROOT, 'images'), file)) return serveNotFound(res);
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) return serveNotFound(res);
    // Назви файлів випадкові й не змінюються — можна кешувати надовго.
    return serveFile(res, file, { 'Cache-Control': 'public, max-age=31536000, immutable' });
  }
  if (!PUBLIC_FILES.has(rel)) return serveNotFound(res);
  serveFile(res, path.join(ROOT, rel));
}

function handleAdminStatic(req, res, pathname) {
  let rel = pathname.replace(/^\/admin\/?/, '') || 'index.html';
  const file = path.join(ADMIN_DIR, rel);
  if (!within(ADMIN_DIR, file) || !['.html', '.js', '.css'].includes(path.extname(file))) return serveNotFound(res);
  serveFile(res, file, { 'X-Robots-Tag': 'noindex, nofollow' });
}

/* ───────────── API ───────────── */

async function handleApi(req, res, url) {
  const method = req.method;
  const p = url.pathname;

  if (method === 'GET' && p === '/api/state') {
    return sendJson(res, 200, { categories: data.categories, items: publicData().items });
  }

  if (!csrfOk(req)) throw new HttpError(403, 'Запит заблоковано (перевірка безпеки)');

  /* Завантаження одного файлу (браузер уже стиснув його в JPEG) */
  if (method === 'POST' && p === '/api/upload') {
    const kind = url.searchParams.get('kind');
    if (kind !== 'full' && kind !== 'thumb') throw new HttpError(400, 'Невідомий тип файлу');
    const buf = await readBody(req, MAX_UPLOAD);
    if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
      throw new HttpError(400, 'Очікується JPEG-зображення');
    }
    let id;
    if (kind === 'full') {
      id = crypto.randomBytes(8).toString('hex');
    } else {
      id = url.searchParams.get('id') || '';
      if (!ID_RE.test(id) || !fs.existsSync(path.join(IMG_DIR, id + '.jpg'))) throw new HttpError(400, 'Спочатку завантажте основне фото');
    }
    fs.mkdirSync(IMG_DIR, { recursive: true });
    fs.writeFileSync(path.join(IMG_DIR, id + (kind === 'thumb' ? '-t' : '') + '.jpg'), buf);
    return sendJson(res, 200, { id });
  }

  if (method === 'POST' && p === '/api/items') {
    const body = await readJson(req);
    const item = await locked(() => {
      const clean = cleanItem(body, new Set());
      const it = Object.assign({ id: crypto.randomBytes(6).toString('hex') }, clean);
      data.items.unshift(it);                      // нові — зверху
      save();
      return it;
    });
    return sendJson(res, 201, item);
  }

  let m = /^\/api\/items\/([a-f0-9]{12})$/.exec(p);
  if (m && method === 'PUT') {
    const body = await readJson(req);
    const item = await locked(() => {
      const idx = data.items.findIndex((i) => i.id === m[1]);
      if (idx < 0) throw new HttpError(404, 'Запис не знайдено');
      const old = data.items[idx];
      const own = new Set(old.photos.map((x) => x.id));
      const clean = cleanItem(body, own);
      data.items[idx] = Object.assign({ id: old.id }, clean);
      save();
      const keep = new Set(clean.photos.map((x) => x.id));
      old.photos.forEach((x) => { if (!keep.has(x.id)) removePhotoFiles(x.id); });
      return data.items[idx];
    });
    return sendJson(res, 200, item);
  }
  if (m && method === 'DELETE') {
    await locked(() => {
      const idx = data.items.findIndex((i) => i.id === m[1]);
      if (idx < 0) throw new HttpError(404, 'Запис не знайдено');
      const [old] = data.items.splice(idx, 1);
      save();
      old.photos.forEach((x) => removePhotoFiles(x.id));   // файли видаляються з диска назавжди
    });
    return sendJson(res, 200, { ok: true });
  }

  if (method === 'POST' && p === '/api/order') {
    const body = await readJson(req);
    await locked(() => {
      const ids = Array.isArray(body.ids) ? body.ids : [];
      const cur = data.items.map((i) => i.id);
      if (ids.length !== cur.length || !cur.every((id) => ids.includes(id))) throw new HttpError(400, 'Некоректний порядок');
      data.items = ids.map((id) => data.items.find((i) => i.id === id));
      save();
    });
    return sendJson(res, 200, { ok: true });
  }

  if (method === 'POST' && p === '/api/categories') {
    const body = await readJson(req);
    const cat = await locked(() => {
      const label = str(body.label, 30, 'назва категорії', true);
      if (data.categories.some((c) => c.label.toLowerCase() === label.toLowerCase())) throw new HttpError(400, 'Така категорія вже є');
      const c = { id: 'c' + crypto.randomBytes(4).toString('hex'), label };
      data.categories.push(c);
      save();
      return c;
    });
    return sendJson(res, 201, cat);
  }

  m = /^\/api\/categories\/([A-Za-z0-9_-]{1,20})$/.exec(p);
  if (m && method === 'DELETE') {
    await locked(() => {
      const idx = data.categories.findIndex((c) => c.id === m[1]);
      if (idx < 0) throw new HttpError(404, 'Категорію не знайдено');
      if (data.items.some((i) => i.cat === m[1])) throw new HttpError(400, 'У категорії є фото — спочатку перенесіть або видаліть їх');
      if (data.categories.length === 1) throw new HttpError(400, 'Має лишитися хоча б одна категорія');
      data.categories.splice(idx, 1);
      save();
    });
    return sendJson(res, 200, { ok: true });
  }

  throw new HttpError(404, 'Невідомий запит');
}

/* ───────────── сервер ───────────── */

const server = http.createServer(async (req, res) => {
  try {
    if (!hostOk(req)) return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;

    const isAdmin = p === '/admin' || p.startsWith('/admin/');
    const isApi = p.startsWith('/api/');

    if (isAdmin || isApi) {
      if (!authorized(req)) {
        return send(res, 401, 'Потрібен пароль', {
          'WWW-Authenticate': 'Basic realm="Адмінка галереї", charset="UTF-8"',
          'Content-Type': 'text/plain; charset=utf-8',
        });
      }
      if (p === '/admin') return send(res, 301, '', { Location: '/admin/' });
      if (isAdmin) {
        if (req.method !== 'GET') return send(res, 405, 'Method not allowed');
        return handleAdminStatic(req, res, p);
      }
      return await handleApi(req, res, url);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    handleStatic(req, res, p);
  } catch (e) {
    if (e instanceof HttpError) return sendJson(res, e.status, { error: e.message });
    console.error(e);
    sendJson(res, 500, { error: 'Внутрішня помилка сервера' });
  }
});

fs.mkdirSync(IMG_DIR, { recursive: true });
save();            // гарантує, що gallery-data.js існує й відповідає даним
cleanOrphans();

server.listen(PORT, HOST, () => {
  const shown = LOOPBACK ? 'localhost' : HOST;
  console.log('Сайт:    http://' + shown + ':' + PORT + '/');
  console.log('Адмінка: http://' + shown + ':' + PORT + '/admin/' + (PASSWORD ? '   (логін: ' + USER + ')' : '   (без пароля — доступна лише з цього комп\'ютера)'));
});
