
const API_URL = '/tasks';

// 1. Fetch and Display Tasks on Load
document.addEventListener('DOMContentLoaded', fetchTasks);

async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        renderTasks(data.tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// 2. Render Tasks to HTML
function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear current list

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-card ${task.is_complete ? 'completed' : ''}`;
        
        // Format date nicely
        const date = new Date(task.created_at).toLocaleDateString();

        li.innerHTML = `
            <div class="task-content">
                <div class="info">
                    <div class="task-text">${task.description}</div>
                    <span class="task-date">Added on ${date}</span>
                </div>
            </div>
            <div class="actions">
                ${!task.is_complete ? `
                <button class="btn-icon btn-check" onclick="completeTask(${task.id})" title="Mark Complete">
                    <i class="fa-solid fa-check"></i>
                </button>` : ''}
                <button class="btn-icon btn-delete" onclick="deleteTask(${task.id})" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// 3. Add New Task
async function addTask() {
    const input = document.getElementById('taskInput');
    const description = input.value.trim();

    if (!description) return alert("Please enter a task!");

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });
        input.value = ''; // Clear input
        fetchTasks();     // Refresh list
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

// 4. Mark Task as Complete
async function completeTask(id) {
    try {
        await fetch(`${API_URL}/${id}/complete`, { method: 'PATCH' });
        fetchTasks();
    } catch (error) {
        console.error('Error completing task:', error);
    }
}

// 5. Delete Task
async function deleteTask(id) {
    if(!confirm("Are you sure you want to delete this task?")) return;
    
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}
