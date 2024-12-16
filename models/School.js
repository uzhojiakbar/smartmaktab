// models/School.js
const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
  viloyat: { type: String, default: "Namangan viloyati" },
  tuman: { type: String, default: "Uchqo'rg'on tumani" },
  nomi: { type: String },
  location: { type: String },
  director: { type: String },
  directorBirth: { type: String },
  directorAge: { type: Number },
  directorWelcome: { type: String },
  directorWelcomeMonth: { type: String },
  directorLocationViloyat: { type: String },
  directorLocationTuman: { type: String },
  directorLocationUy: { type: String },
  directorPhone: { type: String },
  description: { type: String },
});

const School = mongoose.model("School", schoolSchema);

module.exports = School;
