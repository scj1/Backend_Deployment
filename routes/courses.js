const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. Get all courses
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM courses");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/display", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT Course_ID, Course_Name, Course_Description, Instructor_Head_ID, Instructor_Lab_ID, Clan    FROM courses");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get a course by ID
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Course ID" });
        }

        const [results] = await db.query("SELECT * FROM courses WHERE Course_ID = ?", [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// 3. Delete a course
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Course ID" });
        }

        const [existing] = await db.query("SELECT * FROM courses WHERE Course_ID = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        await db.query("DELETE FROM courses WHERE Course_ID = ?", [id]);
        res.json({ message: "Course deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Create a course
router.post("/", async (req, res) => {
    try {
        const {
            Course_Name,
            Course_Description,
            Instructor_Head_ID,
            Instructor_Lab_ID,
            Clan,
            Duration,
            Delivery_Language ,
            Flavour ,
            Class_Status,
            Course_Fee ,
            Teacher_Guide ,
            Brochure_1 ,
            Brochure_2 ,
            Created_By,
            Updated_By,
        } = req.body;

        if (!Course_Name || !Duration || !Created_By) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (Duration <= 0) {
            return res.status(400).json({ error: "Duration must be greater than 0" });
        }

        if (Course_Fee !== null && Course_Fee < 0) {
            return res.status(400).json({ error: "Course_Fee cannot be negative" });
        }

        const query = `
            INSERT INTO courses (
                Course_Name, Course_Description, Instructor_Head_ID, Instructor_Lab_ID, Clan,
                Duration, Delivery_Language, Flavour, Class_Status, Course_Fee,
                Teacher_Guide, Brochure_1, Brochure_2,
                Created_By, Updated_By
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            Course_Name, Course_Description || null, Instructor_Head_ID, Instructor_Lab_ID, Clan,
            Duration, Delivery_Language, Flavour, Class_Status, Course_Fee,
            Teacher_Guide, Brochure_1, Brochure_2,
            Created_By, Updated_By || Created_By
        ];

        const [result] = await db.query(query, values);

        res.status(201).json({ message: "Course created successfully", Course_ID: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update a course
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid Course ID" });
        }

        const [existing] = await db.query("SELECT * FROM courses WHERE Course_ID = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        if (!updates.Updated_By) {
            return res.status(400).json({ error: "Updated_By is required" });
        }

        delete updates.Updated_On;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No update data provided" });
        }

        if ('Duration' in updates && updates.Duration <= 0) {
            return res.status(400).json({ error: "Duration must be greater than 0" });
        }

        if ('Course_Fee' in updates && updates.Course_Fee < 0) {
            return res.status(400).json({ error: "Course_Fee cannot be negative" });
        }

        const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id);

        const sql = `UPDATE courses SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Course_ID = ?`;

        await db.query(sql, values);

        res.json({ message: "Course updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
