const express = require("express");
const router = express.Router();
const db = require("../config/db");
const mysql = require("mysql2/promise");

// 1. Get all cont_info_cust
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM cont_info_cust");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get a cont_info_cust by ID
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Check if ID is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid cont_info_cust ID" });
        }

        const [results] = await db.query("SELECT * FROM cont_info_cust WHERE Contact_Info_ID = ?", [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Customer contact data not found" });
        }

        res.json(results[0]); // Return first result
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Create a new cont_info_cust
router.post("/", async (req, res) => {
    try {
        const {
            Email,
            Phone,
            Whatsapp_No,
            Emergency_Contact_No,
            Emergency_Contact_Relationship,
            NIC_No,
            Passport_No,
            Address,
            Created_By,
            Updated_By,
            Customer_ID,
        } = req.body;

        // Validate required fields
        if (!Email || !Phone || !Whatsapp_No || !Created_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Insert query
        const query = `
          INSERT INTO cont_info_cust (
            Email,
            Phone,
            Whatsapp_No,
            Emergency_Contact_No,
            Emergency_Contact_Realtionship,  
            NIC_No, 
            Passport_No,
            Address,
            Created_By,
            Updated_By,
            Customer_ID
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            Email,
            Phone,
            Whatsapp_No,
            Emergency_Contact_No || null,
            Emergency_Contact_Relationship || null,
            NIC_No || null,
            Passport_No || null,
            Address || null,
            Created_By,
            Updated_By || Created_By,
            Customer_ID || null
        ];

        const [results] = await db.query(query, values);
        res.status(201).json({ message: "Customer Info created successfully", Contact_Info_ID: results.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete a cont_info_cust by ID
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Check if ID is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid cont_info_cust ID" });
        }

        const [results] = await db.query("DELETE FROM cont_info_cust WHERE Contact_Info_ID = ?", [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Customer contact data not found" });
        }

        res.json({ message: "Customer contact data deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update a cont_info_cust by ID
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Contact Info ID" });
        }

        const [existing] = await db.query("SELECT * FROM cont_info_cust WHERE Contact_Info_ID = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Data not found" });
        }

        if (!updates.Updated_By) {
            return res.status(400).json({ error: "Updated_By is required" });
        }

        delete updates.Updated_On;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No update data provided" });
        }

        const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id);

        const sql = `UPDATE cont_info_cust SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Contact_Info_ID = ?`;

        await db.query(sql, values);

        res.json({ message: "Contact Info updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




module.exports = router;