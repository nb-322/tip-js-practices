import assert from "node:assert/strict";
import { createApiServer } from "../api/server.mjs";
import { ApiError, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { createPartialLoader } from "../src/task-api-extra.js";

let passed = 0;
let failed = 0;

async function check(name, action) {
    try {
        await action();
        passed += 1;
        console.log(`OK: ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`FAIL: ${name}`);
        console.error(error.stack ?? error.message);
    }
}

async function expectApiError(action, kind, status = null) {
    let caught;
    try {
        await action();
    } catch (error) {
        caught = error;
    }
    assert.ok(caught instanceof ApiError, "Ожидался экземпляр ApiError");
    assert.equal(caught.kind, kind);
    if (status !== null) {
        assert.equal(caught.status, status);
    }
    return caught;
}

const server = createApiServer();
await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const client = createApiClient({ baseUrl, timeoutMs: 1000 });
const api = createTaskApi(client);

try {
    await check("01. своя комбинация фильтров: невыполненные задачи категории 3", async () => {
        const result = await api.getTasks({ completed: false, categoryId: 3 });
        assert.deepEqual(result.tasks.map((task) => task.id), [19]);
        assert.equal(result.meta.total, 1);
        assert.deepEqual(result.meta.filters, {
            completed: false,
            priority: null,
            categoryId: 3,
            q: "",
        });
    });

    await check("02. своя комбинация фильтров: поиск внутри одной категории даёт пустую выборку", async () => {
        const result = await api.getTasks({ categoryId: 1, q: "демонстрац" });
        assert.deepEqual(result.tasks, []);
        assert.equal(result.meta.total, 0);
    });

    await check("03. ошибочный HTTP-сценарий: отсутствующая категория даёт 404 со своим кодом", async () => {
        const error = await expectApiError(
            () => client.requestJson("/categories/999"),
            "http",
            404,
        );
        assert.equal(error.code, "CATEGORY_NOT_FOUND");
        assert.match(error.url, /\/categories\/999$/);
    });

    await check("04. ошибочный HTTP-сценарий: повторение параметра даёт 400 INVALID_QUERY", async () => {
        const error = await expectApiError(
            () => client.requestJson("/tasks?priority=high&priority=low"),
            "http",
            400,
        );
        assert.equal(error.code, "INVALID_QUERY");
    });

    await check("05. граница отмены: сигнал, отменённый до вызова, не доходит до сети", async () => {
        const controller = new AbortController();
        controller.abort();
        const error = await expectApiError(
            () => client.requestJson("/tasks", { signal: controller.signal }),
            "aborted",
        );
        assert.equal(error.status, null);
    });

    await check("06. граница тайм-аута: запас по времени оставляет запрос успешным", async () => {
        const payload = await client.requestJson("/debug/delay", {
            query: { ms: 30 },
            timeoutMs: 800,
        });
        assert.equal(typeof payload, "object");
        await expectApiError(
            () => client.requestJson("/debug/delay", { query: { ms: 300 }, timeoutMs: 40 }),
            "timeout",
        );
    });

    await check("07. расширение: оба запроса успешны", async () => {
        const loader = createPartialLoader(api);
        const result = await loader.loadInitialDataSettled({ priority: "high" });
        assert.equal(result.ok, true);
        assert.deepEqual(result.tasks.map((task) => task.id), [4, 13, 16, 25, 34]);
        assert.equal(result.categories.length, 3);
        assert.deepEqual(result.errors, { tasks: null, categories: null });
    });

    await check("08. расширение: отказ задач сохраняет категории", async () => {
        const brokenTasks = createTaskApi({
            async requestJson(path) {
                if (path === "/tasks") {
                    throw new ApiError("Нет связи.", { kind: "network" });
                }
                return { data: [{ id: 1, name: "Учёба" }], meta: { total: 1 } };
            },
        });
        const result = await createPartialLoader(brokenTasks).loadInitialDataSettled();
        assert.equal(result.ok, false);
        assert.equal(result.tasks, null);
        assert.deepEqual(result.categories, [{ id: 1, name: "Учёба" }]);
        assert.equal(result.errors.tasks.kind, "network");
        assert.equal(result.errors.categories, null);
    });

    await check("09. расширение: отказ категорий сохраняет задачи", async () => {
        const brokenCategories = createTaskApi({
            async requestJson(path) {
                if (path === "/categories") {
                    throw new ApiError("Сервис недоступен.", { kind: "http", status: 503, code: "SERVICE_UNAVAILABLE" });
                }
                return {
                    data: [{ id: 4, title: "Задача", completed: false, priority: "high", categoryId: 2 }],
                    meta: { total: 1, filters: {} },
                };
            },
        });
        const result = await createPartialLoader(brokenCategories).loadInitialDataSettled();
        assert.equal(result.ok, false);
        assert.deepEqual(result.tasks.map((task) => task.id), [4]);
        assert.equal(result.categories, null);
        assert.equal(result.errors.categories.status, 503);
        assert.equal(result.errors.categories.code, "SERVICE_UNAVAILABLE");
    });

    await check("10. расширение: отказ обоих запросов описан по отдельности", async () => {
        const brokenBoth = createTaskApi({
            async requestJson(path) {
                throw new ApiError(`Отказ ${path}`, { kind: "timeout" });
            },
        });
        const result = await createPartialLoader(brokenBoth).loadInitialDataSettled();
        assert.equal(result.ok, false);
        assert.equal(result.tasks, null);
        assert.equal(result.categories, null);
        assert.equal(result.errors.tasks.kind, "timeout");
        assert.equal(result.errors.categories.kind, "timeout");
    });
} finally {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
}

console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;
