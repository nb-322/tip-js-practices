// Чистые функции: без React, DOM, сети, случайных значений и изменения аргументов.
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);
const TITLE_MAX_LENGTH = 100;

function toCategoryId(value) {
    if (typeof value === 'number') {
        return Number.isSafeInteger(value) && value > 0 ? value : null;
    }
    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }
    const text = value.trim();
    if (!/^\d+$/.test(text)) {
        return null;
    }
    const id = Number(text);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function validateTaskDraft(draft, categories) {
    const source = draft === null || typeof draft !== 'object' ? {} : draft;
    const errors = {};

    let title = '';
    if (typeof source.title !== 'string') {
        errors.title = 'Название должно быть строкой.';
    } else {
        title = source.title.trim();
        if (title.length === 0) {
            errors.title = 'Название не должно быть пустым.';
        } else if (title.length > TITLE_MAX_LENGTH) {
            errors.title = `Название должно содержать не более ${TITLE_MAX_LENGTH} символов.`;
        }
    }

    const priority = source.priority;
    if (!ALLOWED_PRIORITIES.has(priority)) {
        errors.priority = 'Выберите приоритет: низкий, средний или высокий.';
    }

    const categoryId = toCategoryId(source.categoryId);
    if (categoryId === null) {
        errors.categoryId = 'Выберите категорию.';
    } else if (!categories.some(category => category.id === categoryId)) {
        errors.categoryId = 'Такой категории нет в справочнике.';
    }

    if (Object.keys(errors).length > 0) {
        return { valid: false, value: null, errors };
    }

    return { valid: true, value: { title, priority, categoryId }, errors: {} };
}

export function selectTasks(tasks, filters) {
    const query = typeof filters.q === 'string' ? filters.q.trim().toLowerCase() : '';

    return tasks.filter(task => {
        if (query !== '' && !task.title.toLowerCase().includes(query)) {
            return false;
        }
        if (filters.completed === 'true' && task.completed !== true) {
            return false;
        }
        if (filters.completed === 'false' && task.completed !== false) {
            return false;
        }
        if (filters.priority !== '' && task.priority !== filters.priority) {
            return false;
        }
        if (filters.categoryId !== '' && String(task.categoryId) !== String(filters.categoryId)) {
            return false;
        }
        return true;
    });
}

export function getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;

    return { total, completed, active: total - completed };
}

export function addTask(tasks, value, id) {
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
        throw new TypeError('Идентификатор должен быть положительным целым числом.');
    }
    if (tasks.some(task => task.id === id)) {
        throw new Error(`Задача с идентификатором ${id} уже существует.`);
    }

    return [...tasks, { id, ...value, completed: false }];
}

export function updateTask(tasks, id, value) {
    if (!tasks.some(task => task.id === id)) {
        return tasks;
    }

    return tasks.map(task => (task.id === id
        ? { ...task, title: value.title, priority: value.priority, categoryId: value.categoryId }
        : task));
}

export function toggleTask(tasks, id) {
    if (!tasks.some(task => task.id === id)) {
        return tasks;
    }

    return tasks.map(task => (task.id === id ? { ...task, completed: !task.completed } : task));
}

export function removeTask(tasks, id) {
    if (!tasks.some(task => task.id === id)) {
        return tasks;
    }

    return tasks.filter(task => task.id !== id);
}
