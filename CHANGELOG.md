# Changelog

## 0.4.17 - 2026-10-02

- Added Dark, Light and System in Settings > Appearance. Light uses dark text
  on white across Workspace navigation, Files, Markdown and standard reports.
  Browser Preview also has a Settings button with the same theme choices.
- Theme changes apply immediately, persist after restart and preserve a report's
  scroll position and edits. System follows the device theme. Terminal palettes,
  images and custom game designs keep their own colors.

- Fixed browser preview failing to open every card after the normal setup
  created `public/workspace`. Shared report CSS now goes through the app's
  stylesheet pipeline instead of being requested as a JavaScript module.
- Fixed image dialogs closing immediately in development mode and kept them
  outside Markdown paragraphs, so enlarged images remain usable.
- Removed the Vite `__dirname` warning and clarified that Rust is needed only
  when compiling the native desktop app, not for browser preview.
- Browser checks now run the same workspace-link setup as `npm run dev`, and
  verify card navigation, shared dialog styling and recovery after a failed load.

**Update:** finish active tasks, quit Mr. Mak and install the Windows update.
For browser preview, merge the latest source, stop your Preview server, then
run `Setup.ps1 -Mode Preview` again and reload the browser. Dark remains the
default. Issue #1 stays open for confirmation from the reporter.

## 0.4.16 - 2026-10-01

- Added OpenCode to New chat, History and the default-agent setting. It runs the
  installed native CLI with its own providers, account login and model settings.
- OpenCode conversations keep their native session IDs for close/reopen and app
  restart. Native activity drives the working glow and unread completion marker.
  OpenCode 1.x and 2.x have separate observers; v2 terminals use private servers.
- OpenCode uses the existing tab colors, pinning, file drops, clipboard images,
  copy controls and fullscreen terminal scrolling. Voice can open OpenCode chats.
- Clarified subscription setup in README, Help and the setup guide. Claude Code
  and Codex can use eligible existing subscriptions without an API key. Optional
  voice uses a separately billed OpenAI API connection. OpenCode's selected
  providers determine its own authentication and billing.
- Setup now accepts OpenCode as the primary CLI. Permission auto-approval remains
  off by default; OpenCode's explicit deny rules remain in effect when enabled.

**Update:** finish active tasks, quit Mr. Mak and install the Windows update.
Install and configure OpenCode separately if you want to use it. Existing chats
and project content are preserved. The 0.4.14 skills pack is unchanged.

## 0.4.15 - 2026-09-30

- Fixed browser preview crashing on Markdown cards with links or images. Local
  document paths now resolve against the browser origin. A report error also
  leaves Workspace navigation available, with a reload option.
- Root `npm ci` now installs the local service dependencies too, so tests and
  source-based service startup work without an extra install command.
- Removed window authentication credentials from runtime diagnostics. Startup
  passes them directly to the desktop shell without saving them in the project.
- Updated the service's `fast-uri` dependency to 3.1.8, addressing
  [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj).
- Added browser preview regression checks and a private security reporting guide.

**Update:** finish active tasks, quit Mr. Mak, then install the Windows update.
For browser preview, merge the source update, run `npm ci`, then restart Vite.
The skills pack from 0.4.14 is unchanged. The separate report in issue #5 remains
open while we await its private reproduction details; this release does not
claim to resolve that report.

## 0.4.14 - 2026-09-30

- Added six reusable agent workflows: game VFX, game UI, animation integration,
  level design, game audio and native visual review. Both Codex and Claude get
  complete project-local skills with the same resources.
- Improved Blender animation, motion references, feature handoffs and production
  routing. Added a separate skills ZIP with the supporting files and licences.
- Fixed Codex History recovery across local midnight and UTC date boundaries.
  Conversations with large metadata or a delayed first prompt can be discovered.
  Recovery checks the original conversation's identity rather than guessing from
  a shared project folder.

This release aligns the public and desktop version numbers at 0.4.14; it follows
public 0.1.2. Previous public releases remain available.

**Update:** quit the app after active tasks finish, then install the Windows
update and open your existing repository. New skills are repository content;
merge them separately or use the skills ZIP. See [the update guide](docs/updating.md).

## 0.1.2 - 2026-09-23

- Fixed mouse-wheel scrolling in fullscreen Claude Code chats after opening a tab or returning to it. Scrolling also survives reconnects.
- Terminal snapshots and saved screens now preserve the mouse protocol requested by the CLI. Codex and classic Claude keep their existing scrollback behavior.

**Update:** finish active tasks, quit Mr. Mak Workspace from its tray menu, then run the new Windows installer. Open your existing repository; project files, settings and chat history stay in place.

## 0.1.1 - 2026-09-22

- Web links in agent chats and Workspace cards now open in your default browser. Wrapped terminal links and named citations work too.
- The bottom terminal row stays visible above the connection bar, including the model and reasoning effort.
- New Codex and Claude chats default to `xhigh`. Existing saved effort choices are kept; task-specific voice requests can still select an appropriate effort.

**Update:** finish active tasks, quit Mr. Mak Workspace from its tray menu, then run the new Windows installer. Open it with your existing repository. Your project files, settings and chat history stay in place.

The installer updates the application. It does not replace the sample cards or your repository content. If you build from source, bring in this release's application changes and rebuild; keep your own Workspace files and context.

## 0.1.0

First public release with two connected desktop windows, CLI chats, four sample projects and fourteen shared skills.
