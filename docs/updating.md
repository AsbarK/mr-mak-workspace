# Update an existing Workspace

The application and your project folder are separate. The Windows installer
updates the app and its local service. It does not replace your cards, skills,
context, credentials or agent conversations.

## Application

1. Finish active agent tasks, then choose Quit from Mr. Mak's tray menu.
2. Install **Mr. Mak Workspace 0.4.14** for Windows x64.
3. Open the same repository you were using before. Your cards, settings and
   History remain in that folder.

The History fix can reconnect a Codex conversation whose original native record
still exists but whose ID was not saved by Mr. Mak. If that native history was
deleted or belongs to another account, the update cannot recreate it. Use
New chat > Resume with a known native ID when importing an existing CLI chat.
Saved terminal screens are retained when automatic recovery is not possible.

## Skills and source

An installer alone cannot add the new skills. For a clone that tracks this
repository, ask your agent to review and merge the release's source changes.
Keep local work committed or backed up, resolve conflicts deliberately, and
preserve your own `workspace/workspace.json`, cards, context and connections.
Do not reset a customized repository to the template to obtain an update.

For a template-derived repository with unrelated history, use the separate
**Mr-Mak-Skills-0.4.14.zip** for the workflows. Extract it outside your project,
read `SKILLS-README.md`, then merge the desired folders. No personal projects,
keys, CLI logins or MCP definitions are included. The pack does not replace your
`AGENTS.md` or `CLAUDE.md`.

The maintained skills live in `.agents/skills`; complete Claude copies live in
`.claude/skills`. Keep both in sync if you use both agents. Dependencies are
listed in [the skill index](skills.md) and in each skill. A Codex CLI or Claude
Code CLI login remains required; optional providers use your own credentials.

If building the desktop from source, rebuild after merging application changes.
Use the [setup guide](getting-started.md) for the prerequisites.
