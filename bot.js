const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');

const token = '8819663348:AAFKL1hwvAsxxFV3BaFdt83iUZfCkX3gBwY';

const bot = new TelegramBot(token, { polling: true });

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет, октагон! Введи /help, чтобы увидеть список команд.');
});

// /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpText = [
    'Список команд:',
    '/help - показать список команд',
    '/site - отправить ссылку на сайт Октагона',
    '/creator - показать автора бота'
  ].join('\n');

  bot.sendMessage(chatId, helpText);
});

// /site
bot.onText(/\/site/, (msg) => {
  const chatId = msg.chat.id;

  const siteUrl = 'https://octagon-students.ru/beta/profile';

  bot.sendMessage(chatId, `Сайт Октагона: ${siteUrl}`);
});

// /creator
bot.onText(/\/creator/, (msg) => {
  const chatId = msg.chat.id;

  const creatorName = 'Корнилов Илья Викторович';

  bot.sendMessage(chatId, `Создатель бота: ${creatorName}`);
});

// Дополнительно: реакция на "привет"
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!msg.text) return;

  if (msg.text.toLowerCase() === 'привет') {
    bot.sendMessage(chatId, 'Привет, октагон!');
  }
});