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

// GET /api/settings/:key - Get a specific setting
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const value = await getSetting(key);

    if (value === null) {
      return res.status(404).json({ error: `Setting '${key}' not found` });
    }

    res.json({ key, value });
  } catch (error) {
    console.error(`❌ Error fetching setting '${req.params.key}':`, error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// PUT /api/settings/:key - Update a specific setting
router.put("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }

    // --- Validation Logic ---
    if (key === "DISCOUNT_THRESHOLD") {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        return res.status(400).json({
          error: "Discount threshold must be a number between 0 and 100",
        });
      }
    }

    if (key === "PRODUCT_TYPES") {
      if (
        !Array.isArray(value) ||
        !value.every((item) => typeof item === "string" && item.trim() !== "")
      ) {
        return res.status(400).json({
          error: "PRODUCT_TYPES must be an array of non-empty strings.",
        });
      }
    }

    // ✅ NEW: Validate PINCODE
    if (key === "PINCODE") {
      if (typeof value !== "string" || !/^\d{6}$/.test(value)) {
        return res
          .status(400)
          .json({ error: "Pincode must be a 6-digit string." });
      }
    }
    // --- End Validation ---

    const success = await setSetting(key, value);

    if (success) {
      res.json({
        message: `Setting '${key}' updated successfully`,
        key,
        value,
      });
    } else {
      res.status(500).json({ error: `Failed to update setting '${key}'` });
    }
  } catch (error) {
    console.error(`❌ Error updating setting '${req.params.key}':`, error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// PUT /api/settings - Update multiple settings in bulk
router.put("/", async (req, res) => {
  try {
    const settingsToUpdate = req.body;
    const results = {};
    const errors = {};

    for (const [key, value] of Object.entries(settingsToUpdate)) {
      // --- Validation Logic ---
      if (key === "DISCOUNT_THRESHOLD") {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          errors[key] = "Must be a number between 0 and 100";
          continue;
        }
      }

      if (key === "PRODUCT_TYPES") {
        if (
          !Array.isArray(value) ||
          !value.every((item) => typeof item === "string" && item.trim() !== "")
        ) {
          errors[key] = "Must be an array of non-empty strings.";
          continue;
        }
      }

      // ✅ NEW: Validate PINCODE
      if (key === "PINCODE") {
        if (typeof value !== "string" || !/^\d{6}$/.test(value)) {
          errors[key] = "Must be a 6-digit string.";
          continue;
        }
      }
      // --- End Validation ---

      const success = await setSetting(key, value);
      if (success) {
        results[key] = value;
      } else {
        errors[key] = "Failed to update";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Settings update failed with validation errors.",
        errors,
      });
    }

    res.json({
      message: "Settings update complete",
      updated: results,
    });
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
