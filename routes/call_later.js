const express = require("express");
const router = express.Router();
const db = require("../config/db");

//get all pre-requirements
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM call_later");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//get got displaying
router.get("/display", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT Call_Later_Data_ID, Parent_Name, Student_Name, Contact, Email, Comments, Lead_Source_Code, EOD, Call_Date FROM call_later WHERE Active_Status = '2';");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        console.log('GET /call-later/:id route hit with ID:', req.params.id);
        const id = req.params.id;

        if (isNaN(id)) {
            console.log('Invalid ID detected:', id);
            return res.status(400).json({ error: "Invalid ID" });
        }

        console.log('Executing query for ID:', id);
        const [results] = await db.query(`
            SELECT 
                Call_Later_Data_ID,
                Parent_Name, Student_Name, Contact, Comments, Lead_Source_Code, EOD, Call_Date, Status
            FROM call_later 
            WHERE Call_Later_Data_ID = ? AND Active_Status = '2'
        `, [id]);

        console.log('Query results:', results);

        if (results.length === 0) {
            console.log('No active results found for ID:', id);
            return res.status(404).json({ error: "Data not found" });
        }

        console.log('Sending response for ID:', id);
        res.json(results[0]);
    } catch (err) {
        console.error('Database error details:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
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
        const [existing] = await db.query("SELECT * FROM call_later WHERE Call_Later_Data_ID = ?", [id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: "Data not found" });
        }
  
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
        const sql = `UPDATE call_later SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Call_Later_Data_ID = ?`;
    
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
      INSERT INTO call_later (
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
      });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Check if department exists
    const [existing] = await db.query("SELECT * FROM call_later WHERE Call_Later_Data_ID = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Data not found" });
    }

    // Delete the department
    const [results] = await db.query("DELETE FROM call_later WHERE Call_Later_Data_ID = ?", [id]);

    res.json({ message: "Data deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
