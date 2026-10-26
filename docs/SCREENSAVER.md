# Home idle flip clock

Version 1.1.8 adds the approved six-card flip clock to Night Dock Home. Hours, minutes and seconds each use two split-flap cards. Changed digits fold down like a page; unchanged digits stay still. The charcoal cards, cream numbers, subtle warm seconds and date match the HTML preview. The screensaver has no Night Dock label or preview controls.

- Appears after 30 seconds without keyboard, pointer or wheel activity on foreground Home.
- Settings and Sources do not start it. Returning to Home begins a new 30-second period.
- Remote or pointer input dismisses it and restores the current Home selection. The wake key, held repeats and the same pointer gesture's click are consumed so waking does not launch an app.
- Follows the TV's 12/24-hour clock preference, including changes received after startup.
- Hiding the launcher or opening another app dismisses it and cancels idle, second-tick and flip-cleanup timers. Returning to the launcher starts a fresh idle period.
- Uses a second-aligned timeout and short cleanup timers for changed cards. The Home minute timer pauses while the flip clock is visible. Reduced-motion preferences retain live seconds with immediate digit changes.

This is a Home-only launcher feature. It does not install a system-wide webOS screensaver replacement or change firmware, system screensaver policies, app playback behavior, Home mappings or root integration. Other apps retain their existing webOS screensaver behavior. No system-level suppression of LG's own screensaver is installed.

The separate [HTML design preview](../design/screensaver/index.html) remains available for visual review. Its format, finish, demo and fullscreen controls are not present in the TV screen. The production styles use the launcher's fixed 1920 × 1080 stage and existing scale behavior, without container-unit dependencies.

## Verification

The focused screensaver fixture checks the exact idle deadline, seconds/minutes/hours rollover, page-flip completion, missing brand label, wake consumption, repeated keys, pointer clicks, saved preferences, Settings/Sources exclusion, background timer cancellation, resume, clock-format refresh, and reduced motion. It controls the clock instead of waiting through each timeout. Run it using the instructions in [tests/README.md](../tests/README.md).

Production build/type-check, Chrome 79 syntax guard, packaging, four navigation unit tests, 91 existing runtime assertions and 27 screensaver assertions passed before installation.

On the TV, the saver was observed at 30.35 seconds after the last Home input, with six cards and no brand label. Seconds advanced, and OK returned to the selected YouTube tile without opening it or changing preferences. Installed HTML, JavaScript and metadata hashes matched the build. This was a Home idle/wake check, not a system-wide screensaver replacement test.
