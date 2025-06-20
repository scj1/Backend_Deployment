const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM roles");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid Role ID" });

        const [rows] = await db.query("SELECT * FROM roles WHERE Role_ID = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Role not found" });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { Role_Name, Role_Description, Is_Active, Created_By, Updated_By } = req.body;

        if (!Role_Name || !Is_Active || !Created_By || !Updated_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const [result] = await db.query(
            "INSERT INTO roles (Role_Name, Role_Description, Is_Active, Created_By, Updated_By) VALUES (?, ?, ?, ?, ?)",
            [Role_Name, Role_Description, Is_Active, Created_By, Updated_By]
        );

        res.status(201).json({ message: "Role created successfully", Role_ID: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid Attendance ID" });

        const [existing] = await db.query("SELECT * FROM roles WHERE Role_ID = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ error: "Role not found" });

        if (!updates.Updated_By) return res.status(400).json({ error: "Updated_By is required" });
        delete updates.Updated_On;

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No update data provided" });

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id);

        const sql = `UPDATE roles SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Role_ID = ?`;
        await db.query(sql, values);

        res.json({ message: "Role updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid Role ID" });

        const [result] = await db.query("DELETE FROM roles WHERE Role_ID = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Role not found" });

        res.json({ message: "Role deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;