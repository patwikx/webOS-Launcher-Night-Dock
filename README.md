# webOS Launcher - Night Dock

A custom launcher for LG webOS TVs with a night-lake background, translucent glass panels, and a compact app dock. Based on [partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher).

The Night Dock design customization, implementation, optimization, and documentation were done by **GPT 6.1 Sol High**. The upstream launcher and third-party assets retain their original attribution.

Version 1.1.8 was tested on an LG 55UT8050PSB running firmware 33.31.75 and webOS 10.3.2. The screenshots below are from the launcher running on the TV at 1920 × 1080.

## Home

![Night Dock Home screen with a night-lake wallpaper, clock, glass utility buttons, and app dock](docs/screenshots/home.png)

Choose and arrange the apps on your dock. A cream focus background keeps selection clear, and YouTube adapts to a red icon with a white play symbol when focused. Home includes a 12/24-hour clock, Magic Remote pointer support, immediate focus feedback, and instant dock scrolling.

Home also has a six-card flip-clock screensaver with live seconds. It appears after 30 seconds of inactivity on Home and follows the TV clock format. Remote or pointer input dismisses it without opening an app. It pauses in Settings, Sources and while the launcher is backgrounded. See [screensaver behavior](docs/SCREENSAVER.md).

## Settings

![Night Dock Settings with Apps, Sources, and Options tabs, app tiles, and selection checkmarks](docs/screenshots/settings.png)

The glass Settings panel groups controls into Apps, Sources, and Options. Press OK to show or hide an app. Hold OK or choose Re-order apps to change the dock order. Back cancels a move or returns Home.

## Sources

![Night Dock Sources dropdown listing Live TV and HDMI inputs with connection status](docs/screenshots/sources.png)

Sources opens beside Settings and lists Live TV and the TV's reported HDMI inputs, including connection status. The dropdown uses the same glass material and cream selection as Home.

## Rooting the LG 55UT8050PSB

> **Disclaimer:** Use this software and follow this guide at your own risk. Rooting or modifying a TV can cause permanent damage, including a bricked TV, loss of data, or loss of functionality. The maintainer accepts no responsibility for damage, loss, or other consequences of using this project or following these instructions. No warranty or guarantee of compatibility, safety, or successful recovery is provided.

This is the successful route used on the model and firmware above. Compatibility depends on the TV and firmware; follow the linked maintainers' instructions for the tools themselves.

### 1. Prepare Developer Mode access and a backup

Start with an LG Developer Mode connection through the webOS SDK or [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop). Save the existing launcher package and preferences before changing the setup. The initial launcher installation used Developer Mode, before root was enabled.

### 2. Confirm root through SlopBro

Use [SlopBro](https://github.com/throwaway96/slopbro) for the matching webOS version. The tested route used its `voiceweb` entry point with a limited diagnostic payload. The diagnostic returned `uid=0(root)`, confirming root execution on firmware 33.31.75. It did not run SlopBro's full installer payload.

The stock SlopBro command normally continues into its own Homebrew installer. The diagnostic-first route described here used a separate Homebrew installation in the next step.

### 3. Install and elevate Homebrew Channel

Install the [Homebrew Channel 0.8.0-rc1 release](https://github.com/throwaway96/webos-homebrew-channel/releases/tag/v0.8.0-rc1), whose app reports version 0.8.0. Verify the package SHA-256 against the release metadata before installation.

The working setup installed that package through the existing developer SDK connection and elevated its service using Homebrew's elevation tool. Homebrew then used a persistent ActivityManager activity for startup. LG's signed boot script remained intact; no firmware flash or read-only system partition replacement was used.

### 4. Verify access and complete the root setup

Enable key-authenticated root SSH and verify that it returns `uid=0(root)`. Keep the private key outside the launcher project. Unauthenticated telnet was disabled in the tested setup.

Remove Developer Mode as required by this Homebrew rooting procedure, then check Homebrew's root status and SSH access after restarting. Both worked in the verified setup without rerunning the exploit. Do not reinstall Developer Mode on this rooted configuration.

### 5. Map Home to Night Dock

Install and launch [LG Input Hook](https://github.com/Simon34545/lginputhook). Version 1.5.1 worked on the tested TV. Use its logs to identify the remote's button codes, then save these actions:

| Button | Action | Code on the tested remote |
| --- | --- | --- |
| Home | Launch `works.partridge.webos-launcher` | `773` |
| Tap 1 | Open stock LG Home | `2` |

Identify the codes from your remote rather than assuming they match. These mappings worked after standby and an unplug/power-on test. Stock LG Home remains available through button 1 and the launcher's LG Home button.

### 6. Optional power-on and app-exit integration

For cold startup, a separate persistent ActivityManager activity launches Night Dock directly after `core-boot-done` and `firstAppLaunched`, while `boot-done` is still false and the TV is active. An unplug/power-on test confirmed automatic launch before the Homebrew watcher started. The initial input screen may still appear briefly; startup time varies.

A Homebrew watcher handles sleep/wake and provides a startup fallback with a 500 ms added delay. It skips its initial launch when the earlier activity has already issued one, preventing a later takeover. Quick Start+ is enabled and LG Home Auto Launch is disabled in the tested setup.

For direct return from YouTube, a writable system-profile override set:

```json
{"idleApp":{"appId":"works.partridge.webos-launcher"}}
```

The override was applied through the TV's existing system-profile rescan mechanism after testing restoration of the original profile. YouTube Back exits returned directly to Night Dock with the return watcher stopped. The setting also survived a standby test. Cold-reboot persistence of this override and every other app's exit behavior were not verified.

These optional device integrations are separate from this repository. Deploying Night Dock installs the launcher app; it does not install a power watcher, map buttons, or write system profiles.

An optional [ad/upload service and update guard](docs/TV-PRIVACY.md) includes reversible scripts for disabling selected services and automatic firmware/webOS updates. It is installed separately from Night Dock.

## Build and install Night Dock

Use Node.js 22 or newer with npm:

```sh
npm ci
npm run build
npm run package
```

The package is written to `build/works.partridge.webos-launcher_1.1.8_all.ipk`. The existing app ID is retained for compatibility with saved preferences and Home-button mappings.

For a rooted TV, copy `tv.env.example` to the ignored `tv.env`, set `TV_HOST` to your SSH alias or TV address, and run:

```sh
npm run deploy
```

For a separate unrooted TV already paired through Developer Mode, build and package, then run `sh scripts/install-dev.sh`. Set `TV_DEVICE` if the pairing name differs from `lg-tv`. Rootless installation runs as a regular app; the Home-button integration above requires root.

Run `npm run dev` for a browser preview with sample apps. Real launching and input switching require the TV.

## Performance

The glass panels and artwork are preserved. Version 1.1.7 renders selected apps before input/clock responses, reuses Settings tiles, and batches held reorder updates. Remaining catalogue discovery waits for quiet input and idle time, or starts immediately when Settings is requested. Version 1.1.6 removes Home focus animations and makes dock scrolling immediate. Earlier optimizations reduced JavaScript/CSS size by 20% and median warm reload time by about 26% in the measured TV workload. Version 1.1.4 combines rapid navigation paints and skips row-edge rendering. Version 1.1.5 preloads the wallpaper and font, and disables the webOS launch splash and spinner on the tested TV. See the [startup performance report](performance/REPORT.md) and [rapid navigation measurements](performance/RAPID-NAVIGATION.md) for results and limits. The [CPU, memory, and startup measurements](performance/RESOURCES.md) also cover navigation with a simulated CPU slowdown. The [version 1.1.7 verification](performance/STAGED-STARTUP.md) records the deferred discovery and reorder behavior; its small TV sample did not demonstrate a startup-time improvement.

The launcher can still be reclaimed under heavy memory pressure and need a fresh launch. The tested launch-time memory exemption reduced one reclaim path; it did not guarantee residency during 4K playback.

## Attribution

The original MIT-licensed launcher history and notices are retained. See [UPSTREAM.md](UPSTREAM.md), [LICENSE](LICENSE), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for code, fonts, artwork, and trademark attribution. The project is not affiliated with LG or the app publishers shown in the screenshots.
