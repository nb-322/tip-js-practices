"use strict";

const totalTasks = 9;
const completedTasks = 9;

if (typeof totalTasks !== "number" || typeof completedTasks !== "number") {
    console.log("Ошибка: totalTasks и completedTasks должны быть числами, а не строками или другими значениями.");
} else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
    console.log("Ошибка: totalTasks и completedTasks должны быть конечными числами (не NaN и не Irfinity).");
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    console.log("Ошибка: totalTasks и completedTasks должны быть целыми числами.");
} else if (totalTasks < 0 || totalTasks > 1000) {
    console.log("Ошибка: totalTasks должен быть в диапазоне от 0 до 1000.");
} else if (completedTasks < 0) {
    console.log("Ошибка: completedTasks не может быть отрицательным.");
} else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше задач, чем существует всего.");
} else if (totalTasks === 0 && completedTasks === 0) {
    console.log("Задач пока нет");
} else {
    const remainingTasks = totalTasks - completedTasks;
    const progressPercentage = (completedTasks / totalTasks) * 100;
    let status;
    if (completedTasks === 0) {
        status = "Не начато";
    } else if (completedTasks === totalTasks) {
        status = "Завершено";
    } else {
        status = "В работе";
    }
    console.log("Всего задач:", totalTasks);
    console.log("Выполнено:", completedTasks);
    console.log("Осталось:", remainingTasks);
    console.log(`Прогресс: ${progressPercentage.toFixed(1)}%`);
    console.log("Статус:", status);
}
