# Staged startup and reorder updates

Version 1.1.7 builds on PR #1. Home waits only for selected app verification. Input discovery and the TV clock preference arrive after the first Home frame. Homebrew mode fetches selected icons before the remaining catalogue; Settings reuses keyed tiles and saves a held reorder only when committed.

Remaining catalogue discovery now waits for 600 ms without keyboard/pointer input, then a browser idle callback with a 1.5-second timeout. Engines without idle callbacks use the quiet period alone. New input postpones pending work; hiding the page cancels the pending callback, and foregrounding schedules it again. Requesting Settings bypasses this delay and shares the same discovery promise. Listeners are removed once discovery starts or the scheduled task is cancelled. Already-running service requests are not cancelled by this scheduler.

Held reorder moves update logical order immediately and defer grid rendering to the existing animation-frame queue. OK flushes a pending keyboard update before committing. Pointer activation flushes pending navigation before reading a reused tile's current index. Back retains the original cancellation behavior.

## Verification

- Production type-check/build, Chrome 79 bundle syntax guard and IPK packaging passed.
- Four navigation unit tests passed.
- 91 browser assertions passed across interaction, delayed-startup and failed-input fixtures. They cover deferred reorder rendering, preserved focus, commit/cancel writes, idle scheduling, input interruption, hidden-page cancellation, foreground resume, fallback scheduling and on-demand discovery.
- On the LG 55UT8050PSB, firmware 33.31.75 / webOS 10.3.2, installed JavaScript, HTML and metadata hashes matched the version 1.1.7 build.
- On-TV reorder verification reached index 2 after two rapid Right events while retaining the original tile and focus. No focus call was needed in that measured burst. Cancelling retained saved preferences exactly. All four sources were available; Settings kept its 22 px backdrop blur and Home transitions remained disabled.

Two warm reloads on the installed 1.1.6 baseline observed Home ready at 579.4 and 250.3 ms, and two valid reloads of 1.1.7 at 906.0 and 388.0 ms. The updated samples were slower. This small, variable sequence does not demonstrate a startup-time improvement or isolate the changes from TV workload. It also does not measure cold power-on or final screen presentation. No startup speedup is claimed. Earlier attempts interrupted while the launcher was backgrounded yielded no ready timestamp and were excluded.

The confirmed result is less immediate background catalogue work and bounded reorder rendering, with preserved interaction behavior. The wallpaper, typography, glass, focus appearance and animation settings are unchanged. Firmware/update-blocking settings, Home mappings and root startup integrations were not changed by the app deployment.
