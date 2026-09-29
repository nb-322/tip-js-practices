export const STORAGE_VERSION = 1;

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const TITLE_MAX_LENGTH = 100;

function isValidTask(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    if (!Number.isSafeInteger(value.id) || value.id <= 0) {
        return false;
    }
    if (typeof value.title !== "string") {
        return false;
    }

    const title = value.title.trim();
    if (title.length === 0 || title.length > TITLE_MAX_LENGTH) {
        return false;
    }
    if (typeof value.completed !== "boolean") {
        return false;
    }

    return ALLOWED_PRIORITIES.has(value.priority);
}

export function isValidTaskList(value) {
    if (!Array.isArray(value)) {
        return false;
    }
    if (!value.every((task) => isValidTask(task))) {
        return false;
    }

    return new Set(value.map((task) => task.id)).size === value.length;
}

export function loadTasks(storage, key, fallbackTasks) {
    const fallback = fallbackTasks.map((task) => ({ ...task }));

    try {
        const raw = storage.getItem(key);
        if (raw === null || raw === undefined) {
            return { ok: true, source: "initial", tasks: fallback };
        }

        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {
                ok: false,
                source: "fallback",
                tasks: fallback,
                error: "Сохранённые данные имеют неизвестный формат, взят исходный набор",
            };
        }
        if (parsed.version !== STORAGE_VERSION) {
            return {
                ok: false,
                source: "fallback",
                tasks: fallback,
                error: `Версия сохранённых данных ${parsed.version} не поддерживается, взят исходный набор`,
            };
        }
        if (!isValidTaskList(parsed.tasks)) {
            return {
                ok: false,
                source: "fallback",
                tasks: fallback,
                error: "Сохранённые задачи не прошли проверку схемы, взят исходный набор",
            };
        }

        return {
            ok: true,
            source: "storage",
            tasks: parsed.tasks.map((task) => ({ ...task })),
        };
    } catch (error) {
        return {
            ok: false,
            source: "fallback",
            tasks: fallback,
            error: `Сохранённые данные не прочитаны: ${error.message}`,
        };
    }
}

export function saveTasks(storage, key, tasks) {
    if (!isValidTaskList(tasks)) {
        return { ok: false, error: "Список задач не прошёл проверку и не был сохранён" };
    }

    try {
        storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Не удалось сохранить данные: ${error.message}` };
    }
}

export function removeSavedTasks(storage, key) {
    try {
        storage.removeItem(key);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
    }
}
