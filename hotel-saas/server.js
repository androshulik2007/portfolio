require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Облікові дані адміністратора
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'hotel_lornet_2026';

app.use(cors());
app.use(express.json());

// Підключення до PostgreSQL (Render автоматично передає DATABASE_URL)
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('Підключено до хмарної бази даних PostgreSQL');

// --- ІНІЦІАЛІЗАЦІЯ БАЗИ ДАНИХ ТА ТАБЛИЦЬ ---
async function initDB() {
  try {
    // Створення таблиці кімнат
    await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        price REAL NOT NULL
      )
    `);

    // Створення таблиці бронювань
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
  } catch (err) {
    console.error('Помилка ініціалізації бази даних:', err.message);
  }
}

initDB();

// --- API МАРШРУТИ ---

// 1. Отримати список усіх кімнат
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM rooms");
    res.json(result.rows);
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
    const query = `INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES ($1, $2, $3, $4) RETURNING id`;
    const result = await db.query(query, [room_id, guest_name, check_in, check_out]);
    res.status(201).json({ message: 'Бронювання успішно створено!', bookingId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Отримати список усіх бронювань (для адмінки)
app.get('/api/bookings', async (req, res) => {
  try {
    const query = `
      SELECT bookings.id, rooms.name as room_name, bookings.guest_name, bookings.check_in, bookings.check_out 
      FROM bookings 
      JOIN rooms ON bookings.room_id = rooms.id
    `;
    const result = await db.query(query);
    res.json(result.rows);
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
