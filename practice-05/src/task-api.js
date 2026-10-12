import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
    if (client === null || typeof client !== "object" || typeof client.requestJson !== "function") {
        throw new TypeError("createTaskApi требует объект с методом requestJson");
    }

    function normalizeFilters(filters) {
        if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
            throw new TypeError("filters должен быть обычным объектом");
        }

        const query = {};

        for (const [key, value] of Object.entries(filters)) {
            if (!ALLOWED_FILTERS.has(key)) {
                throw new TypeError(`Неизвестный фильтр: ${key}`);
            }
            if (value === undefined) {
                continue;
            }

            if (key === "completed") {
                if (typeof value !== "boolean") {
                    throw new TypeError("Фильтр completed должен быть true или false");
                }
                query.completed = value;
            }

            if (key === "priority") {
                if (!ALLOWED_PRIORITIES.has(value)) {
                    throw new TypeError("Фильтр priority должен быть low, medium или high");
                }
                query.priority = value;
            }

            if (key === "categoryId") {
                if (!isPositiveSafeInteger(value)) {
                    throw new TypeError("Фильтр categoryId должен быть положительным целым числом");
                }
                query.categoryId = value;
            }

            if (key === "q") {
                if (typeof value !== "string") {
                    throw new TypeError("Фильтр q должен быть строкой");
                }
                const text = value.trim();
                if (text.length > 100) {
                    throw new TypeError("Фильтр q длиннее 100 символов");
                }
                query.q = text;
            }
        }

        return query;
    }

    function checkCollection(payload, isValidItem, label) {
        if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)) {
            throw invalidResponse(`Ответ ${label} не содержит массив data`);
        }
        if (!payload.data.every((item) => isValidItem(item))) {
            throw invalidResponse(`Ответ ${label} содержит запись, не соответствующую модели`);
        }

        const ids = payload.data.map((item) => item.id);
        if (new Set(ids).size !== ids.length) {
            throw invalidResponse(`Ответ ${label} содержит повторяющиеся id`);
        }

        const meta = payload.meta;
        if (meta !== undefined) {
            if (meta === null || typeof meta !== "object" || meta.total !== payload.data.length) {
                throw invalidResponse(`В ответе ${label} meta.total не совпадает с длиной data`);
            }
        }

        return payload;
    }

    async function getTasks(filters = {}) {
        const query = normalizeFilters(filters);
        const payload = await client.requestJson("/tasks", { query });
        checkCollection(payload, isTask, "списка задач");

        return { tasks: payload.data, meta: payload.meta };
    }

    async function getTaskById(id) {
        if (!isPositiveSafeInteger(id)) {
            throw new TypeError("id должен быть положительным целым числом");
        }

        const payload = await client.requestJson(`/tasks/${id}`);
        if (payload === null || typeof payload !== "object" || !isTask(payload.data)) {
            throw invalidResponse("Ответ задачи не соответствует модели");
        }

        return payload.data;
    }

    async function getCategories() {
        const payload = await client.requestJson("/categories");
        checkCollection(payload, isCategory, "списка категорий");

        return payload.data;
    }

    async function loadInitialData(filters = {}) {
        normalizeFilters(filters);

        const tasksRequest = getTasks(filters);
        const categoriesRequest = getCategories();
        const [tasksResult, categories] = await Promise.all([tasksRequest, categoriesRequest]);

        return { tasks: tasksResult.tasks, categories, meta: tasksResult.meta };
    }

    return { getTasks, getTaskById, getCategories, loadInitialData };
}
