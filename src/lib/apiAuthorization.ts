let sessionToken: string | null = null;
let installed = false;

export function setSessionToken(token: string | null): void {
  sessionToken = token;
}

export function clearSessionToken(): void {
  sessionToken = null;
}

export function installApiAuthorization(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;
    const url = new URL(rawUrl, window.location.origin);
    const isApiRequest = url.origin === window.location.origin && url.pathname.startsWith("/api/");
    const isLoginRequest = url.pathname === "/api/v2/auth/login";

    if (!isApiRequest || isLoginRequest || !sessionToken) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    headers.set("Authorization", `Bearer ${sessionToken}`);

    const response = await nativeFetch(input, { ...init, headers });
    if (response.status === 401) {
      clearSessionToken();
      window.dispatchEvent(new CustomEvent("redhack:session-expired"));
    }
    return response;
  };
}
