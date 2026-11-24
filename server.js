require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

app.use(cors({
    origin: origins.length ? origins : true
}));

app.use(express.json());

// API GUIDE
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Study Support Hub API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f4f6fa;
                    padding: 30px;
                    color: #17365D;
                }
                main {
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    max-width: 850px;
                    margin: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background: #17365D;
                    color: white;
                }
                code {
                    background: #eee;
                    padding: 4px;
                }
            </style>
        </head>
        <body>
            <main>
                <h1>Study Support Hub API</h1>
                <p><strong>Student:</strong> Namuungo Mulungu</p>
                <p><strong>Student Number:</strong> 202511363</p>
                <p>A backend API for managing student academic support requests.</p>

                <h2>API Links</h2>
                <p><a href="/health">Health Check</a></p>
                <p><a href="/api/records">View All Records</a></p>

                <h2>Available Routes</h2>
                <table>
                    <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
                    <tr><td>GET</td><td>/api/records</td><td>Get all records</td></tr>
                    <tr><td>GET</td><td>/api/records/:id</td><td>Get one record</td></tr>
                    <tr><td>POST</td><td>/api/records</td><td>Create a record</td></tr>
                    <tr><td>PUT</td><td>/api/records/:id</td><td>Update a record</td></tr>
                    <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td></tr>
                </table>

                <h2>Required Fields</h2>
                <p>title, category, description and status.</p>
                <p>Allowed statuses: Pending, In progress, Completed.</p>

                <h2>Example JSON Body</h2>
                <pre>{
  "title": "Help with Java loops",
  "category": "Programming",
  "description": "I need help understanding Java loops.",
  "status": "Pending"
}</pre>

                <h2>Status Codes</h2>
                <p>200: Successful request | 201: Record created</p>
                <p>400: Invalid input | 404: Not found | 500: Server error</p>
                <p>An idle hosting service may need time to start.</p>
            </main>
        </body>
        </html>
    `);
});

// DATABASE HEALTH CHECK
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({
            status: "OK",
            database: "Connected"
        });
    } catch (error) {
        res.status(503).json({
            message: "Database connection failed."
        });
    }
});

// RECORD ROUTES
app.use("/api/records", require("./routes/records"));

// UNKNOWN ROUTES
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});

// ERROR HANDLER
app.use((error, req, res, next) => {
    console.error(error);

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            message: "Invalid JSON format."
        });
    }

    res.status(500).json({
        message: "An unexpected server error occurred."
    });
});

// START SERVER
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
});