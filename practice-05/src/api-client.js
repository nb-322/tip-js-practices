export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

const JSON_CONTENT_TYPE = /^application\/([\w.+-]+\+)?json\s*(;|$)/i;

function parseBaseUrl(baseUrl) {
    if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
        throw new TypeError("baseUrl должен быть непустой строкой");
    }

    let parsed;
    try {
        parsed = new URL(baseUrl);
    } catch {
        throw new TypeError("baseUrl должен быть абсолютным адресом");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new TypeError("baseUrl должен использовать схему http или https");
    }
    if (parsed.search !== "" || parsed.hash !== "") {
        throw new TypeError("baseUrl не должен содержать query или hash");
    }

    return parsed;
}

function checkTimeout(timeoutMs) {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
        throw new TypeError("timeoutMs должен быть положительным целым числом");
    }
}

export function buildUrl(baseUrl, path, query = {}) {
    const base = parseBaseUrl(baseUrl);

    if (typeof path !== "string" || path.trim().length === 0) {
        throw new TypeError("path должен быть непустой строкой");
    }
    if (query === null || typeof query !== "object" || Array.isArray(query)) {
        throw new TypeError("query должен быть обычным объектом");
    }

    const basePath = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
    const relativePath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(relativePath, `${base.origin}${basePath}`);

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") {
            continue;
        }
        url.searchParams.set(key, String(value));
    }

    return url.toString();
}

export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
    parseBaseUrl(baseUrl);

    if (typeof fetchFn !== "function") {
        throw new TypeError("fetchFn должен быть функцией");
    }
    checkTimeout(timeoutMs);

    function classifyFailure(error, { url, timeoutSignal, externalSignal }) {
        if (externalSignal !== undefined && externalSignal.aborted) {
            return new ApiError("Запрос отменён вызывающим кодом.", {
                kind: "aborted",
                url,
                cause: error,
            });
        }
        if (timeoutSignal.aborted) {
            return new ApiError("Превышено время ожидания ответа.", {
                kind: "timeout",
                url,
                cause: error,
            });
        }
        return new ApiError(`Нет связи с API: ${error.message}`, {
            kind: "network",
            url,
            cause: error,
        });
    }

    async function readErrorPayload(response) {
        const contentType = response.headers.get("content-type") ?? "";
        if (!JSON_CONTENT_TYPE.test(contentType.trim())) {
            return null;
        }
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    async function requestJson(path, options = {}) {
        if (options === null || typeof options !== "object") {
            throw new TypeError("options должен быть объектом");
        }

        const {
            query = {},
            signal: externalSignal,
            timeoutMs: requestTimeoutMs = timeoutMs,
        } = options;

        if (externalSignal !== undefined && !(externalSignal instanceof AbortSignal)) {
            throw new TypeError("signal должен быть экземпляром AbortSignal");
        }
        checkTimeout(requestTimeoutMs);

        const url = buildUrl(baseUrl, path, query);
        const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);
        const signal = externalSignal === undefined
            ? timeoutSignal
            : AbortSignal.any([externalSignal, timeoutSignal]);

        let response;
        try {
            response = await fetchFn(url, {
                method: "GET",
                headers: { Accept: "application/json" },
                signal,
            });
        } catch (error) {
            throw classifyFailure(error, { url, timeoutSignal, externalSignal });
        }

        if (!(response instanceof Response)) {
            throw new ApiError("Ответ не является объектом Response.", {
                kind: "invalid-response",
                url,
            });
        }

        if (!response.ok) {
            const payload = await readErrorPayload(response);
            const apiError = payload !== null && typeof payload === "object"
                ? payload.error
                : null;
            const message = apiError !== null
                && typeof apiError === "object"
                && typeof apiError.message === "string"
                && apiError.message.trim().length > 0
                ? apiError.message
                : `Запрос завершился со статусом HTTP ${response.status}.`;

            throw new ApiError(message, {
                kind: "http",
                status: response.status,
                code: apiError?.code ?? null,
                details: apiError?.details ?? null,
                url,
            });
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!JSON_CONTENT_TYPE.test(contentType.trim())) {
            throw new ApiError(`Ожидался JSON, получен Content-Type: ${contentType || "не указан"}.`, {
                kind: "invalid-response",
                url,
            });
        }

        try {
            return await response.json();
        } catch (error) {
            throw new ApiError("Тело ответа не является корректным JSON.", {
                kind: "invalid-response",
                url,
                cause: error,
            });
        }
    }

    return { requestJson };
}
