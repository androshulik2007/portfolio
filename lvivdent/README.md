# LvivDent — Стоматологічна клініка

## Структура сайту
- `index.html` — головна
- `services.html` — послуги
- `prices.html` — ціни
- `gallery.html` — галерея клініки + До/Після
- `blog.html` — блог зі статтями
- `admin.html` — адмін-панель для управління блогом
- `sitemap.xml` — мапа сайту для Google
- `robots.txt` — правила для пошукових роботів

## Адмін-панель
1. Відкрий `admin.html`
2. Введи пароль (за замовчуванням: `admin123`)
3. Створюй / редагуй / видаляй статті
4. **ВАЖЛИВО**: зміни пароль у файлі `admin.html` — рядок `const ADMIN_PASSWORD = 'admin123'`

## Форма запису
У файлі `index.html` знайди `YOUR_FORM_ID` і заміни на свій ID з Formspree:
1. Зайди на formspree.io
2. Створи безкоштовний акаунт
3. Створи нову форму
4. Скопіюй ID з URL (типу `mrejnnzw`)
5. Встав замість `YOUR_FORM_ID` у `index.html`

## Фото
Створи папку `photos/` і поклади туди:
- `doctor1.jpg ... doctor4.jpg` — фото лікарів
- `clinic1.jpg ... clinic6.jpg` — фото клініки
- `before1.jpg, after1.jpg` (і далі) — фото До/Після
- `clinic-og.jpg` — превью для соцмереж (1200×630px)

## SEO
✅ Унікальні title і description на кожній сторінці
✅ Open Graph для красивих посилань у Telegram/Facebook
✅ Canonical URL для уникнення дублів
✅ Sitemap.xml для Google
✅ Robots.txt з закритою адмінкою
✅ Структуровані заголовки H1/H2/H3
✅ Alt-теги на фото

Після публікації:
1. Зареєструй сайт у Google Search Console
2. Додай sitemap.xml через Search Console
3. Збоо постав Google Analytics (необов'язково)
