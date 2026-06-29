# Security and Vulnerability Reporting

Sensitive security-related questions, comments, and reports should be sent by
opening a private security advisory on GitHub or by contacting the repository
maintainers at [advayta108](https://github.com/advayta108). You should receive
a prompt response, typically within 48 hours.

## Scope

This project is a client-side demo for VPN/proxy detection heuristics. Security
reports we are most interested in include:

- Issues that could expose user data beyond what the browser already reveals
  (e.g. unintended network requests, data leaks to third parties).
- Vulnerabilities in build scripts or dependencies that could affect developers
  building or deploying the project.
- Supply-chain or integrity issues in bundled WASM artifacts or data files.

## Out of scope

- False positives/negatives in VPN detection heuristics (these are expected
  limitations of client-side detection, documented in README).
- Issues that require a user to run untrusted code in their own browser session
  outside the normal operation of the demo app.

## Disclosure

Please do not open public issues for security vulnerabilities. We will work with
reporters to understand and address valid issues before public disclosure.
