const { TelegramBot } = require('node-telegram-bot-api');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const qr = require('qr-image');
const puppeteer = require('puppeteer');

const token = '8819663348:AAFKL1hwvAsxxFV3BaFdt83iUZfCkX3gBwY';

const bot = new TelegramBot(token, { polling: true });

// ----------------- MySQL подключение -----------------

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ChatBotTests'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err.message);
  } else {
    console.log('Connected to MySQL');
  }
});

// ----------------- Вспомогательные функции -----------------

// Форматирование предмета: "(ID) - NAME: DESC"
function formatItem(item) {
  // предполагаем, что в таблице поля называются id, name, desc
  return `(${item.id}) - ${item.name}: ${item.desc}`;
}

// Убедиться, что есть папка temp для временных файлов
function ensureTempDir() {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  return tempDir;
}

// ----------------- Команда /start -----------------

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Привет, октагон! Доступные команды:\n' +
    'randomItem - случайный предмет из БД\n' +
    'deleteItem <id> - удалить предмет по ID\n' +
    'getItemByID <id> - получить предмет по ID\n' +
    '!qr <текст или ссылка> - сгенерировать QR-код\n' +
    '!webscr <url> - скриншот сайта по адресу'
  );
});

// ----------------- Команда randomItem -----------------

bot.onText(/^randomItem$/i, (msg) => {
  const chatId = msg.chat.id;

  db.query('SELECT * FROM Items ORDER BY RAND() LIMIT 1', (err, rows) => {
    if (err) {
      console.error('DB error (randomItem):', err);
      bot.sendMessage(chatId, 'Ошибка базы данных');
      return;
    }

    if (rows.length === 0) {
      bot.sendMessage(chatId, 'В базе нет предметов');
      return;
    }

    const item = rows[0];
    bot.sendMessage(chatId, formatItem(item));
  });
});

// ----------------- Команда deleteItem <id> -----------------

bot.onText(/^deleteItem\s+(\d+)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const id = Number(match[1]);

  if (!id || Number.isNaN(id)) {
    bot.sendMessage(chatId, 'Ошибка: некорректный ID');
    return;
  }

  db.query('SELECT * FROM Items WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error('DB error (deleteItem - select):', err);
      bot.sendMessage(chatId, 'Ошибка базы данных');
      return;
    }

    if (rows.length === 0) {
      bot.sendMessage(chatId, 'Ошибка: такого предмета нет');
      return;
    }

    db.query('DELETE FROM Items WHERE id = ?', [id], (delErr) => {
      if (delErr) {
        console.error('DB error (deleteItem - delete):', delErr);
        bot.sendMessage(chatId, 'Ошибка базы данных при удалении');
        return;
      }

      bot.sendMessage(chatId, 'Удачно: предмет удалён');
    });
  });
});

// ----------------- Команда getItemByID <id> -----------------

bot.onText(/^getItemByID\s+(\d+)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const id = Number(match[1]);

  if (!id || Number.isNaN(id)) {
    bot.sendMessage(chatId, 'Ошибка: некорректный ID');
    return;
  }

  db.query('SELECT * FROM Items WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error('DB error (getItemByID):', err);
      bot.sendMessage(chatId, 'Ошибка базы данных');
      return;
    }

    if (rows.length === 0) {
      bot.sendMessage(chatId, 'Ошибка: такого предмета нет');
      return;
    }

    const item = rows[0];
    bot.sendMessage(chatId, formatItem(item));
  });
});

// ----------------- Команда !qr <текст/ссылка> -----------------

bot.onText(/^!qr\s+(.+)/i, (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1].trim();

  if (!text) {
    bot.sendMessage(chatId, 'Ошибка: нужно указать текст или ссылку после команды !qr');
    return;
  }

  try {
    const tempDir = ensureTempDir();
    const fileName = `qr_${Date.now()}.png`;
    const filePath = path.join(tempDir, fileName);

    const qrPngStream = qr.image(text, { type: 'png' }); // генератор QR-кода [web:309][web:312]
    const writeStream = fs.createWriteStream(filePath);

    qrPngStream.pipe(writeStream);

    writeStream.on('finish', () => {
      bot.sendPhoto(chatId, filePath, {
        caption: `QR-код для: ${text}`
      })
        .then(() => {
          fs.unlink(filePath, () => {});
        })
        .catch((err) => {
          console.error('Error sending QR image:', err);
          bot.sendMessage(chatId, 'Ошибка при отправке QR-кода');
        });
    });

    writeStream.on('error', (err) => {
      console.error('Error writing QR image:', err);
      bot.sendMessage(chatId, 'Ошибка при генерации QR-кода');
    });
  } catch (err) {
    console.error('Error generating QR:', err);
    bot.sendMessage(chatId, 'Ошибка при генерации QR-кода');
  }
});

// ----------------- Команда !webscr <url> (через puppeteer) -----------------

bot.onText(/^!webscr\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1].trim();

  if (!url) {
    bot.sendMessage(chatId, 'Ошибка: нужно указать веб-адрес после команды !webscr');
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    bot.sendMessage(chatId, 'Ошибка: URL должен начинаться с http:// или https://');
    return;
  }

  const tempDir = ensureTempDir();
  const fileName = `webscr_${Date.now()}.png`;
  const filePath = path.join(tempDir, fileName);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }); // стандартный запуск puppeteer на новых Node [web:323][web:326]

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000); // чуть подождать, чтобы страница стабилизировалась

    await page.screenshot({ path: filePath, fullPage: true });

    await bot.sendPhoto(chatId, filePath, {
      caption: `Скриншот сайта: ${url}`
    });

    fs.unlink(filePath, () => {});
  } catch (err) {
    console.error('Error taking web screenshot with puppeteer:', err);
    bot.sendMessage(chatId, 'Ошибка при создании скриншота сайта');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// ----------------- Простейший лог всех сообщений -----------------

bot.on('message', (msg) => {
  console.log('New message:', msg.text);
});