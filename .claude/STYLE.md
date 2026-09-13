# STYLE, admin console

React, Vite, plain JavaScript.

**Plain and obvious beats clever.**

## Principles

- Choose the technology and approach that best fits the problem. Do not impose unnecessary frontend restrictions.
- Keep the UI **modern, clean, professional, responsive, and accessible**.
- Prefer consistency, simplicity, and maintainability over unnecessary abstraction.
- Use the existing TF Reader visual language: **blue-first, restrained colours, clear hierarchy, and subtle background effects**.
- Semantic colours such as red, amber, or green are allowed when they communicate meaningful status, but avoid unnecessary colour variety.
- The frontend team may choose appropriate libraries, state management, data fetching, component patterns, and styling approaches when they provide clear value.

## Do

- Use function components; avoid classes.
- Keep components focused and named by responsibility: `InstitutionList`, `ShelfEditor`, etc.
- Keep authentication tokens secure and avoid `localStorage` for sensitive tokens.
- Organize API access clearly by resource where practical.
- Handle **loading, error, empty, and success** states explicitly for data-driven screens.
- Show `traceId` on actionable error screens.
- Respect the backend API contract and send exact enum values.
- Disable actions while mutations are in progress to prevent duplicate submissions.
- Ensure forms have clear labels, validation, errors, and accessible controls.
- Make important workflows usable across desktop, tablet, and mobile.
- Use meaningful abstractions only when they improve readability, reuse, or maintainability.
- Use `eslint-disable` only when genuinely necessary and document why.

## Forms

- Use controlled or form-library-based inputs as appropriate to the complexity.
- Validate at an appropriate point in the interaction; avoid unnecessarily disruptive per-keystroke validation.
- Send the API exact enum/value representations, not display labels.
- Prevent duplicate submissions while requests are in flight.

## Naming

- Components: `PascalCase`
- Variables/functions: `camelCase`
- Files should clearly describe their responsibility.
- Handlers should use names such as `handleSubmit` and `handleShelfReorder`.

## Complexity

There are no rigid line-count or component-count limits.

If a component becomes difficult to understand, test, or modify, consider
splitting or restructuring it.

**Do not create excessive small components or abstractions just to satisfy a
rule.**

## Accessibility

- Interactive elements must be keyboard accessible.
- Inputs require clear accessible labels.
- Focus states must remain visible.
- Do not rely on colour alone to communicate state.
- Maintain readable contrast and usable touch targets.

## What is not our job

Formatting is handled by Prettier and `.githooks/pre-commit`.

**Never argue about formatting in code review.**

Reviews should focus on correctness, security, accessibility, UX, maintainability,
and meaningful architectural decisions.
