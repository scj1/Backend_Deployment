const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all attendance records
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM attendance");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get attendance by ID
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid Attendance ID" });

        const [rows] = await db.query("SELECT * FROM attendance WHERE Attendance_ID = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Attendance record not found" });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete attendance record
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid Attendance ID" });

        const [existing] = await db.query("SELECT * FROM attendance WHERE Attendance_ID = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ error: "Attendance record not found" });

        await db.query("DELETE FROM attendance WHERE Attendance_ID = ?", [id]);
        res.json({ message: "Attendance record deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Create attendance record
router.post("/", async (req, res) => {
    try {
        const {
            Course_ID,
            Index_Number,
            Attendance_Date,
            Instructor_1_ID,
            Instructor_2_ID,
            Status,
            Remarks,
            Created_By,
            Updated_By
        } = req.body;

        if (!Course_ID || !Index_Number || !Attendance_Date || !Created_By || !Updated_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const query = `
            INSERT INTO attendance (
                Course_ID, Index_Number, Attendance_Date, Instructor_1_ID, Instructor_2_ID,
                Status, Remarks, Created_By, Updated_By
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            Course_ID, Index_Number, Attendance_Date, Instructor_1_ID || null, Instructor_2_ID || null,
            Status || '1', Remarks || null, Created_By, Updated_By
        ];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: "Attendance recorded", Attendance_ID: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Attendance already recorded for this student on this date" });
        }
        res.status(500).json({ error: err.message });
    }
});

// 5. Update attendance record
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid Attendance ID" });

        const [existing] = await db.query("SELECT * FROM attendance WHERE Attendance_ID = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ error: "Attendance record not found" });

        if (!updates.Updated_By) return res.status(400).json({ error: "Updated_By is required" });
        delete updates.Updated_On;

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No update data provided" });

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id);

        const sql = `UPDATE attendance SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Attendance_ID = ?`;
        await db.query(sql, values);

        res.json({ message: "Attendance record updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
