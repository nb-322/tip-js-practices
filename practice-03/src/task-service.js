const ALLOWED_PRIORITIES = ["low", "medium", "high"];
const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 100;

function checkId(id) {
    if (typeof id !== "number") {
        return "Идентификатор должен быть числом";
    }
    if (!Number.isSafeInteger(id)) {
        return "Идентификатор должен быть безопасным целым числом";
    }
    if (id <= 0) {
        return "Идентификатор должен быть положительным";
    }
    return null;
}

function normalizeTitle(title) {
    if (typeof title !== "string") {
        return { ok: false, error: "Название должно быть строкой" };
    }
    const trimmed = title.trim();
    if (trimmed.length < TITLE_MIN_LENGTH) {
        return { ok: false, error: "Название не должно быть пустым" };
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
        return { ok: false, error: `Название длиннее ${TITLE_MAX_LENGTH} символов` };
    }
    return { ok: true, title: trimmed };
}

function checkPriority(priority) {
    if (!ALLOWED_PRIORITIES.includes(priority)) {
        return `Приоритет должен быть одним из: ${ALLOWED_PRIORITIES.join(", ")}`;
    }
    return null;
}

export function createTask(id, title, priority = "medium") {
    const idError = checkId(id);
    if (idError !== null) {
        return { ok: false, error: idError };
    }

    const titleResult = normalizeTitle(title);
    if (!titleResult.ok) {
        return titleResult;
    }

    const priorityError = checkPriority(priority);
    if (priorityError !== null) {
        return { ok: false, error: priorityError };
    }

    return {
        ok: true,
        task: {
            id,
            title: titleResult.title,
            completed: false,
            priority,
        },
    };
}

export function findTaskById(tasks, id) {
    return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
    return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
    return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed === true).length;
    const pending = total - completed;
    const progress = total === 0 ? 0 : (completed / total) * 100;

    return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
    const created = createTask(id, title, priority);
    if (!created.ok) {
        return created;
    }

    if (findTaskById(tasks, id) !== undefined) {
        return { ok: false, error: `Задача с идентификатором ${id} уже есть в списке` };
    }

    return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
    const idError = checkId(id);
    if (idError !== null) {
        return { ok: false, error: idError };
    }

    if (typeof completed !== "boolean") {
        return { ok: false, error: "Признак выполнения должен быть true или false" };
    }

    if (findTaskById(tasks, id) === undefined) {
        return { ok: false, error: `Задача с идентификатором ${id} не найдена` };
    }

    const nextTasks = tasks.map((task) => (task.id === id ? { ...task, completed } : task));

    return { ok: true, tasks: nextTasks };
}

export function renameTask(tasks, id, title) {
    const idError = checkId(id);
    if (idError !== null) {
        return { ok: false, error: idError };
    }

    const titleResult = normalizeTitle(title);
    if (!titleResult.ok) {
        return titleResult;
    }

    if (findTaskById(tasks, id) === undefined) {
        return { ok: false, error: `Задача с идентификатором ${id} не найдена` };
    }

    const nextTasks = tasks.map((task) =>
        task.id === id ? { ...task, title: titleResult.title } : task
    );

    return { ok: true, tasks: nextTasks };
}

export function removeTask(tasks, id) {
    const idError = checkId(id);
    if (idError !== null) {
        return { ok: false, error: idError };
    }

    if (findTaskById(tasks, id) === undefined) {
        return { ok: false, error: `Задача с идентификатором ${id} не найдена` };
    }

    return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
