"use strict";
const totalTasks = 9;
const completedTasks = 9;
const dailyLimit = 3;
if (
    typeof totalTasks !== "number" ||
    typeof completedTasks !== "number" ||
    typeof dailyLimit !== "number"
) {
    console.log("Ошибка: totalTasks, completedTasks и dailyLimit должны быть числами.");
} else if (
    !Number.isFinite(totalTasks) ||
    !Number.isFinite(completedTasks) ||
    !Number.isFinite(dailyLimit)
) {
    console.log("Ошибка: значения должны быть конечными числами (не NaN и не Infinity).");
} else if (
    !Number.isInteger(totalTasks) ||
    !Number.isInteger(completedTasks) ||
    !Number.isInteger(dailyLimit)
) {
    console.log("Ошибка: totalTasks, completedTasks и dailyLimit должны быть целыми числами.");
} else if (totalTasks < 0 || totalTasks > 1000) {
    console.log("Ошибка: totalTasks должен быть в диапазоне от 0 до 1000.");
} else if (completedTasks < 0) {
    console.log("Ошибка: completedTasks не может быть отрицательным.");
} else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше задач, чем существует всего.");
} else if (dailyLimit < 1 || dailyLimit > 1000) {
    console.log("Ошибка: dailyLimit должен быть целым числом от 1 до 1000.");
} else {
    let remainingTasks = totalTasks - completedTasks;

    if (remainingTasks === 0) {
        if (totalTasks === 0 && completedTasks === 0) {
            console.log("Задач пока нет");
        } else {
            console.log("Все задачи уже выполнены");
        }
        console.log("Потребуется дней: 0");
    } else {
        console.log("Осталось задач:", remainingTasks);
        let dayNumber = 0;
        while (remainingTasks > 0) {
            dayNumber += 1;
            const tasksToday = Math.min(dailyLimit, remainingTasks);
            remainingTasks -= tasksToday;
            console.log(`День ${dayNumber}: выполнено ${tasksToday}, осталось ${remainingTasks}`);
        }
        console.log("Потребуется дней:", dayNumber);
    }
}
