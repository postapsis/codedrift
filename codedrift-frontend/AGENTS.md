This is an open source fully client-side application about code management/code intelligence app called `Codedrift`.

## Techstack

1. React
2. Typescript
3. Tailwind CSS
4. Shadcn UI
5. Tanstack Router
6. Tanstack Query
7. Zod
8. Vite

## Rules

Here are some rules for the project:

1. After your changes, compile with `tsc` and run prettier to format the code.
2. Use the `eslint` and `prettier` plugins.
3. Ensure code consistency and readability by following these guidelines:
    1. Use `camelCase` for variables and functions.
    2. Use `PascalCase` for classes and interfaces.
    3. Use `kebab-case` for file names.
    4. Use `@` for imports.
    5. Use arrow functions wherever possible.
    6. Use `const` whenever possible.
    7. Avoid `any` type usage unless it's too convoluted to avoid.
    8. Use explicit return types.
    9. Don't exceed 120 characters per line, try to keep it to 80.
    10. Don't install NPM packages without explicit permission from the user.
    11. Don't run vite or browser to check the visuals for now.
    12. Move reused types in the `@types` folder.
    13. If people usually use a specific library for a specific task, prompt the user if they want to use it. (e.g.,
        form validation with Zod)
    14. If variables can be moved outside the component, do so.
    15. Use Zod for form validation.
    16. Use Zustand for state management.