const Admin = require("../../models/Admin");
const School = require("../../models/School");
const User = require("../../models/User");
const { AdminPanel } = require("../adminpanel/adminpanel");

const callbackIds = {};

async function startCommand(bot, msg) {
  const chatId = msg.chat.id;

  let user = await User.findOne({ telegramId: chatId });

  if (!user) {
    user = new User({
      telegramId: chatId,
      username: msg.from.username,
      firstName: msg.from.first_name,
      lastName: msg.from.last_name,
    });
    await user.save();
  }

  const isAdmin =
    (await Admin.findOne({ adminid: chatId.toString() })) !== null;

  if (isAdmin) {
    bot.sendMessage(
      chatId,
      "🏫 *Smart Maktab* ga xush Kelibsiz!\nPastdagi tugmalardan keraklisini tanlang!",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏫 Maktab", callback_data: "school" },
              { text: "🏫 Maktab gacha ta'lim", callback_data: "schoolgacha" },
            ],
            [{ text: " ⚙️ Admin Panelga kirish", callback_data: "panel" }],
          ],
        },
      }
    );
  } else {
    bot.sendMessage(
      chatId,
      "🏫 *Smart Maktab* ga xush Kelibsiz!\nPastdagi tugmalardan keraklisini tanlang!",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: " 🏫 Maktab", callback_data: "school" },
              { text: " 🏫 Maktab gacha ta'lim", callback_data: "schoolgacha" },
            ],
          ],
        },
      }
    );
  }

  bot.on("callback_query", async (query) => {
    if (callbackIds[query.id]) return;

    callbackIds[query.id] = true;
    const chatId = query.message.chat.id;

    await bot.answerCallbackQuery(query.id, {
      text: "🕔 Yuklanmoqda...",
      show_alert: false,
    });

    await bot.answerCallbackQuery(query.id);

    switch (query.data) {
      // *MAKTABNI TANLASH
      case "school":
        try {
          // Viloyatlarni olish
          const viloyatlar = await School.distinct("viloyat");

          // Viloyat tugmalari yaratish
          const viloyatButtons = viloyatlar.map((viloyat) => [
            { text: viloyat, callback_data: `viloyat_${viloyat}` },
          ]);

          // Inline tugmalar bilan xabar yuborish
          await bot.sendMessage(chatId, "📍 Viloyatni tanlang:", {
            reply_markup: {
              inline_keyboard: [
                ...viloyatButtons,
                [{ text: "🔙 Ortga", callback_data: "restart" }],
              ],
            },
          });

          // Eski xabarni o'chirish
          await bot.deleteMessage(chatId, query.message.message_id);
        } catch (error) {
          console.error("Xatolik yuz berdi:", error);

          // Foydalanuvchiga xatolik haqida xabar berish
          await bot.sendMessage(
            chatId,
            "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring."
          );
        }
        break;

      // Viloyat tanlangandan so'ng tumanlarni chiqarish
      case query.data.startsWith("viloyat_") ? query.data : null:
        try {
          const viloyat = query.data.split("_")[1]; // Viloyat nomini olish
          const tumanlar = await School.distinct("tuman", { viloyat });

          // Tuman tugmalari yaratish
          const tumanButtons = tumanlar.map((tuman) => [
            { text: tuman, callback_data: `tuman_${tuman}` },
          ]);

          // Tumanni tanlash uchun xabar yuborish
          await bot.sendMessage(
            chatId,
            `📍 ${viloyat} viloyati: Tumanni tanlang:`,
            {
              reply_markup: {
                inline_keyboard: [
                  ...tumanButtons,
                  [{ text: "🔙 Ortga", callback_data: "school" }],
                ],
              },
            }
          );

          // Eski xabarni o'chirish
          await bot.deleteMessage(chatId, query.message.message_id);
        } catch (error) {
          console.error("Xatolik yuz berdi:", error);

          // Foydalanuvchiga xatolik haqida xabar berish
          await bot.sendMessage(
            chatId,
            "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring."
          );
        }
        break;

      // Tuman tanlangandan so'ng maktablarni chiqarish
      case query.data.startsWith("tuman_") ? query.data : null:
        try {
          const tuman = query.data.split("_")[1]; // Tuman nomini olish
          const maktablar = await School.find({ tuman }).select("nomi").lean();

          // Maktab tugmalari yaratish
          const maktabButtons = maktablar.map((maktab) => [
            { text: maktab.nomi, callback_data: `maktab_${maktab._id}` },
          ]);

          // Maktabni tanlash uchun xabar yuborish
          await bot.sendMessage(
            chatId,
            `🏫 ${tuman} tumani: Maktabni tanlang:`,
            {
              reply_markup: {
                inline_keyboard: [
                  ...maktabButtons,
                  [
                    {
                      text: "🔙 Ortga",
                      callback_data: `viloyat_${maktablar[0]?.viloyat}`,
                    },
                  ],
                ],
              },
            }
          );

          // Eski xabarni o'chirish
          await bot.deleteMessage(chatId, query.message.message_id);
        } catch (error) {
          console.error("Xatolik yuz berdi:", error);

          // Foydalanuvchiga xatolik haqida xabar berish
          await bot.sendMessage(
            chatId,
            "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring."
          );
        }
        break;

      // Maktab tanlangandan so'ng direktor ma'lumotlarini chiqarish
      case query.data.startsWith("maktab_") ? query.data : null:
        try {
          const maktabId = query.data.split("_")[1]; // Maktab ID sini olish
          const maktab = await School.findById(maktabId);

          // Direktor ma'lumotlarini chiqarish

          const maktabnomi = "*🏫 Maktab nomi:* `" + maktab.nomi + "`\n\n\n";

          const maktabhaqida =
            `\`\`\`📍Maktab_Joylashuvi
${maktab.viloyat}, ${maktab.tuman}
${maktab.location}
          \`\`\`` +
            "\n" +
            "\n" +
            "\n";
          const direcotrInfos =
            `\`\`\`👤Direktor
👤 FISH: ${maktab.director}
🎂 Tug'ilgan sanasi: ${maktab.directorBirth}
🔹 yoshi: ${maktab.directorAge}
📅 Ishga kirgan sana: ${maktab.directorWelcome}
🔹 Necha yildan buyon ishlaydi: ${maktab.directorWelcomeMonth}
          \`\`\`` +
            "\n" +
            "\n" +
            "\n";

          const directorLocation =
            `\`\`\`👤Direktor_Manzili
${maktab.directorLocationViloyat}, ${maktab.directorLocationTuman}
${maktab.directorLocationUy}
          \`\`\`` +
            "\n" +
            "\n" +
            "\n";

          const oth =
            "*📞 Telefon:* `" +
            maktab.directorPhone +
            "`\n" +
            "*📝 Maktab haqida:* `" +
            maktab.description +
            "`";

          const directorInfo =
            maktabnomi + maktabhaqida + direcotrInfos + directorLocation + oth;

          //     const directorInfo =
          //     "**🏫 Maktab nomi:** `" + maktab.nomi + "`\n\n\n"+
          //     "**📍 Viloyat:** `" + maktab.viloyat + "`\n"+
          //     "**📍 Tuman:** `" + maktab.tuman + "`\n"+
          //     "**📍 Manzil:** `" + maktab.location + "`\n"+

          //     "**👤 Direktor FISH:** `" + maktab.director + "`\n"+
          //     "**🎂 Direktor Tug'ilgan sanasi:** `" + maktab.directorBirth + "`\n"+
          //     "**🔹 Direktor yoshi:** `" + maktab.directorAge + "`\n"+
          //     "**📅 Direktor Ishga kirgan sana:** `" + maktab.directorWelcome + "`\n"+
          //     "**🔹 Necha yildan buyon ishlaydi:** `" + maktab.directorWelcomeMonth + "`\n\n"+

          //    + "\n"+ "```" +
          //       "📍Direktor manzili" +
          //       maktab.directorLocationViloyat + "\n"+
          //       maktab.directorLocationTuman + "\n"+
          //       maktab.directorLocationUy + "```" + "\n"
          //     "📞 Telefon: `" + maktab.directorWelcomeMonth + "`\n"+
          //     "📝 Maktab haqida: `" + maktab.description + "`\n"+
          // // 📝 Maktab haqida: ${maktab.description}
          // //     ";

          await bot.sendMessage(chatId, directorInfo, {
            parse_mode: "Markdown",
          });

          // Ortga qaytish tugmasi
          await bot.sendMessage(
            chatId,
            "🔙 Qaytish uchun quyidagilardan birini tanlang:",
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🔙 Tumanga qaytish",
                      callback_data: `tuman_${maktab.tuman}`,
                    },
                  ],
                  [
                    {
                      text: "🔙 Viloyatga qaytish",
                      callback_data: `viloyat_${maktab.viloyat}`,
                    },
                  ],
                ],
              },
            }
          );

          // Eski xabarni o'chirish
          await bot.deleteMessage(chatId, query.message.message_id);
        } catch (error) {
          console.error("Xatolik yuz berdi:", error);

          // Foydalanuvchiga xatolik haqida xabar berish
          await bot.sendMessage(
            chatId,
            "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring."
          );
        }
        break;

      // *BOG'CHANI TANLASh
      case "schoolgacha":
        bot.sendMessage(chatId, "🏫 *Smart Maktab* gacha", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔄 Qaytish", callback_data: "restart" }],
            ],
          },
        });
        bot.deleteMessage(chatId, query.message.message_id);
        break;

      case "panel":
        AdminPanel(bot, msg);
        bot.deleteMessage(chatId, query.message.message_id);
        break;

      // * RESTART
      case "restart":
        bot.deleteMessage(chatId, query.message.message_id);

        if (isAdmin) {
          bot.sendMessage(
            chatId,
            "🏫 *Smart Maktab* ga xush Kelibsiz!\nPastdagi tugmalardan keraklisini tanlang!",
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: " 🏫 Maktab", callback_data: "school" },
                    {
                      text: " 🏫 Maktab gacha ta'lim",
                      callback_data: "schoolgacha",
                    },
                  ],
                  [
                    {
                      text: " ⚙️ Admin Panelga kirish",
                      callback_data: "panel",
                    },
                  ],
                ],
              },
            }
          );
        } else {
          bot.sendMessage(
            chatId,
            "🏫 *Smart Maktab* ga xush Kelibsiz!\nPastdagi tugmalardan keraklisini tanlang!",
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: " 🏫 Maktab", callback_data: "school" },
                    {
                      text: " 🏫 Maktab gacha ta'lim",
                      callback_data: "schoolgacha",
                    },
                  ],
                ],
              },
            }
          );
        }
    }
  });
}

module.exports = { startCommand };
