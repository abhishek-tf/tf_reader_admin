# STYLE, admin console

React, Vite, plain JavaScript. Fresher team, 8-week prototype. **Plain and obvious beats clever.**

## Do not, unless explicitly asked

- **No state management library.** No Redux, no Zustand, no MobX. `useState` and one context for the
  signed-in operator is enough for five screens.
- **No data fetching library.** No React Query, no SWR. `fetch` in a small `api.js` per resource.
- **No component library.** No MUI, no Chakra, no Ant. Plain CSS, or CSS modules.
- **No custom hook until the same logic appears three times.** Twice is a coincidence.
- **No abstraction over `fetch`** beyond one thin wrapper that attaches the token and parses the
  error envelope. Not a generic client with interceptors and retry.
- **No `useEffect` to derive state from props.** Compute it during render.
- **No `any`-style escape hatches**, meaning no `eslint-disable` without a comment saying why.
- **No new dependency** without asking. A dependency is forever, and this app ships in weeks.

## Do

- **Function components only.** No classes.
- **One component per file**, named the same as the file.
- **Keep the token in memory**, in a context. Not `localStorage`: an XSS then reads it.
- **One `api/` module per resource**, mirroring the backend's grouping: `api/publishers.js`,
  `api/institutions.js`, and so on.
- **Handle three states explicitly on every screen that loads data**: loading, error, empty. The empty
  state is the one everybody forgets, and this app has real empty states, such as a brand new
  institution with no shelves curated.
- **Show `traceId` on an error screen.** It is the only thing that makes a bug report actionable.

## Budgets, and what to do at one

| Limit                                                          | At the limit                                            |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| Component over 150 lines                                       | Say so and ask. Usually it is two screens in one file   |
| More than 5 `useState` in one component                        | Say so and ask. Usually it wants one object, or a child |
| Nesting deeper than 3 in JSX                                   | Extract a child component                               |
| A file with no default export and no name that says what it is | Rename it                                               |

**Saying "this is getting long, here are two options" is correct.** Quietly producing fourteen small
components is not, because nobody can then find where anything renders.

## Forms

- Controlled inputs. One `useState` object per form, not one per field.
- **Validate on submit, not on every keystroke.** Per-keystroke validation on a fresher-built form
  produces error messages that flash and confuse.
- **Send the API the exact enum value**, not the label shown to the operator.
- Disable submit while the request is in flight, or you get duplicate records.

## Naming

- Components in `PascalCase`, everything else in `camelCase`, files match the export.
- Say what it is: `InstitutionList`, `ShelfEditor`. Not `Wrapper`, `Container`, `Manager`, `Helper`.
- Handlers read as `handleSubmit`, `handleShelfReorder`.

## What is not our job

Formatting. Prettier decides it, `.githooks/pre-commit` applies it. **Never argue about a brace in a
review.**
