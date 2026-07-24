require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 5000;

// Облікові дані адміністратора (можна змінити у файлі .env або безпосередньо тут)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'hotel_lornet_2026';

// Мідлварі
app.use(cors());
app.use(express.json());

// Підключення до SQLite
const db = new sqlite3.Database('./hotel.db', (err) => {
  if (err) {
    console.error('Помилка підключення до SQLite:', err.message);
  } else {
    console.log('Успішно підключено до бази даних SQLite (hotel.db)');
  }
});

// Ініціалізація таблиць та додавання тестових даних
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
    // Перевіримо, чи є вже кімнати в базі. Якщо немає — додамо тестові
    db.get("SELECT COUNT(*) as count FROM rooms", (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO rooms (name, type, price) VALUES 
          ('Стандарт #101', 'Standard', 1200),
          ('Стандарт #102', 'Standard', 1200),
          ('Люкс #201', 'Suite', 2500),
          ('Апартаменти #301', 'Apartment', 4000)
        `);
        console.log('Додано тестові кімнати в базу даних!');
      }
    });
  });
});

// --- API МАРШРУТИ ---

// 1. Отримати список усіх кімнат
app.get('/api/rooms', (req, res) => {
  db.all("SELECT * FROM rooms", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 2. Створити нове бронювання
app.post('/api/bookings', (req, res) => {
  const { room_id, guest_name, check_in, check_out } = req.body;

  if (!room_id || !guest_name || !check_in || !check_out) {
    return res.status(400).json({ error: 'Будь ласка, заповніть усі поля!' });
  }

  const query = `INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES (?, ?, ?, ?)`;
  
  db.run(query, [room_id, guest_name, check_in, check_out], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      message: 'Бронювання успішно створено!', 
      bookingId: this.lastID 
    });
  });
});

// 3. Отримати список усіх бронювань (для адмінки готелю)
app.get('/api/bookings', (req, res) => {
  const query = `
    SELECT bookings.id, rooms.name as room_name, bookings.guest_name, bookings.check_in, bookings.check_out 
    FROM bookings 
    JOIN rooms ON bookings.room_id = rooms.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
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