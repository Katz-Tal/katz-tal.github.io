# talkatz.com

Personal site for Tal Katz — Senior Security Engineer at Wiz (Google).

Three hand-written files. No framework, no build step, no dependencies, no
webfonts, and no third-party requests at runtime. Clone it and open
`index.html`; that is the entire toolchain.

## The idea

A CV built as an operator's report rather than a portfolio: monochrome with a
single saturated accent reserved strictly for signal, monospace for display and
data, and dense aligned tables instead of cards.

| Section | What it holds |
|---|---|
| `overview` | Positioning statement and headline numbers |
| `alerts` | Career as severity-tagged entries with scope lines |
| `detections` | Things built and run |
| `coverage` | Toolset by domain |
| `credentials` | Certifications |
| `console` | A working shell |

## Things worth knowing

**The background is the page's own security policy.** It parses the live
`Content-Security-Policy` meta tag rather than restating it, so the display
cannot drift from what is enforced, and it logs every refusal the browser
actually makes.

**The shell is real.** `help` lists the documented commands. Two are not
listed. The site rewards reading its source.

**Keyboard:** `j`/`k` move between sections, `1`–`6` jump, `g g` top, `G`
bottom, `/` focuses the console, `?` shows the shortcuts, `Esc` closes.

**It works without JavaScript.** Every section is in the served HTML; JS adds
the scroll-spy, keyboard layer, shell, ledger and rail. There is a failsafe
that force-reveals content if the IntersectionObserver never delivers —
content must never depend on an animation firing.

**Nothing time-dependent is hard-coded.** Uptime and role durations are
computed from dates, so they cannot go stale the way a PDF does.

## Local preview

```sh
python3 -m http.server 8080 --directory .
```

Worth testing before any deploy:

- JavaScript disabled — should still be a complete, readable CV
- Reduced motion on — no canvas, no cursor, no transitions
- Keyboard only — every control reachable, focus always visible

## Deploying

GitHub Pages serves `main` from the repository root. Push and it deploys.

`CNAME` claims the custom domain — **do not delete it**; it is what makes
`talkatz.com` resolve here rather than returning a 404.

### Files that exist for later, not today

- `_headers` — security response headers. **Inert on GitHub Pages**, which
  cannot send custom headers. Cloudflare Pages reads it automatically if the
  site ever migrates. Its CSP must stay in sync with the `<meta>` tag in
  `index.html`.
- `.nojekyll` — stops GitHub's Jekyll build silently dropping `_headers` for
  having a leading underscore.
- `docs/dns-snapshot.md` — the live DNS records, captured before any
  migration. Includes the **ImprovMX MX and SPF records**; losing those breaks
  mail to `@talkatz.com` silently, with no bounce.

## Known limitation

GitHub Pages cannot send HTTP response headers, so the deployed site has no
HSTS and no `frame-ancestors` protection. A `<meta>` CSP covers what it can,
but those two directives are header-only. This is an accepted trade for
shipping on DNS that already worked — and the reason `_headers` is written.
