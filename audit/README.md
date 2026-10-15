# Website reliability audit, 2026-10-15

Baseline: main at 36395e38314e2aba7d0f682c8380c21010a78d4d. No production deployment or settings changes performed.

## Evidence

- Cloud Chrome visited the canonical root and all 18 root HTML documents, including the four legacy redirect endpoints.
- Canonical non-www site loads. The www root returned a 502 gateway page reporting certificate hostname mismatch on two observations. This requires host/DNS investigation; it is not an HTML repair or proof of universal outage.
- Live baseline: four case disclosures opened by click; five FAQs opened with Enter; Diagnostic CTA selected the correct contact interest; invalid submissions remained local. No valid inquiry sent.
- Read-only HTTP checks: robots, sitemap, favicon, portrait and social image return 200. Missing nested path and excluded archive return 404.
- Repaired source: 18 root HTML files, 12 sitemap entries, no broken local references. Labels, IDs, duplicate attributes, main focus targets and JSON-LD validated.
- Ten isolated jsdom tests pass with mocked fetch. These are not live browser tests.

## Review gates

No rendered repair preview, mobile device/emulation, Lighthouse/field CWV, full assistive-technology audit, GA4 account verification or real Formspree delivery test was available. Do not infer those checks passed. Retest the branch in an approved preview before merge. Do not deploy without explicit owner approval.

Existing professional figures and degree completion claims need owner evidence review; no conferral or client results were added. Client-history phrasing was softened and About credential metadata made more cautious.

GA4 G-87QVKBQM8X is present in source. Preserve inquiry_submit as the success event and verify account key-event settings separately; do not count clicks, starts and automatic form_submit as equivalent leads. Formspree response acceptance does not establish inbox delivery. Approved end-to-end tests remain pending.

## Running checks

Use Python 3 with beautifulsoup4 for `python tests/source_audit.py`. Install jsdom in a separate test dependency directory, then run `NODE_PATH=/path/to/dependencies/node_modules node --test tests/reliability.cjs`. No external request is made by these tests. `node --check a94-site.js`, `node --check a94-contact.js` and `git diff --check` also pass.

Full owner report and baseline screenshots are delivered separately from the public repository.
