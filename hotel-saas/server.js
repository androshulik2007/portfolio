require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Облікові дані адміністратора
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'hotel_lornet_2026';

app.use(cors());
app.use(express.json());

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
  // Налаштування для локальної SQLite
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

initDB();

// --- API МАРШРУТИ ---

// 1. Отримати список усіх кімнат
app.get('/api/rooms', async (req, res) => {
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
      res.status(201).json({ message: 'Бронювання успішно створено!', bookingId: result.rows[0].id });
    } else {
      const query = `INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES (?, ?, ?, ?)`;
      db.run(query, [room_id, guest_name, check_in, check_out], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Бронювання успішно створено!', bookingId: this.lastID });
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Отримати список усіх бронювань (для адмінки)
app.get('/api/bookings', async (req, res) => {
  try {
    if (isProduction) {
      const query = `
        SELECT bookings.id, rooms.name as room_name, bookings.guest_name, bookings.check_in, bookings.check_out 
        FROM bookings 
        JOIN rooms ON bookings.room_id = rooms.id
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } else {
      const query = `
        SELECT bookings.id, rooms.name as room_name, bookings.guest_name, bookings.check_in, bookings.check_out 
        FROM bookings 
        JOIN rooms ON bookings.room_id = rooms.id
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