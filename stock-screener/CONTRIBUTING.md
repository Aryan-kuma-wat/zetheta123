# Contributing Guidelines

Thank you for contributing to the Real-Time Stock Screener! We welcome contributions to improve performance, add technical indicators, refine state slices, or enhance styling.

---

## 1. Development Principles

To keep the application running at 60 FPS under high-frequency updates, please follow these guidelines:

1. **Strict Type Safety**: Write strict, explicit Typescript types. Do not use `any` unless absolutely necessary (e.g. mock socket library interfaces).
2. **React Render Optimization**:
   - Do not pass inline objects or arrow functions as props to frequently updated cells.
   - Use `React.memo` for list components.
   - When modifying fast-updating values (like ticks), mutate the DOM directly using refs (e.g., following the `FlashCell` pattern) instead of triggering React state updates.
3. **Zustand Selectors**: Always use fine-grained selectors when reading states from Zustand stores (`useStockStore`, etc.) to prevent components from re-rendering on unrelated state changes.
4. **Calculations Separation**:
   - Write indicator math calculations as pure functions in `src/utils/indicators.ts`.
   - Write filter evaluations in `src/utils/filterEngine.ts`.
   - Never perform database operations or expensive array math directly inside rendering loops or components.
5. **No External Math Libraries**: Keep mathematical indicators self-contained and implement formulas manually.

---

## 2. Setting Up Your Workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Verify tests pass before making changes:
   ```bash
   npm run test
   ```

---

## 3. Creating Pull Requests

1. **Commit Messages**: Follow standard descriptive commit messages (e.g. `feat: add MACD oscillator indicator`, `fix: resolving memory leak in chart resize listeners`).
2. **Unit Tests**: If you introduce a new technical indicator or filter rule, you must write corresponding tests in `src/tests/indicators.test.ts` or `src/tests/filterEngine.test.ts`.
3. **Run Linting**: Make sure the linter passes without warnings or errors:
   ```bash
   npm run lint
   ```
4. **Verify Build**: Verify the production build succeeds locally:
   ```bash
   npm run build
   ```
5. Submit your Pull Request against the `main` branch.
