import { ApiError } from "./api-client.js";

function describeFailure(reason) {
    if (reason instanceof ApiError) {
        return {
            kind: reason.kind,
            status: reason.status,
            code: reason.code,
            message: reason.message,
        };
    }

    return {
        kind: "unknown",
        status: null,
        code: null,
        message: reason instanceof Error ? reason.message : String(reason),
    };
}

export function createPartialLoader(api) {
    if (api === null || typeof api !== "object"
        || typeof api.getTasks !== "function"
        || typeof api.getCategories !== "function") {
        throw new TypeError("createPartialLoader требует объект, созданный createTaskApi");
    }

    async function loadInitialDataSettled(filters = {}) {
        const results = await Promise.allSettled([
            api.getTasks(filters),
            api.getCategories(),
        ]);

        const [tasksResult, categoriesResult] = results;

        return {
            ok: tasksResult.status === "fulfilled" && categoriesResult.status === "fulfilled",
            tasks: tasksResult.status === "fulfilled" ? tasksResult.value.tasks : null,
            meta: tasksResult.status === "fulfilled" ? tasksResult.value.meta : null,
            categories: categoriesResult.status === "fulfilled" ? categoriesResult.value : null,
            errors: {
                tasks: tasksResult.status === "rejected" ? describeFailure(tasksResult.reason) : null,
                categories: categoriesResult.status === "rejected" ? describeFailure(categoriesResult.reason) : null,
            },
        };
    }

    return { loadInitialDataSettled };
}
