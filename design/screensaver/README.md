# Night Dock flip-clock preview

Open `index.html` directly from this checkout. The existing local Inter font is the only asset; no server, image, video, framework, canvas or network request is needed.

Six split-flap cards display hours, minutes and seconds. A changing digit folds its old upper half down, then reveals the new lower half. Unchanged cards do not animate. Show rollover demonstrates a simultaneous hour/minute/second change; the display returns to live time automatically. Other preview controls switch 12/24-hour time, choose a warm finish, and enter fullscreen where permitted.

This replaces the rejected photo and orbital concepts with a physical split-flap composition. The dark palette and cream numbers retain Night Dock's visual identity. The toolbar is for design review and would not appear on the TV.

The clock uses one second-aligned timeout, with short cleanup timers only for changing digits. Timers and in-flight flips are cleared while hidden. Reduced-motion preferences use immediate digit changes. The wake instruction describes the intended TV behavior; this HTML does not capture remote buttons or launch Home.

Opening this preview does not change a TV. Version 1.1.8 integrates the approved design as a Home-only idle screen; see [production behavior](../../docs/SCREENSAVER.md). It does not replace the system-wide webOS screensaver. The HTML has only been checked through source/syntax checks and T3's inline HTML renderer, without interactive browser or computer automation.
