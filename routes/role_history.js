const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all role history records
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM role_history");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get role history by ID
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid Role History ID" });

        const [rows] = await db.query("SELECT * FROM role_history WHERE Role_History_ID = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Role history record not found" });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Create role history record
router.post("/", async (req, res) => {
    try {
        const { Employee_ID, Role_ID, Start_Date, End_Date, Created_By, Updated_By } = req.body;

        if (!Employee_ID || !Role_ID || !Start_Date || !Created_By || !Updated_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Ensure dates are in correct format
        const startDate = new Date(Start_Date);
        const endDate = End_Date ? new Date(End_Date) : null;

        const [result] = await db.query(
            "INSERT INTO role_history (Employee_ID, Role_ID, Start_Date, End_Date, Created_By, Updated_By) VALUES (?, ?, ?, ?, ?, ?)",
            [Employee_ID, Role_ID, startDate, endDate, Created_By, Updated_By]
        );

        res.status(201).json({ message: "Role history created successfully", Role_History_ID: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Update role history record
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid Role History ID" });

        const [existing] = await db.query("SELECT * FROM role_history WHERE Role_History_ID = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ error: "Role history record not found" });

        if (!updates.Updated_By) return res.status(400).json({ error: "Updated_By is required" });
        delete updates.Updated_On;

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No update data provided" });

         // If Start_Date or End_Date is being updated, ensure they are in correct format
         if (updates.Start_Date) {
            updates.Start_Date = new Date(updates.Start_Date);
        }
        if (updates.End_Date) {
            updates.End_Date = new Date(updates.End_Date);
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id);

        const sql = `UPDATE role_history SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Role_History_ID = ?`;
        await db.query(sql, values);

        res.json({ message: "Role history updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Delete role history record
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid Role History ID" });

        const [result] = await db.query("DELETE FROM role_history WHERE Role_History_ID = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Role history record not found" });

        res.json({ message: "Role history deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;