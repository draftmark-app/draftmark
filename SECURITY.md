# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Draftmark, please report it responsibly.

**Email:** security@rumbolabs.com

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll acknowledge your report within 48 hours and aim to release a fix within 7 days for critical issues.

## What qualifies

- Authentication or authorization bypasses
- SQL injection, XSS, or other injection attacks
- Exposure of magic tokens, API keys, or other secrets
- Any way to access or modify another user's documents without authorization

## What doesn't qualify

- Denial of service attacks
- Social engineering
- Issues in dependencies (report upstream instead)
- Missing rate limiting (known limitation)

## Security model

Draftmark uses a no-account auth model:

- **Magic tokens** grant owner access (edit, delete). SHA-256 hashed at rest.
- **API keys** grant read access to private docs. SHA-256 hashed at rest.
- **No passwords or sessions** are stored.

See the [README](README.md) for more on the auth model.
