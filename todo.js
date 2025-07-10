#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TodoManager {
    constructor() {
        this.todoFile = path.join(__dirname, 'todo-tasks.json');
        this.tasks = this.loadTasks();
    }

    loadTasks() {
        try {
            if (fs.existsSync(this.todoFile)) {
                const data = fs.readFileSync(this.todoFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading tasks:', error.message);
        }
        return [];
    }

    saveTasks() {
        try {
            fs.writeFileSync(this.todoFile, JSON.stringify(this.tasks, null, 2));
        } catch (error) {
            console.error('Error saving tasks:', error.message);
        }
    }

    addTask(description, priority = 'medium') {
        const task = {
            id: Date.now(),
            description,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.push(task);
        this.saveTasks();
        console.log(`✅ Added task: ${description}`);
    }

    listTasks() {
        if (this.tasks.length === 0) {
            console.log('📝 No tasks for tomorrow yet!');
            return;
        }

        console.log('\n📋 TODO FOR TOMORROW:');
        console.log('='.repeat(50));

        const pendingTasks = this.tasks.filter(task => !task.completed);
        const completedTasks = this.tasks.filter(task => task.completed);

        if (pendingTasks.length > 0) {
            console.log('\n🔄 PENDING TASKS:');
            pendingTasks.forEach((task, index) => {
                const priorityIcon = this.getPriorityIcon(task.priority);
                console.log(`${index + 1}. ${priorityIcon} ${task.description}`);
            });
        }

        if (completedTasks.length > 0) {
            console.log('\n✅ COMPLETED TASKS:');
            completedTasks.forEach((task, index) => {
                console.log(`${index + 1}. ✅ ${task.description}`);
            });
        }

        console.log(`\n📊 Summary: ${pendingTasks.length} pending, ${completedTasks.length} completed`);
    }

    completeTask(taskIndex) {
        const pendingTasks = this.tasks.filter(task => !task.completed);

        if (taskIndex < 1 || taskIndex > pendingTasks.length) {
            console.log('❌ Invalid task number');
            return;
        }

        const taskToComplete = pendingTasks[taskIndex - 1];
        const taskInMainList = this.tasks.find(task => task.id === taskToComplete.id);

        if (taskInMainList) {
            taskInMainList.completed = true;
            taskInMainList.completedAt = new Date().toISOString();
            this.saveTasks();
            console.log(`✅ Completed: ${taskToComplete.description}`);
        }
    }

    deleteTask(taskIndex) {
        const pendingTasks = this.tasks.filter(task => !task.completed);

        if (taskIndex < 1 || taskIndex > pendingTasks.length) {
            console.log('❌ Invalid task number');
            return;
        }

        const taskToDelete = pendingTasks[taskIndex - 1];
        this.tasks = this.tasks.filter(task => task.id !== taskToDelete.id);
        this.saveTasks();
        console.log(`🗑️  Deleted: ${taskToDelete.description}`);
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        console.log(`🧹 Cleared ${completedCount} completed tasks`);
    }

    getPriorityIcon(priority) {
        const icons = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };
        return icons[priority] || '🟡';
    }

    showHelp() {
        console.log(`
📝 TODO SCRIPT - TOMORROW'S TASKS
================================

Usage:
  node todo.js add "Task description" [priority]
  node todo.js list
  node todo.js complete <number>
  node todo.js delete <number>
  node todo.js clear
  node todo.js help

Commands:
  add     - Add a new task (priority: high/medium/low)
  list    - Show all tasks
  complete - Mark a task as completed
  delete  - Delete a task
  clear   - Remove all completed tasks
  help    - Show this help message

Examples:
  node todo.js add "Review project documentation" high
  node todo.js add "Call client" medium
  node todo.js add "Buy groceries" low
  node todo.js list
  node todo.js complete 1
        `);
    }
}

// Main execution
const todo = new TodoManager();
const command = process.argv[2];

switch (command) {
    case 'add':
        const description = process.argv[3];
        const priority = process.argv[4] || 'medium';

        if (!description) {
            console.log('❌ Please provide a task description');
            console.log('Example: node todo.js add "Review code" high');
            process.exit(1);
        }

        if (!['high', 'medium', 'low'].includes(priority)) {
            console.log('❌ Priority must be: high, medium, or low');
            process.exit(1);
        }

        todo.addTask(description, priority);
        break;

    case 'list':
        todo.listTasks();
        break;

    case 'complete':
        const completeIndex = parseInt(process.argv[3]);
        if (isNaN(completeIndex)) {
            console.log('❌ Please provide a valid task number');
            console.log('Example: node todo.js complete 1');
            process.exit(1);
        }
        todo.completeTask(completeIndex);
        break;

    case 'delete':
        const deleteIndex = parseInt(process.argv[3]);
        if (isNaN(deleteIndex)) {
            console.log('❌ Please provide a valid task number');
            console.log('Example: node todo.js delete 1');
            process.exit(1);
        }
        todo.deleteTask(deleteIndex);
        break;

    case 'clear':
        todo.clearCompleted();
        break;

    case 'help':
    default:
        todo.showHelp();
        break;
} 