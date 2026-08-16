# What the Claude workflow in this repo does

Plain list of every file that was added, what it does, and who touches it.

Nothing here is about React. This is the setup that makes ten people running ten separate Claude
sessions produce one consistent codebase.

---

## 1. The one idea

- Claude reads files from the repo it is working in.
- So the rules live **in the repo**, not on anybody's laptop.
- Everyone who clones gets them. Nobody has to be told twice.
- Two files are deliberately **not** committed, because they are personal: `.claude/team` and
  `.claude/settings.local.json`.

---

## 2. Files that teach Claude what to do

### `CLAUDE.md`

- Loaded automatically at the start of **every** session. No command needed.
- Holds the four hard rules, what this app is, the five screens, and the four API traps.
- Ends with `@` lines that pull in the style guide and the context files.
- **Edited by:** the team lead, through a PR. Kept short on purpose.

### `.claude/STYLE.md`

- The list of things **not** to write.
- Exists because Claude's default is more abstraction than a fresher team can maintain.
- Bans Redux, React Query, MUI, a custom hook before three uses, `useEffect` to derive state.
- Sets size budgets, and says the correct response at a budget is **to ask**, not to silently split
  a file into eight.
- **Edited by:** the team lead. Add a line whenever you see a pattern you do not want again.

### `.claude/context/shared.md`

- The system in six lines: what the product is, who owns which module, the three book tiers.
- The same file exists in the backend repo, so both repos describe the system identically.
- **Edited by:** the wokay lead.

### `.claude/context/wokay.md`

- What our team owns, the nine collections, and the five things that bite.
- **Edited by:** the wokay lead.

### `.claude/context/api-contract-digest.md`

- **Generated, never hand-edited.** Says so at the top of itself.
- The full contract is 147 KB. Loading it into a session costs more than the session. This is
  6 KB and answers nearly every question: all 44 endpoints, the 11 error codes, every enum.
- In this repo it is **copied from the backend**, because the backend owns the contract. One
  generator, one owner, or the two copies drift.

```bash
cp ../tf_reader_backend_temp/.claude/context/api-contract-digest.md .claude/context/
```

### `.claude/team`

- One word: `wokay`.
- **Gitignored**, so it is yours alone and can never conflict with a teammate.
- This single file is the whole "second team later" design. A flambeau member writes `flambeau`
  instead and gets a different context. Nothing else changes.
- **Created by:** every person, once per clone.

---

## 3. Files that run automatically

### `.claude/hooks/load-context.sh`

- A **Claude hook**. Runs once when a session starts.
- Prints your team's context so Claude knows the project before you type anything.
- Also warns you if your git identity is missing, or if the git hooks are not switched on.
- **Why once per session, not per message:** a per-message hook would pay for the same context
  dozens of times. This pays once and the cache keeps it warm.

### `.claude/hooks/guard.sh`

- A **Claude hook**. Runs before every command Claude tries to run.
- **Denies** these outright:
  - `gh pr merge`, `git merge`, any merge API call
  - every way of reattributing a commit: `--author`, `git -c user.email=`, `GIT_AUTHOR_EMAIL=`,
    `--amend --reset-author`, `filter-branch`
  - any commit message carrying a `Co-Authored-By` or other trailer
  - setting somebody's `git config user.name` or `user.email` for them
  - `git push --force`, `git reset --hard`, `git clean -f`
  - a push straight to `main`
- Denies rather than asking, because somebody shown a prompt they do not understand will approve it.

### `.claude/settings.json`

- Tells Claude to run both hooks above.
- Lists which commands never need a prompt, the read-only ones like `git status` and `git diff`.
- **`git push` is deliberately left off that list**, so every push asks you. That is a free second
  approval gate.

---

## 4. Files that run when you commit

All three need switching on once per clone:

```bash
git config core.hooksPath .githooks
```

### `.githooks/prepare-commit-msg`

- A **git hook**. Runs **before** the commit message is finalised, including for `git commit -m`.
- **Strips every trailer line**, then prints what it removed.
- Removes `Co-Authored-By` for **anybody**, not only Claude, plus `Signed-off-by`, `Generated-by`,
  any "Generated with ..." line, and the robot emoji.
- Strips rather than rejects, so a session that adds a trailer does not cost you a failed commit.

### `.githooks/commit-msg`

- A **git hook**. Runs on every commit, including ones you type yourself outside Claude.
- The backstop. Rejects the commit if:
  - **any** trailer survived the strip above
  - the message credits a tool in any wording, or contains an anthropic.com address
  - **the author and the committer are different people**, which is what `--author` does
  - the resolved author is a bot, a placeholder, or a machine hostname address
  - the first line is over 72 characters, or is meaningless like `wip`
- It checks the **resolved** author via `git var GIT_AUTHOR_IDENT`, not `git config`, because
  `--author` and `GIT_AUTHOR_EMAIL` override the config and would otherwise slip straight past.
- **Together these two files are what make a commit the team member's own work.** Claude Code adds
  a Claude trailer by default, so without them it would happen quietly in every session.

### `.githooks/pre-commit`

- A **git hook**. Runs just before the message check.
- Runs Prettier on the staged files, so formatting is never a review comment.
- Runs ESLint on the staged files and refuses the commit if there are errors.
- Blocks a `.env`, a `.key` file, and any line that stores a token in `localStorage` or
  `sessionStorage`.

---

## 5. The commands you type

Each is a saved instruction in `.claude/commands/`. Type `/` in a session to see them.

### `/ship`

- The only way to commit and push. In order:
  1. checks your git identity, and stops if it is missing
  2. shows you the whole diff and one paragraph of plain English
  3. **stops and asks.** Nothing is staged, committed or pushed yet
  4. on your yes, commits with **no trailers at all**, under your own identity
  5. adds one line to `.contrib/your-name.log`
  6. pushes, which prompts you again
  7. opens the PR
  8. **stops.** Never merges

### `/pr-review <branch>`

- For somebody who does not read code well. Plain English.
- Writes at most 50 lines to `.reviews/`, in first person, as if you wrote it.
- Four parts: what was done, what it actually does, issues or "No problems found.", anything worth
  flagging.
- **Cannot change code.** It has no write tool except into `.reviews/`.

### `/code-review <branch>`

- For the person who wrote the code. Technical.
- Checks it against the API contract, the style guide, and whether tests exist.
- Ends with a section saying what it actually ran and what it could not. That section is not
  optional.

### `/context`

- Re-reads the context files mid-session, for when somebody changed the contract while you had a
  session open.

### `/onboard`

- Walks a new person through first-day setup.

---

## 6. Files for GitHub

### `.github/pull_request_template.md`

- Four questions on every PR: what, why, how tested, contract impact.
- `/pr-review` reads this. A vague description produces a vague review.

### `.github/CODEOWNERS`

- Makes GitHub ask the right person for a review automatically.
- **Ships with fake usernames and does nothing until they are real.**

---

## 7. Files for tracking who did what

### `.contrib/<your-name>.log`

- One line per commit: date, team, branch, kind, a 60-character summary, PR number.
- **One file per person**, so two people can never conflict. That is the whole reason it is not one
  shared table.
- **Written by `/ship`, never by hand.**

### `CONTRIBUTIONS.md`

- Generated from all the `.contrib` files plus git history. Never hand-edited.
- Also flags any commit that was attributed to Claude rather than a person.

---

## 8. What is gitignored, and why it matters

| Path                          | Why                                                                    |
| ----------------------------- | ---------------------------------------------------------------------- |
| `.claude/team`                | personal. This is what lets two teams share one repo with no conflict  |
| `.claude/settings.local.json` | personal overrides                                                     |
| `.reviews/`                   | reviews in a PR diff cause arguments, and two reviewers would conflict |
| `.env`, `*.key`, `*.pem`      | secrets. The pre-commit hook blocks these too                          |

---

## 9. What this does not do

Worth being clear so nobody relies on the wrong thing.

- **It does not stop a human merging.** It stops **Claude**. Only GitHub branch protection stops a
  human, and that has to be switched on in Settings, Branches.
- **It does not check your code is correct.** The linter catches mistakes, not wrong behaviour. That
  is what the review commands and your own testing are for.
- **It does not survive a laptop.** `.claude/team` and `core.hooksPath` are per clone, so a new
  machine needs both again. `/onboard` covers it.

---

## 10. The one thing to check if something feels wrong

Start a fresh session and ask:

```
what are the three tier values, and what state library am I allowed to use
```

The right answer is `OPEN_ACCESS`, `SUBSCRIPTION`, `ELITE`, and **none**, given straight away with no
file reading.

If it reads files first, or suggests Redux, the context did not load. Type `/hooks` and compare the
field names against `.claude/settings.json`. The names change between Claude Code versions, and a
wrong name means the hook silently does nothing.
