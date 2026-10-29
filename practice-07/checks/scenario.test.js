import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, tasks } from '../src/data.js';
import {
  addTask, getTaskStats, removeTask, selectTasks, toggleTask, updateTask, validateTaskDraft,
} from '../src/domain/task-service.js';

const ids = list => list.map(task => task.id);
const nextId = list => list.reduce((max, task) => Math.max(max, task.id), 0) + 1;
const emptyFilters = Object.freeze({ q: '', completed: '', priority: '', categoryId: '' });
const snapshot = JSON.stringify(tasks);

test('последовательность: создание, редактирование, удаление', () => {
  const draft = { title: '  Собрать интерфейс  ', priority: 'low', categoryId: '3' };
  const created = validateTaskDraft(draft, categories);
  assert.equal(created.valid, true);

  const afterAdd = addTask(tasks, created.value, nextId(tasks));
  assert.deepEqual(afterAdd.at(-1), {
    id: 35, title: 'Собрать интерфейс', priority: 'low', categoryId: 3, completed: false,
  });
  assert.deepEqual(getTaskStats(afterAdd), { total: 13, completed: 5, active: 8 });

  const edited = validateTaskDraft({ title: 'Собрать и проверить интерфейс', priority: 'high', categoryId: '2' }, categories);
  const afterUpdate = updateTask(afterAdd, 35, edited.value);
  assert.deepEqual(afterUpdate.at(-1), {
    id: 35, title: 'Собрать и проверить интерфейс', priority: 'high', categoryId: 2, completed: false,
  });

  const afterRemove = removeTask(afterUpdate, 35);
  assert.deepEqual(ids(afterRemove), ids(tasks));
  assert.deepEqual(getTaskStats(afterRemove), getTaskStats(tasks));
  assert.equal(JSON.stringify(tasks), snapshot);
});

test('редактирование не теряет статус, а переключение не теряет правки', () => {
  const value = validateTaskDraft({ title: 'Новое название', priority: 'low', categoryId: '3' }, categories).value;
  const afterUpdate = updateTask(tasks, 1, value);
  assert.equal(afterUpdate[0].completed, true);

  const afterToggle = toggleTask(afterUpdate, 1);
  assert.deepEqual(afterToggle[0], { id: 1, ...value, completed: false });
});

test('длина массива и максимум выборки не годятся как следующий id', () => {
  const value = { title: 'Проверка идентификатора', priority: 'low', categoryId: 1 };

  // Длина массива равна 12, но id 13 уже занят: такой расчёт даёт конфликт.
  assert.equal(tasks.length + 1, 13);
  assert.throws(() => addTask(tasks, value, tasks.length + 1));

  // Максимум видимой выборки меньше максимума полного набора.
  const visible = selectTasks(tasks, { ...emptyFilters, priority: 'low' });
  assert.deepEqual(ids(visible), [7, 22, 31]);
  assert.equal(nextId(visible), 32);
  assert.equal(nextId(tasks), 35);

  // Расчёт по полному массиву конфликта не создаёт.
  const afterAdd = addTask(tasks, value, nextId(tasks));
  assert.equal(new Set(ids(afterAdd)).size, afterAdd.length);
});

test('удалённый максимальный id переиспользуется без конфликта', () => {
  const afterRemove = removeTask(tasks, 34);
  const afterAdd = addTask(afterRemove, { title: 'Снова 34', priority: 'low', categoryId: 1 }, nextId(afterRemove));
  assert.equal(afterAdd.at(-1).id, 32);
  assert.equal(new Set(ids(afterAdd)).size, afterAdd.length);
});

test('созданная запись видна только в подходящей выборке', () => {
  const value = validateTaskDraft({ title: 'Задача низкого приоритета', priority: 'low', categoryId: '1' }, categories).value;
  const afterAdd = addTask(tasks, value, nextId(tasks));

  assert.equal(selectTasks(afterAdd, { ...emptyFilters, priority: 'high' }).length, 5);
  assert.deepEqual(ids(selectTasks(afterAdd, { ...emptyFilters, priority: 'low' })), [7, 22, 31, 35]);
  assert.equal(getTaskStats(afterAdd).total, 13);
});

test('удаление всех задач оставляет корректные пустые результаты', () => {
  const empty = ids(tasks).reduce((list, id) => removeTask(list, id), tasks);
  assert.deepEqual(empty, []);
  assert.deepEqual(getTaskStats(empty), { total: 0, completed: 0, active: 0 });
  assert.deepEqual(selectTasks(empty, emptyFilters), []);
  assert.deepEqual(ids(addTask(empty, { title: 'Первая после очистки', priority: 'medium', categoryId: 1 }, nextId(empty))), [1]);
});
