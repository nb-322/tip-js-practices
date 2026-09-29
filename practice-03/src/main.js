import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks, getTasksByPriority } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  priorities: document.querySelector("#priority-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
};

// Готовая служебная часть: ?dataset=variant включает данные своего варианта.
// Наборы не смешиваются, редактировать код для переключения не требуется.
const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";
let currentPriority = "all";

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

const STATUS_FILTERS = ["all", "pending", "completed"];
const PRIORITY_FILTERS = ["all", "low", "medium", "high"];

function markActive(groupElement, attribute, value) {
    if (groupElement === null) {
        return;
    }
    for (const button of groupElement.querySelectorAll(`button[data-${attribute}]`)) {
        const isActive = button.dataset[attribute] === value;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    }
}

function renderApp() {
    const visibleTasks = getTasksByPriority(
        getVisibleTasks(currentTasks, currentFilter),
        currentPriority
    );

    renderTaskList(elements.list, visibleTasks);
    renderSummary(elements.summary, currentTasks, visibleTasks.length);
    renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);
    markActive(elements.filters, "filter", currentFilter);
    markActive(elements.priorities, "priority", currentPriority);
}

function handleTaskListClick(event) {
    if (!(event.target instanceof Element)) {
        return;
    }

    const button = event.target.closest("button[data-action]");
    if (button === null || !elements.list.contains(button)) {
        return;
    }

    const action = button.dataset.action;
    if (action !== "toggle" && action !== "delete") {
        return;
    }

    const card = button.closest("li[data-task-id]");
    if (card === null) {
        return;
    }

    const id = Number(card.dataset.taskId);
    if (!Number.isSafeInteger(id) || id <= 0) {
        elements.message.textContent = `Некорректный идентификатор задачи: ${card.dataset.taskId}`;
        return;
    }

    let result;
    if (action === "toggle") {
        const task = findTaskById(currentTasks, id);
        if (task === undefined) {
            elements.message.textContent = `Задача с идентификатором ${id} не найдена`;
            return;
        }
        result = setTaskCompleted(currentTasks, id, !task.completed);
    } else {
        result = removeTask(currentTasks, id);
    }

    if (!result.ok) {
        elements.message.textContent = result.error;
        return;
    }

    currentTasks = result.tasks;
    elements.message.textContent = "";
    renderApp();
    restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
    if (!(event.target instanceof Element)) {
        return;
    }

    const button = event.target.closest("button[data-filter]");
    if (button === null || !elements.filters.contains(button)) {
        return;
    }

    const filter = button.dataset.filter;
    if (!STATUS_FILTERS.includes(filter)) {
        return;
    }

    currentFilter = filter;
    elements.message.textContent = "";
    renderApp();
}

function handlePriorityClick(event) {
    if (!(event.target instanceof Element)) {
        return;
    }

    const button = event.target.closest("button[data-priority]");
    if (button === null || !elements.priorities.contains(button)) {
        return;
    }

    const priority = button.dataset.priority;
    if (!PRIORITY_FILTERS.includes(priority)) {
        return;
    }

    currentPriority = priority;
    elements.message.textContent = "";
    renderApp();
}

// Готовая вспомогательная функция. Сохраняет понятную позицию клавиатурного фокуса
// после замены карточек. Если карточки больше нет, фокус получает активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

// Подписки выполняются один раз. Эти контейнеры не заменяются при перерисовке.
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.priorities.addEventListener("click", handlePriorityClick);

// До реализации renderApp ожидается сообщение о заглушке.
// try/catch здесь — готовая диагностика старта, а не замена проверки result.ok.
try {
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}
