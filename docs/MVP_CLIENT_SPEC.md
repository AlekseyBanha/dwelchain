# Dwelchain MVP — внутрішнє ТЗ (клієнтська частина)

Документ для розробки. Базується на клієнтському ТЗ MVP, існуючому HTML/CSS прототипі та уточненнях по порядку робіт.

**Поза скоупом цього документа:** UI адмінки / CRM.  
**У скоупі схеми БД:** поля й сутності з запасом під адмінку (статуси, модерація, лічильники, внутрішні коментарі).

**Стек:** Laravel + PostgreSQL + існуючий frontend (Blade/HTML/CSS/JS).  
**Джерело UI:** `Dwelchain-frontend-prototype/` → уже імпортовано в `resources/views/pages/` + `public/assets/`.

---

## 0. Принципи

1. Frontend уже є — не перемальовуємо. Підключаємо API/сесії до існуючих екранів і модалок.
2. Адмінку не будуємо зараз, але дані й статуси одразу «адмін-ready».
3. Гостьовий перегляд каталогу/об’єктів дозволений. Дії «залишити заявку» вимагають авторизації.
4. Один користувач може мати обидві ролі (`tenant` + `landlord`) через прапорці; UI кабінету перемикається як у прототипі.

---

## 1. Порядок реалізації (фази)

| Фаза | Назва | Результат |
|------|--------|-----------|
| **A** | Auth (пароль + email-код) | Реєстрація/вхід, gate на CTA |
| **B** | Особистий кабінет + форма орендодавця | Профіль, favorites, додавання об’єкта (R2 + Google address) |
| **C** | Каталог + об’єкт + фільтри | Публічний контент з БД |
| **D** | Заявки (перегляд / власник / менеджер) | Форми пишуть у БД |
| **E** | Карта + geo (Київ) + інфо | Карта, райони з БД, інфо-сторінки |

Далі по фазах детально.

---

## Фаза A — Реєстрація / авторизація (перша в черзі)

### A.1 Бізнес-правило (критичне)

При кліку на:
- **«Записатися на перегляд»** (`viewing-modal`)
- **«Запропонувати об’єкт»** (`owner-modal`)

якщо користувач **не авторизований**:

1. Не відкривати бізнес-форму одразу.
2. Показати модалку: «Щоб продовжити, увійдіть або зареєструйтеся».
3. Пройти auth (пароль + підтвердження email кодом).
4. Після успіху — повернути до початкової дії (відкрити відповідну форму / продовжити сценарій).

Форма «Зв’язатися з менеджером» на старті може залишатися доступною гостю (як у клієнтському ТЗ). Якщо пізніше вирішимо уніфікувати — зміна одна точка в gate.

### A.2 Метод auth

**Пароль + email one-time code.**

- **Вхід:** email + пароль (якщо email ще не підтверджений — спочатку кроки з кодом).
- **Реєстрація:** анкета з паролем → код на пошту → після валідного коду акаунт активний і сесія відкрита.
- Прототип (`auth.html`) уже на паролі — **залишаємо пароль**, додаємо крок верифікації email кодом. Стилі/лейаут зберігаємо.

#### Реєстрація — кроки

1. Користувач заповнює: ім’я, телефон, email, роль, місто, **пароль**, **підтвердження пароля**.
2. Backend валідує дані, створює user зі статусом «email не підтверджено» (або тримає pending до verify — обрати один підхід і триматися його), генерує 6-значний код, TTL **10 хв**, шле на пошту.
3. Користувач вводить код.
4. При валідному коді: `email_verified_at` = now, логін у сесію.
5. Rate limit: max N кодів на email/IP за годину; повторне надсилання не раніше ніж через 60 с.

#### Вхід — кроки

1. Email + пароль (+ «Запам’ятати мене»).
2. Якщо credentials ок і email підтверджений → сесія.
3. Якщо credentials ок, але email **не** підтверджений → показати крок з кодом (можна resend), після коду — сесія.
4. Невірний email/пароль → загальна помилка без розкриття, що саме не так.

#### Відновлення пароля

Залишаємо з прототипу (`/auth?mode=recover`):
1. Email → лист із посиланням або кодом скидання.
2. Новий пароль + підтвердження.
3. Після зміни — опційно одразу логін.

#### Екрани / UI

- Повна сторінка `/auth`: вкладки «Вхід» / «Реєстрація» + recover.
- Модалка auth-gate поверх сайту (новий dialog у chrome) — ті самі кроки в компактному вигляді.
- Після логіну: редірект у `/account` або resume intended action.

#### Поля реєстрації (мінімум MVP)

| Поле | Обов’язкове | Коли |
|------|-------------|------|
| Ім’я | так | реєстрація |
| Телефон | так | реєстрація |
| Email | так | реєстрація / вхід / recover |
| Пароль | так | реєстрація / вхід / новий після recover |
| Підтвердження пароля | так | реєстрація / recover |
| Код з пошти | так | після реєстрації (і при логіні неверифікованого) |
| Роль (tenant / landlord) | так | реєстрація; можна змінити/додати пізніше в профілі |
| Місто | ні / default Київ | реєстрація |

Правила пароля: мінімум **8 символів** (як у прототипі). Хеш — Laravel `Hash` / `hashed` cast.

### A.3 API / маршрути (орієнтир)

```
POST /auth/register             { name, phone, email, password, password_confirmation, role, city? }
POST /auth/email/verify         { email, code }
POST /auth/email/resend-code    { email }
POST /auth/login                { email, password, remember? }
POST /auth/password/forgot      { email }
POST /auth/password/reset       { email, code|token, password, password_confirmation }
POST /auth/logout
GET  /auth/me                   (або session-based blade)
```

Сесія Laravel (cookie). CSRF на всіх POST.

### A.4 Критерії готовності фази A

- [x] Гість на «Записатися на перегляд» / «Запропонувати об’єкт» бачить auth-gate.
- [x] Реєстрація з паролем надсилає код на пошту; без коду повний доступ не дається.
- [x] Вхід email + пароль відкриває сесію для підтвердженого акаунта.
- [x] Непідтверджений email при логіні потрапляє на крок коду.
- [x] Recover пароля працює (лист + новий пароль).
- [x] Після логіну resume відкриває потрібну бізнес-модалку.
- [x] Авторизований одразу бачить бізнес-форму.
- [x] Rate limit і TTL коду працюють.
- [x] Невалідний/прострочений код і невірний пароль показують зрозумілі помилки.

---

## Фаза B — Особистий кабінет

Базуємось на `account.html` прототипу.

### B.1 Орендар (`tenant`)

| Розділ | Що робимо в MVP |
|--------|------------------|
| Огляд | Лічильники: збережені, заявки на перегляд, активні |
| Збережені об’єкти | Favorites CRUD |
| Мої перегляди | Список власних `viewing_requests` + статуси (read-only для клієнта) |
| Профіль | Ім’я, телефон, email (email change = знову код), місто, ролі |

### B.2 Орендодавець (`landlord`)

| Розділ | Що робимо в MVP |
|--------|------------------|
| Огляд | Лічильники: мої об’єкти, чернетки на модерації |
| Мої об’єкти | Список `properties` де `owner_user_id = me` + кнопка «Додати об’єкт» |
| Додати / редагувати об’єкт | Повна форма (`/property-editor`) — див. B.3 |
| Заявки клієнтів | **Не клієнтська CRM.** У MVP приховати або лише статус «менеджер працює». |
| Профіль | Як у tenant |

### B.3 Форма додавання / редагування об’єкта (орендодавець)

UI: існуючий `property-editor` (прототип). Доступ лише `auth` + `is_landlord` (або роль landlord увімкнена).

**Публікація напряму заборонена.** Після submit:
- створюється / оновлюється `properties` зі `status = draft` (або `pending_moderation`, якщо додамо окремий статус);
- `owner_user_id = current user`;
- `city_id` = Київ (MVP);
- чекає менеджера/адміна для `published`.

#### Поля форми (мінімум)

| Поле | Обов’язкове | Джерело |
|------|-------------|---------|
| Назва | так | input |
| Deal (rent/sale) | так | select |
| Тип нерухомості | так | select |
| Опис / короткий опис | так / бажано | textarea |
| Ціна (USD) | так | number |
| Кімнати, площа, поверх, поверховість | так (де релевантно) | number |
| **Адреса** | так | **Google Places Autocomplete** |
| lat / lng | так | з обраного place (hidden) |
| google_place_id | бажано | з place |
| Район (`district_id`) | так (авто або ручний fallback) | резолв з точки / select районів Києва |
| Фото (1…N) | так мінімум 1 cover | upload → **Cloudflare R2** |

Редагування: `/property-editor?id=…` лише власних draft/hidden об’єктів; published — обмежено (або read-only до адмінки).

### B.4 Завантаження фото в Cloudflare R2

- Диск Laravel `s3`-compatible → R2 (`AWS_ENDPOINT`, `AWS_BUCKET`, keys у `.env`).
- Потік (рекомендований):
  1. `POST /account/properties/media/presign` → temporary upload URL + object key;
  2. клієнт PUT файл напряму в R2;
  3. `POST` збереження об’єкта з масивом keys / порядок / cover.
- Альтернатива MVP: multipart через Laravel → Storage::disk('r2').
- Валідація: jpg/png/webp, max size (напр. 5–10 MB), max N фото, MIME/real image check.
- У `property_images`: `path` = R2 key, `sort_order`, `is_cover`.
- Публічний URL через R2 custom domain / `AWS_URL` для каталогу.

### B.5 Адреса через Google Maps (у формі орендодавця)

Уже на фазі B (не відкладати до E):

1. Поле адреси = Places Autocomplete, bias на Київ.
2. Після вибору place → `latitude`, `longitude`, `google_place_id`, `address_private`.
3. На submit бекенд резолвить `city_id` / `district_id` (див. E.3); якщо не Київ — помилка валідації.
4. На формі можна показати міні-карту з маркером обраної точки (Google Maps JS).
5. `address_public` формуємо на бекенді (район + орієнтир без точного номера — за політикою).

### B.6 Критерії готовності фази B

- [ ] `/account` доступний лише авторизованим (редирект на auth).
- [ ] Профіль зберігається в БД.
- [ ] Favorites працюють (tenant).
- [ ] Список власних заявок на перегляд відображається зі статусами з БД.
- [ ] Перемикач ролей tenant/landlord працює, якщо обидві увімкнені.
- [ ] Landlord бачить «Мої об’єкти» і відкриває `/property-editor`.
- [ ] Форма створює draft-об’єкт у БД з `owner_user_id`, `city_id`, `district_id`, lat/lng.
- [ ] Адреса обирається через Google Places; lat/lng не вводяться вручну як основний шлях.
- [ ] Фото вантажаться в R2 і прив’язуються до об’єкта (cover + порядок).
- [ ] Об’єкт **не** з’являється в публічному каталозі без статусу `published`.

---

## Фаза C — Публічний каталог і об’єкт

Відповідність клієнтському ТЗ §§1–4, частково §5.

### C.1 Головна

З існуючого UI залишити/підключити:
- коротко про сервіс;
- пошук → каталог з query;
- нові / популярні (за `is_featured`, `published_at`, `views_count`);
- CTA в каталог;
- CTA «Запропонувати об’єкт» / «Записатися…» (через auth-gate);
- переваги, контакти, форма менеджера.

### C.2 Каталог — картка

Фото, назва, ціна, район, тип, кімнати, площа, short description, лінк на деталі.

### C.3 Фільтри (базові з ТЗ)

- deal: rent | sale  
- **місто: лише Київ** (див. фазу E / geo) — у UI select зафіксований або прихований  
- district → `districts` де `city_id = Київ`  
- property type  
- rooms  
- price min / max  

Розширені фільтри з прототипу — підключати якщо поля вже в БД; не блокують MVP.

### C.4 Сторінка об’єкта

Галерея, атрибути (ціна, район/приблизна адреса, кімнати, площа, поверх, поверховість, тип), опис, **карта району/approx точки** (фаза E), CTA перегляд + менеджер.

При відкритті сторінки: інкремент `properties.views_count` (ідемпотентність по сесії/IP на день — бажано одразу, щоб аналітика не роздувалась).

Лише `status = published` і не `hidden`/`archived`. Об’єкти MVP лише з `city_id` = Київ.

---

## Фаза D — Заявки

### D.1 Заявка на перегляд (§6)

Поля: ім’я, телефон, email (optional якщо вже в профілі), дата, час, коментар, `property_id`.

- Тільки для авторизованих (фаза A).
- Prefill з профілю.
- Статуси (для адмінки, клієнт бачить read-only):  
  `new` → `contacted` → `confirmed` → `rescheduled` → `completed` | `cancelled`

### D.2 Заявка власника (§7) / CTA «Запропонувати об’єкт»

Два шляхи (не дублювати зайве):

1. **Авторизований landlord** → після auth-gate вести на **`/property-editor`** (повна форма з B.3: Google address + R2 фото).
2. Коротка модалка `owner-modal` — лише якщо користувач ще не landlord / швидкий лід; у MVP можна одразу промоутити в editor після реєстрації з роллю landlord.

Повна картка об’єкта з фото й адресою — через форму кабінету (фаза B), не через урізану модалку.

### D.3 Питання менеджеру (§8)

Поля: ім’я, телефон, питання, зручний канал (+ optional email).  
Кнопки tel / Telegram / Viber / WhatsApp / email з конфігу.

Антиспам: throttle + honeypot (+ опційно Turnstile пізніше).

---

## Фаза E — Карта, geo, інфо, технічне

### E.1 Geo-шар (уже в міграціях / сиді)

У БД є PostGIS і довідники на все майбутнє масштабування:

| Таблиця | Призначення |
|---------|-------------|
| `regions` | області (+ `location` Point, `boundaries` Polygon) |
| `cities` | міста (`region_id`, `has_districts`, Point/Polygon) |
| `districts` | райони міста (`city_id`, Point/Polygon) |

Імпорт: `GeoSeeder` + `GeoImportService` з `geo-fetch/` (усі регіони/міста/райони України підвантажені **на майбутнє**).

**Київ у даних:** `cities.id = 268`, `slug = kyyiv`, райони (10): Голосіївський, Дарницький, Деснянський, Дніпровський, Оболонський, Печерський, Подільський, Святошинський, Солом’янський, Шевченківський.

### E.2 Обмеження MVP: тільки Київ

1. Публічний каталог, карта, фільтри, заявки власника — **лише Київ**.
2. UI: місто не вибирається вільно (select «Київ» disabled / єдиний option / взагалі без вибору).
3. API/query: ігнорувати або відхиляти `city_id` ≠ Київ; завжди скоуп `where city_id = <kyiv_id>`.
4. Фільтр районів: `districts` де `city_id = Київ`.
5. Реєстрація/профіль: місто default Київ (`city_id` або legacy string → краще FK).
6. Інші міста/області в БД **не чіпаємо і не показуємо** — запас під post-MVP.

Константа/config: наприклад `config('dwelchain.mvp_city_slug') = 'kyyiv'` або `mvp_city_id = 268`.

### E.3 Ввід адреси (Google Maps) → збереження в БД

**Перший робочий кейс — форма орендодавця у фазі B** (`/property-editor`). Той самий пайплайн потім для адмінки.

Для створення/редагування об’єкта:

1. Користувач вводить адресу в **Google Places Autocomplete** (обмеження bias/componentRestrictions на **Київ / UA** у MVP).
2. Обирає підказку → Google віддає `place_id`, **formatted address**, **lat**, **lng** (і компоненти адреси).
3. Фронт (або бекенд) надсилає на API: `{ latitude, longitude, address_raw?, place_id? }`.
4. Бекенд:
   - зберігає `latitude`, `longitude`, PostGIS `location`;
   - `address_private` = повна адреса з Google (не для публічки);
   - `address_public` = скорочений/приблизний варіант (район + орієнтир, без номера будинку — за політикою приватності);
   - резолвить **`city_id`**: точка ∈ `cities.boundaries` (MVP: має бути Київ, інакше reject);
   - резолвить **`district_id`**: точка ∈ `districts.boundaries` цього міста; якщо полігон порожній — fallback nearest `districts.location`;
   - зберігає об’єкт уже з `city_id`, `district_id`, координатами.

Публічний користувач на каталозі **не** бачить точну адресу — лише приблизну точку / район.

### E.4 Показ карти на клієнті

- **Сторінка об’єкта:** Google Map з **приблизною** точкою (або jitter / центр району). Точний `address_private` не віддаємо в публічний API.
- **`/map`:** Google Map по Києву — маркери published-об’єктів, sync зі списком/фільтрами. Popup → сторінка об’єкта.
- Наші `regions` / `cities` / `districts` — джерело істини для FK і фільтрів; Google — UX вибору адреси + тайли/маркери.
- API key у `.env` (`GOOGLE_MAPS_API_KEY`), обмеження по HTTP referrer / IP.

### E.5 Інфо + технічне

- Сторінки: Про нас, Контакти, Політика, Умови (§13).
- Валідація серверна, CSRF, upload whitelist (jpg/png/webp, max size), SSL на деплої.
- Антиспам форм: throttle + honeypot.

### E.6 Критерії готовності фази E

- [ ] Autocomplete адреси через Google Places (скоуп Київ).
- [ ] Збереження об’єкта з lat/lng + резолвом `city_id` / `district_id` з наших geo-таблиць.
- [ ] Фільтр районів тягнеться з `districts` Києва, не з хардкоду HTML.
- [ ] Каталог/карта не віддають об’єкти поза Києвом.
- [ ] На `/property` і `/map` — Google Map з приблизними маркерами.
- [ ] Публічний API не віддає `address_private`.
- [ ] Повний geo-довідник у БД залишається для майбутніх міст без UI в MVP.

---

## 2. Модель даних (з запасом під адмінку)

### 2.1 `users`

| Поле | Тип | Примітка |
|------|-----|----------|
| id | bigint PK | |
| name | string | |
| email | string unique | |
| email_verified_at | timestamp nullable | після коду з пошти |
| password | string | обов’язковий, hashed |
| phone | string nullable | |
| city | string nullable / або `city_id` FK | default Київ; краще FK на `cities` |
| is_tenant | bool | default true |
| is_landlord | bool | default false |
| is_admin | bool | **запас під адмінку**, UI не будуємо |
| remember_token | string nullable | |
| last_login_at | timestamp nullable | |
| timestamps / softDeletes | | soft delete — запас |

### 2.2 `email_verification_codes`

| Поле | Тип |
|------|-----|
| id | bigint |
| email | string index |
| code_hash | string |
| purpose | string (`register`, `email_change`, `password_reset`) |
| attempts | int |
| expires_at | timestamp |
| consumed_at | timestamp nullable |
| ip | string nullable |
| timestamps | |

### 2.3 `properties`

| Поле | Тип | Примітка |
|------|-----|----------|
| id | bigint | |
| slug | string unique | публічний id як у прототипі |
| title | string | |
| short_description | text | |
| description | text | |
| deal | enum rent/sale | |
| type | string/enum | apartment, house, townhouse… |
| city_id | FK → cities | **MVP: завжди Київ (268)** |
| district_id | FK → districts nullable | район Києва |
| address_public | string nullable | те, що бачить гість (район / орієнтир) |
| address_private | string nullable | повна адреса з Google; **не в публічний API** |
| google_place_id | string nullable | для повторного резолву / аудиту |
| price_usd | decimal | |
| price_uah | decimal nullable | |
| rooms | int | |
| area | decimal | |
| floor | int nullable | |
| total_floors | int nullable | |
| latitude / longitude | decimal nullable | з Google Places |
| location | geography(Point,4326) nullable | PostGIS Point з тих самих lat/lng |
| status | enum | `draft`, `pending_moderation` (опційно), `published`, `hidden`, `archived` |
| is_featured | bool | |
| is_new | bool | |
| views_count | unsigned int default 0 | **аналітика / адмін** |
| owner_user_id | FK nullable | власник-клієнт |
| created_by_admin_id | FK nullable | запас |
| published_at | timestamp nullable | |
| moderated_at | timestamp nullable | запас |
| sort_order | int | |
| timestamps / softDeletes | | |

Розширені атрибути прототипу (furnished, renovation, pets, parking, balcony, building_type, developer, market_type) — окремі колонки або `jsonb attributes`. Краще колонки для фільтрів.

### 2.4 `property_images`

| Поле | Тип |
|------|-----|
| id | |
| property_id | FK |
| path | string | R2 object key |
| alt | string nullable |
| sort_order | int |
| is_cover | bool |

### 2.5 `property_views` (опційно, для анти-накрутки)

| Поле | Тип |
|------|-----|
| id | |
| property_id | FK |
| viewer_key | string | hash(session\|ip\|ua day) |
| viewed_on | date |
| unique(property_id, viewer_key, viewed_on) | |

`views_count` оновлюємо лише при новому унікальному ключі за день.

### 2.6 `saved_properties` (favorites)

`user_id`, `property_id`, unique pair, timestamps.

### 2.7 `viewing_requests`

| Поле | Тип |
|------|-----|
| id | |
| user_id | FK nullable (але в нашому MVP майже завжди є) |
| property_id | FK |
| name | string |
| phone | string |
| email | string nullable |
| preferred_date | date |
| preferred_time | time/string |
| comment | text nullable |
| status | enum (див. D.1) |
| admin_notes | text nullable | **запас під адмінку** |
| assigned_admin_id | FK nullable | запас |
| status_changed_at | timestamp nullable | |
| timestamps | |

### 2.8 `owner_listing_requests`

Аналогічно §7 + статуси D.2 + `admin_notes`, `assigned_admin_id`, `linked_property_id` nullable.

Фото заявок: `owner_listing_request_files`.

### 2.9 `manager_inquiries`

name, phone, email?, channel, message, status (`new`/`closed`), `admin_notes`, user_id nullable, timestamps.

### 2.10 Geo-довідники (уже є)

Міграції: `enable_postgis`, `regions`, `cities`, `districts`.  
Seed: повний імпорт України з `geo-fetch/` — **дані ширші за MVP**.

У клієнтському MVP читаємо лише Київ і його `districts`.  
`property_types` — окремий enum/seed у коді (не geo).

Не дублювати райони хардкодом у Blade/JS — джерело істини БД.

---

## 3. Правила доступу (клієнт)

| Дія | Гість | User |
|-----|-------|------|
| Каталог / об’єкт / карта / інфо | ✓ | ✓ |
| Записатися на перегляд | auth-gate | ✓ |
| Запропонувати об’єкт | auth-gate | ✓ |
| Питання менеджеру | ✓ (MVP) | ✓ |
| Кабінет / favorites | ✗ | ✓ |
| Бачити чужі заявки / адмін поля | ✗ | ✗ |
| Публікувати об’єкт напряму | ✗ | ✗ |

`is_admin` у БД є, маршрутів адмінки в цьому ТЗ немає.

---

## 4. Інтеграція з існуючим frontend

| Прототип | Дія |
|----------|-----|
| Модалки viewing / owner / manager | Підключити submit → API; viewing/owner через auth-gate |
| `auth.html` | Залишити пароль; додати крок email-коду + recover |
| `account.html` | Дані з API/Blade замість `accounts.json` |
| `property-editor.html` | **Фаза B:** форма landlord — Google Places + upload фото в R2 → draft у БД |
| `properties.json` | Замінити сидом БД + API/Blade |
| Контакти в коді | Винести в config; поки тестові |

Маршрути Laravel вже є (`routes/web.php`): `/`, `/catalog`, `/map`, `/property`, `/auth`, `/account`, `/property-editor`.

---

## 5. Поза скоупом клієнтського MVP (але схема готова)

- UI адмінки / CRM (§9–11)
- Зміна статусів заявок менеджером
- Повна аналітика-дашборд (§12) — лише `views_count` + заявки в БД
- **Інші міста України** (довідник уже в БД через geo-fetch, UI/скоуп — після MVP)
- AI, call-центр, інвестиційні метрики, платежі
- Мобільна окрема версія (адаптив існуючого CSS — за можливості)

---

## 6. Відкриті рішення (зафіксувати перед/під час A)

1. **SMTP** для кодів: Mailtrap на dev, прод-провайдер?
2. Чи обов’язкова роль на реєстрації, чи default `tenant` і роль додається пізніше?
3. Чи manager-форма теж за auth-gate?
4. Валюта відображення: USD primary як у прототипі?
5. Google Maps: квоти / billing на Places Autocomplete + Maps JS (ключ уже потрібен у фазі B).
6. Наскільки «розмивати» публічну точку на карті (точний pin vs центр району / jitter).
7. R2: public bucket vs signed URLs для фото в каталозі.

---

## 7. Чеклист старту розробки (зараз)

1. Міграції: `users` (password + email verify + ролі + `is_admin`), `email_verification_codes`.
2. Mail + register/login + `VerifyCode` / resend / password reset.
3. Auth UI: сторінка (пароль + код) + модалка gate.
4. Підвісити gate на `data-modal-open="viewing-modal"` і `owner-modal`.
5. Потім фаза B (кабінет), далі C→D→E (карта лише Київ на базі geo-таблиць).

---

*Останнє оновлення: 2026-07-26. Джерело: клієнтське «ТЗ для MVP», прототип frontend, geo-міграції, Google Places → lat/lng → city_id/district_id; MVP = Київ; auth = пароль + email-код; без адмін UI.*
