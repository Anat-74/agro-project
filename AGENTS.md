# Agents rules

## File editing

- On Windows, use the `edit` tool for all file modifications. Do NOT use `bash`/`shell`/`cat`/heredocs for editing files — the Windows shell (PowerShell/MINGW64) does not reliably support heredoc syntax and complex command-line escaping.
- The project has `edit` tool available. Always check your tool list before falling back to shell commands.
- Use `read` to review file content, then `edit` to apply changes. Use `bash` only for running commands (git, npm, build), not for file manipulation.
