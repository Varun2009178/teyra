/**
 * Fetch with automatic timeout and retry logic
 * Prevents hanging requests on slow networks
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 8000, retries = 0, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' && retries > 0) {
      // Retry on timeout
      return fetchWithTimeout(url, { ...options, retries: retries - 1 });
    }

    throw error;
  }
}

/**
 * Parallel fetch helper - fetches multiple endpoints in parallel
 */
export async function fetchParallel<T extends Record<string, string>>(
  endpoints: T,
  options: FetchWithTimeoutOptions = {}
): Promise<Record<keyof T, Response>> {
  const entries = Object.entries(endpoints);

  const responses = await Promise.all(
    entries.map(([key, url]) =>
      fetchWithTimeout(url, options).catch(error => {
        console.error(`Failed to fetch ${key}:`, error);
        return null;
      })
    )
  );

  const result: any = {};
  entries.forEach(([key], index) => {
    result[key] = responses[index];
  });

  return result;
}
