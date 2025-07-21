// backend/models/settings.js
import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;