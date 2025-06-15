const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all departments
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM department");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 2. Get a department by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Check if ID is a valid number
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    const [results] = await db.query("SELECT * FROM department WHERE Department_ID = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json(results[0]); // Return first result
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create a department
router.post("/", (req, res) => {
  const { Department_Name, Department_Head, Created_By } = req.body;

  if (!Department_Name || !Created_By) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "INSERT INTO department (Department_Name, Department_Head, Created_By) VALUES (?, ?, ?)",
    [Department_Name, Department_Head, Created_By],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ id: results.insertId, Department_Name, Department_Head, Created_On: new Date().toISOString(), Created_By });
    }
  );
});


// 4. Delete a department
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    // Check if department exists
    const [existing] = await db.query("SELECT * FROM department WHERE Department_ID = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Delete the department
    const [results] = await db.query("DELETE FROM department WHERE Department_ID = ?", [id]);

    res.json({ message: "Department deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





//Update a department
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    // Check if department exists
    const [existing] = await db.query("SELECT * FROM department WHERE Department_ID = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Department not found" });
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
    const sql = `UPDATE department SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Department_ID = ?`;

    // Execute update query
    await db.query(sql, values);

    res.json({ message: "Department updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;