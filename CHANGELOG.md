# Changelog

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
