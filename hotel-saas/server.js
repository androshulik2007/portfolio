require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
// ВАЖЛИВО: 'sqlite3' підвантажується нижче лінивим require(), лише якщо
// сервер реально запускається без DATABASE_URL (тобто локально для розробки).
// На Render sqlite3 не потрібен (використовується PostgreSQL).

const app = express();
const PORT = process.env.PORT || 5000;

// Облікові дані адміністратора
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'hotel_lornet_2026';

// Дозволені джерела (звідки можна робити запити до цього API).
const ALLOWED_ORIGINS = [
  'https://blackwoodstudio.org',
  'https://www.blackwoodstudio.org',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    // дозволяємо запити без origin (Postman, health-check, десктоп-програма)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS: заблоковано запит з origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Проста перевірка стану сервера
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Lornet Hotel API працює', production: !!process.env.DATABASE_URL });
});

// Визначаємо, яку базу даних використовувати (PostgreSQL на Render чи SQLite локально)
const isProduction = !!process.env.DATABASE_URL;
let db;

if (isProduction) {
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Підключено до хмарної бази даних PostgreSQL');
} else {
  let sqlite3;
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (err) {
    console.error('Не вдалося завантажити модуль sqlite3:', err.message);
    console.error('Якщо ви на Render — переконайтеся, що змінна DATABASE_URL задана в Environment.');
    throw err;
  }
  db = new sqlite3.Database('./hotel.db', (err) => {
    if (err) {
      console.error('Помилка підключення до SQLite:', err.message);
    } else {
      console.log('Успішно підключено до локальної бази даних SQLite (hotel.db)');
    }
  });
}

/* =========================================================================
   УНІВЕРСАЛЬНА ОБГОРТКА НАД БАЗОЮ ДАНИХ
   -------------------------------------------------------------------------
   Весь інший код пише SQL з плейсхолдерами у вигляді "?" (як у SQLite).
   Ці три функції самі перетворюють їх на "$1, $2..." для PostgreSQL і
   виконують запит правильним для поточної БД способом. Завдяки цьому вся
   бізнес-логіка нижче написана один раз, без дублювання if(isProduction).
========================================================================= */
function toPgPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function dbAll(sql, params = []) {
  if (isProduction) {
    return db.query(toPgPlaceholders(sql), params).then(r => r.rows);
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function dbRun(sql, params = [], { returning = false } = {}) {
  if (isProduction) {
    let pgSql = toPgPlaceholders(sql);
    if (returning) pgSql += ' RETURNING id';
    return db.query(pgSql, params).then(r => ({
      id: returning && r.rows[0] ? r.rows[0].id : null,
      rowCount: r.rowCount
    }));
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, rowCount: this.changes });
    });
  });
}

// --- ІНІЦІАЛІЗАЦІЯ БАЗИ ДАНИХ ТА ТАБЛИЦЬ ---
async function initDB() {
  if (isProduction) {
    // Примітка: таблиця "rooms" (окремі пронумеровані кімнати) більше не створюється —
    // бронювання тепер працює тільки за класами номерів (room_classes, нижче).
    // Якщо ця таблиця вже існує з попередніх версій, вона просто залишається в базі
    // недоторканою (для історії), але додаток її більше не використовує.
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        room_id INTEGER,
        guest_name TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL
      )
    `);
    // Апгрейд схеми: додаємо нові поля, якщо їх ще немає (безпечно для вже існуючих даних)
    const alters = [
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS first_name TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_name TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_comment TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_note TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ];
    for (const sql of alters) await db.query(sql);

    // --- НОВЕ: КЛАСИ НОМЕРІВ (бронювання тепер за класом, а не за конкретною кімнатою) ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS room_classes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        amenities TEXT,
        photos TEXT
      )
    `);
    await db.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES room_classes(id) ON DELETE SET NULL");
  } else {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Примітка: таблиця "rooms" більше не створюється — див. коментар вище (Postgres-гілка).
        db.run(`
          CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER,
            guest_name TEXT NOT NULL,
            check_in TEXT NOT NULL,
            check_out TEXT NOT NULL
          )
        `);
        // --- НОВЕ: КЛАСИ НОМЕРІВ (бронювання тепер за класом, а не за конкретною кімнатою) ---
        db.run(`
          CREATE TABLE IF NOT EXISTS room_classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            description TEXT,
            amenities TEXT,
            photos TEXT
          )
        `, () => resolve());
      });
    });
    // Апгрейд схеми для SQLite: перевіряємо, яких колонок бракує, і додаємо їх
    const existingCols = (await dbAll("PRAGMA table_info(bookings)")).map(c => c.name);
    const wanted = {
      first_name: 'TEXT', last_name: 'TEXT', phone: 'TEXT', email: 'TEXT',
      guest_comment: 'TEXT', staff_note: 'TEXT',
      status: "TEXT DEFAULT 'new'", created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
      class_id: 'INTEGER REFERENCES room_classes(id)'
    };
    for (const [col, type] of Object.entries(wanted)) {
      if (!existingCols.includes(col)) {
        await dbRun(`ALTER TABLE bookings ADD COLUMN ${col} ${type}`);
      }
    }
  }

  // Наповнюємо класи номерів початковими даними (ті самі, що раніше були
  // захардкоджені на сайті), лише якщо класів ще немає взагалі.
  const classCountRows = await dbAll('SELECT COUNT(*) as count FROM room_classes');
  const classCount = parseInt(classCountRows[0].count, 10);
  if (classCount === 0) {
    const defaultClasses = [
      {
        name: 'Економ', price: 900, quantity: 5,
        description: 'Компактний номер для короткого перебування — усе необхідне під рукою.',
        amenities: ['Wi-Fi', 'Душ', 'Щоденне прибирання'],
        photos: []
      },
      {
        name: 'Стандарт', price: 1300, quantity: 5,
        description: 'Просторіший номер з видом на вуличку — для ділових поїздок і коротких відпусток.',
        amenities: ['Wi-Fi', 'Сніданок', 'Кондиціонер', 'Сейф'],
        photos: []
      },
      {
        name: 'Люкс', price: 2200, quantity: 5,
        description: 'Окрема зона відпочинку, ванна з латунними деталями та краєвид на дахи центру.',
        amenities: ['Wi-Fi', 'Сніданок', 'Ванна', 'Мінібар', 'Вид на місто'],
        photos: []
      },
      {
        name: 'Апартаменти', price: 3800, quantity: 5,
        description: 'Повноцінні апартаменти з вітальнею та кухнею — для довшого перебування чи родини.',
        amenities: ['Wi-Fi', 'Кухня', 'Вітальня', 'Панорамний вид', 'Консьєрж 24/7'],
        photos: []
      }
    ];
    for (const c of defaultClasses) {
      await dbRun(
        'INSERT INTO room_classes (name, price, quantity, description, amenities, photos) VALUES (?, ?, ?, ?, ?, ?)',
        [c.name, c.price, c.quantity, c.description, JSON.stringify(c.amenities), JSON.stringify(c.photos)]
      );
    }
    console.log('Додано початкові класи номерів (Економ / Стандарт / Люкс / Апартаменти).');
  }
}

initDB().catch((err) => {
  console.error('Критична помилка ініціалізації бази даних:', err.message);
  console.error('Сервер продовжує роботу, але запити до БД можуть не працювати, доки проблему не буде виправлено.');
});

/* =========================================================================
   ВАЛІДАЦІЯ
========================================================================= */
function isValidPhone(phone) {
  // Рівно 10 цифр, без коду країни (наприклад 0971234567)
  return typeof phone === 'string' && /^[0-9]{10}$/.test(phone.trim());
}
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* =========================================================================
   ДОСТУПНІСТЬ ЗА КЛАСОМ НОМЕРУ
   -------------------------------------------------------------------------
   На відміну від окремих кімнат, клас має "quantity" однакових номерів.
   Клас вважається доступним на певний період, якщо кількість активних
   бронювань цього класу, що діють одночасно в будь-який день періоду,
   ніколи не досягає quantity.
========================================================================= */

// Перевіряє, чи є вільний номер класу class_id на весь період [check_in, check_out)
async function isClassAvailable(class_id, check_in, check_out, quantity, excludeBookingId = null) {
  let sql = `
    SELECT check_in, check_out FROM bookings
    WHERE class_id = ?
      AND status != 'cancelled'
      AND check_in < ?
      AND check_out > ?
  `;
  const params = [class_id, check_out, check_in];
  if (excludeBookingId) {
    sql += ' AND id != ?';
    params.push(excludeBookingId);
  }
  const overlapping = await dbAll(sql, params);

  // Зайнятість рівно в момент check_in (бронювання, що почались раніше і ще тривають)
  let count = overlapping.filter(b => b.check_in <= check_in && b.check_out > check_in).length;
  if (count >= quantity) return false;

  // Події (початок/кінець інших бронювань) строго всередині нашого періоду
  const events = [];
  overlapping.forEach(b => {
    if (b.check_in > check_in && b.check_in < check_out) events.push([b.check_in, 1]);
    if (b.check_out > check_in && b.check_out < check_out) events.push([b.check_out, -1]);
  });
  events.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : (a[0] < b[0] ? -1 : 1)));
  for (const [, delta] of events) {
    count += delta;
    if (count >= quantity) return false;
  }
  return true;
}

// Повертає злиті діапазони дат, коли клас ПОВНІСТЮ зайнятий (усі quantity номерів зайняті).
// Формат {check_in, check_out} — сумісний з тим, як фронтенд уже блокує дати в календарі.
async function getFullyBookedRanges(class_id, quantity) {
  const bookings = await dbAll(
    `SELECT check_in, check_out FROM bookings WHERE class_id = ? AND status != 'cancelled'`,
    [class_id]
  );
  if (bookings.length === 0 || quantity <= 0) return [];

  const boundarySet = new Set();
  bookings.forEach(b => { boundarySet.add(b.check_in); boundarySet.add(b.check_out); });
  const boundaries = Array.from(boundarySet).sort();

  const fullRanges = [];
  let rangeStart = null;
  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    const occupied = bookings.filter(b => b.check_in <= segStart && b.check_out > segStart).length;
    if (occupied >= quantity) {
      if (rangeStart === null) rangeStart = segStart;
    } else if (rangeStart !== null) {
      fullRanges.push({ check_in: rangeStart, check_out: segStart });
      rangeStart = null;
    }
  }
  if (rangeStart !== null) fullRanges.push({ check_in: rangeStart, check_out: boundaries[boundaries.length - 1] });
  return fullRanges;
}

// Клас у базі зберігає amenities/photos як JSON-рядок — тут розпаковуємо назад у масиви для клієнта.
function parseClassRow(row) {
  let amenities = [];
  let photos = [];
  try { amenities = row.amenities ? JSON.parse(row.amenities) : []; } catch (_) { amenities = []; }
  try { photos = row.photos ? JSON.parse(row.photos) : []; } catch (_) { photos = []; }
  return { ...row, amenities, photos };
}

// Проста авторизація для захищених маршрутів (адмінка / десктоп-програма).
// Клієнт передає пароль адміністратора в заголовку x-admin-key після логіну.
function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (key && key === ADMIN_PASS) return next();
  return res.status(401).json({ error: 'Потрібна авторизація адміністратора.' });
}

/* =========================================================================
   API МАРШРУТИ — КЛАСИ НОМЕРІВ
   (нове: гість бронює клас номеру, а не конкретну кімнату з номером)
========================================================================= */

// Отримати список усіх класів номерів (публічний маршрут — для сайту)
app.get('/api/room-classes', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const rows = await dbAll('SELECT * FROM room_classes ORDER BY price ASC');
    res.json(rows.map(parseClassRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отримати один клас за id
app.get('/api/room-classes/:id', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM room_classes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Клас номеру не знайдено.' });
    res.json(parseClassRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Публічний маршрут: діапазони дат, коли клас повністю зайнятий (без жодних даних гостя).
// Використовується календарем на сайті, щоб заблокувати недоступні дати.
app.get('/api/room-classes/:id/availability', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const rows = await dbAll('SELECT quantity FROM room_classes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Клас номеру не знайдено.' });
    const ranges = await getFullyBookedRanges(req.params.id, rows[0].quantity);
    res.json(ranges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function validateClassPayload(body) {
  const name = (body.name || '').trim();
  const price = Number(body.price);
  const quantity = body.quantity == null || body.quantity === '' ? 1 : Number(body.quantity);
  const description = (body.description || '').trim();
  const amenities = Array.isArray(body.amenities)
    ? body.amenities.map(a => String(a).trim()).filter(Boolean)
    : [];
  const photos = Array.isArray(body.photos)
    ? body.photos.map(p => String(p).trim()).filter(Boolean)
    : [];

  if (!name) return { error: "Вкажіть назву класу номеру." };
  if (isNaN(price) || price < 0) return { error: 'Вкажіть коректну ціну.' };
  if (isNaN(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
    return { error: 'Кількість номерів цього класу має бути цілим числом, не менше 1.' };
  }
  return { name, price, quantity, description, amenities, photos };
}

// Додати новий клас номерів (тільки адмін)
app.post('/api/room-classes', requireAdmin, async (req, res) => {
  const parsed = validateClassPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const result = await dbRun(
      'INSERT INTO room_classes (name, price, quantity, description, amenities, photos) VALUES (?, ?, ?, ?, ?, ?)',
      [parsed.name, parsed.price, parsed.quantity, parsed.description, JSON.stringify(parsed.amenities), JSON.stringify(parsed.photos)],
      { returning: true }
    );
    res.status(201).json({ message: 'Клас номерів додано.', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Редагувати клас номерів (тільки адмін)
app.put('/api/room-classes/:id', requireAdmin, async (req, res) => {
  const parsed = validateClassPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    await dbRun(
      'UPDATE room_classes SET name = ?, price = ?, quantity = ?, description = ?, amenities = ?, photos = ? WHERE id = ?',
      [parsed.name, parsed.price, parsed.quantity, parsed.description, JSON.stringify(parsed.amenities), JSON.stringify(parsed.photos), req.params.id]
    );
    res.json({ message: 'Клас номерів оновлено.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Видалити клас номерів (тільки адмін) — бронювання цього класу лишаються в історії
// (клас у них просто позначиться як видалений), номерна класифікація не видаляє гостьові записи.
app.delete('/api/room-classes/:id', requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM room_classes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Клас номерів видалено.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   API МАРШРУТИ — БРОНЮВАННЯ
========================================================================= */

// Створити нове бронювання (з сайту або вручну з десктоп-програми)
// Гість бронює КЛАС номеру (class_id), конкретний номер сервер призначає не обираючи вручну —
// достатньо, щоб кількість активних бронювань класу не перевищувала його quantity.
app.post('/api/bookings', async (req, res) => {
  const { class_id, first_name, last_name, phone, email, check_in, check_out, guest_comment } = req.body;

  // email тепер опційний — не входить у перелік обов'язкових полів
  if (!class_id || !first_name || !last_name || !phone || !check_in || !check_out) {
    return res.status(400).json({ error: "Будь ласка, заповніть усі обов'язкові поля!" });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Номер телефону має містити рівно 10 цифр (без +38).' });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Некоректна електронна адреса.' });
  }
  if (new Date(check_in) >= new Date(check_out)) {
    return res.status(400).json({ error: 'Дата виїзду має бути пізніше дати заїзду.' });
  }

  try {
    const classRows = await dbAll('SELECT * FROM room_classes WHERE id = ?', [class_id]);
    if (classRows.length === 0) {
      return res.status(404).json({ error: 'Обраний клас номеру не знайдено.' });
    }
    const roomClass = classRows[0];

    const available = await isClassAvailable(class_id, check_in, check_out, roomClass.quantity);
    if (!available) {
      return res.status(409).json({ error: 'На жаль, номерів цього класу вже немає на обрані дати. Оберіть інші дати або інший клас.' });
    }

    const guest_name = `${first_name} ${last_name}`.trim();
    const result = await dbRun(
      `INSERT INTO bookings
        (class_id, guest_name, first_name, last_name, phone, email, check_in, check_out, guest_comment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      [class_id, guest_name, first_name, last_name, phone.trim(), email ? email.trim() : null, check_in, check_out, guest_comment || null],
      { returning: true }
    );
    console.log(`Нове бронювання #${result.id} збережено (class_id=${class_id}, guest=${guest_name})`);
    res.status(201).json({ message: 'Бронювання успішно створено!', bookingId: result.id });
  } catch (err) {
    console.error('Помилка вставки бронювання:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Отримати список усіх бронювань (для адмінки / десктоп-програми)
app.get('/api/bookings', requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const rows = await dbAll(`
      SELECT bookings.id, bookings.class_id,
             COALESCE(room_classes.name, 'Клас видалено') as class_name,
             COALESCE(room_classes.name, 'Клас видалено') as room_name,
             bookings.first_name, bookings.last_name, bookings.phone, bookings.email,
             bookings.check_in, bookings.check_out, bookings.guest_comment, bookings.staff_note,
             bookings.status, bookings.created_at
      FROM bookings
      LEFT JOIN room_classes ON bookings.class_id = room_classes.id
      ORDER BY bookings.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Змінити статус бронювання: new / confirmed / cancelled (тільки адмін)
app.patch('/api/bookings/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['new', 'confirmed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Недопустимий статус.' });
  }
  try {
    await dbRun('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Статус бронювання оновлено.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Зберегти внутрішню нотатку працівника біля бронювання (тільки адмін)
app.patch('/api/bookings/:id/note', requireAdmin, async (req, res) => {
  const { staff_note } = req.body;
  try {
    await dbRun('UPDATE bookings SET staff_note = ? WHERE id = ?', [staff_note || '', req.params.id]);
    res.json({ message: 'Нотатку збережено.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Видалити одне бронювання (тільки адмін)
app.delete('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ message: 'Бронювання видалено.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Масово змінити статус декількох бронювань одразу (тільки адмін)
app.patch('/api/bookings/bulk-status', requireAdmin, async (req, res) => {
  const { ids, status } = req.body;
  const allowedStatuses = ['new', 'confirmed', 'cancelled'];
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Не передано жодного ID бронювання.' });
  }
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Недопустимий статус.' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await dbRun(`UPDATE bookings SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);
    res.json({ message: `Статус оновлено для ${ids.length} бронювань.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Масово видалити декілька бронювань одразу (тільки адмін)
// ПОСТ, а не DELETE — щоб шлях не збігався з "/api/bookings/:id" (де :id міг би стати "bulk-delete")
app.post('/api/bookings/bulk-delete', requireAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Не передано жодного ID бронювання.' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await dbRun(`DELETE FROM bookings WHERE id IN (${placeholders})`, ids);
    res.json({ message: `Видалено бронювань: ${ids.length}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   АВТОРИЗАЦІЯ АДМІНІСТРАТОРА
========================================================================= */
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Введіть логін та пароль!' });
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // adminKey повертається клієнту (сайту чи десктоп-програмі), і він передає
    // його далі в заголовку x-admin-key для доступу до захищених маршрутів.
    res.json({ success: true, message: 'Успішний вхід до адмін-панелі!', adminKey: ADMIN_PASS });
  } else {
    res.status(401).json({ success: false, message: 'Невірний логін або пароль!' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на порту ${PORT}`);
});
