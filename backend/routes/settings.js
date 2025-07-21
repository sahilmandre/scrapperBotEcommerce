// backend/routes/settings.js
import express from "express";
import { getAllSettings, getSetting, setSetting } from "../utils/settings.js";

const router = express.Router();

// GET /api/settings - Get all settings
router.get("/", async (req, res) => {
  try {
    const settings = await getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error("❌ Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// GET /api/settings/:key - Get specific setting
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const value = await getSetting(key);
    
    if (value === null) {
      return res.status(404).json({ error: `Setting ${key} not found` });
    }
    
    res.json({ key, value });
  } catch (error) {
    console.error(`❌ Error fetching setting ${req.params.key}:`, error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// PUT /api/settings/:key - Update specific setting
router.put("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }
    
    // Validate specific settings
    if (key === "DISCOUNT_THRESHOLD") {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        return res.status(400).json({ 
          error: "Discount threshold must be a number between 0 and 100" 
        });
      }
    }
    
    const success = await setSetting(key, value);
    
    if (success) {
      res.json({ 
        message: `Setting ${key} updated successfully`,
        key,
        value 
      });
    } else {
      res.status(500).json({ error: "Failed to update setting" });
    }
  } catch (error) {
    console.error(`❌ Error updating setting ${req.params.key}:`, error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// PUT /api/settings - Update multiple settings
router.put("/", async (req, res) => {
  try {
    const settings = req.body;
    const results = {};
    const errors = {};
    
    for (const [key, value] of Object.entries(settings)) {
      // Validate specific settings
      if (key === "DISCOUNT_THRESHOLD") {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          errors[key] = "Must be a number between 0 and 100";
          continue;
        }
      }
      
      const success = await setSetting(key, value);
      if (success) {
        results[key] = value;
      } else {
        errors[key] = "Failed to update";
      }
    }
    
    res.json({
      message: "Settings update complete",
      updated: results,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;