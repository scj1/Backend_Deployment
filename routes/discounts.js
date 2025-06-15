const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all discounts
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM discounts");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get a discount by ID
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Check if ID is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid Discounts ID" });
        }

        const [results] = await db.query("SELECT * FROM discounts WHERE Discount_ID = ?", [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Discount data not found" });
        }

        res.json(results[0]); // Return first result
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Create a new discount
router.post("/", async (req, res) => {
    try {
        const {
            Discount_Type,
            Discount_Code,
            Discount_Percentage,
            Discount_Amount,
            Start_Date,
            End_Date,
            Eligibility_Criteria,
            Maximum_Usage,
            Description,
            Is_Active
        } = req.body;

        // Validate required fields
        if (!Discount_Type || (!Discount_Percentage && !Discount_Amount)) {
            return res.status(400).json({ error: "Discount_Type and either Discount_Percentage or Discount_Amount are required" });
        }

        const query = `
          INSERT INTO discounts (
            Discount_Type,
            Discount_Code,
            Discount_Percentage,
            Discount_Amount,
            Start_Date,
            End_Date,
            Eligibility_Criteria,
            Maximum_Usage,
            Description,
            Is_Active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            Discount_Type,
            Discount_Code || null,
            Discount_Percentage || null,
            Discount_Amount || null,
            Start_Date || null,
            End_Date || null,
            Eligibility_Criteria || null,
            Maximum_Usage || null,
            Description || null,
            Is_Active ?? false
        ];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: "Discount created successfully", Discount_ID: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//4. Update a discount
router.patch("/:id", async (req, res) => {
    try {
        const discountId = parseInt(req.params.id, 10);
        const updates = req.body;

        // Validate ID
        if (!Number.isInteger(discountId) || discountId <= 0) {
            return res.status(400).json({ error: "Invalid Discount ID" });
        }

        // Ensure there is something to update
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No update fields provided" });
        }

        // Remove Created_On (if present) to prevent manual update
        delete updates.Created_On;

        // Dynamically build SET clause
        const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(discountId); // for WHERE clause

        const query = `
        UPDATE discounts
        SET ${fields}, Updated_On = CURRENT_TIMESTAMP
        WHERE Discount_ID = ?
      `;

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Discount not found" });
        }

        res.json({ message: "Discount updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//5. Delete a discount
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Check if ID is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid Discount ID" });
        }

        const [results] = await db.query("DELETE FROM discounts WHERE Discount_ID = ?", [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Discount data not found" });
        }

        res.json({ message: "Discount data deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;