import { useState } from "react";
import { Navigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useApp } from "../context";

export default function SignIn() {
  const { session, signIn, signInWithGoogle, supportsGoogleSignIn, authLoading, resetPassword } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password, { createAccount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in with Google.");
    } finally {
      setSubmitting(false);
    }
  };

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setSubmitting(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  if (forgotMode) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 bg-white dark:bg-neutral-950">
          <h1 className="text-2xl font-semibold mb-2">Reset password</h1>
          {resetSent ? (
            <>
              <p className="text-sm text-green-600 dark:text-green-400 mb-6">
                Reset link sent — check your inbox and follow the instructions.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(""); }}
              >
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Enter your email and we'll send a reset link.
              </p>
              <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                {resetError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{resetError}</p>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-center"
                >
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 bg-white dark:bg-neutral-950">
        <h1 className="text-2xl font-semibold mb-2">Sign in to JobSprint</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Sign in with email + password. Enable create mode if this is your first login.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => { setForgotMode(true); setResetEmail(email); }}
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
            />
            Create account
          </label>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || authLoading}
          >
            {submitting
              ? createAccount
                ? "Creating account..."
                : "Signing in..."
              : createAccount
              ? "Create Account"
              : "Sign In"}
          </Button>

          {supportsGoogleSignIn && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-neutral-950 px-2 text-neutral-500">
                    Or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void handleGoogleSignIn()}
                disabled={submitting || authLoading}
              >
                Continue with Google
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
