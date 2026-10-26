# Launcher regression checks

Run `npm ci`, `npm run build`, `npm run package`, and
`node --test tests/homeNavigation.test.mjs`.

For browser runtime checks, start `npm run dev` and open these pages at a
1920 × 1080 viewport:

- `/tests/performance-runtime.html`: inspect `window.__performanceTests`.
- `/tests/startup-runtime.html`: inspect `window.__startupTests`.
- `/tests/startup-runtime.html?fail-input`: inspect `window.__startupTests`.
- `/tests/screensaver-runtime.html`: inspect `window.__screensaverTests`.

Each result has a `passed` array and an `error` property only on failure.
The interaction fixture covers tile reuse, remote/pointer focus after reordering,
commit/cancel preference writes, one grid focus update at most per frame for held moves, and existing navigation/launch behavior. Startup
checks use a mock Luna bridge to hold HDMI and clock responses, exercise failed
HDMI discovery, and verify staged Homebrew icon loading and catalogue fallback.
The startup fixture also checks quiet/idle scheduling, interruption by input, background cancellation, foreground resume, and immediate Settings discovery.
Use a fresh page/browser context for each fixture; they install global test hooks.

These fixtures do not connect to a TV or measure its actual CPU, graphics, memory,
or button-to-screen latency. Hardware validation is still required for performance
claims.

The screensaver fixture controls the clock and timers to check the 30-second deadline, remote/pointer wake consumption, repeated keys, rollover including seconds, Settings/Sources exclusion, background timer cleanup, resume and clock preferences. It runs against the real launcher runtime with fixture apps and does not change TV settings.
