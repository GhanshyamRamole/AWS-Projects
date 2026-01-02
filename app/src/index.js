const express = require("express");
const { Client } = require("pg");

// Initialize our application
const app = express();
const PORT = process.env.PORT || 3000;

/*
 * -------------------------------------------------------
 * DATABASE CONFIGURATION
 * -------------------------------------------------------
 * Gathering the credentials from the environment.
 * We use a fallback for the port just in case.
 */
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: {
    rejectUnauthorized: false // Allowing self-signed certs for now
  }
};

const client = new Client(dbConfig);

/*
 * -------------------------------------------------------
 * STARTUP SEQUENCE
 * -------------------------------------------------------
 * Attempt to connect to the DB immediately when the app loads.
 */
(async () => {
  try {
    console.log("⏳ Attempting to bridge connection to PostgreSQL...");
    await client.connect();
    console.log("📌 Connected to PostgreSQL RDS successfully! Ready to roll.");
  } catch (err) {
    console.error("❌ Oops! Failed to connect to DB on startup.");
    console.error("   Error details:", err.message || err);
  }
})();

/*
 * -------------------------------------------------------
 * APP ROUTES
 * -------------------------------------------------------
 */

// 1. Simple Health Check
// Used by load balancers to see if we are alive.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 2. The Root Welcome Page
// Displays a friendly message and the current database time.
app.get("/", async (req, res) => {
  try {
    const result = await client.query("SELECT NOW()");
    const dbTime = result.rows[0].now;
    
    res.send(`App is running! 🎉<br>DB Time: ${dbTime}`);
  } catch (error) {
    console.error("⚠️ Error querying time:", error.message);
    res.status(500).send("DB Error: " + error.message);
  }
});

// 3. Database Connectivity Check
// A specific endpoint to ensure the DB can execute queries.
app.get("/db-check", async (req, res) => {
  try {
    // Just a quick ping query
    const dbResult = await client.query("SELECT 1 as ok");
    res.json({ ok: dbResult.rows[0].ok });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
 * -------------------------------------------------------
 * SERVER LAUNCH
 * -------------------------------------------------------
 */
app.listen(PORT, () => {
  console.log(`
  🚀 Server is ready for takeoff!
  ---------------------------------
  📡 Listening on Port: ${PORT}
  ---------------------------------
  `);
});
