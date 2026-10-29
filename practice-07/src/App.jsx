import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import {
  addTask, getTaskStats, removeTask, selectTasks, toggleTask, updateTask,
} from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

function nextId(tasks) {
  return tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
}

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = tasks.find(task => task.id === editingId) ?? null;

  function handleToggle(id) {
    setTasks(previous => toggleTask(previous, id));
    setMessage('Статус задачи изменён.');
  }

  function handleEdit(id) {
    setEditingId(id);
    setMessage('');
  }

  function handleDelete(id) {
    if (!window.confirm('Удалить задачу?')) {
      return;
    }
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) {
      setEditingId(null);
    }
    setMessage('Задача удалена.');
  }

  function handleSave(value) {
    if (editingId === null) {
      setTasks(previous => addTask(previous, value, nextId(previous)));
      setMessage('Задача добавлена.');
      return true;
    }

    if (!tasks.some(task => task.id === editingId)) {
      setMessage('');
      return false;
    }

    setTasks(previous => updateTask(previous, editingId, value));
    setEditingId(null);
    setMessage('Задача обновлена.');
    return true;
  }

  function handleCancel() {
    setEditingId(null);
    setMessage('Редактирование отменено.');
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>
      <p role="status">{message}</p>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      <TaskForm
        key={editingId ?? 'new'}
        categories={categories}
        initialTask={editingTask}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <TaskList
        tasks={visibleTasks}
        categories={categories}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
