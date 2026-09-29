export const DRAFT_VERSION = 1;

export function isValidDraft(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    return typeof value.id === "string"
        && typeof value.title === "string"
        && typeof value.priority === "string";
}

export function isEmptyDraft(draft) {
    return draft.id.trim().length === 0 && draft.title.trim().length === 0;
}

export function loadDraft(storage, key) {
    try {
        const raw = storage.getItem(key);
        if (raw === null || raw === undefined) {
            return { ok: true, draft: null };
        }

        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object" || parsed.version !== DRAFT_VERSION) {
            return { ok: false, draft: null, error: "Черновик формы имеет неизвестный формат и не восстановлен" };
        }
        if (!isValidDraft(parsed.draft)) {
            return { ok: false, draft: null, error: "Черновик формы повреждён и не восстановлен" };
        }

        return { ok: true, draft: { ...parsed.draft } };
    } catch (error) {
        return { ok: false, draft: null, error: `Черновик формы не прочитан: ${error.message}` };
    }
}

export function saveDraft(storage, key, draft) {
    if (!isValidDraft(draft)) {
        return { ok: false, error: "Черновик не сохранён: неверный набор полей" };
    }

    try {
        storage.setItem(key, JSON.stringify({ version: DRAFT_VERSION, draft }));
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Черновик не сохранён: ${error.message}` };
    }
}

export function removeDraft(storage, key) {
    try {
        storage.removeItem(key);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Черновик не удалён: ${error.message}` };
    }
}
