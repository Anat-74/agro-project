# Agents rules

## CRITICAL: git push / deploy запрещены без явной команды

- **"закомить"** — только `git commit`, без push.
- **"запуш" / "запушкать"** — ЕДИНСТВЕННАЯ команда для `git push`.
- **"деплой" / "задеплой"** — ЕДИНСТВЕННАЯ команда для запуска `node scripts/deploy.mjs`.
- Если пользователь сказал что-то другое (например "закомить", "делай", "продолжай", "ок") — НЕ пушить и не деплоить.
- Нарушение этого правила — критическая ошибка агента.

## File editing

- On Windows, use the `edit` tool for all file modifications. Do NOT use `bash`/`shell`/`cat`/heredocs for editing files — the Windows shell (PowerShell/MINGW64) does not reliably support heredoc syntax and complex command-line escaping.
- The project has `edit` tool available. Always check your tool list before falling back to shell commands.
- Use `read` to review file content, then `edit` to apply changes. Use `bash` only for running commands (git, npm, build), not for file manipulation.
