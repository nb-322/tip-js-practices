import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
    const apiMethods = [
        "loadInitialData", "getTasks", "createTask", "updateTask",
        "setTaskCompleted", "deleteTask", "resetDemoData",
    ];
    const viewMethods = [
        "setListState", "setTasks", "setCategories", "setTotal",
        "setFormTask", "showFormErrors", "setMutationPending", "notify",
    ];

    if (api === null || typeof api !== "object" || !apiMethods.every((name) => typeof api[name] === "function")) {
        throw new TypeError("createAppController требует api со всеми методами задач");
    }
    if (view === null || typeof view !== "object" || !viewMethods.every((name) => typeof view[name] === "function")) {
        throw new TypeError("createAppController требует view со всеми методами отображения");
    }
    if (typeof validateDraft !== "function") {
        throw new TypeError("validateDraft должен быть функцией");
    }

    let tasks = [];
    let categories = null;
    let filters = {};
    let editingId = null;
    let activeLoad = null;
    let loadNumber = 0;

    function showTasks(list, meta) {
        tasks = list;
        view.setTasks(list, categories ?? []);
        view.setTotal(meta?.total ?? list.length);
        view.setListState(list.length === 0 ? "empty" : "ready");

        if (editingId !== null && !list.some((task) => task.id === editingId)) {
            resetForm();
            view.notify("Редактируемая задача исчезла из текущей выборки, форма возвращена в режим создания.", "error");
        }
    }

    function isAborted(error) {
        return error instanceof ApiError && error.kind === "aborted";
    }

    async function load() {
        activeLoad?.abort();
        const controller = new AbortController();
        activeLoad = controller;
        loadNumber += 1;
        const current = loadNumber;

        view.setListState("loading");

        try {
            if (categories === null) {
                const result = await api.loadInitialData(filters, { signal: controller.signal });
                if (current !== loadNumber) return;
                categories = result.categories;
                view.setCategories(categories);
                showTasks(result.tasks, result.meta);
                return;
            }

            const result = await api.getTasks(filters, { signal: controller.signal });
            if (current !== loadNumber) return;
            showTasks(result.tasks, result.meta);
        } catch (error) {
            if (current !== loadNumber || isAborted(error)) return;
            view.setListState("error", messageForError(error));
        } finally {
            if (activeLoad === controller) activeLoad = null;
        }
    }

    async function mutate(action) {
        view.setMutationPending(true);
        try {
            const message = await action();
            view.notify(message, "success");
            await load();
        } catch (error) {
            if (!isAborted(error)) {
                view.notify(messageForError(error), "error");
            }
        } finally {
            view.setMutationPending(false);
        }
    }

    function findTask(id) {
        return tasks.find((task) => task.id === id);
    }

    function resetForm() {
        editingId = null;
        view.setFormTask(null);
        view.showFormErrors({});
    }

    async function start(initialFilters = {}) {
        filters = { ...initialFilters };
        resetForm();
        await load();
    }

    async function applyFilters(nextFilters = {}) {
        filters = { ...nextFilters };
        await load();
    }

    async function refresh() {
        await load();
    }

    async function submit(draft) {
        const result = validateDraft(draft, categories ?? []);
        if (!result.valid) {
            view.showFormErrors(result.errors);
            return;
        }

        view.showFormErrors({});
        const value = result.value;
        const editedId = editingId;

        await mutate(async () => {
            if (editedId === null) {
                await api.createTask(value);
                resetForm();
                return "Задача добавлена.";
            }

            await api.updateTask(editedId, value);
            resetForm();
            return "Задача обновлена.";
        });
    }

    function beginEdit(id) {
        const task = findTask(id);
        if (task === undefined) {
            view.notify("Задача уже отсутствует в списке. Обновите данные.", "error");
            return;
        }

        editingId = task.id;
        view.setFormTask(task);
        view.showFormErrors({});
    }

    function cancelEdit() {
        resetForm();
    }

    async function toggleTask(id) {
        const task = findTask(id);
        if (task === undefined) {
            view.notify("Задача уже отсутствует в списке. Обновите данные.", "error");
            return;
        }

        await mutate(async () => {
            await api.setTaskCompleted(task.id, !task.completed);
            return task.completed ? "Задача возвращена в работу." : "Задача отмечена выполненной.";
        });
    }

    async function deleteTask(id) {
        await mutate(async () => {
            await api.deleteTask(id);
            if (editingId === id) resetForm();
            return "Задача удалена.";
        });
    }

    async function resetData() {
        await mutate(async () => {
            await api.resetDemoData();
            resetForm();
            return "Учебный набор восстановлен.";
        });
    }

    function destroy() {
        activeLoad?.abort();
        activeLoad = null;
    }

    return {
        start, applyFilters, refresh, submit, beginEdit,
        cancelEdit, toggleTask, deleteTask, resetData, destroy,
    };
}
