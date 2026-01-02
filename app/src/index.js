const express = require("express");
const { Client } = require("pg");

// -------------------------------------------------------
// 1. SETUP & CONFIGURATION
// -------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// We need this line to understand JSON data sent by users
app.use(express.json()); 

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
    console.log("✅ Database Connected! Ready to track your tasks.");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// -------------------------------------------------------
// 3. API ROUTES
// -------------------------------------------------------

// GET: Retrieve all tasks
// "Show me everything I need to do."
app.get("/tasks", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM tasks ORDER BY created_at DESC");
    res.json({
      message: "Here are your tasks!",
      count: result.rowCount,
      tasks: result.rows
    });
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ error: "Could not fetch tasks." });
  }
});

// POST: Create a new task
// "I need to remember to buy milk."
app.post("/tasks", async (req, res) => {
  const { description } = req.body;

  // Simple validation: Don't allow empty tasks
  if (!description) {
    return res.status(400).json({ error: "Please provide a task description!" });
  }

  try {
    const query = "INSERT INTO tasks (description) VALUES ($1) RETURNING *";
    const result = await client.query(query, [description]);
    
    res.status(201).json({
      message: "Task created successfully! 💪",
      task: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating task:", error.message);
    res.status(500).json({ error: "Could not save task." });
  }
});

// PATCH: Mark a task as done
// "I finished this one!"
app.patch("/tasks/:id/complete", async (req, res) => {
  const taskId = req.params.id;

  try {
    const query = "UPDATE tasks SET is_complete = TRUE WHERE id = $1 RETURNING *";
    const result = await client.query(query, [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({
      message: "Great job! Task marked as complete. ✅",
      task: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating task:", error.message);
    res.status(500).json({ error: "Could not update task." });
  }
});

// DELETE: Remove a task
// "I don't need this anymore."
app.delete("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;

  try {
    const query = "DELETE FROM tasks WHERE id = $1 RETURNING *";
    const result = await client.query(query, [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found (maybe you already deleted it?)" });
    }

    res.json({
      message: "Task deleted successfully. 🗑️",
      deletedTask: result.rows[0]
    });
  } catch (error) {
    console.error("Error deleting task:", error.message);
    res.status(500).json({ error: "Could not delete task." });
  }
});

// -------------------------------------------------------
// 4. SERVER START
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log(`
  🚀 Task Manager API is live!
  ---------------------------------------
  📝 Endpoint: http://localhost:${PORT}/tasks
  ---------------------------------------
  `);
});
