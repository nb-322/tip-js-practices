const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const TITLE_MAX_LENGTH = 100;

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
    const errors = {};
    const source = draft === null || typeof draft !== "object" ? {} : draft;
    const list = Array.isArray(categories) ? categories : [];

    const rawTitle = source.title;
    let title = "";
    if (typeof rawTitle !== "string") {
        errors.title = "Название должно быть строкой.";
    } else {
        title = rawTitle.trim();
        if (title.length === 0) {
            errors.title = "Название не должно быть пустым.";
        } else if (title.length > TITLE_MAX_LENGTH) {
            errors.title = `Название должно содержать не более ${TITLE_MAX_LENGTH} символов.`;
        }
    }

    const priority = source.priority;
    if (!ALLOWED_PRIORITIES.has(priority)) {
        errors.priority = "Выберите приоритет: низкий, средний или высокий.";
    }

    const categoryId = Number(source.categoryId);
    if (source.categoryId === "" || source.categoryId === null || source.categoryId === undefined
        || !Number.isSafeInteger(categoryId) || categoryId <= 0) {
        errors.categoryId = "Выберите категорию.";
    } else if (!list.some((category) => category.id === categoryId)) {
        errors.categoryId = "Такой категории нет в загруженном списке.";
    }

    if (Object.keys(errors).length > 0) {
        return { valid: false, value: null, errors };
    }

    return { valid: true, value: { title, priority, categoryId }, errors: {} };
}
