const mongoose = require("mongoose");
const AdminSchema = new mongoose.Schema({
  adminid: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Admin", AdminSchema);
