const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all feedback_emp
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM feedback_emp");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get a feedback_emp by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query("SELECT * FROM feedback_emp WHERE Feedback_ID = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create a feedback_emp
router.post("/", async (req, res) => {
  try {
    const {
      Emp_ID,
      Feedback_URL,
      Feedback_Recipient_ID,
      Created_By,
      Updated_By,
    } = req.body;

    // Validate required fields
    if (!Emp_ID || !Feedback_URL || !Created_By) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert query
    const query = `
        INSERT INTO feedback_emp (
          Emp_ID, Feedback_URL, Feedback_Recipient_ID, Created_By, Updated_By
        ) VALUES (?, ?, ?, ?, ?)
      `;

    const values = [
      Emp_ID, Feedback_URL, Feedback_Recipient_ID || null, Created_By, Updated_By || Created_By
    ];

    const [results] = await db.query(query, values);
    res.status(201).json({ message: "Feedback created successfully", Feedback_ID: results.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete a feedback_emp
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existingFeedback] = await db.query("SELECT * FROM feedback_emp WHERE Feedback_ID = ?", [id]);

    if (existingFeedback.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    const [results] = await db.query("DELETE FROM feedback_emp WHERE Feedback_ID = ?", [id]);

    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a feedback_emp
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid Employee Feedback ID" });
    }

    // Check if department exists
    const [existing] = await db.query("SELECT * FROM feedback_emp WHERE Feedback_ID = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Ensure `Updated_By` is provided
    if (!updates.Updated_By) {
      return res.status(400).json({ error: "Updated_By is required" });
    }

    // Remove `Updated_On` from the request (auto-set in query)
    delete updates.Updated_On;

    // Validate that at least one field is provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    // Build dynamic SQL query
    const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(updates);
    values.push(id); // Add ID for WHERE condition

    // Ensure `Updated_On` is always updated
    const sql = `UPDATE feedback_emp SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Feedback_ID = ?`;

    // Execute update query
    await db.query(sql, values);

    res.json({ message: "Employee feedback data updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;