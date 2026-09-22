import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
    createTask,
    findTaskById,
    getPendingTasks,
    getTaskTitles,
    getTaskStats,
    addTask,
    setTaskCompleted,
    renameTask,
    removeTask,
} from "./task-service.js";
import { getPrioritySummary } from "./task-extra.js";

function printTasks(caption, tasks) {
    console.log(caption);
    if (tasks.length === 0) {
        console.log("  (список пуст)");
        return;
    }
    for (const task of tasks) {
        const mark = task.completed ? "выполнена" : "в работе";
        console.log(`  #${task.id} [${task.priority}] ${task.title} - ${mark}`);
    }
}

function printStats(caption, tasks) {
    const { total, completed, pending, progress } = getTaskStats(tasks);
    if (total === 0) {
        console.log(`${caption}: Задач пока нет`);
        return;
    }
    console.log(
        `${caption}: всего ${total}; выполнено ${completed}; осталось ${pending}; прогресс ${progress.toFixed(1)}%`
    );
}

function apply(currentTasks, result, caption) {
    if (result.ok) {
        console.log(`${caption}: успешно`);
        return result.tasks;
    }
    console.error(`${caption}: ошибка - ${result.error}`);
    return currentTasks;
}

console.log("=== ПР2. Общий сценарий (demoTasks) ===");

let currentTasks = demoTasks;

printTasks("Исходные задачи:", currentTasks);
console.log("Названия:", getTaskTitles(currentTasks));
printTasks("Невыполненные задачи:", getPendingTasks(currentTasks));
printStats("Сводка", currentTasks);

console.log("\n-- Шаг 1. Добавление задачи id = 20 --");
currentTasks = apply(
    currentTasks,
    addTask(currentTasks, 20, "Добавить проверку", "high"),
    "Добавление id 20"
);
printStats("Сводка", currentTasks);

console.log("\n-- Шаг 2. Выполнение задачи id = 4 --");
currentTasks = apply(
    currentTasks,
    setTaskCompleted(currentTasks, 4, true),
    "Выполнение id 4"
);
printStats("Сводка", currentTasks);

console.log("\n-- Шаг 3. Переименование задачи id = 10 --");
currentTasks = apply(
    currentTasks,
    renameTask(currentTasks, 10, "Подготовить инструкцию запуска"),
    "Переименование id 10"
);
console.log("Новое название:", findTaskById(currentTasks, 10).title);
printStats("Сводка", currentTasks);

console.log("\n-- Шаг 4. Удаление задачи id = 7 --");
currentTasks = apply(currentTasks, removeTask(currentTasks, 7), "Удаление id 7");
printStats("Сводка", currentTasks);

console.log("\n-- Шаг 5. Обработанные отказы --");
currentTasks = apply(
    currentTasks,
    addTask(currentTasks, 4, "Повтор идентификатора"),
    "Добавление существующего id 4"
);
currentTasks = apply(
    currentTasks,
    setTaskCompleted(currentTasks, 20, "true"),
    "Статус строкой \"true\" для id 20"
);
currentTasks = apply(
    currentTasks,
    removeTask(currentTasks, 777),
    "Удаление отсутствующего id 777"
);
console.log("Состояние после отказов не изменилось:");
printStats("Сводка", currentTasks);

console.log("\n-- Итог общего сценария --");
printTasks("Итоговые задачи:", currentTasks);
console.log(
    "Идентификаторы:",
    currentTasks.map((task) => task.id)
);
printTasks("Исходный demoTasks после всех операций:", demoTasks);

console.log("\n\n=== Индивидуальный вариант " + variantNumber + " (сайт-портфолио) ===");

let variantCurrent = variantTasks;

printTasks("Исходные задачи варианта:", variantCurrent);
printStats("Сводка", variantCurrent);

console.log("\n-- Шаг 1. Добавление задачи id = 80 --");
variantCurrent = apply(
    variantCurrent,
    addTask(variantCurrent, 80, "Подключить форму обратной связи", "low"),
    "Добавление id 80"
);
printStats("Сводка", variantCurrent);

console.log("\n-- Шаг 2. Выполнение задачи id = 11 --");
variantCurrent = apply(
    variantCurrent,
    setTaskCompleted(variantCurrent, 11, true),
    "Выполнение id 11 (задача уже была выполнена)"
);
printStats("Сводка", variantCurrent);

console.log("\n-- Шаг 3. Переименование задачи id = 23 --");
variantCurrent = apply(
    variantCurrent,
    renameTask(variantCurrent, 23, "Выбрать шаблон и собрать палитру"),
    "Переименование id 23"
);
console.log("Запись после переименования:", findTaskById(variantCurrent, 23));
printStats("Сводка", variantCurrent);

console.log("\n-- Шаг 4. Удаление задачи id = 37 --");
variantCurrent = apply(variantCurrent, removeTask(variantCurrent, 37), "Удаление id 37");
printStats("Сводка", variantCurrent);

console.log("\n-- Шаг 5. Повторное добавление id = 80 --");
variantCurrent = apply(
    variantCurrent,
    addTask(variantCurrent, 80, "Дубликат формы обратной связи", "low"),
    "Повторное добавление id 80"
);
printStats("Сводка", variantCurrent);

console.log("\n-- Итог варианта --");
printTasks("Итоговые задачи варианта:", variantCurrent);
console.log(
    "Идентификаторы:",
    variantCurrent.map((task) => task.id)
);
printTasks("Исходный variantTasks после всех операций:", variantTasks);

console.log("\n\n=== Расширение: сводка по приоритетам ===");
console.log("demoTasks:", getPrioritySummary(demoTasks));
console.log("Вариант после всех операций:", getPrioritySummary(variantCurrent));

console.log("\n=== Пример createTask без списка ===");
console.log(createTask(20, "  Проверить  данные  "));
console.log(createTask("20", "Строковый идентификатор"));
