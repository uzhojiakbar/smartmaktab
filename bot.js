require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const {
  subscribeCheck,
} = require("./commands/checksubscriber/checksubscriber");
const User = require("./models/User");
const { startCommand } = require("./commands/start/start");

// MongoDB ulanish
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDBga ulandi ✅"))
  .catch((err) => console.error("MongoDBga ulanishda xatolik: ❌", err));

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
console.log("Bot faol! 👋");

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  const subscribed = await subscribeCheck(bot, chatId);

  console.log(subscribed);

  if (!subscribed) {
  } else {
    console.log(msg.text);

    if (msg.text === "/start") {
      startCommand(bot, msg);
    }
  }
});
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const encodedData = match[1]; // start parametri ichidagi shifrlangan ma'lumot

  const decodedData = atob(decodeURIComponent(encodedData)); // Base64 formatidan qayta matnni tiklash
  const formData = JSON.parse(decodedData); // JSON obyektiga aylantirish

  console.log(formData); // Ma'lumotlarni konsolga chiqarish

  bot.sendMessage(chatId, `Ma'lumotlar: ${JSON.stringify(formData)}`);
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "check_subscription") {
    if (await subscribeCheck(bot, chatId)) {
      bot.sendMessage(
        chatId,
        "Rahmat! Siz endi botdan to'liq foydalanishingiz mumkin."
      );
    } else {
      bot.sendMessage(
        chatId,
        "Siz hali hamma kanallarga a'zo bo'lmagansiz. Iltimos, barcha kanallarga a'zo bo'ling va yana tekshiring."
      );
    }
  }
});
