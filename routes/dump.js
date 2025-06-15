const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM dump");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/display", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT Dump_ID, Parent_Name, Student_Name, Phone_Number, Comments, Lead_Source_Code, EOD, Call_Date FROM dump;");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;
    
        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ error: "Invalid ID" });
        }
    
     
        const [existing] = await db.query("SELECT * FROM dump WHERE Dump_ID = ?", [id]);
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
        const sql = `UPDATE dump SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Dump_ID = ?`;
    
        // Execute update query
        await db.query(sql, values);
    
        res.json({ message: "Data updated successfully" });
    
      } catch (err) {
        res.status(500).json({ error: err.message });
      }

});

router.post("/", (req, res) => {
  const { 
    Dumped_Date, 
    Parent_Name,
    Student_Name,
    Phone_Number,
    Lead_Source_Code,
    Comments,
    Status,
    EOD,
    Call_Date,
    Created_By} = req.body;

  if (!Parent_Name || !Phone_Number || !Status || !EOD || !Lead_Source_Code || !Dumped_Date || !Comments || !Created_By) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "INSERT INTO dump (Dumped_Date, Parent_Name,Student_Name,Phone_Number,Lead_Source_Code,Comments,Status,EOD,Call_Date,Created_By) VALUES (?, ?, ?, ?,?,?,?,?,?,?)",
    [Dumped_Date, Parent_Name,Student_Name,Phone_Number,Lead_Source_Code,Comments,Status,EOD,Call_Date,Created_By],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200);
    }
  );
});


router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid dump ID" });
    }

    // Check if department exists
    const [existing] = await db.query("SELECT * FROM dump WHERE Dump_ID = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Dump data not found" });
    }

    // Delete the department
    const [results] = await db.query("DELETE FROM dump WHERE Dump_ID = ?", [id]);

    res.json({ message: "Dump data deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;