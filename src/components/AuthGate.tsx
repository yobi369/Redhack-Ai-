/// <reference types="vite/client" />

import { useEffect, useState, type FormEvent, type PropsWithChildren } from "react";
import { clearSessionToken, setSessionToken } from "../lib/apiAuthorization";

type LoginResponse = {
  token?: string;
  user?: { id: string; name: string; email: string; role: string };
  error?: string;
  code?: string;
};

export default function AuthGate({ children }: PropsWithChildren) {
  const isProduction = import.meta.env.PROD;
  const [authenticated, setAuthenticated] = useState(!isProduction);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [readOnlyDemo, setReadOnlyDemo] = useState(false);
  const [readOnlyDemoAvailable, setReadOnlyDemoAvailable] = useState(false);

  useEffect(() => {
    const onExpired = () => {
      setAuthenticated(false);
      setUserName("");
      setError("Your session has expired. Please sign in again.");
    };
    window.addEventListener("redhack:session-expired", onExpired);
    return () => window.removeEventListener("redhack:session-expired", onExpired);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.token || !result.user) {
        const authStoreUnavailable = result.code === "AUTH_STORE_UNAVAILABLE";
        setReadOnlyDemoAvailable(authStoreUnavailable);
        setError(
          authStoreUnavailable
            ? "Persistent authentication is not configured. You can continue in a restricted read-only demo."
            : "Sign-in failed. Check your credentials and try again."
        );
        return;
      }

      setSessionToken(result.token);
      setUserName(result.user.name || result.user.email);
      setReadOnlyDemo(false);
      setReadOnlyDemoAvailable(false);
      setPassword("");
      setAuthenticated(true);
    } catch {
      setError("Unable to reach the authentication service. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    clearSessionToken();
    setAuthenticated(false);
    setUserName("");
    setReadOnlyDemo(false);
    setReadOnlyDemoAvailable(false);
    setPassword("");
    setError("");
  }

  if (!isProduction || authenticated) {
    return (
      <>
        {isProduction && authenticated && (
          <div className="fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-lg">
            <span className="max-w-40 truncate">{readOnlyDemo ? "Read-only demo" : userName}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-slate-600 px-3 py-1.5 font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-400">Secure operator access</p>
          <h1 className="text-3xl font-black tracking-tight">REDHACK AI</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Sign in with a provisioned account to access the Cyber Operations workspace. Demo seed identities cannot authenticate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="redhack-email" className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
            <input
              id="redhack-email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="operator@organization.com"
            />
          </div>
          <div>
            <label htmlFor="redhack-password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              id="redhack-password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1024}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/50 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          {readOnlyDemoAvailable && (
            <button
              type="button"
              onClick={() => {
                clearSessionToken();
                setReadOnlyDemo(true);
                setUserName("Read-only demo");
                setAuthenticated(true);
                setError("");
                setReadOnlyDemoAvailable(false);
              }}
              className="w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Continue in read-only demo mode
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying credentials…" : "Sign in securely"}
          </button>
        </form>

        <p className="mt-6 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
          Sessions are held in memory for this browser tab and are cleared on sign-out or an authentication failure.
        </p>
      </section>
    </main>
  );
}
