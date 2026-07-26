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
| **B** | Особистий кабінет | Профіль, збережене, заявки користувача |
| **C** | Каталог + об’єкт + фільтри | Публічний контент з БД |
| **D** | Заявки (перегляд / власник / менеджер) | Форми пишуть у БД |
| **E** | Карта + інфо-сторінки + захист/антиспам | Доведення клієнтського MVP |

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

- [ ] Гість на «Записатися на перегляд» / «Запропонувати об’єкт» бачить auth-gate.
- [ ] Реєстрація з паролем надсилає код на пошту; без коду повний доступ не дається.
- [ ] Вхід email + пароль відкриває сесію для підтвердженого акаунта.
- [ ] Непідтверджений email при логіні потрапляє на крок коду.
- [ ] Recover пароля працює (лист + новий пароль).
- [ ] Після логіну resume відкриває потрібну бізнес-модалку.
- [ ] Авторизований одразу бачить бізнес-форму.
- [ ] Rate limit і TTL коду працюють.
- [ ] Невалідний/прострочений код і невірний пароль показують зрозумілі помилки.

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
| Огляд | Заявки власника, «мої» об’єкти (якщо вже прив’язані) |
| Мої об’єкти | Список `properties` де `owner_user_id = me` (публікація лише через менеджера/адміна пізніше) |
| Заявки клієнтів | **Не клієнтська CRM.** У MVP або приховати, або показувати лише агрегований статус «менеджер працює» без повного CRM. Повна обробка — в адмінці (поза скоупом UI). |
| Профіль | Як у tenant |

`property-editor.html` у клієнтському MVP: **не дає публікувати напряму**. Може бути чернеткою / заявкою власника; фінальна публікація — адмін (схема БД вже готова).

### B.3 Критерії готовності фази B

- [ ] `/account` доступний лише авторизованим (редирект на auth).
- [ ] Профіль зберігається в БД.
- [ ] Favorites працюють.
- [ ] Список власних заявок на перегляд відображається зі статусами з БД.
- [ ] Перемикач ролей tenant/landlord працює, якщо обидві увімкнені.

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
- district  
- property type  
- rooms  
- price min / max  

Розширені фільтри з прототипу — підключати якщо поля вже в БД; не блокують MVP.

### C.4 Сторінка об’єкта

Галерея, атрибути (ціна, район/приблизна адреса, кімнати, площа, поверх, поверховість, тип), опис, карта (приблизна), CTA перегляд + менеджер.

При відкритті сторінки: інкремент `properties.views_count` (ідемпотентність по сесії/IP на день — бажано одразу, щоб аналітика не роздувалась).

Лише `status = published` і не `hidden`/`archived`.

---

## Фаза D — Заявки

### D.1 Заявка на перегляд (§6)

Поля: ім’я, телефон, email (optional якщо вже в профілі), дата, час, коментар, `property_id`.

- Тільки для авторизованих (фаза A).
- Prefill з профілю.
- Статуси (для адмінки, клієнт бачить read-only):  
  `new` → `contacted` → `confirmed` → `rescheduled` → `completed` | `cancelled`

### D.2 Заявка власника (§7)

Поля: ім’я, телефон, email?, deal, type, district/address, price estimate, short description, photos (якщо погодимо upload).

- Тільки для авторизованих.
- **Не публікує** об’єкт автоматично.
- Статуси:  
  `new` → `contacted` → `meeting_planned` → `verifying` → `property_created` → `published` | `rejected` | `closed`

### D.3 Питання менеджеру (§8)

Поля: ім’я, телефон, питання, зручний канал (+ optional email).  
Кнопки tel / Telegram / Viber / WhatsApp / email з конфігу.

Антиспам: throttle + honeypot (+ опційно Turnstile пізніше).

---

## Фаза E — Карта, інфо, технічне

- Карта на сторінці об’єкта (координати approx; точна адреса не публічна).
- Окрема `/map` з прототипу — якщо час дозволяє в тому ж MVP.
- Сторінки: Про нас, Контакти, Політика, Умови (§13).
- Валідація серверна, CSRF, upload whitelist (jpg/png/webp, max size), SSL на деплої.

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
| city | string nullable | default Київ |
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
| district | string | |
| address_public | string nullable | приблизна |
| address_private | string nullable | **тільки адмін** |
| city | string | |
| price_usd | decimal | |
| price_uah | decimal nullable | |
| rooms | int | |
| area | decimal | |
| floor | int nullable | |
| total_floors | int nullable | |
| lat / lng | decimal nullable | approx для карти |
| status | enum | `draft`, `published`, `hidden`, `archived` |
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
| path | string |
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

### 2.10 Довідники (пізніше або seed)

districts, property_types — можна спочатку enum/seed у коді.

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
| `properties.json` | Замінити сидом БД + API/Blade |
| `property-editor.html` | Або зв’язати з owner request, або сховати до фази D |
| Контакти в коді | Винести в config; поки тестові |

Маршрути Laravel вже є (`routes/web.php`): `/`, `/catalog`, `/map`, `/property`, `/auth`, `/account`, `/property-editor`.

---

## 5. Поза скоупом клієнтського MVP (але схема готова)

- UI адмінки / CRM (§9–11)
- Зміна статусів заявок менеджером
- Повна аналітика-дашборд (§12) — лише `views_count` + заявки в БД
- AI, call-центр, інвестиційні метрики, платежі
- Мобільна окрема версія (адаптив існуючого CSS — за можливості)

---

## 6. Відкриті рішення (зафіксувати перед/під час A)

1. **SMTP** для кодів: Mailtrap на dev, прод-провайдер?
2. Чи обов’язкова роль на реєстрації, чи default `tenant` і роль додається пізніше?
3. Чи manager-форма теж за auth-gate?
4. Чи upload фото в заявці власника в першому релізі?
5. Валюта відображення: USD primary як у прототипі?

---

## 7. Чеклист старту розробки (зараз)

1. Міграції: `users` (password + email verify + ролі + `is_admin`), `email_verification_codes`.
2. Mail + register/login + `VerifyCode` / resend / password reset.
3. Auth UI: сторінка (пароль + код) + модалка gate.
4. Підвісити gate на `data-modal-open="viewing-modal"` і `owner-modal`.
5. Потім фаза B (кабінет), далі C→D→E.

---

*Останнє оновлення: 2026-07-26. Джерело: клієнтське «ТЗ для MVP», прототип frontend, уточнення: auth = пароль + email-код; порядок auth → кабінет → решта; без адмін UI.*
