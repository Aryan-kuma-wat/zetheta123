# Final Submission Checklist

Use this checklist to track the final verification and packaging tasks before submitting the Stock Screener project.

---

## Technical & Build Verification

- [ ] **Build passes**: Verify that Next.js successfully compiles the production bundle without errors.
  ```bash
  npm run build
  ```
- [ ] **Lint passes**: Confirm that code conforms to strict ESLint standards.
  ```bash
  npm run lint
  ```
- [ ] **Tests pass**: Run the Vitest unit tests to verify mathematical indicator calculations and JIT AST filter rules:
  ```bash
  npm run test
  ```

---

## Documentation & Assets

- [ ] **Documentation complete**: Ensure that all required submission documents have been generated and reviewed in the root folder.
  - [ ] `README.md`
  - [ ] `ARCHITECTURE.md`
  - [ ] `PERFORMANCE_REPORT.md`
  - [ ] `TESTING_REPORT.md`
  - [ ] `DEPLOYMENT_GUIDE.md`
  - [ ] `CONTRIBUTING.md`
  - [ ] `SECURITY.md`
  - [ ] `CHANGELOG.md`
  - [ ] `.env.example`
  - [ ] `LICENSE`
- [ ] **Screenshots added**: Replace the image placeholders in `README.md` with active screenshot files from your running application.
- [ ] **Performance report completed**: Measure real-world filtering latencies, stream frame rates, and heap usage, and update the benchmark placeholders in `PERFORMANCE_REPORT.md`.
- [ ] **Architecture diagrams completed**: Review the ASCII layout and logic flow maps inside `ARCHITECTURE.md`.

---

## Deployment & Repository

- [ ] **Deployment verified**: Deploy the compiled bundle to Vercel and test interactive behaviors (table scrolling, sector filtering, chart synchronization) on the live URL.
- [ ] **GitHub repository prepared**:
  - Remove developer keys, local environment files (`.env`, `.env.local`), and temporary build assets.
  - Verify that `.gitignore` correctly blocks the upload of the `.next/` and `node_modules/` folders.
- [ ] **Submission ready**: Tag release milestones in Git matching your final `CHANGELOG.md` targets.
