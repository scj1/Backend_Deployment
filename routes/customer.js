const express = require("express");
const router = express.Router();
const db = require("../config/db");



//1. Get all customers
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM customers");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get a customer by ID
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Check if ID is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid customer ID" });
        }

        const [results] = await db.query("SELECT * FROM customers WHERE Customer_ID = ?", [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json(results[0]); // Return first result
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a customer
router.post("/", async (req, res) => {
    try {
        const {
            Index_Number,
            Name,
            Lead_Source_Code,
            Class_Mode,
            Created_By,
            Updated_By,
            Contact_Info_ID
        } = req.body;

        // Validate required fields
        if (!Name || !Lead_Source_Code || !Class_Mode || !Created_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const query = `
        INSERT INTO customers (
          Index_Number,
          Name,
          Lead_Source_Code,
          Class_Mode,
          Created_By,
          Updated_By,
          Contact_Info_ID
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

        const values = [
            Index_Number || null,
            Name,
            Lead_Source_Code,
            Class_Mode,
            Created_By,
            Updated_By || Created_By,
            Contact_Info_ID || null
        ];

        const [results] = await db.query(query, values);

        res.status(201).json({
            message: "Customer created successfully",
            
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 4. Update a customer
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Customer ID" });
        }

        // Check if department exists
        const [existing] = await db.query("SELECT * FROM customers WHERE Customer_ID = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Customer data not found" });
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
        const sql = `UPDATE customers SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Customer_ID = ?`;

        // Execute update query
        await db.query(sql, values);

        res.json({ message: "Department updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//5. Delete a customer
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Customer ID" });
        }

        // Check if department exists
        const [existing] = await db.query("SELECT * FROM customers WHERE Customer_ID = ?", [id]);

        if (existing.length === 0) {
            return res.status(404).json({ error: "Customer data not found" });
        }

        // Delete the department
        const [results] = await db.query("DELETE FROM customers WHERE Customer_ID = ?", [id]);

        res.json({ message: "Customer data deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;