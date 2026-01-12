const express = require("express");
const { Client } = require("pg");
const path = require("path"); // <--- IMPORT PATH MODULE

// -------------------------------------------------------
// 1. SETUP & CONFIGURATION
// -------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---> ADD THIS: Serve Static Files (The Frontend)
app.use(express.static(path.join(__dirname, '../public')));

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: { rejectUnauthorized: false }
};

const client = new Client(dbConfig);

// -------------------------------------------------------
// 2. DATABASE CONNECTION
// -------------------------------------------------------
(async () => {
  try {
    console.log("🔌 Connecting to the Task Database...");
    await client.connect();
    console.log("✅ Database Connected!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// -------------------------------------------------------
// 3. API ROUTES
// -------------------------------------------------------

// ---> ADD THIS: Health Check for AWS Load Balancer
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// GET: Retrieve all tasks
app.get("/tasks", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM tasks ORDER BY created_at DESC");
    res.json({ tasks: result.rows });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Could not fetch tasks." });
  }
});

// POST: Create a new task
app.post("/tasks", async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "Description required" });

  try {
    const query = "INSERT INTO tasks (description) VALUES ($1) RETURNING *";
    const result = await client.query(query, [description]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Could not save task." });
  }
});

// PATCH: Complete task
app.patch("/tasks/:id/complete", async (req, res) => {
  try {
    const query = "UPDATE tasks SET is_complete = TRUE WHERE id = $1 RETURNING *";
    const result = await client.query(query, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Task not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Could not update task" });
  }
});

// DELETE: Remove task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const query = "DELETE FROM tasks WHERE id = $1 RETURNING *";
    const result = await client.query(query, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Could not delete task" });
  }
});

// -------------------------------------------------------
// 4. SERVER START
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
