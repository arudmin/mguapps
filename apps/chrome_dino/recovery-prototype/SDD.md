# Chrome Dino — SDD recovery design draft
Target: app 1.5.36, server 0.2.13 (not released).

## Ownership and migration
Full restoration requires a verified account recovery credential or an administrator-authorized, account-specific migration. A vehicle hash is not authentication. Legacy accounts without a recovery credential need the latter path. Never expose account tokens or rotate them on an unauthenticated request. Existing database rows remain unchanged until an authorized operation. No raw VIN transfer. API v1 remains compatible.

## Proposed flow
Consent → identity probe → authenticated recovery eligibility → show profile and four scores → restore or create new account. Offline: keep local play and retry later. Restore preserves maximum of local and server records; new account uses a random installation UUID and automatic nickname. Preserve pending operations. A recovery credential is required before transferring account ownership, nickname, or publishing imported scores. For legacy users, admin migration must verify the specific old and new accounts separately.

## Included prototype
The standalone module implements public leaderboard lookup by explicitly entered nickname and local-only record merging. It does not authenticate ownership, modify the server, integrate with MGU or transfer scores to public ranking. This is deliberately separate from full account recovery. All five unit tests run using Node 22.16.0. Full repository integration, CI, deployment and hardware tests remain pending.
