# Night Dock

The user's approved reference is the latest Night Dock design in the prior `launcher-design-review/index.html`, also represented by `/tmp/opencode/nightdock.js`. Its night-lake photograph, large light clock at top left, labeled utility pills at top right, and two compact rows of labeled app tiles at the bottom define this update. Keep its cream focus fill and outer focus ring.

This is an Operate surface for a television. App art, the clock format, saved ordering, hidden apps and sources, and real launch targets come from the TV. Extra enabled apps scroll in five-column rows. Settings uses a larger scrollable panel for sofa-distance legibility and the complete installed catalogue. There is no review-page chrome or simulated launch handoff on the TV.

## Settings and sources update

Sources is a top-right utility beside Settings. Its dropdown always lists every input reported by the TV, including disconnected ports and Live TV, with connection status. Prior source visibility choices remain stored but no longer filter the menu. There is no bottom source strip.

Settings restores the prior full-screen Apps / Sources / Options tabs and six-column app grid. OK toggles app checkmarks, Re-order apps or holding OK enters reorder mode, and Back cancels a held move. Sources in Settings switches inputs directly. Night Dock supplies the photograph, dark panels, cream focus fill, and amber checkmarks.

Selection uses a single filled surface without an extra outline or enlargement. Both grids include internal scroll padding so focused containers stay fully visible. The clock remains unchanged at the user's request.

Apps and sources launch directly without a loading panel or dialog. Home keeps its current selection and remains usable during the service call. Failed launches and browser-only attempts show a small notice without taking focus. Back, a new launch, opening Settings or Sources, or returning to the launcher clears the notice. Older handoff callbacks cannot replace feedback for a newer launch.

All overlay surfaces now use night-tinted glass with translucent fill and a shared 22px backdrop blur. Settings uses only the landscape behind the glass; the Home dock and controls are hidden while Settings is open. Sources and launch notices use the same material. The cream focus fill remains unchanged, without an extra ring.

Home focus colors and dock scrolling update immediately, without fades or artwork lift. The glass material and selection appearance are retained. Settings, Sources, and launch notices have no added animation.

Performance version 1.1.2 preserves the rendered design and motion. Removed only obsolete styles and duplicate bundled assets. Focus updates touch only changed nodes; unchanged grids and menus are reused. Home's selected apps are verified before remaining Settings entries, and the clock pauses in the background. Performance evidence is in the workspace's performance/REPORT.md.

Rapid navigation keeps every arrow movement in order and paints the latest Home or Settings focus once per animation frame. Row-edge presses do no rendering work. OK flushes the pending selection before activation, pointer input takes over immediately, and hidden pages cancel queued paints. Geometry is read before focus styles change. Dock scrolling is immediate; the glass material and Settings appearance remain unchanged.

Remaining app discovery waits until Home input has been quiet for 600 ms and the browser grants idle time. Settings requests bypass that wait. Pending discovery is cancelled while hidden and resumes on foregrounding. Held-app reordering preserves every logical move and updates the grid once per frame; drop and cancel retain the existing save semantics. Inputs and the TV clock preference arrive after the initial Home frame. No visual tokens, animation settings, root policies or Home mappings change.

The Home idle screen uses the approved split-flap clock: six charcoal cards for hours, minutes and seconds, cream digits, warm muted seconds, horizontal seams and small side hinges. There is no Night Dock label. Only changed digits fold down; Home itself remains unanimated. The clock appears after 30 seconds without input on foreground Home, follows the TV clock format, and consumes the wake gesture to preserve the selected app. Settings, Sources and background apps never start it. Hidden/closed screens cancel idle, second-tick and flip-cleanup timers.
