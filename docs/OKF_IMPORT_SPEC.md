---
tags:
  - OKF
  - open-knowledge-format
  - import
  - consumer
  - collections
  - API-design
technologies:
  - Next.js
  - PostgreSQL
  - Prisma
standards:
  - Open Knowledge Format v0.1
projects:
  - Rumbo Labs
---
# Draftmark — OKF Import/Consume Specification

**Version:** 0.1
**Status:** v1 **implemented** (server + CLI) — see the "Implemented" notes below
**Last updated:** July 2026
**Owner:** TBD
**Companion:** [`docs/OKF_EXPORT_SPEC.md`](OKF_EXPORT_SPEC.md) (the producer side)

> **v1 shipped:** `POST /api/v1/collections?format=okf` ingests a JSON manifest (`src/lib/okf-import.ts` + the import branch of `src/app/api/v1/collections/route.ts`); the CLI `dm import <dir>` walks a local bundle directory and posts it. Frontmatter is parsed with the `yaml` dependency (option 1, §5). Intra-bundle concept links are rewritten to the new docs' share URLs (§8). The import is atomic (one transaction) and additive. Deferred from v1: `seoSlug` for imported public docs (skipped — they resolve via `/share/{slug}`), tarball input to the CLI (untar locally first), and everything in §10.

---

## 1. Summary

Make Draftmark a **consumer** of [Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundles: ingest an external OKF bundle (a directory / tarball / manifest of `.md` concept docs) and materialize it as a Draftmark **Collection** whose members are **Docs**. This is the symmetric inverse of the export capability, closing the round trip: *Draftmark → OKF → Draftmark*, and — more importantly — *anyone's OKF bundle → Draftmark*, so a bundle authored in another tool (or committed to a git repo) can be pulled in for review, commenting, and sharing.

This is the largest of the OKF follow-ups and has one genuinely hard sub-problem (YAML frontmatter **parsing**, §5) that export did not. It is written as a scoping doc: read §5–§7 to decide whether the value justifies the cost.

**Non-goals (v1):** git-URL ingestion, dedup/upsert of a previously-imported bundle, `log.md` → version-history reconstruction. All named in §10.

## 2. Motivation

- **Round-trip / portability.** Export already lets knowledge leave Draftmark. Import lets it come back — and lets *foreign* bundles (Anthropic, Google, open-source, hand-written) land in Draftmark's review surface (comments, reactions, reviews, threaded replies).
- **Onboarding.** "I have an OKF bundle / an LLM wiki / a folder of markdown — get it into Draftmark" becomes one command.
- **Symmetry is a credibility signal.** Being a full producer *and* consumer of an open format is a stronger position than producer-only.

## 3. Background: what a bundle looks like on the way in

A bundle (see export spec §3) is a tree of `.md` files:

```
<bundle>/
  okf.json          # optional sidecar (our export writes it): { okf_version, bundle }
  index.md          # reserved: directory listing, no frontmatter
  log.md            # reserved: changelog, no frontmatter
  concepts/
    orders.md       # concept doc: YAML frontmatter + markdown body
    customers.md
```

- **Concept doc** = YAML frontmatter (`type` required; `title`/`description`/`resource`/`tags`/`timestamp` recommended) + markdown body.
- **Reserved files** (`index.md`, `log.md`) and the `okf.json` sidecar are *not* concept docs.
- Foreign bundles may nest arbitrarily, use any `type`, carry unknown frontmatter keys, and contain broken links. **We MUST tolerate all of it** (OKF conformance rule for consumers).

## 4. Mapping OKF → Draftmark (the inverse table)

| OKF source | Draftmark target | Notes |
|---|---|---|
| Bundle (directory) | new `Collection` | title from `index.md` H1, else the bundle/dir name |
| Each non-reserved `.md` | new `Doc` | one Doc per concept |
| frontmatter `type` | `Doc.meta.type` | passthrough (inverse of export §5) |
| frontmatter `title` | `Doc.title` | else derive from first H1, else slug |
| frontmatter `description` | `Doc.meta.description` | if present |
| frontmatter `tags` | `Doc.meta.tags` | list passthrough |
| frontmatter `resource`, `timestamp` | dropped (or `meta.okf_resource`) | provenance; see §9 Q3 |
| markdown body (after frontmatter) | `Doc.content` | verbatim |
| `index.md` list entry order + label | `CollectionDoc.position` + `label` | parse the list; fall back to file order |
| `log.md` | ignored in v1 | see §10 |
| unknown frontmatter keys | preserved under `Doc.meta`? or dropped | see §9 Q2 |

The `meta.type` / `meta.description` / `meta.tags` targets are exactly what the exporter reads (`src/lib/okf.ts`), so an export→import round trip is lossless for those fields.

## 5. The hard decision: YAML frontmatter **parsing**

Export **emits** YAML with a hand-rolled double-quoted-scalar writer (no dependency — see export spec). Import must **parse** YAML, which is materially harder: foreign bundles can use block scalars, flow and block sequences, anchors, comments, multi-line strings, quoted/unquoted forms, etc. Three options:

1. **Add a small parser dependency** (`yaml` ~= 1 file, no transitive deps, or `js-yaml`). Correct against arbitrary YAML; costs the "zero-YAML-dep" stance the codebase has held. **Recommended** — parsing correctness is not a place to hand-roll, and OKF explicitly invites arbitrary producers.
2. **Hand-roll a constrained parser** that recognizes only the frontmatter shapes we care about (top-level `key: scalar`, `key: [inline, list]`, and `key:\n  - block\n  - list`) and ignores the rest. Zero dep, but silently mis-reads anything fancier — and "silently mis-reads a foreign file" is a bad failure mode for a consumer whose whole job is tolerance.
3. **Require our own dialect** — only import bundles that match our exact emitter output. Trivial to parse, but defeats the point (can't import foreign bundles). Rejected.

**This choice gates the feature.** If a YAML dependency is unacceptable, import is only worth doing in the narrow round-trip sense (option 3), which is low value. Recommendation: **option 1**.

## 6. Input format & where parsing happens

Two clean surfaces; they compose:

- **A. Server accepts a JSON manifest** — the exact inverse of what export produces:
  `POST /api/v1/collections?format=okf` with body `{ okf_version?, bundle?, files: [{ path, content }] }`. The server parses frontmatter, creates Docs + a Collection, returns them. Simple, streamable, no binary handling.
- **B. CLI `dm import <path>`** — reads a **local directory or `.tar.gz`**, builds the `{files:[…]}` manifest client-side (untarring locally if needed), and POSTs to surface A. Keeps tar/zip reading and filesystem walking out of the server.

v1 ships **A + B with directory + manifest**; tarball reading in the CLI is a small add (Node has `zlib`; a minimal tar *reader* mirrors the hand-rolled writer). Server never touches binaries.

**Size limits** (mirror the batch-comments cap of 50): reject a manifest over e.g. **100 files** or some total-bytes ceiling, with a clear error. Silent truncation is forbidden.

## 7. Ownership, auth, and visibility

Import **creates** docs and a collection, so it needs the same stance as `POST /docs`:

- **Anonymous import:** allowed; each created Doc + the Collection get fresh `magic_token` + `api_key`, returned in the response (and written to `.draftmark.json` by the CLI). Consistent with token-only doc creation.
- **Account import:** with an `acct_…` key, created docs/collection are owned by the account (`Doc.userId`), like authenticated `POST /docs`.
- **Visibility:** default **public** (the content arrived in a shareable bundle); `--visibility private` requires an account (private-doc creation already requires auth — see the `POST /docs` gate). One flag, applied to every doc in the bundle.

No existing data is mutated — import is purely additive — so there is no destructive-overwrite risk to gate. Re-importing simply makes a second, independent collection (no dedup in v1, §10).

## 8. Intra-bundle links (the inverse of export §8)

Bundle concept docs link to sibling members as `/concepts/{bundleSlug}.md`. On import each concept becomes a Doc with a **new** Draftmark slug, so those links would dangle. Symmetric to export's rewriting:

- Build a map `bundleFilename → newDocSlug` as docs are created.
- Rewrite `/concepts/{x}.md` links in each body to the new share URL (`/share/{newSlug}`) or keep them collection-relative.
- Same conservatism as export: skip fenced code, skip query strings, only touch known-member targets.

Given it's the mirror of already-shipped, already-tested export rewriting, it's **medium** effort and probably worth doing in v1 (a bundle whose internal links all dangle on import is a poor experience).

## 9. Privacy & safety

- **Rendering:** imported markdown flows through the existing safe renderer (react-markdown + rehype-highlight) — no new XSS surface beyond what user-authored docs already have.
- **No SSRF:** v1 takes file content directly (manifest/local files). No git-URL / remote-fetch surface (that's §10, and would need SSRF review).
- **Resource bounds:** enforce the file-count / byte cap (§6); consider per-import rate limiting like other write endpoints.
- **Frontmatter injection:** a malicious `resource`/`type` is just data landing in `Doc.meta`; it is never executed. Fine.

## 10. Follow-ups (out of v1 scope)

- **Git-URL ingestion** — `POST …?format=okf` with `{ git: "https://…" }`; server clones. Needs SSRF hardening + a clone sandbox. Large.
- **Dedup / re-import upsert** — detect a previously-imported bundle (e.g. an import id in `Collection.meta`) and update in place instead of duplicating. Medium.
- **`log.md` → version history** — parse the changelog and seed `DocVersion.versionNote` rows. Small–Medium, low value.
- **Tarball/zip upload directly to the server** — if a browser "upload a bundle" UI is wanted, the server would need a tar reader. Medium.

## 11. Effort estimate

| Increment | Scope | Estimate |
|---|---|---|
| Frontmatter parse decision + dep | pick option 1, wire `yaml` | Quick (gated on approval) |
| Server import (`POST …?format=okf`, JSON manifest) | parse, create Docs + Collection, order/labels from `index.md`, size caps | Medium |
| Link rewriting on import (§8) | mirror export rewriter | Short–Medium |
| CLI `dm import <dir>` | walk dir → manifest → POST → write `.draftmark.json` | Short |
| CLI tarball input | local untar → manifest | Short |
| Tests | round-trip (export→import identity), foreign-bundle tolerance, caps, privacy | Medium |
| **Total v1** | | **Medium–Large** (clearly the biggest OKF item) |

## 12. Open questions

1. **YAML dependency (§5):** accept `yaml`/`js-yaml`, or keep zero-dep and scope import to round-trip-only? *This is the decision that unblocks everything.*
2. **Unknown frontmatter keys:** preserve verbatim under `Doc.meta` (lossless, but pollutes meta) or keep only the known set (`type`/`description`/`tags`)? Leaning: keep known set, stash the rest under `meta.okf_extra` for round-trip fidelity.
3. **`resource` / `timestamp`:** drop, or retain as provenance in `meta` (`meta.okf_resource`, `meta.okf_timestamp`)? Leaning: retain — cheap, and useful for "where did this come from".
4. **Round-trip identity target:** should `export(import(bundle))` be byte-identical for a Draftmark-origin bundle? A useful test oracle if we commit to it; may constrain choices 2–3.
5. **Collection title source:** `index.md` H1 vs `okf.json`/dir name precedence when they disagree.
