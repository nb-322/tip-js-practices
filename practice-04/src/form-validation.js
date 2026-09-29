const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const TITLE_MAX_LENGTH = 100;

function normalizeId(rawId) {
    if (typeof rawId !== "number" && typeof rawId !== "string") {
        return { ok: false, error: "Укажите идентификатор задачи" };
    }
    if (typeof rawId === "string" && rawId.trim().length === 0) {
        return { ok: false, error: "Укажите идентификатор задачи" };
    }

    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return { ok: false, error: "Идентификатор должен быть положительным целым числом" };
    }

    return { ok: true, id };
}

function normalizeTitle(rawTitle) {
    if (typeof rawTitle !== "string") {
        return { ok: false, error: "Название должно быть строкой" };
    }

    const title = rawTitle.trim();
    if (title.length === 0) {
        return { ok: false, error: "Название не должно быть пустым" };
    }
    if (title.length > TITLE_MAX_LENGTH) {
        return { ok: false, error: `Название длиннее ${TITLE_MAX_LENGTH} символов` };
    }

    return { ok: true, title };
}

export function validateTaskDraft(draft, tasks, editingId = null) {
    const errors = {};
    let id = null;

    if (editingId === null) {
        const idResult = normalizeId(draft.id);
        if (!idResult.ok) {
            errors.id = idResult.error;
        } else if (tasks.some((task) => task.id === idResult.id)) {
            errors.id = `Задача с идентификатором ${idResult.id} уже есть в списке`;
        } else {
            id = idResult.id;
        }
    } else {
        const idResult = normalizeId(editingId);
        if (!idResult.ok) {
            errors.id = idResult.error;
        } else if (!tasks.some((task) => task.id === idResult.id)) {
            errors.id = `Задача с идентификатором ${idResult.id} не найдена`;
        } else {
            id = idResult.id;
        }
    }

    const titleResult = normalizeTitle(draft.title);
    if (!titleResult.ok) {
        errors.title = titleResult.error;
    }

    if (!ALLOWED_PRIORITIES.has(draft.priority)) {
        errors.priority = "Приоритет должен быть low, medium или high";
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        value: { id, title: titleResult.title, priority: draft.priority },
    };
}
