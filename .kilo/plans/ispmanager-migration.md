# Переезд хостинга: Plesk → ISPmanager (hb.by)

Статус: **согласовано 19.11.2026, ждём переноса.** Ничего не меняем до сообщения поддержки о завершении.

## Что подтвердила поддержка
- **SSH (chroot) будет доступен** для пользователя на ISPmanager.
- **Node.js-приложение размещать можно** (тип сайта Node.js; нужна версия ≥ 22.22.3).
- **Технические домены `vh324.by3020.ihb.by` и `api.vh324.by3020.ihb.by` на новом сервере недоступны.**
  В панели можно создать любое доменное имя и назначить ему технический домен → **адрес API изменится**.

Источники: письмо поддержки 19.11.2026; [новость HB.BY о переходе на ISPmanager](https://hb.by/company/news/perehod-na-ispmanager) (22.05.2026);
[тарифы Unix](https://hb.by/solutions/hosting/unix) — ISPmanager, Node.js 18–25, SSH/FTP/SFTP, «Бизнес» 4 ГБ / 4 ядра / 25 ГБ.

## Что нужно от пользователя после переноса
1. Новый домен для API (например `api.<домен>.by`) — создаётся в панели.
2. SSH-доступ: хост, порт, пользователь, ключ/пароль.
3. Подтверждение, что перенесены **БД и папка `uploads`** Strapi.
4. Окно для тестирования (не в момент переноса).

## Инвентарь: что менять при смене адреса API

| Файл | Что именно |
|---|---|
| `frontend/env/prod-api.env` | `NUXT_PUBLIC_STRAPI_URL`, `NUXT_STRAPI_URL` |
| `frontend/netlify.toml` | те же переменные в `[build.environment]` |
| `frontend/.env` (локально, gitignored) | те же переменные |
| `frontend/nuxt.config.ts` (~стр. 212) | `image.domains` — иначе NuxtImg не отдаст картинки |
| Netlify (панель/CLI) | env после настройки деплоя |
| Strapi `backend` | публичный URL медиа, CORS (`origin: ['*']` — ок) |
| `frontend/sitemap.xml` | сгенерированный артефакт со старыми URL → перегенерировать |
| `.kilo/plans/*.md` (8 файлов), `AGENTS.md` | упоминания старого адреса |

## Plesk-скрипты станут неактуальны
`scripts/deploy.mjs`, `scripts/deploy-api.mjs`, `scripts/restart-api.mjs`, `scripts/restart-app.mjs`,
`scripts/plesk-deploy.mjs` — все ходят на `https://vh324.by3020.ihb.by:8443`.

Замена (SSH):
- сборка: `cd <app dir> && npm ci && npm run build`;
- проверка: наличие `.output/server/index.mjs`;
- запуск/перезапуск: pm2 (или менеджер процессов ISPmanager);
- логи: `pm2 logs` / `journalctl` (больше не нужен UI-лог панели).

## Автоматизация после переноса: SSH / API / git-hook

Изучено 20.11.2026 по официальной документации.

**Что умеет ISPmanager**
- **API панели**: `https://<сервер>:1500/ispmgr?authinfo=логин:пароль&out=json&func=...`; авторизация
  `func=auth&username=&password=` → ID сессии (cookie `ispmgrses5`); форматы `json`/`JSONdata`/`xml`.
  Управление доменами, БД, SSL, файлами (есть `mancgi/upload` для загрузки файлов).
- **`mgrctl`** (локально на сервере): `/usr/local/mgr5/sbin/mgrctl -m ispmgr <функция>` — обращается
  к панели напрямую, **без пароля** (авторизация по пользователю ОС). При наличии SSH API-токены не нужны.
- **Node.js-проект**: действия «Параметры запуска (Node.js)», «Перезапустить (Node.js)», «Npm install»,
  «Просмотр пакетов», **«Shell-клиент»** (доступен, если у пользователя включено «Может использовать shell»).
  Команда запуска — из `scripts` в `package.json` или вручную (`&&`, `;`), можно задать команду перед
  запуском и до **10 переменных окружения**.

**Варианты (рекомендация: A + C)**

| | Как | Плюсы | Минусы |
|---|---|---|---|
| **A. SSH-скрипты** | `ssh user@host 'cd app && git pull && pnpm i --frozen-lockfile && pnpm build'` + перезапуск | полный контроль, логи, любые команды | нужен SSH (подтверждён) |
| **B. API панели** | HTTP `ispmgr` / `mgrctl` | сайт/SSL/DNS/env без консоли | произвольные команды (сборку) не запускает |
| **C. Git push-to-deploy** | bare-репозиторий на сервере + `hooks/post-receive` → checkout → install/build → reload | деплой = один `git push` | первичная настройка хука по SSH |

**Что понадобится от хостера/пользователя**
1. SSH: хост, порт, пользователь, ключ (ключ предпочтительнее пароля); включить «Может использовать shell».
2. На сервере: `git`, `npm`/`pnpm`, возможность поставить `pm2` (или использовать менеджер панели).
3. Каталог приложения и сайт типа Node.js (либо nginx-прокси на порт процесса под pm2).
4. Логин в ISPmanager — только если что-то делаем через API (при SSH не обязателен).

**Безопасность**
- Отдельный SSH-ключ, лежит **вне репозитория** (`C:\kilo-bridje\ssh\…`), с ограниченным пользователем.
- Из Plesk-скриптов убрать закоммиченные логин/пароль (сейчас они в открытом виде).
- Переменные окружения — в `.env` каталога приложения (в панели лимит 10 переменных).

**Источники**: [API ISPmanager](https://www.ispmanager.ru/docs/ispmanager/vzaimodejstvie-cherez-api),
[Node.js-проект в ISPmanager](https://www.ispmanager.ru/docs/ispmanager/upravlenie-proektom-na-nodejs),
[загрузка файла через API](https://www.ispmanager.com/knowledge-base/api-uploading-a-file-to-the-server).

## Связь с другими планами и порядок работ

Есть два уже записанных плана, которые пересекаются с переездом:

1. **`npm-to-pnpm.md`** (не начато). В нём пункт «Деплой — Plesk Node.js: поменять install/build команды
   приложения» **устареет** после переезда — на ISPmanager команды задаёт наш SSH-скрипт/хук.
   Переход на pnpm меняет команды установки и сборки (`pnpm i --frozen-lockfile`, `pnpm build`),
   поэтому его нужно сделать **до** настройки автоматизации, иначе деплой-скрипты придётся переписывать дважды.
   Учесть: `onlyBuiltDependencies`/`pnpm approve-builds` для `sharp` и `better-sqlite3`, `corepack` на сервере.
2. **`gitlab-migration.md`** (не начато). GitLab даёт CI/CD (`.gitlab-ci.yml`) и заменяет бесполезные сейчас
   GitHub Actions. Логично переехать **до** финальной настройки деплоя, чтобы хуки/пайплайны сразу смотрели
   на постоянный remote и не переделывать дважды.

**Рекомендуемая последовательность**
1. Перенос хостинга (жду поддержку) → новый домен API, проверка Strapi/медиа.
2. **pnpm** (локально, с проверкой сборки и тестов) → обновить `packageManager`, lock, команды.
3. **GitLab** (remote + `.gitlab-ci.yml`: Node 22, install/build/test) → деплой-пайплайн/хук на новый remote.
4. **SSH-автоматизация**: ключ, `scripts/deploy-ssh.mjs` (или git-hook), pm2/перезапуск, проверки.
   Удалить Plesk-скрипты и закоммиченные креды.
5. Проверка критериев приёмки из этого плана + прогон проверок фронта (12 карточек, 0 битых картинок).

## Свой git на хостинге: bare-репозиторий (после переезда)

Цель — собственная копия кода, которой не касаются внешние блокировки. Gitea/GitLab **не нужны**: git уже есть.
Bare-репозиторий — это папка без рабочей копии (только история): `objects/`, `refs/`, `HEAD`, `config`, `hooks/`.

```bash
# на сервере (один раз, по SSH)
mkdir -p ~/git && git init --bare ~/git/agro-project.git

# на ПК — второй remote (GitHub остаётся основным)
git remote add hosting ssh://<user>@<host>:<port>/~/git/agro-project.git
git push hosting master && git push hosting --tags
git fetch hosting && git log hosting/master --oneline -5
```

**Деплой** — рабочая копия в каталоге приложения обновляется из bare-репозитория:

```bash
# вручную/скриптом
cd <каталог-приложения>
git remote add hosting ~/git/agro-project.git
git pull hosting master
pnpm install --frozen-lockfile && pnpm build
pm2 restart agro
```

```bash
# автоматически: ~/git/agro-project.git/hooks/post-receive
#!/bin/sh
set -e
APP=/var/www/.../frontend
git --work-tree="$APP" --git-dir="$HOME/git/agro-project.git" checkout -f master
cd "$APP"
pnpm install --frozen-lockfile
pnpm build
pm2 restart agro || pm2 start .output/server/index.mjs --name agro
```

**Копии кода (все три):**
1. GitHub — основной remote;
2. bare-репозиторий на хостинге — своя копия, не зависит от блокировок;
3. локальное зеркало на ПК (`git clone --mirror . C:/kilo-bridje/git/agro-project.git`).

**Проверить на новом хостинге:** `git --version` по SSH (в chroot), наличие `corepack`/`pnpm`, `pm2` (или менеджер процессов панели), права записи пользователя SSH в каталог приложения.

**Ограничения:** нет веб-интерфейса (нет issues/PR/просмотра кода), нет CI (его роль выполняет `post-receive`), хостинг общий с сайтом (падение хостинга затрагивает обе копии).

## Порядо

к работ
1. Получить новый домен + SSH → прописать в `prod-api.env`, `.env`, `netlify.toml`, `image.domains`.
2. Strapi на новом сервере: тип сайта Node.js, точка входа, env (`NUXT_APP_SECRET`, `DEEPSEEK_API_KEY`… — для бэкенда свои), SSL, проверить `/api/products`.
3. Проверить медиа: картинки из `uploads` отдаются по новому адресу.
4. Заменить Plesk-скрипты на SSH-схему; удалить/заархивировать старые.
5. Перегенерировать sitemap, обновить доки и планы, поправить `AGENTS.md`.
6. Прогнать проверку фронта: 12 товаров, 0 битых картинок, `scrollWidth == clientWidth` на 390.
7. Только после этого — деплой фронта на Netlify с новыми переменными.

## Критерии приёмки
- `https://<новый домен>/api/products` → 200, данные и картинки доступны.
- Strapi-админка открывается, вход работает.
- Фронт (локально и на превью) показывает товары и изображения без ошибок.
- `grep -r "vh324.by3020"` по репозиторию не находит рабочих ссылок (только исторические записи в планах).

## Риски
- **Потеря медиа/БД** при переносе → требуем подтверждение и бэкап до переключения.
- **SSL/домен**: после переноса старые URL мертвы → любой закешированный фронт (Netlify/Plesk) сломается, пока не пересоберём.
- Plesk-резерв (фронт на старом хостинге) после смены адреса API перестанет видеть данные — либо пересобрать его, либо оставить только Netlify.
- Простой на время переноса — уточнить у поддержки длительность.

## Не делать
- Не менять `master` под новый адрес до фактического переключения (пока Plesk-фронт живой).
- Не удалять Plesk-скрипты до успешной проверки SSH-схемы.
