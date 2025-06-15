const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all employees
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM employee");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get an employee by ID

router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Check if ID is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid Emp ID" });
        }

        const [results] = await db.query("SELECT * FROM employee WHERE Emp_ID = ?", [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(results[0]); // Return first result
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete an employee
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Employee ID" });
        }

        // Check if Employee exists
        const [existing] = await db.query("SELECT * FROM employee WHERE Emp_ID = ?", [id]);

        if (existing.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Delete the Employee
        const [results] = await db.query("DELETE FROM employee WHERE Emp_ID = ?", [id]);

        res.json({ message: "Employee deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 4. Create an employee
router.post("/", async (req, res) => {
    try {
        const {
            First_Name,
            Last_Name,
            Middle_Name,
            DOB,
            Email,
            Phone,
            Whatsapp_No,
            Emergency_Contact_No,
            Emergency_Contact_Realtionship,
            NIC_No,
            Passport_No,
            Address,
            Gender,
            Salary,
            Status,
            Department_ID,
            Created_By,
            Updated_By,
        } = req.body;

        // Validate required fields
        if (!First_Name || !Last_Name || !DOB || !Email || !Phone || !Gender || !Salary || !Status || !Created_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Insert query
        const query = `
        INSERT INTO employee (
          First_Name, Last_Name, Middle_Name, DOB, Email, Phone, Whatsapp_No, 
          Emergency_Contact_No, Emergency_Contact_Realtionship, NIC_No, Passport_No, 
          Address, Gender, Salary, Status, Department_ID, Created_By, Updated_By
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const values = [
            First_Name, Last_Name, Middle_Name || null, DOB, Email, Phone, Whatsapp_No || Phone,
            Emergency_Contact_No || null, Emergency_Contact_Realtionship || null, NIC_No || null, Passport_No || null,
            Address || null, Gender, Salary, Status, Department_ID || null, Created_By, Updated_By || Created_By
        ];

        const [results] = await db.query(query, values);

        res.status(201).json({ message: "Employee created successfully", Emp_ID: results.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update an employee
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Emp ID" });
        }

        // Check if department exists
        const [existing] = await db.query("SELECT * FROM employee WHERE Emp_ID = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
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
        const sql = `UPDATE employee SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Emp_ID = ?`;

        // Execute update query
        await db.query(sql, values);

        res.json({ message: "Employee updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//export
module.exports = router;