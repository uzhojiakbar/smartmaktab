const mongoose = require("mongoose");
const School = require("../../models/School");
const Admin = require("../../models/Admin");
const callbackIds = {};

async function AdminPanel(bot, msg) {
  const chatId = msg.chat.id;

  // Admin bo'lsa, menyu yuborish
  bot.sendMessage(chatId, "🛠️ Admin panelga xush kelibsiz!", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Maktab qo'shish", callback_data: "addSchool" }],
        [{ text: "➕ Admin qo'shish", callback_data: "addAdmin" }],
        [
          {
            text: "🔺 Foydaluvchi paneliga qaytish",
            callback_data: "restart",
          },
        ],
      ],
    },
  });

  bot.on("callback_query", async (query) => {
    if (callbackIds[query.id]) return;
    callbackIds[query.id] = true;
    const chatId = query.message.chat.id;

    await bot.answerCallbackQuery(query.id, {
      text: "🕔 Hozirda!...",
      show_alert: false,
    });

    switch (query.data) {
      case "addSchool":
        bot.deleteMessage(chatId, query.message.message_id);
        await startAddingSchool(bot, chatId);
        break;
      case "addAdmin":
        bot.sendMessage(
          chatId,
          "<b>🆔 Admin ID ni yuboring</b>\n\nmasalan: 2017025737\n\nℹ️ Shaxsiy ID ni bu yerdagi bot qaytaradi: https://t.me/getuseridsbot",
          {
            parse_mode: "HTML",
          }
        );

        bot.once("message", async (response) => {
          const adminId = response.text;
          if (adminId && adminId.match(/^\d+$/)) {
            try {
              const newAdmin = new Admin({
                adminid: adminId,
              });

              await newAdmin.save();
              bot.sendMessage(chatId, "Admin ID muvaffaqiyatli qo'shildi.");
            } catch (err) {
              bot.sendMessage(
                chatId,
                "Xatolik yuz berdi, admin ID qo'shilmadi."
              );
              console.error(err);
            }
          } else {
            bot.sendMessage(chatId, "Iltimos, to'g'ri admin ID kiriting.");
          }
        });
        break;
      case "restartAdmin":
        bot.deleteMessage(chatId, query.message.message_id);
        bot.sendMessage(chatId, "🛠️ Admin panelga xush kelibsiz!", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🏫 Maktab",
                  callback_data: "admin_maktablar",
                },
                {
                  text: "🏫 Maktab gacha ta'lim",
                  callback_data: "admin_maktabgacha",
                },
              ],
              [
                {
                  text: "🔺 Foydaluvchi paneliga qaytish",
                  callback_data: "restart",
                },
              ],
            ],
          },
        });
        break;
    }
  });
}

async function startAddingSchool(bot, chatId) {
  const schoolData = {};

  const askQuestion = async (question, key) => {
    await bot.sendMessage(chatId, question);

    return new Promise((resolve) => {
      bot.once("message", async (response) => {
        schoolData[key] = response.text;
        resolve();
      });
    });
  };

  try {
    await askQuestion(
      "📍 Viloyatni kiriting:\n\nAynan bunday formatda bolishi shart: \nNamangan viloyati",
      "viloyat"
    );
    await askQuestion(
      "📍 Tumanni kiriting:\n\nAynan bunday formatda bolishi shart:\nUchqo'rg'on tumani",
      "tuman"
    );
    await askQuestion(
      "🏫 Maktab nomini kiriting:\n\nAynan bunday formatda bolishi shart:\n1-maktab",
      "nomi"
    );
    await askQuestion(
      "📍 Maktab manzilini kiriting:\n\nAynan bunday formatda bolishi shart:\nMFY nomi, Ko'cha nomi,1-uy  (uy raqami)",
      "location"
    );
    await askQuestion(
      "👤 Direktorning ismini kiriting:\n\nAynan bunday formatda bolishi shart:\nIsm Familiya Otasining ismi",
      "director"
    );
    await askQuestion(
      "📅 Direktor tug'ilgan yilini kiriting:\n\nAynan bunday formatda bolishi shart:\n01/31/1960",
      "directorBirth"
    );
    await askQuestion(
      "🎂 Direktor yoshini kiriting:\n\nAynan bunday formatda bolishi shart:\n52",
      "directorAge"
    );
    await askQuestion(
      "📆 Direktor ishga kirgan yilini kiriting:\n\nAynan bunday formatda bolishi shart:\n01/31/1960",
      "directorWelcome"
    );
    await askQuestion(
      "📅 Direktor necha yildan beri direktor:\n\nAynan bunday formatda bolishi shart:\n7 yil 8 oy ",
      "directorWelcomeMonth"
    );
    await askQuestion(
      "📍 Direktor viloyatini kiriting:\n\nAynan bunday formatda bolishi shart:\nNamangan viloyati",
      "directorLocationViloyat"
    );
    await askQuestion(
      "📍 Direktor tumanini kiriting:\n\nAynan bunday formatda bolishi shart:\nNamangan tumani",
      "directorLocationTuman"
    );
    await askQuestion(
      "🏠 Direktor uy manzilini kiriting:\n\nAynan bunday formatda bolishi shart:\nMFY nomi, Ko'cha nomi,1-uy  (uy raqami)",
      "directorLocationUy"
    );
    await askQuestion(
      "📞 Direktor telefon raqamini kiriting:\n\nAynan bunday formatda bolishi shart:\n90-123-45-67",
      "directorPhone"
    );
    await askQuestion(
      "📝 izoh (bosh qoldirish uchun - ni yuboring):",
      "description"
    );

    const newSchool = new School(schoolData);
    await newSchool.save();

    bot.sendMessage(chatId, "✅ Maktab muvaffaqiyatli qo'shildi!", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: " ⚙️ Admin Panelga kirish", callback_data: "panel" }],
          [
            {
              text: "🔺 Foydaluvchi paneliga qaytish",
              callback_data: "restart",
            },
          ],
        ],
      },
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring!", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: " ⚙️ Admin Panelga kirish", callback_data: "panel" }],
          [
            {
              text: "🔺 Foydaluvchi paneliga qaytish",
              callback_data: "restart",
            },
          ],
        ],
      },
    });
  }
}

module.exports = { AdminPanel };
