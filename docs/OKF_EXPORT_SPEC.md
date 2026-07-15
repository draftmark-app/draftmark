---
tags:
  - OKF
  - open-knowledge-format
  - agent-DX
  - collections
  - API-design
  - markdown-export
technologies:
  - Next.js
  - PostgreSQL
  - Prisma
standards:
  - Open Knowledge Format v0.1
projects:
  - Rumbo Labs
---
# Draftmark — OKF Export/Serve Specification

**Version:** 0.1 (proposal)
**Status:** Draft — v2 candidate, not yet scheduled
**Last updated:** July 2026
**Owner:** TBD

---

## 1. Summary

Make Draftmark a **producer** of [Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundles. OKF is Google Cloud's open, vendor-neutral spec (v0.1, published 2026-06-12) that formalizes the "LLM wiki" pattern: a directory of markdown files with YAML frontmatter, distributed via git, consumable by any agent with no SDK or proprietary registry.

Draftmark already produces OKF's atomic unit. A `/share/{slug}.md` response is *almost* an OKF concept document — it lacks only the YAML frontmatter and the required `type` field. This spec covers wrapping existing per-doc output in frontmatter, adding a collection-level bundle assembler, and surfacing OKF compatibility to users via docs and a dedicated `/okf` landing page (§9).

**Non-goals (this spec):** the symmetric *consumer* side (ingesting an OKF bundle into a collection) and automatic intra-bundle link rewriting. Both are named in §9 as follow-ups.

## 2. Motivation

- **Portability.** Knowledge authored in Draftmark escapes the platform and survives tool migration — it can be committed to git, read on GitHub, or fed to any agent framework (Anthropic, OpenAI, open-source).
- **Agent DX alignment.** Draftmark's thesis is markdown-for-agents. OKF is the emerging standard for exactly that. Speaking it cheaply widens the set of agents that can consume Draftmark content without custom integration.
- **Low marginal cost.** The per-doc raw primitive (`?format=raw`, `/share/{slug}.md`) already exists. This is incremental, not greenfield.

## 3. Background: OKF v0.1 essentials

- A **bundle** is a directory tree of `.md` concept docs; git is the preferred distribution channel.
- A **concept document** = YAML frontmatter + markdown body. The **only required frontmatter field is `type`** (a producer-defined free string). Recommended fields, in priority order: `title`, `description`, `resource` (a URI), `tags` (list), `timestamp` (ISO 8601).
- Two **reserved filenames**: `index.md` (directory listing for progressive disclosure; no frontmatter) and `log.md` (date-grouped changelog, newest first).
- **Links** are plain markdown. Absolute links begin with `/`, relative to bundle root. Link semantics are untyped.
- **Conformance:** every non-reserved `.md` has parseable frontmatter with a non-empty `type`; reserved files follow their structure. Everything else is soft guidance — consumers MUST tolerate unknown types and broken links.
- The root `index.md` may declare `okf_version: "0.1"`.

## 4. Mapping Draftmark → OKF

| OKF concept | Draftmark source | Notes |
|---|---|---|
| Bundle (directory) | `Collection` | one bundle per collection |
| Concept document | `Doc` | frontmatter synthesized at export time |
| `type` (required) | `Doc.meta.type`, fallback `"Document"` | see §5 — the only real gap |
| `title` | `Doc.title` | already auto-derived from first H1 |
| `description` | `Doc.meta.description` (optional) | omit if absent |
| `resource` | canonical share URL | `{BASE_URL}/share/{slug}` |
| `tags` | `Doc.meta.tags` (optional) | JSONB list passthrough |
| `timestamp` | `Doc.updatedAt` (ISO 8601) | direct |
| `index.md` | generated from `CollectionDoc` rows | uses `label` + `position` |
| `log.md` | *deferred* — derivable from `DocVersion.versionNote` | see §9 |
| markdown links | doc body content | left as-is in v1 (see §7) |

## 5. The one schema decision: where `type` comes from

OKF requires a non-empty `type` on every concept doc. Draftmark's `Doc` has no such field. Three options:

1. **`meta.type` passthrough (chosen for v1).** Read `Doc.meta.type`; default to `"Document"` when absent. Zero migration, consistent with treating `meta` (JSONB) as the extensibility bag, and OKF explicitly requires consumers to tolerate any `type` string.
2. Add a first-class `Doc.type String?` column. Sortable and explicit, but costs a migration plus create/edit UI and CLI surface. Deferred unless product need emerges.
3. Collection-level default via `Collection.meta.okf_type`, per-doc override. More moving parts than v1 warrants.

**Decision: option 1.** Reversible, no migration, ships now.

## 6. API surface

### 6.1 Per-doc (trivial extension)

Extend the existing `format` branch in `src/app/api/v1/docs/[slug]/route.ts` (the block at the `format === "raw"` check).

```
GET /api/v1/docs/:slug?format=okf   → text/markdown; charset=utf-8
GET /share/:slug.okf.md             → same, via a middleware rewrite mirroring the .md rewrite
```

Response body:

```
---
type: <meta.type | "Document">
title: <doc.title>
description: <meta.description>        # omitted if absent
resource: <BASE_URL>/share/<slug>
tags: [<meta.tags…>]                   # omitted if absent
timestamp: <doc.updatedAt ISO 8601>
---

<doc.content>
```

Access rules are **identical to the existing GET** — private docs require a valid `api_key`, magic token, or share token; anonymous requests to a private doc return 401. Frontmatter synthesis must not run before the existing auth gate.

> **Implemented** in `src/lib/okf.ts` (`buildOkfConceptDoc`) + the `format === "okf"` branch of `GET /api/v1/docs/:slug`, with the `/share/:slug.okf.md` rewrite in `src/middleware.ts`.

### 6.2 Collection bundle (the feature)

```
GET /api/v1/collections/:slug?format=okf   → application/json (manifest) | application/gzip (tarball)
GET /c/:slug.okf                           → application/gzip tarball (browser-friendly download)
```

Content negotiation: default to a **JSON manifest** (cheapest to ship, easiest for agents to stream into their own store); a gzipped tar is offered via `Accept: application/gzip` or the `/c/:slug.okf` route.

**JSON manifest shape:**

```json
{
  "okf_version": "0.1",
  "bundle": "<collection.slug>",
  "files": [
    { "path": "index.md", "content": "…" },
    { "path": "concepts/<slug>.md", "content": "---\ntype: …\n---\n\n…" }
  ]
}
```

**Assembler algorithm:**

1. Load the collection with its docs ordered by `position` (as `src/app/api/v1/collections/[slug]/route.ts` already does).
2. Apply the privacy gate (§7). Excluded docs are silently omitted from both the manifest and `index.md`.
3. For each included doc, emit `concepts/{slug}.md` with synthesized frontmatter (§6.1 body format).
4. Generate a root `index.md`:

```
# <collection.title>

* [<CollectionDoc.label | doc.title>](/concepts/<slug>.md) - <meta.description>
```

5. Declare `okf_version: "0.1"` on the **manifest** (top-level JSON field), *not* inside `index.md`. OKF's reserved `index.md` structure is frontmatter-free, so putting the version there would either violate that or require a special-case frontmatter exception. Keeping it on the manifest keeps `index.md` conformant. When a tarball surface is added (§10), the version-declaration location can be revisited (e.g. an `okf.json` sidecar).

> **Implemented** in `src/lib/okf.ts` (`buildOkfBundle`) + `GET /api/v1/collections/:slug?format=okf`. Returns the JSON manifest; tarball / `/c/:slug.okf` remain follow-ups (§10).

## 7. Privacy (the sharp edge)

`GET /api/v1/collections/:slug` is currently **unauthenticated** and deliberately withholds private docs' titles and view counts from anonymous callers, because a private doc's title is auto-derived from its content. OKF export MUST preserve this invariant:

- **Anonymous export:** include only `visibility === "public"` docs. Private docs are omitted entirely — not just their content, but their existence (no `index.md` entry, no `resource` URL, no title).
- **Authenticated export:** when the collection `api_key` or magic token is supplied, private docs owned by that collection may be included.

Frontmatter synthesis pulls `title`, `description`, `tags`, and `resource` — all of which can leak content for a private doc. The privacy gate MUST run before synthesis. This is the single place a naive implementation creates a real disclosure bug; it needs explicit test coverage (public-only anonymous bundle; authenticated bundle includes private docs; private doc never appears anonymously).

## 8. Link handling (v1 caveat)

OKF prefers intra-bundle links as bundle-relative paths (`/concepts/other.md`). Draftmark doc bodies contain free-form markdown, sometimes with absolute `draftmark.app/share/…` URLs.

**v1 leaves links untouched.** Absolute share URLs remain valid links (they resolve on the public web), just not bundle-relative. OKF requires consumers to tolerate any link. Auto-rewriting a `share/{slug}` link to `/concepts/{slug}.md` when the target is in the same collection is a clean, well-scoped follow-up (§9) — deferred because link rewriting is where correctness bugs hide.

## 9. Marketing & documentation surfaces

Being OKF-compatible is a positioning asset, not just a feature. It should be visible to humans evaluating Draftmark, not buried in the API. Three surfaces:

### 9.1 "OKF compatible" mentions

- **Docs (`/docs`).** Add an "OKF export" entry describing `?format=okf` and the collection bundle endpoint, with a curl example and a link to the `/okf` landing page (§9.2). Cross-reference from the collections section.
- **Homepage / agents page.** A short "OKF compatible" badge or line in the agent-DX section of `src/app/page.tsx` (and `/agents`), linking to `/okf`. Keep it one line — it's a credibility signal, not a pitch.
- **README + `openapi.yaml`.** Note OKF support in the API surface list; document the `format=okf` enum value on the relevant `GET` operations so it appears in `/api-docs`.

### 9.2 `/okf` landing page

A dedicated marketing page explaining what OKF is and how Draftmark speaks it, following the established `/cli` and `/skill` pattern exactly:

- **Files:** `src/app/okf/page.tsx` + `src/app/okf/opengraph-image.tsx` (tailored OG image, matching the recent per-landing-page OG work).
- **Metadata:** `export const metadata` with `title` / `description` / `openGraph` block, mirroring `src/app/cli/page.tsx`.
- **Wiring:** add `/okf` to `src/app/sitemap.ts` (priority ~0.7, `monthly`), to the footer link group in `src/components/SiteFooter.tsx`, and — if it belongs in the top nav — to `src/components/Nav.tsx`.
- **Content outline:**
  1. *What OKF is* — one paragraph, plus the "LLM wiki" framing and the vendor-neutral / no-SDK angle. Link out to the [OKF spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) and Google's announcement.
  2. *How Draftmark produces it* — the Collection→bundle, Doc→concept mapping, with a rendered example concept doc (frontmatter + body) and a sample `index.md`.
  3. *Try it* — copy-paste curl for `GET /share/{slug}.okf.md` and `GET /c/{slug}.okf`, plus the planned `dm export … --format okf` CLI line.
  4. *Why it matters* — portability, git-native, consumable by any agent framework.

Ship §9.1 mentions alongside the API work; the `/okf` page can land in the same increment or immediately after, since it depends on the endpoints existing to demo.

## 10. Follow-ups (out of scope)

- **Intra-bundle link rewriting** — rewrite same-collection share links to bundle-relative paths. Medium.
- **`log.md` generation** — derive a per-doc or bundle changelog from `DocVersion` rows (`versionNote`, `versionNumber`, `createdAt`). Small–Medium.
- **First-class `Doc.type`** — promote option 2 from §5 if product need emerges. Migration + UI + CLI.
- **OKF consumer / import** — `POST /collections?format=okf` to ingest an external bundle into a new collection. Separate, larger feature.
- **CLI** — `dm export <collection-slug> --format okf -o ./bundle/` in the separate CLI repo, reusing the collection endpoint. Small once the API exists.

## 11. Effort estimate

| Increment | Scope | Estimate |
|---|---|---|
| Per-doc `?format=okf` | frontmatter synthesis + `.okf.md` rewrite + tests | Quick (~0.5 day) |
| Collection bundle (JSON, public-only) | assembler + `index.md` + privacy gate + tests | Short (1–2 days) |
| Tarball + `/c/:slug.okf` + CLI export | streaming tar, download route, CLI subcommand | Short |
| "OKF compatible" mentions (§9.1) | docs, homepage/agents line, README, openapi enum | Quick |
| `/okf` landing page (§9.2) | `page.tsx` + `opengraph-image.tsx` + nav/footer/sitemap wiring | Short |
| Follow-ups (§10) | each | Medium+ |

## 12. Test plan (highlights)

- Per-doc OKF output has valid frontmatter with a non-empty `type`; defaults to `"Document"` when `meta.type` absent.
- Optional fields (`description`, `tags`) omitted cleanly when absent; `timestamp` matches `updatedAt`.
- **Privacy:** anonymous collection export excludes private docs entirely; authenticated export with collection credential includes them; a private doc's title/content never appears in an anonymous bundle.
- Bundle `index.md` lists included docs in `position` order using `CollectionDoc.label` when present, `doc.title` otherwise.
- Root `index.md` declares `okf_version: "0.1"`.
- Round-trip: a generated bundle satisfies OKF §conformance (every non-reserved `.md` has parseable frontmatter + non-empty `type`).
- `/okf` route renders and its `opengraph-image` builds; `/okf` appears in `sitemap.xml`; footer link resolves.

## 13. Open questions

1. Should `resource` point to the human view (`/share/{slug}`) or the raw endpoint (`/share/{slug}.md`)? Leaning human view for discoverability; raw is one hop away.
2. Should authenticated bundles embed a `share_token` in private docs' `resource` URLs so the bundle stays consumable after distribution, or keep them tokenless (requiring the recipient to hold credentials)? Default: tokenless, to avoid leaking read access into a portable file.
3. Tar vs. zip for the binary bundle — OKF names tarball; zip is friendlier on some platforms. Default tar to match the spec's wording.
