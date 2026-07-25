require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
// ВАЖЛИВО: 'sqlite3' підвантажується нижче лінивим require(), лише якщо
// сервер реально запускається без DATABASE_URL (тобто локально для розробки).
// На Render sqlite3 не потрібен (використовується PostgreSQL), а спроба
// завантажити його нативний бінарник там викликала критичний збій через
// несумісність версій GLIBC — сервер падав ще до старту Express.

const app = express();
const PORT = process.env.PORT || 5000;

// Облікові дані адміністратора
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'hotel_lornet_2026';

// Дозволені джерела (звідки можна робити запити до цього API).
// Додано варіанти з www і без, а також http://127.0.0.1 для локальної розробки.
// За потреби додайте сюди ще домени через кому.
const ALLOWED_ORIGINS = [
  'https://blackwoodstudio.org',
  'https://www.blackwoodstudio.org',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    // дозволяємо запити без origin (наприклад, Postman, health-check)
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

// Проста перевірка стану сервера — корисно, щоб перевірити,
// чи сервер взагалі "прокинувся" і відповідає (актуально для Render free-tier)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Lornet Hotel API працює', production: !!process.env.DATABASE_URL });
});

// Визначаємо, яку базу даних використовувати (PostgreSQL на Render чи SQLite локально)
const isProduction = !!process.env.DATABASE_URL;
let db;

if (isProduction) {
  // Налаштування для PostgreSQL (Render)
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Підключено до хмарної бази даних PostgreSQL');
} else {
  // Налаштування для локальної SQLite (лише для розробки на своєму компʼютері)
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

// --- ІНІЦІАЛІЗАЦІЯ БАЗИ ДАНИХ ТА ТАБЛИЦЬ ---
async function initDB() {
  if (isProduction) {
    // Створення таблиць для PostgreSQL
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

    // Перевірка чи є кімнати, якщо ні — додаємо тестові
    const res = await db.query('SELECT COUNT(*) as count FROM rooms');
    if (parseInt(res.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO rooms (name, type, price) VALUES 
        ('Стандарт #101', 'Standard', 1200),
        ('Стандарт #102', 'Standard', 1200),
        ('Люкс #201', 'Suite', 2500),
        ('Апартаменти #301', 'Apartment', 4000)
      `);
      console.log('Додано тестові кімнати в PostgreSQL!');
    }
  } else {
    // Створення таблиць для SQLite
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
      `, () => {
        db.get("SELECT COUNT(*) as count FROM rooms", (err, row) => {
          if (row.count === 0) {
            db.run(`INSERT INTO rooms (name, type, price) VALUES 
              ('Стандарт #101', 'Standard', 1200),
              ('Стандарт #102', 'Standard', 1200),
              ('Люкс #201', 'Suite', 2500),
              ('Апартаменти #301', 'Apartment', 4000)
            `);
            console.log('Додано тестові кімнати в SQLite!');
          }
        });
      });
    });
  }
}

initDB().catch((err) => {
  console.error('Критична помилка ініціалізації бази даних:', err.message);
  console.error('Сервер продовжує роботу, але запити до БД можуть не працювати, доки проблему не буде виправлено.');
});

// --- API МАРШРУТИ ---

// 1. Отримати список усіх кімнат
app.get('/api/rooms', async (req, res) => {
  res.set('Cache-Control', 'no-store'); // завжди свіжі дані, без кешування
  try {
    if (isProduction) {
      const result = await db.query("SELECT * FROM rooms");
      res.json(result.rows);
    } else {
      db.all("SELECT * FROM rooms", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Створити нове бронювання
app.post('/api/bookings', async (req, res) => {
  const { room_id, guest_name, check_in, check_out } = req.body;

  if (!room_id || !guest_name || !check_in || !check_out) {
    return res.status(400).json({ error: 'Будь ласка, заповніть усі поля!' });
  }

  try {
    if (isProduction) {
      const query = `INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES ($1, $2, $3, $4) RETURNING id`;
      const result = await db.query(query, [room_id, guest_name, check_in, check_out]);
      console.log(`Нове бронювання #${result.rows[0].id} збережено (room_id=${room_id}, guest=${guest_name})`);
      res.status(201).json({ message: 'Бронювання успішно створено!', bookingId: result.rows[0].id });
    } else {
      const query = `INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES (?, ?, ?, ?)`;
      db.run(query, [room_id, guest_name, check_in, check_out], function(err) {
        if (err) {
          console.error('Помилка вставки бронювання:', err.message);
          return res.status(500).json({ error: err.message });
        }
        console.log(`Нове бронювання #${this.lastID} збережено (room_id=${room_id}, guest=${guest_name})`);
        res.status(201).json({ message: 'Бронювання успішно створено!', bookingId: this.lastID });
      });
    }
  } catch (err) {
    console.error('Помилка вставки бронювання:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Отримати список усіх бронювань (для адмінки)
app.get('/api/bookings', async (req, res) => {
  res.set('Cache-Control', 'no-store'); // завжди свіжі дані, без кешування
  try {
    if (isProduction) {
      const query = `
        SELECT bookings.id, COALESCE(rooms.name, 'Номер видалено/не знайдено #' || bookings.room_id) as room_name, bookings.guest_name, bookings.check_in, bookings.check_out 
        FROM bookings 
        LEFT JOIN rooms ON bookings.room_id = rooms.id
        ORDER BY bookings.id DESC
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } else {
      const query = `
        SELECT bookings.id, COALESCE(rooms.name, 'Номер видалено/не знайдено #' || bookings.room_id) as room_name, bookings.guest_name, bookings.check_in, bookings.check_out 
        FROM bookings 
        LEFT JOIN rooms ON bookings.room_id = rooms.id
        ORDER BY bookings.id DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Авторизація адміністратора
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Введіть логін та пароль!' });
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, message: 'Успішний вхід до адмін-панелі!' });
  } else {
    res.status(401).json({ success: false, message: 'Невірний логін або пароль!' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на порту ${PORT}`);
});
