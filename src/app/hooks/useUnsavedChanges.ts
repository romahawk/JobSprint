/**
 * Guards a close/discard action behind a confirmation prompt when there are
 * unsaved changes. Returns `confirmDiscard()` which returns `true` if the
 * caller may proceed (either no dirty state, or the user confirmed).
 */
export function useUnsavedChanges(isDirty: boolean) {
  function confirmDiscard(): boolean {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Discard them?");
  }
  return { confirmDiscard };
}
