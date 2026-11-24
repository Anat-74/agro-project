# Переезд хостинга: Plesk → ISPmanager (hb.by)

Статус: **перенос выполнен 22.11.2026, старый хостинг скоро отключат.** Панель новая (ISPmanager),
старые Plesk-скрипты нерабочие. Текущее состояние — см. «Состояние на 23.11.2026» ниже.

## Что подтвердила поддержка
- **SSH (chroot) будет доступен** для пользователя на ISPmanager.
- **Node.js-приложение размещать можно** (тип сайта Node.js; нужна версия ≥ 22.22.3).
- **Технические домены `vh324.by3020.ihb.by` и `api.vh324.by3020.ihb.by` на новом сервере недоступны.**
  В панели можно создать любое доменное имя и назначить ему технический домен → **адрес API изменится**.

Источники: письмо поддержки 19.11.2026; [новость HB.BY о переходе на ISPmanager](https://hb.by/company/news/perehod-na-ispmanager) (22.05.2026);
[тарифы Unix](https://hb.by/solutions/hosting/unix) — ISPmanager, Node.js 18–25, SSH/FTP/SFTP, «Бизнес» 4 ГБ / 4 ядра / 25 ГБ.

## Состояние на 23.11.2026 (проверено по панели и API)

### Доступ
- Панель: **ISPmanager 6** (не Plesk). Вход из-за пределов РБ: `https://by5010.hbby-cloud.com:2087/`,
  из РБ: `https://by5010.hb.by:1500/`. Логин `u34165-8120`, пароль — в письме поддержки
  (в репозиторий не пишем).
- Доступ к панели по HTTP ограничен списком белорусских IP, поэтому используется адрес «из-за пределов РБ».
- **API панели работает с нашего ПК** (проверено): `POST https://by5010.hbby-cloud.com:2087/ispmgr`
  с `authinfo=ЛОГИН:ПАРОЛЬ`, `out=JSONdata` (или `json`), `func=<функция>`.
- **SSH извне РБ закрыт** (письмо поддержки): «доступ по SSH будет доступен только из панели управления
  и не будет доступен из-за пределов Республики Беларусь». Shell-клиент в панели — единственный путь к CLI.

### Что уже сделано
- Сайт `agro-api.by` (id `851`, docroot `/www/agro-api.by` = `/var/www/u34165-8120/data/www/agro-api.by`).
- **Node.js переключён 27.0.0-alpha.0.1.1 → 22.23.5** (LTS 22) через
  `func=webdomain.edit&elid=agro-api.by&nodejs_version=22.23.5&sok=ok`; проверено в списке сайтов.
  Обоснование: Nuxt 4 требует ≥ 22.12, `backend/package.json` — `node >=18 <=22.x`.
- Техдомен `u34165-8120.by5010.ihb.by` теперь резолвится (поддержка: «нужно было время»).
- Каталог сайта пуст: только заглушки панели `index.html`, `package.json`, `server.js`.

### Чего нет (проверено)
- **Git-модуля в панели нет**: `func=git` → «The associated module is missing».
  Значит вариант «Git-репозитории» из документации ISPmanager на этом тарифе недоступен.
- **Shell выключен у пользователя**: `func=shell` → «You have insufficient permissions».
  Включается в «Пользователи → Изменить → Может использовать shell» (права администратора тарифа,
  сам пользователь себе не включит) — нужен запрос в поддержку.
- Нет отдельного домена под фронтенд (в списке только `agro-api.by` и `test.by`).

### Архивы переноса (в `/var/www/u34165-8120/data/www/`)
- `api.vh324.by3020.ihb.by.zip` — 257 МБ (файлы Strapi, вероятно с `uploads`);
- `httpdocs.zip` — 231 МБ, `other.zip` — 1.86 ГБ, `createx…zip`, `loft…zip`, `vue…zip` — прочее со старой подписки;
- `agro-project_2026-11-22_17-48-52.sql.zip` — 108 КБ, **дамп БД** (прод работал на MySQL:
  в `backend/config/database.ts` клиент задаётся `DATABASE_CLIENT`, локально `sqlite`).
  БД и медиа, судя по архивам, перенесены — риск потери данных снят, но требует проверки импорта.

### Грабли API панели
- `elid` у `webdomain.edit` — **имя домена**, не числовой id.
- Файловый API (`func=file`) принимает только **абсолютный** путь; относительный трактуется от
  `/usr/local/mgr5/...` и даёт `noaccess`.
- Git Bash на Windows ломает аргументы, начинающиеся с `/` (превращает в `C:/Program Files/Git/...`),
  поэтому путь передаём percent-encoded: `path=%2Fvar%2Fwww%2F...`.

### Следствия для планов автоматизации
- Вариант **A (SSH-скрипты с ПК)** и **C (post-receive хук)** из раздела ниже **нереализуемы без shell**;
  даже с shell SSH из-за пределов РБ закрыт → команды придётся гонять через Shell-клиент панели
  или через API + фоновые задачи.
- Вариант **B (API панели)** — единственный, работающий сейчас: домены, SSL, файлы, запуск/перезапуск
  Node.js. Сборку (`npm ci`, `npm run build`) API не запускает.

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

## Порядок работ

1. Получить новый домен + SSH → прописать в `prod-api.env`, `.env`, `netlify.toml`, `image.domains`.
2. Strapi на новом сервере: тип сайта Node.js, точка входа, env (`NUXT_APP_SECRET`, `DEEPSEEK_API_KEY`… — для бэкенда свои), SSL, проверить `/api/products`.
3. Проверить медиа: картинки из `uploads` отдаются по новому адресу.
4. Заменить Plesk-скрипты на SSH-схему; удалить/заархивировать старые.
5. Перегенерировать sitemap, обновить доки и планы, поправить `AGENTS.md`.
6. Прогнать проверку фронта: 12 товаров, 0 битых картинок, `scrollWidth == clientWidth` на 390.
7. Только после этого — деплой фронта на Netlify с новыми переменными.

## Фактическое состояние и найденные грабли (24.11.2026)

**Ресурсы:** новая подписка — **4 ГБ RAM** (старая была 2 ГБ). Несмотря на это, `npm ci` на сервере
идёт очень медленно (6+ минут без прогресса в логе) — упираемся в процессор/лимиты shared-хостинга.

**Доступы (вне репозитория):** `C:\kilo-bridje\secrets\panel.txt` — URL панели, логин, пароль, FTP-хост.
SSH-ключ: `C:\kilo-bridje\ssh\agro_deploy` (+ `.pub`), публичная часть уже в `~/.ssh/authorized_keys`
(права 700/600 ставил через FTP `SITE CHMOD`).

**Панель (ISPmanager 6, тема Phoenix, Angular SPA), URL `https://by5010.hb.by:1500/`:**
- разделы: Dashboard, Sites, Databases, Mail, SSL certificates, DNS management, CRON jobs, Backup copies,
  File manager, IP addresses, FTP users, Migration tool, Action log, Access log, Site logs, Traffic usage,
  Limit statistics, Notifications, Disk usage, PHP, **Shell-client**;
- доступ к панели разграничен белорусскими IP; shell-клиент доступен из любого места;
- **Shell-client** — это iframe `https://by5010.hb.by:1500/shell/ispmgr/1/<session>/` (внутри ещё
  `keyboard.html`). Ввод команд: найти frame по `/shell/ispmgr/`, кликнуть в него, `keyboard.type`.
  В шелле **нет `node` в PATH** → `export PATH=$HOME/.nvm/versions/node/v22.21.0/bin:$PATH`.
  **Длинные команды обрываются при закрытии сессии** → запускать через `nohup … &` и опрашивать лог.

**Меню строки сайта (⋮ в карточке сайта в Sites):** Open the website in a browser, Edit, Site files,
Error pages, Redirects settings, Access limits, Log, **Run settings (Node.js)**, **Restart (Node.js)**,
**Npm install**, View Node.js packages, **Shell client**, Create a backup copy, Restore website from a copy.
«Restart (Node.js)» — правильная кнопка для перезапуска приложения.

**API панели (работает из Беларуси):**
`https://by5010.hb.by:1500/ispmgr?authinfo=ЛОГИН:ПАРОЛЬ&out=JSONdata&func=…`
- `webdomain` — список сайтов; `webdomain.edit&elid=САЙТ` — параметры (в т.ч. `nodejs`, `techdomain`,
  `document_root`, `nodejs_server`, `nodejs_use_port`, `nodejs_socket`) → **изменение версии Node:
  `webdomain.edit&elid=…&nodejs_version=22.21.0&sok=ok`** (проверено, применилось);
- `sslcert` — сертификаты (`is_letsencrypt`, `letsencrypt_has_error`), `sslcert.edit&elid=…` — детали;
- `letsencrypt.generate` — выпуск (`domain_name`, `domain`, `email`, `crtname`, `name`, `username`,
  `keylen`, `wildcard`, `dns_check`, `skip_check_a_record`, `enable_cert`, `sok=ok`);
- `file&path=…` — файловый менеджер (есть `extract_action`), `func=user`/`database` — нет прав/модуля.

**Сайт API:** `agro-api.by` (id 851), docroot `/var/www/u34165-8120/data/www/agro-api.by`
(в FTP — `/www/agro-api.by`), handler **Node.js 22.21.0**, соединение через unix-socket,
технический домен **`u34165-8120.by5010.ihb.by`** (резолвится на 176.60.210.124), SSL — self-signed
(выпуск LE падал: `letsencrypt_has_error`).

**Грабли (подтверждено на практике):**
1. **Архив `api.vh324…zip` неполный** для запуска: потеряны `.bin`-симлинки (→ `strapi: command not found`)
   и часть вложенных зависимостей (пример: `globalthis` → падение `@strapi/core`). Вывод: нужна свежая
   установка зависимостей, а не распаковка.
2. **`npm install` на сервере убивается лимитами** и оставляет `node_modules` неполным (пропал
   `@strapi/strapi`). Не запускать «на живую» без `nohup` и без плана восстановления.
3. **`better-sqlite3` требует Python/node-gyp** → сборка падает. Решение: `npm ci --omit=dev --ignore-scripts`
   (в пакете есть готовые `prebuilds`), при необходимости — подложить бинарник из сохранённой копии
   (`~/bsq-backup`).
4. **Let's Encrypt по HTTP не выпустится, пока Node-приложение не запущено**: ACME-запрос идёт на сайт,
   а nginx отдаёт 502. Порядок: сначала приложение, потом сертификат.
5. **SSH**: ключ принимается (аутентификация проходит), но **каналы не открываются**
   (`channel 0: open failed: connect failed: open failed`) — и для команд, и для SFTP. Передано поддержке.
6. **Перенос каталогов вместо `cp -a` больших `node_modules`**: копирование зависает; `mv` директорий
   (распакованное приложение ↔ каталог сайта) работает мгновенно.

**Текущее состояние:** приложение Strapi развёрнуто в каталоге сайта (БД `.tmp/data.db`, `public/uploads`,
собранная админка `dist`), Node 22.21.0, идёт `npm ci --omit=dev --ignore-scripts`; сайт отдаёт 502.
Старый сервер и старый API (`api.vh324.by3020.ihb.by`) пока живы — фронт и превью не затронуты.

### Обновление 24.11 (вечер): Strapi запущен, но данные нужно забрать со старого сервера

- `npm ci --omit=dev --ignore-scripts` завершился: **added 1392 packages in 15m** (это и есть ориентир
  по времени на этом тарифе), `node_modules` = 770 МБ.
- После запуска Strapi потребовал `.env` → сгенерировали ключи (`APP_KEYS`, `API_TOKEN_SALT`,
  `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`) → **Strapi started successfully**.
- **Критично: база из архива пустая.** В `api.vh324…zip` файл `.tmp/data.db` (1 384 448 байт) содержит
  только схему (74 таблицы), но **`admin_users = 0`, `products = 0`** → данных в бэкапе нет.
  Запуск на ней создаёт новую пустую базу, панель просит «создать первого администратора», API отдаёт 403.
- **Вывод:** базу (и `.env`) нужно забрать с **живого старого сервера** (Plesk, `/httpdocs/backend/.tmp/data.db`),
  затем положить в `~/www/agro-api.by/.tmp/data.db` и перезапустить. `public/uploads` в архиве есть — их переносить не нужно.
- Порядок после переноса БД: проверить `/api/products` (200 + данные) → Let's Encrypt → переключение фронта.

### РАЗГАДКА (24.11): база у Strapi — MySQL, а не SQLite

На странице «Информация о подключении» старого Plesk видно: **MySQL/MariaDB** `localhost:3306`, база
**`agro-project`**, пользователь **`agro_user`**. Значит `.tmp/data.db` (SQLite) в архиве — **старый мусор**,
поэтому он и был пустым. Настоящий дамп лежит в архиве рядом:
**`agro-project_2026-11-22_17-48-52.sql.zip`** (111 КБ, 92 INSERT, все таблицы Strapi).

**Что сделано на новом сервере:**
1. Создана БД `agro-project` + пользователь `agro_user` (MySQL 10.5.29, `127.0.0.1:3306`) через API панели
   (`func=db.edit`, `server=MySQL`, `charset=utf8mb4`). Пароль сгенерирован и лежит в `~/db-created.txt` (600).
2. Дамп распакован (`~/dbrestore/…sql`) и импортирован клиентом `mysql` (есть в chroot, MariaDB 10.5).
   Проверка: **products = 78**, **admin_users = 1**, **categories = 31**.
3. В `.env` добавлены `DATABASE_CLIENT=mysql`, `DATABASE_HOST=127.0.0.1`, `DATABASE_PORT=3306`,
   `DATABASE_NAME=agro-project`, `DATABASE_USERNAME=agro_user`, `DATABASE_PASSWORD=…`.
4. Запуск: **Strapi started successfully**, `/api/products` → **200**, `total: 33`.

**Осталось:** перезапустить через панель (Restart (Node.js)), чтобы процессом владел pm2 панели и nginx
направил сайт на него; затем Let's Encrypt (HTTP-проверка пройдёт) и переключение фронта.

Ручной `node server.js` после проверки остановлен, чтобы не занимать порт.

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

### Рабочее состояние API (24.11, вечер)

- Сайт проксируется nginx на **127.0.0.1:10006** (панель переключила на порт) → в `.env` выставлено `PORT=10006`.
- Strapi работает: `http://u34165-8120.by5010.ihb.by/api/products` → **200**, `total: 33`.
- Процесс сейчас запущен вручную (`nohup node server.js`) — **не переживёт перезагрузку**; штатный запуск через
  панель (pm2) нужно наладить отдельно: при «Restart (Node.js)» процесс панели не поднимался.
- **Let's Encrypt не выпускается**: панель возвращает `letsencrypt_has_error: on`, а nginx в логе пишет
  `openat() "/usr/local/mgr5/www/letsencrypt/<token>" failed (No such file or directory)` — плагин LE не создаёт
  challenge-файл. Это на стороне хостера → запрос в поддержку. До HTTPS фронт переключать нельзя (mixed content).

### Рекомендации из документации Strapi 5 (24.11)

Источники: [Deployment](https://docs.strapi.io/cms/deployment), [Process manager](https://docs.strapi.io/cms/deployment/process-manager).

**Требования (официальные) и наше соответствие**

| Параметр | Требование | У нас |
|---|---|---|
| CPU | мин. 1, рек. 2+ | 4 ✓ |
| RAM | мин. 2 ГБ, рек. 4 ГБ | 4 ГБ ✓ |
| Диск | мин. 8 ГБ | 61 ГБ ✓ |
| Node.js | только LTS (22/24/26) | 22.21.0 ✓ |
| БД | MySQL ≥8.0 / MariaDB ≥10.3 | MariaDB 10.5.29 ✓ |

**Что обязательно**
1. `NODE_ENV=production` для сборки и запуска; сборка админки — `npm run build` (у нас `dist` уже собран).
2. Env-переменные: `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`,
   `ENCRYPTION_KEY` + доступы к БД. **Не менять между деплоями** — иначе инвалидируются сессии и API-токены.
3. **Процесс-менеджер — PM2** (документация: «We highly recommend using a process manager such as PM2»).
4. Health-check `/_health` → **204** (есть у Strapi, использовать для мониторинга).
5. **Strapi однопроцессный** — не запускать в cluster (`-i max`).
6. **pnpm для бэкенда не использовать** (документация: агрессивный hoisting ломает нативные модули вроде `mysql2`).
   У нас бэкенд на npm — соответствует. Фронтенд на pnpm — это отдельный проект, к Strapi отношения не имеет.

**Настроить (сейчас отсутствует)**
- `config/server.ts`: добавить `proxy: true` (работа за nginx с SSL) и `url: env('PUBLIC_URL')` — сейчас есть только
  `host`, `port`, `app.keys`.
- `NODE_ENV=production` — явно в окружении pm2.

**Целевой запуск: pm2, одна инстанция**

```js
// ecosystem.config.cjs (в каталоге приложения)
module.exports = {
  apps: [{
    name: 'agro-api',
    script: 'server.js',
    cwd: '/var/www/u34165-8120/data/www/agro-api.by',
    instances: 1,
    autorestart: true,
    max_memory_restart: '700M',
    env: { NODE_ENV: 'production', PORT: 10006 },
  }],
};
```

```bash
pm2 start ecosystem.config.cjs && pm2 save
# pm2 startup требует root — автозапуск после ребута обеспечивает панель (её pm2)
```

**Деплой-цепочка (после SSH/bare-репозитория):**
```bash
git pull
npm ci --omit=dev --ignore-scripts   # нативная сборка лучше-sqlite3 не нужна (БД MySQL)
npm run build                        # при изменениях кода/конфига админки
pm2 restart agro-api
curl -s -o /dev/null -w '%{http_code}' https://<домен>/_health   # ожидаем 204
```

**Вывод:** по требованиям Strapi мы проходим с запасом; осталось (1) дождаться от хостера SSL и рабочего
запуска панельного pm2, (2) добавить `proxy`/`url`, (3) перевести процесс на pm2, (4) переключить фронт.
