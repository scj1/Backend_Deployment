const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Check table structure
router.get("/check-structure", async (req, res) => {
    try {
        console.log('Checking table structure...');
        const [structure] = await db.query(`
            DESCRIBE pre_recruitment_data
        `);
        console.log('Table structure:', structure);
        res.json(structure);
    } catch (err) {
        console.error('Error checking table structure:', err);
        res.status(500).json({ error: err.message });
    }
});

//get all pre-requirements
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM pre_recruitment_data WHERE Active_Status = '1'"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//get for displaying
router.get("/display", async (req, res) => {
    try {
        console.log('Fetching active data from pre_recruitment_data table...');
        const [rows] = await db.query(`
            SELECT 
                Recruitment_Data_ID,
                Parent_Name, Student_Name, Contact, Email, Comments, Lead_Source_Code, EOD, Call_Date, Status,
                Created_On,
                Updated_On
            FROM pre_recruitment_data
            WHERE Active_Status = '1'
        `);
        console.log('Query results:', JSON.stringify(rows, null, 2));
        res.json(rows);
    } catch (err) {
        console.error('Error in display route:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get data by ID
router.get("/:id", async (req, res) => {
    try {
        console.log('GET /:id route hit with ID:', req.params.id);
        const id = req.params.id;

        if (isNaN(id)) {
            console.log('Invalid ID detected:', id);
            return res.status(400).json({ error: "Invalid ID" });
        }

        console.log('Executing query for ID:', id);
        const [results] = await db.query(`
            SELECT 
                Recruitment_Data_ID,
                Parent_Name, Student_Name, Contact, Email, Comments, Lead_Source_Code, EOD, Call_Date, Status
            FROM pre_recruitment_data 
            WHERE Recruitment_Data_ID = ? AND Active_Status = '1'
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


//moving to call_later
router.post('/move1/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT Parent_Name, Student_Name, Contact, Email, Comments,
              Lead_Source_Code, Status, EOD, Call_Date,
              Created_On, Created_By, Updated_On, Updated_By
       FROM pre_recruitment_data
       WHERE Recruitment_Data_ID = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data not found' });
        }

        const sheet = rows[0];

        // Insert into Call_later with Active_Status set to 2
        await db.query(
            `INSERT INTO call_later (
        Parent_Name, Student_Name, Contact, Email, Comments,
        Lead_Source_Code, Status, EOD, Call_Date,
        Created_On, Created_By, Updated_On, Updated_By, Active_Status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sheet.Parent_Name,
                sheet.Student_Name,
                sheet.Contact,
                sheet.Email,
                sheet.Comments,
                sheet.Lead_Source_Code,
                sheet.Status,
                sheet.EOD,
                sheet.Call_Date,
                sheet.Created_On,
                sheet.Created_By,
                sheet.Updated_On,
                sheet.Updated_By,
                2 // <-- Active_Status set to 2
            ]
        );



        res.json({ message: 'data moved successfully', movedId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


//moving to dump
router.post('/move2/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT Parent_Name, Student_Name, Contact, Email, Comments,
              Lead_Source_Code, Status, EOD, Call_Date,
              Created_On, Created_By, Updated_On, Updated_By
       FROM pre_recruitment_data
       WHERE Recruitment_Data_ID = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data not found' });
        }

        const sheet = rows[0];
        
        // Insert into dump with Active_Status set to 2
        await db.query(
            `INSERT INTO dump (
        Parent_Name, Student_Name, Contact, Email, Comments,
        Lead_Source_Code, Status, EOD, Call_Date,
        Created_On, Created_By, Updated_On, Updated_By, Active_Status,Dumped_Date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
            [
                 
                sheet.Parent_Name,
                sheet.Student_Name,
                sheet.Contact,
                sheet.Email,
                sheet.Comments,
                sheet.Lead_Source_Code,
                sheet.Status,
                sheet.EOD,
                sheet.Call_Date,
                sheet.Created_On,
                sheet.Created_By,
                sheet.Updated_On,
                sheet.Updated_By,
                3, // <-- Active_Status set to 2
                sheet.Dumped_Date || new Date(),
            ]
        );



        res.json({ message: 'data moved successfully', movedId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});



//update
router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updates = req.body;

        console.log('Update request received:', { id, updates });

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            console.log('Invalid ID:', id);
            return res.status(400).json({ error: "Invalid ID" });
        }

        // Check if record exists
        const [existing] = await db.query("SELECT * FROM pre_recruitment_data WHERE Recruitment_Data_ID = ?", [id]);
        console.log('Existing record:', existing);

        if (existing.length === 0) {
            console.log('Record not found for ID:', id);
            return res.status(404).json({ error: "Data not found" });
        }

        // Remove fields that shouldn't be updated directly
        delete updates.Updated_On;
        delete updates.Created_On;
        delete updates.Recruitment_Data_ID;

        // Build dynamic SQL query
        const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        values.push(id); // Add ID for WHERE condition

        const sql = `UPDATE pre_recruitment_data SET ${fields}, Updated_On = CURRENT_TIMESTAMP WHERE Recruitment_Data_ID = ?`;
        console.log('Update SQL:', sql);
        console.log('Update values:', values);

        // Execute update query
        const [result] = await db.query(sql, values);
        console.log('Update result:', result);

        if (result.affectedRows === 0) {
            console.log('No rows were updated');
            // This is now a successful response, as no changes means nothing to update
            return res.json({ message: "No changes were made to update" });
        }

        res.json({
            message: "Data updated successfully",
            affectedRows: result.affectedRows
        });

    } catch (err) {
        console.error('Update error:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        res.status(500).json({ error: err.message });
    }
});




router.post("/", async (req, res) => {
    try {
        console.log('Incoming POST request body:', req.body); // Added for debugging

        const {
            Recruitment_Data_ID,
            Parent_Name,
            Student_Name,
            Email,
            Comments,
            Lead_Source_Code,
            EOD,
            Call_Date, //from contact date to call date
            Status,
            Contact,
            Created_By,
            Updated_By,
            Active_Status
        } = req.body; // Only destructure fields expected from frontend

        // Validate only Recruitment_Data_ID as required


        // Check if Recruitment_Data_ID already exists
        const [existingId] = await db.query("SELECT Recruitment_Data_ID FROM pre_recruitment_data WHERE Recruitment_Data_ID = ?", [Recruitment_Data_ID]);
        if (existingId.length > 0) {
            console.log('Error: Recruitment_Data_ID already exists:', Recruitment_Data_ID); // Added for debugging
            return res.status(409).json({ error: "Recruitment_Data_ID already exists. Please provide a unique ID." });
        }

        const columns = [
            "Recruitment_Data_ID",
            // Always 'admin'
        ];
        const values = [
            Recruitment_Data_ID,

        ];

        // Dynamically add other fields if they are provided in the request body
        const bodyFields = {
            Parent_Name,
            Student_Name,
            Email,
            Comments,
            Lead_Source_Code,
            EOD,
            Call_Date, //changed from Contact_Date to Call_Date
            Status,
            Contact,
            Created_By,
            Updated_By,
            Active_Status: Active_Status !== undefined ? Active_Status : 1 // Default to 1 if not provided
        };

        for (const key in bodyFields) {
            if (bodyFields[key] !== undefined) { // Check if the field was provided
                columns.push(key);
                values.push(bodyFields[key]);
            }
        }

        const placeholders = values.map(() => '?').join(", ");
        const columnNames = columns.join(", ");

        const query = `
      INSERT INTO pre_recruitment_data (
        ${columnNames}
      ) VALUES (${placeholders})
    `;

        console.log('Executing INSERT query:', query, 'with values:', values); // Added for debugging

        const [results] = await db.query(query, values);

        res.status(201).json({
            message: "Data created successfully",
            id: results.insertId
        });
    } catch (err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update table structure if needed
router.get("/update-structure", async (req, res) => {
    try {
        console.log('Updating table structure...');

        // Check if Contact column exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'defaultdb' 
            AND TABLE_NAME = 'pre_recruitment_data' 
            AND COLUMN_NAME = 'Contact'
        `);

        if (columns.length === 0) {
            console.log('Adding Contact column...');
            await db.query(`
                ALTER TABLE pre_recruitment_data 
                ADD COLUMN Contact VARCHAR(255) AFTER Email
            `);
            console.log('Contact column added successfully');
        } else {
            console.log('Contact column already exists');
        }

        res.json({ message: "Table structure check completed" });
    } catch (err) {
        console.error('Error updating table structure:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check and update table structure
router.get("/fix-table", async (req, res) => {
    try {
        console.log('Checking table structure...');

        // First, check if Contact column exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ml1' 
            AND TABLE_NAME = 'pre_recruitment_data' 
            AND COLUMN_NAME = 'Contact'
        `);

        if (columns.length === 0) {
            console.log('Contact column does not exist. Adding it...');
            await db.query(`
                ALTER TABLE pre_recruitment_data 
                ADD COLUMN Contact VARCHAR(255) AFTER Email
            `);
            console.log('Contact column added successfully');
        } else {
            console.log('Contact column exists. Checking its properties...');
            const [columnInfo] = await db.query(`
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'ml1' 
                AND TABLE_NAME = 'pre_recruitment_data' 
                AND COLUMN_NAME = 'Contact'
            `);
            console.log('Contact column info:', columnInfo[0]);
        }

        // Get sample data to verify
        const [sampleData] = await db.query(`
            SELECT Recruitment_Data_ID, Contact 
            FROM pre_recruitment_data 
            LIMIT 5
        `);
        console.log('Sample data:', sampleData);

        res.json({
            message: "Table structure check completed",
            sampleData: sampleData
        });
    } catch (err) {
        console.error('Error fixing table structure:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
