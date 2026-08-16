# tf_reader_admin

The operator console for the Taylor and Francis Reader. React, Vite, **plain JavaScript, no
TypeScript**. wokay only. **Every contributor is a fresher on an 8-week prototype.**

## Hard rules. These are not preferences

1. **Every commit is authored by ONE team member, alone, with no trailers at all.** No
   `Co-Authored-By` for **anybody**, not only Claude. No `Generated with`, no `Signed-off-by`,
   no robot emoji, no tool credit in any wording. Never pass `--author`, never set
   `GIT_AUTHOR_*`, never use `git -c user.email=`. Two git hooks enforce it: one strips a
   trailer before the commit, the other rejects what survives and checks the author is a real
   person.
2. **Never merge a pull request.** Opening it is the last step.
3. **Show the diff and get a yes before pushing.** Use `/ship`.
4. **Follow `.claude/STYLE.md`.**

## What this app is

A console for the people who run the library, not for readers. Five screens:

| Screen                        | Calls                                               |
| ----------------------------- | --------------------------------------------------- |
| Sign in                       | `POST /api/admin/v1/auth/login`                     |
| Publishers and collections    | `/api/admin/v1/publishers/**`                       |
| Books and upload              | `/api/admin/v1/catalogue-items/**`                  |
| Institutions and entitlements | `/api/admin/v1/institutions/**`                     |
| Shelf curation                | `PUT /api/admin/v1/institutions/{id}/feed-settings` |

**34 admin operations exist.** They are listed in `.claude/context/api-contract-digest.md`. Read that
before writing a fetch call; do not guess a path.

## Four things about this API that will catch you out

1. **Two tokens.** `accessToken` is a JWT that lives 15 minutes. `refreshToken` is opaque and lives
   12 hours. Store neither in `localStorage`; keep the access token in memory and let a refresh call
   rebuild it after a reload.
2. **Logout is immediate.** Every admin request re-checks its session, so a revoked token fails on the
   next call. Expect one `401` after logout and handle it as "signed out", not as an error.
3. **`version` is required when saving feed settings.** Send back the number you loaded. A `409
STALE_VERSION` means somebody else saved first: reload, reapply, save again. **Do not retry
   automatically**, or you will silently destroy their work.
4. **Tier values are `OPEN_ACCESS`, `SUBSCRIPTION`, `ELITE`.** The same three everywhere. Show a
   friendly label in the UI, but send and compare the real value.

## Errors

Every error has the same shape. **Switch on `code`, never on `message`.**

```json
{
  "timestamp": "...",
  "status": 403,
  "code": "NO_ENTITLEMENT",
  "message": "for a human",
  "path": "...",
  "traceId": "quote this in a bug report"
}
```

There are 11 codes and no others. They are listed in the digest.

## Commands

`/ship`, `/pr-review <branch>`, `/code-review <branch>`, `/context`, `/onboard`. Same as the backend
repo, so nothing new to learn moving between them.

@.claude/STYLE.md
@.claude/context/shared.md
@.claude/context/api-contract-digest.md
