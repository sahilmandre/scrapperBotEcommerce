// backend/utils/settings.js
import Settings from "../models/settings.js";
import dotenv from "dotenv";

dotenv.config();

// The original list from your types.js file
const originalProductTypes = [
  "gadgets",
  "coolers",
  "saree",
  "jeans",
  "tops",
  "shirts",
  "groceries",
  "shoes",
  "watches",
  "bags",
  "laptops",
  "mobiles",
  "tv",
  "furniture",
  "bedroom",
  "branded shirt",
  "branded jeans",
  "Kitchen Appliances",
  "cosmetics",
  "Pressure washer",
  "utensils",
  "kadhai",
  "pan",
  "buiscuits",
  "levis jeans",
  "levis shirts",
  "peter england shirts",
];

// Default settings
const DEFAULT_SETTINGS = {
  DISCOUNT_THRESHOLD: parseInt(process.env.DISCOUNT_THRESHOLD || "80"),
  HEADLESS: process.env.HEADLESS !== "false",
  SCRAPE_INTERVAL: 30, // minutes
  PRODUCT_TYPES: originalProductTypes,
  PINCODE: "452001", // ✅ ADD THIS NEW SETTING
};

// Cache for frequently accessed settings
let settingsCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get a setting value with caching
export async function getSetting(key, defaultValue = null) {
  try {
    // Check cache first
    const now = Date.now();
    if (settingsCache[key] && now - cacheTimestamp < CACHE_DURATION) {
      return settingsCache[key];
    }

    const setting = await Settings.findOne({ key });
    let value;

    if (setting) {
      value = setting.value;
    } else {
      // If setting doesn't exist in DB, use default or create it
      value = DEFAULT_SETTINGS[key] || defaultValue;
      if (value !== null) {
        await setSetting(key, value);
      }
    }

    // Update cache
    if (value !== null) {
      settingsCache[key] = value;
      cacheTimestamp = now;
    }

    return value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return DEFAULT_SETTINGS[key] || defaultValue;
  }
}

// Clear settings cache (call when settings are updated)
export function clearSettingsCache() {
  settingsCache = {};
  cacheTimestamp = 0;
}

// Set a setting value
export async function setSetting(key, value) {
  try {
    await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    // Clear cache when setting is updated
    clearSettingsCache();

    console.log(`✅ Setting ${key} updated to:`, value);
    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
}

// Get all settings
export async function getAllSettings() {
  try {
    const settings = await Settings.find({});
    const settingsObj = {};

    // Add DB settings
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    // Add missing defaults
    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (!(key in settingsObj)) {
        settingsObj[key] = DEFAULT_SETTINGS[key];
      }
    });

    return settingsObj;
  } catch (error) {
    console.error("Error getting all settings:", error);
    return DEFAULT_SETTINGS;
  }
}

// Initialize default settings in DB if they don't exist
export async function initializeSettings() {
  try {
    console.log("🔧 Initializing settings...");

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await Settings.findOne({ key });
      if (!existing) {
        await setSetting(key, value);
        console.log(`✅ Initialized ${key}: ${JSON.stringify(value)}`);
      }
    }

    console.log("✅ Settings initialization complete");
  } catch (error) {
    console.error("❌ Error initializing settings:", error);
  }
}
