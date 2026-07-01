const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');

const token = '8819663348:AAFKL1hwvAsxxFV3BaFdt83iUZfCkX3gBwY';

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет, октагон!');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.toLowerCase() === 'привет') {
    bot.sendMessage(chatId, 'Привет, октагон!');
  }
});