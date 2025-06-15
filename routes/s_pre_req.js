const express = require("express");
const router = express.Router();
const db = require("../config/db");

//get all pre-requirements
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM pre_recruitment_data");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//get got displaying
router.get("/display", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT Recruitment_Data_ID, Parent_Name, Student_Name, Contact, Comments, Lead_Source_Code, EOD, Call_Date FROM ml1.pre_recruitment_data;");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//update
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;
    
        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ error: "Invalid ID" });
        }
    
        // Check if department exists
        const [existing] = await db.query("SELECT * FROM pre_recruitment_data WHERE Recruitment_Data_ID = ?", [id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: "Data not found" });
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
        const sql = `UPDATE pre_recruitment_data SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Recruitment_Data_ID = ?`;
    
        // Execute update query
        await db.query(sql, values);
    
        res.json({ message: "Data updated successfully" });
    
      } catch (err) {
        res.status(500).json({ error: err.message });
      }

});


router.post("/", async (req, res) => {
  try {
      const {
        Parent_Name, Student_Name, Contact, Comments, Lead_Source_Code, EOD, Call_Date, Created_By, Updated_By
      } = req.body;

      // Validate required fields
      if (!Parent_Name || !Lead_Source_Code || !Contact || !Comments|| !EOD  || !Call_Date || !Created_By) {
          return res.status(400).json({ error: "Missing required fields" });
      }

      const query = `
      INSERT INTO pre_recruitment_data (
        Parent_Name, Student_Name, Contact, Comments, Lead_Source_Code, EOD, Call_Date, Created_By, Updated_By
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const values = [
        Parent_Name,
        Student_Name,
        Contact,
        Comments,
        Lead_Source_Code,
        EOD,
        Call_Date,
        Created_By,
        Updated_By
      ];

      const [results] = await db.query(query, values);

      res.status(201).json({
          message: "Data created successfully"
          //Recruitment_Data_ID: results.insertId
      });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});


module.exports = router;