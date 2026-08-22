const POLL_INTERVAL_MS = 50;
const MAX_ATTEMPTS = 40; // ~2s total — generous for a large accordion list that
// needs to re-render (force-expanding the errored card) before the field exists
const HIGHLIGHT_CLASS = "field-highlight";
const HIGHLIGHT_DURATION_MS = 1800; // matches the CSS animation duration

/**
 * Scrolls to and focuses a field by its `name` (falling back to `id`),
 * polling briefly rather than checking once. A single check right after
 * triggering a change isn't reliable here: an accordion card that needs to
 * force-expand, or a step transition (`StepTransition.tsx` uses
 * `AnimatePresence mode="wait"`, so the next step's content doesn't mount
 * until the previous step's ~0.25s exit animation finishes), both mean the
 * target element may not exist in the DOM yet on the very next frame.
 *
 * Deliberately an instant jump, not `behavior: "smooth"` — a smooth scroll
 * is an async, interruptible animation, and calling `.focus()` on the
 * target right after starting one (needed so keyboard/screen-reader users
 * land on the actual field) can abort it mid-flight with no visible
 * movement at all. An instant jump has nothing to interrupt: by the time
 * `focus()` runs, the scroll has already fully happened, synchronously.
 *
 * Also applies a brief highlight pulse — `scrollIntoView` is a no-op if
 * the target's already roughly in view (e.g. the same field is still
 * invalid on a second attempt), which otherwise looks like nothing
 * happened at all.
 */
export function scrollToField(name: string, attempt = 0): void {
  const el =
    document.getElementsByName(name)[0] ?? document.getElementById(name);

  if (!el) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => scrollToField(name, attempt + 1), POLL_INTERVAL_MS);
    }
    return;
  }

  el.scrollIntoView({ block: "center" });

  if (el instanceof HTMLElement) {
    el.focus({ preventScroll: true });

    // Restart the animation even if it's already mid-pulse from a very
    // recent call on the same element (e.g. clicking Next repeatedly).
    el.classList.remove(HIGHLIGHT_CLASS);
    // Force a reflow so the class removal is actually observed before it's
    // re-added — otherwise the browser coalesces the two class changes and
    // the animation never restarts.
    void el.offsetWidth;
    el.classList.add(HIGHLIGHT_CLASS);
    setTimeout(() => el.classList.remove(HIGHLIGHT_CLASS), HIGHLIGHT_DURATION_MS);
  }
}
