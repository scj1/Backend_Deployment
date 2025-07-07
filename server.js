const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./config/db");
const departmentRoutes = require("./routes/departments");
const employeeRoutes = require("./routes/employees");
const feedback_empRoutes = require("./routes/feedback_emp");
const discountsRoutes = require("./routes/discounts");
const cont_info_custRoutes = require("./routes/cont_info_cust");
const customerRoutes = require("./routes/customer");
const s_pre_reqRoutes = require("./routes/s_pre_req");
const call_laterRoutes = require("./routes/call_later");
const dumpRoutes = require("./routes/dump");
const coursesRoutes = require("./routes/courses");
const studentsRoutes = require("./routes/students");
const attendanceRoutes = require("./routes/attendance");
require("dotenv").config();
const app = express();
const port = 3000;
  
// Middleware
app.use(cors());
app.use(bodyParser.json());


// Routes
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/feedback_emp", feedback_empRoutes);
app.use("/api/v1/discounts", discountsRoutes);
app.use("/api/v1/cont_info_cust", cont_info_custRoutes);
app.use("/api/v1/customer", customerRoutes);
app.use("/api/v1/s_pre_req", s_pre_reqRoutes);
app.use("/api/v1/call_later", call_laterRoutes);
app.use("/api/v1/dump", dumpRoutes);
app.use("/api/v1/courses", coursesRoutes);
app.use("/api/v1/students", studentsRoutes);
app.use("/api/v1/attendance", attendanceRoutes);






app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
