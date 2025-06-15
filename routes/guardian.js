const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all guardians
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM guardian");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* router.get  ("/display", async (req, res) => {
    try{
        const [rows] = await db.query("SELECT FROM guardian");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}); */

// 2. Get a guardian by ID
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid Guardian ID" });

        const [rows] = await db.query("SELECT * FROM guardian WHERE Guardian_ID = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Guardian not found" });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete a guardian
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid Guardian ID" });

        const [existing] = await db.query("SELECT * FROM guardian WHERE Guardian_ID = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ error: "Guardian not found" });

        await db.query("DELETE FROM guardian WHERE Guardian_ID = ?", [id]);
        res.json({ message: "Guardian deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Create a guardian
router.post("/", async (req, res) => {
    try {
        const {
            First_Name,
            Last_Name,
            Email,
            Phone,
            Whatsapp_Number,
            Ocuppation,
            Address,
            Relationship,
            NIC_No,
            Passport_No,
            Index_Number,
            Created_By,
            Updated_By
        } = req.body;

        // Validate required fields
        if (!First_Name || !Last_Name || !Email || !Phone || !Address || !Relationship || !Index_Number || !Created_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const query = `
        INSERT INTO guardian (
            First_Name, Last_Name, Email, Phone, Whatsapp_Number, Ocuppation, Address, 
            Relationship, NIC_No, Passport_No, Index_Number, Created_By, Updated_By
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            First_Name, Last_Name, Email, Phone, Whatsapp_Number || '', Ocuppation || '', Address,
            Relationship, NIC_No || null, Passport_No || null, Index_Number, Created_By, Updated_By || Created_By
        ];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: "Guardian created successfully", Guardian_ID: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update a guardian
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid Guardian ID" });

        const [existing] = await db.query("SELECT * FROM guardian WHERE Guardian_ID = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ error: "Guardian not found" });

        if (!updates.Updated_By) return res.status(400).json({ error: "Updated_By is required" });
        delete updates.Updated_On;

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No update data provided" });

        const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id);

        const sql = `UPDATE guardian SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Guardian_ID = ?`;
        await db.query(sql, values);

        res.json({ message: "Guardian updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
