# Переход на GitLab (план)

Статус: не начато, записано 14.11. Связано с `deploy-speed.md` (автоматизация деплоя).

## Зачем

- **Встроенный CI/CD** (`.gitlab-ci.yml`): пайплайн, стадии, окружения, артефакты, логи сборки — то,
  чего сейчас не хватает: деплой делается кликами Playwright по Plesk, и причину падения сборки не видно.
- **Self-hosting бесплатно** (GitLab Community Edition, MIT): можно поднять на своём сервере и держать
  код/пайплайны у себя; у GitHub self-hosted только в Enterprise.
- Встроенные сканеры безопасности (SAST/DAST/dependency/container) уже на бесплатных тарифах;
  у GitHub это отдельные платные продукты Advanced Security.
- Единый продукт: репозиторий, registry (контейнеры/пакеты), окружения, планирование — без зоопарка.

## Чем реально отличается от GitHub (2026)

| | GitLab | GitHub |
|---|---|---|
| CI/CD | встроен и «из коробки», `.gitlab-ci.yml`, стадии/окружения/артефакты | Actions + огромный маркетплейс готовых actions |
| Стиль | «всё в одном», свои скрипты в пайплайне | «хаб + маркетплейс», много чужих actions (дополнительная поверхность атаки) |
| Self-hosted | GitLab CE бесплатно (MIT), но тяжёлый (несколько ГБ RAM) | только GitHub Enterprise Server (платно) |
| Free CI-минуты | ~400 compute-минут/мес (приватные), публичные — без лимита | ~2000 Actions-минут/мес (приватные; лимит зависит от тарифа) |
| Безопасность | SAST/DAST/dependency/container на free | Advanced Security — платные аддоны |
| Сообщество/экосистема | меньше, но достаточно | крупнейшее; **исходники Vue и Nuxt живут на GitHub** |
| AI | GitLab Duo (в тарифах Premium/Ultimate) | Copilot (отдельные планы, есть free) |

Важно: «GitLab продвигают в Vue-сообществах» — это про CI/DevOps, а не про то, что Vue переехал.
Официальные репозитории Vue/Nuxt остаются на GitHub; переход ничего не ломает.

## Риски и цена перехода

- Пайплайн надо написать заново (Actions → `.gitlab-ci.yml`), включая деплой на Plesk.
- Нужно перенести: remote, issues/MR, вебхуки, npm-токены/секреты (CI variables), бейджи/ссылки.
- Self-hosted GitLab CE на том же VPS, где Strapi, — по RAM может не хватить (Strapi + Nuxt + GitLab).
  Тогда: gitlab.com (free) или отдельный сервер.
- Откат: GitHub остаётся как зеркало (`git remote add github`, push в оба) — пока пайплайн не устоится.

## Порядок

1. Импорт проекта в GitLab (Import → GitHub, история и MR переносятся).
2. Настроить CI variables (Strapi URL, токены, SSH-ключ для деплоя).
3. Написать `.gitlab-ci.yml`: `lint → test → build → deploy` (деплой — rsync/SSH в Plesk, см. deploy-speed.md).
4. Проверить на ветке, затем сделать GitLab основным remote, GitHub — зеркалом.
5. Обновить AGENTS.md (пути/команды/remote) и `deploy-speed.md`.
