/**
 * A dropped connection surfaces the same way whether it comes from a raw
 * fetch() (TypeError: "Failed to fetch") or the Supabase client (which wraps
 * fetch and puts the same text into `error.message`). Neither means anything
 * to a restaurant owner mid-service, so swap it for something actionable.
 * Every other error (validation, 409 conflicts, etc.) passes through as-is.
 */
export function friendlyErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw =
    err instanceof Error
      ? err.message
      : (err as { message?: string } | null | undefined)?.message ?? "";
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  if (offline || /failed to fetch|networkerror|network request failed|load failed/i.test(raw)) {
    return "No internet connection. Check your connection and try again.";
  }
  return raw || fallback;
}
