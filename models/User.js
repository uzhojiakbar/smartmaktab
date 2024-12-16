const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  username: String,
});

module.exports = mongoose.model("User", UserSchema);
