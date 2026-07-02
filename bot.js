const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const mysql = require('mysql2');

const token = '8819663348:AAFKL1hwvAsxxFV3BaFdt83iUZfCkX3gBwY';

const bot = new TelegramBot(token, { polling: true });

// Подключение к MySQL (XAMPP)
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

// Вспомогательная функция форматирования предмета
function formatItem(item) {
  return `(${item.id}) - ${item.name}: ${item.desc}`;
}

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Привет, октагон! Доступные команды:\n' +
    'randomItem - случайный предмет\n' +
    'deleteItem <id> - удалить предмет по ID\n' +
    'getItemByID <id> - получить предмет по ID'
  );
});

// Команда: randomItem
bot.onText(/randomItem/i, (msg) => {
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

// Команда: deleteItem <id>
bot.onText(/deleteItem\s+(\d+)/i, (msg, match) => {
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

// Команда: getItemByID <id>
bot.onText(/getItemByID\s+(\d+)/i, (msg, match) => {
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