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
    await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        price REAL NOT NULL
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
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
  } else {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            price REAL NOT NULL
          )
        `);
        db.run(`
          CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER,
            guest_name TEXT NOT NULL,
            check_in TEXT NOT NULL,
            check_out TEXT NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
          )
        `, () => resolve());
      });
    });
    // Апгрейд схеми для SQLite: перевіряємо, яких колонок бракує, і додаємо їх
    const existingCols = (await dbAll("PRAGMA table_info(bookings)")).map(c => c.name);
    const wanted = {
      first_name: 'TEXT', last_name: 'TEXT', phone: 'TEXT', email: 'TEXT',
      guest_comment: 'TEXT', staff_note: 'TEXT',
      status: "TEXT DEFAULT 'new'", created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP'
    };
    for (const [col, type] of Object.entries(wanted)) {
      if (!existingCols.includes(col)) {
        await dbRun(`ALTER TABLE bookings ADD COLUMN ${col} ${type}`);
      }
    }
  }

  // Наповнюємо кімнати заглушками до 20 штук, не чіпаючи вже існуючі
  const countRows = await dbAll('SELECT COUNT(*) as count FROM rooms');
  const currentCount = parseInt(countRows[0].count, 10);
  const TARGET_ROOMS = 20;
  if (currentCount < TARGET_ROOMS) {
    const categories = [
      { type: 'Економ', price: 900 },
      { type: 'Стандарт', price: 1300 },
      { type: 'Люкс', price: 2200 },
      { type: 'Апартаменти', price: 3800 }
    ];
    for (let i = currentCount + 1; i <= TARGET_ROOMS; i++) {
      const cat = categories[(i - 1) % categories.length];
      const name = `Номер ${i}: ${cat.type}`;
      await dbRun('INSERT INTO rooms (name, type, price) VALUES (?, ?, ?)', [name, cat.type, cat.price]);
    }
    console.log(`Додано кімнати-заглушки, тепер у базі ${TARGET_ROOMS} номерів (назви можна змінити пізніше).`);
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
  return typeof phone === 'string' && /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim());
}
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Перевіряє, чи вільний номер на вказані дати (перетин інтервалів)
async function isRoomAvailable(room_id, check_in, check_out, excludeBookingId = null) {
  let sql = `
    SELECT id FROM bookings
    WHERE room_id = ?
      AND status != 'cancelled'
      AND check_in < ?
      AND check_out > ?
  `;
  const params = [room_id, check_out, check_in];
  if (excludeBookingId) {
    sql += ' AND id != ?';
    params.push(excludeBookingId);
  }
  const rows = await dbAll(sql, params);
  return rows.length === 0;
}

// Проста авторизація для захищених маршрутів (адмінка / десктоп-програма).
// Клієнт передає пароль адміністратора в заголовку x-admin-key після логіну.
function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (key && key === ADMIN_PASS) return next();
  return res.status(401).json({ error: 'Потрібна авторизація адміністратора.' });
}

/* =========================================================================
   API МАРШРУТИ — КІМНАТИ
========================================================================= */

// Отримати список усіх кімнат
app.get('/api/rooms', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const rows = await dbAll('SELECT * FROM rooms ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Додати нову кімнату (тільки адмін)
app.post('/api/rooms', requireAdmin, async (req, res) => {
  const { name, type, price } = req.body;
  if (!name || !type || price == null) {
    return res.status(400).json({ error: 'Заповніть назву, тип і ціну кімнати.' });
  }
  try {
    const result = await dbRun('INSERT INTO rooms (name, type, price) VALUES (?, ?, ?)', [name, type, price], { returning: true });
    res.status(201).json({ message: 'Кімнату додано.', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Редагувати кімнату (тільки адмін)
app.put('/api/rooms/:id', requireAdmin, async (req, res) => {
  const { name, type, price } = req.body;
  if (!name || !type || price == null) {
    return res.status(400).json({ error: 'Заповніть назву, тип і ціну кімнати.' });
  }
  try {
    await dbRun('UPDATE rooms SET name = ?, type = ?, price = ? WHERE id = ?', [name, type, price, req.params.id]);
    res.json({ message: 'Кімнату оновлено.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Видалити кімнату (тільки адмін) — повʼязані бронювання видаляться каскадно
app.delete('/api/rooms/:id', requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ message: 'Кімнату видалено.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   API МАРШРУТИ — БРОНЮВАННЯ
========================================================================= */

// Створити нове бронювання (з сайту або вручну з десктоп-програми)
app.post('/api/bookings', async (req, res) => {
  const { room_id, first_name, last_name, phone, email, check_in, check_out, guest_comment } = req.body;

  if (!room_id || !first_name || !last_name || !phone || !email || !check_in || !check_out) {
    return res.status(400).json({ error: "Будь ласка, заповніть усі обов'язкові поля!" });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Некоректний номер телефону.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Некоректна електронна адреса.' });
  }
  if (new Date(check_in) >= new Date(check_out)) {
    return res.status(400).json({ error: 'Дата виїзду має бути пізніше дати заїзду.' });
  }

  try {
    const available = await isRoomAvailable(room_id, check_in, check_out);
    if (!available) {
      return res.status(409).json({ error: 'Цей номер вже заброньовано на обрані дати. Оберіть інший номер або інші дати.' });
    }

    const guest_name = `${first_name} ${last_name}`.trim();
    const result = await dbRun(
      `INSERT INTO bookings
        (room_id, guest_name, first_name, last_name, phone, email, check_in, check_out, guest_comment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      [room_id, guest_name, first_name, last_name, phone.trim(), email.trim(), check_in, check_out, guest_comment || null],
      { returning: true }
    );
    console.log(`Нове бронювання #${result.id} збережено (room_id=${room_id}, guest=${guest_name})`);
    res.status(201).json({ message: 'Бронювання успішно створено!', bookingId: result.id });
  } catch (err) {
    console.error('Помилка вставки бронювання:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Отримати список усіх бронювань (для адмінки / десктоп-програми)
app.get('/api/bookings', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const rows = await dbAll(`
      SELECT bookings.id, bookings.room_id,
             COALESCE(rooms.name, 'Номер видалено #' || bookings.room_id) as room_name,
             bookings.first_name, bookings.last_name, bookings.phone, bookings.email,
             bookings.check_in, bookings.check_out, bookings.guest_comment, bookings.staff_note,
             bookings.status, bookings.created_at
      FROM bookings
      LEFT JOIN rooms ON bookings.room_id = rooms.id
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
