# Cross-Device Sync Checklist

Use this checklist to validate remote persistence and sync behavior.

## Preconditions

- Remote API is configured via `VITE_JSPRINT_REMOTE_API_URL`.
- Same user account/email is used in both browser sessions.

## Verification Steps

1. Sign in on Browser A and Browser B with the same account.
2. In Browser A:
   - Create a new application.
   - Update status of an existing application.
   - Toggle one weekly checklist item.
3. In Browser B:
   - Click the manual `Refresh` action in sync status.
4. Confirm Browser B reflects all changes from Browser A.
5. Sign out and sign back in on Browser B.
6. Confirm data still matches Browser A after re-login.

## Expected UI Signals

- Sync status displays storage mode (`local` or `remote`).
- Last sync timestamp updates after refresh/save.
- Sync errors (if any) are shown in sync status text.

