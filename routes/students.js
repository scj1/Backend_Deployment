const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all students
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM students");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/display", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT Index_Number, First_Name, Middle_Name, Last_Name, Date_Of_Birth, Age FROM students");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get a student by Index_Number
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Index Number" });
        }

        const [results] = await db.query("SELECT * FROM students WHERE Index_Number = ?", [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// 3. Delete a student
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Index Number" });
        }

        const [existing] = await db.query("SELECT * FROM students WHERE Index_Number = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        await db.query("DELETE FROM students WHERE Index_Number = ?", [id]);
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Create a student
router.post("/", async (req, res) => {
    try {
        const {
            First_Name,
            Middle_Name,
            Last_Name,
            Date_Of_Birth,
            Age,
            Preference_Language,
            Email,
            School,
            Phone,
            Whatsapp_Phone,
            Start_Date,
            End_Date,
            Address,
            Status,
            Created_By,
            Updated_By,
            Social_Media_1,
            Social_Media_2,
            Social_Media_3,
            Hobby_1,
            Hobby_2,
            Hobby_3
        } = req.body;

        // Required fields validation
        if (!First_Name || !Last_Name || !Date_Of_Birth || !Preference_Language || !Address) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (Age !== null && Age <= 0) {
            return res.status(400).json({ error: "Age must be greater than 0" });
        }

        const query = `
            INSERT INTO students (
                First_Name, Middle_Name, Last_Name, Date_Of_Birth, Age,
                Preference_Language, Email, School, Phone, Whatsapp_Phone,
                Start_Date, End_Date, Address, Status,
                Created_On, Created_By, Updated_On, Updated_By,
                Social_Media_1, Social_Media_2, Social_Media_3,
                Hobby_1, Hobby_2, Hobby_3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            First_Name, Middle_Name || null, Last_Name, Date_Of_Birth, Age || null,
            Preference_Language, Email || null, School || "", Phone || null, Whatsapp_Phone || Phone || null,
            Start_Date || null, End_Date || null, Address, Status,
            Created_By || null, Updated_By || Created_By || null,
            Social_Media_1 || "", Social_Media_2 || "", Social_Media_3 || "",
            Hobby_1 || "", Hobby_2 || "", Hobby_3 || ""
        ];

        const [result] = await db.query(query, values);

        res.status(201).json({ message: "Student created successfully", Index_Number: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update a student
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Index Number" });
        }

        const [existing] = await db.query("SELECT * FROM students WHERE Index_Number = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        if (!updates.Updated_By) {
            return res.status(400).json({ error: "Updated_By is required" });
        }

        delete updates.Updated_On;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No update data provided" });
        }

        if ('Age' in updates && updates.Age <= 0) {
            return res.status(400).json({ error: "Age must be greater than 0" });
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id);

        const sql = `UPDATE students SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Index_Number = ?`;

        await db.query(sql, values);
        res.json({ message: "Student updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
