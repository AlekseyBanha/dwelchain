import { initDialogs, mountChrome, renderPropertyCard } from './components.js?v=20260725-investors1';
import { dataLoadError, formatUsd, properties, propertyTypes } from './data.js?v=20260725-accounts1';

mountChrome();
initDialogs();

const portalPage = document.body.dataset.portalPage;
const params = new URLSearchParams(location.search);

function setMeta(title, description) {
  document.title = `${title} | Dwelchain`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}

function field(label, input, id, className = '') {
  return `<label class="field ${className}"><span>${label}</span>${input}<small class="field-error" id="${id}-error" data-field-error></small></label>`;
}

function setFieldError(input, message = '') {
  input.toggleAttribute('aria-invalid', Boolean(message));
  const error = input.closest('.field, .portal-choice')?.querySelector('[data-field-error]');
  if (error) error.textContent = message;
}

function validatePortalField(input, form) {
  const value = input.type === 'checkbox' ? input.checked : input.value.trim();
  let message = '';
  if (input.required && !value) message = input.type === 'checkbox' ? 'Підтвердьте цей пункт.' : 'Заповніть поле.';
  if (!message && input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Вкажіть коректний email.';
  if (!message && input.type === 'tel' && value && value.replace(/\D/g, '').length < 10) message = 'Вкажіть телефон щонайменше з 10 цифр.';
  if (!message && input.name === 'password' && value.length < 8) message = 'Пароль має містити щонайменше 8 символів.';
  if (!message && input.name === 'passwordConfirm' && value !== form.elements.password?.value) message = 'Паролі не збігаються.';
  if (!message && input.type === 'number' && value && input.min !== '' && Number(value) < Number(input.min)) message = `Мінімальне значення — ${input.min}.`;
  setFieldError(input, message);
  return !message;
}

function bindPortalForm(form, successContent) {
  const inputs = [...form.querySelectorAll('input, select, textarea')].filter(input => input.type !== 'file');
  inputs.forEach(input => {
    const eventName = input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input';
    input.addEventListener(eventName, () => setFieldError(input));
  });
  form.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', () => {
      const status = input.closest('.file-upload')?.querySelector('[data-file-status]');
      if (status) status.textContent = input.files.length ? `Обрано файлів: ${input.files.length}. У прототипі вони не завантажуються.` : 'Файли залишаються у браузері й не завантажуються';
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = inputs.filter(input => !validatePortalField(input, form));
    const message = form.querySelector('[data-form-status]');
    if (invalid.length) {
      message.className = 'portal-form-status is-error';
      message.textContent = 'Перевірте позначені поля.';
      invalid[0].focus();
      return;
    }
    message.className = 'portal-form-status is-success';
    message.innerHTML = typeof successContent === 'function' ? successContent(form) : successContent;
    message.focus({ preventScroll: true });
  });
}

function renderAuth() {
  const root = document.getElementById('auth-root');
  const mode = ['login', 'register', 'recover'].includes(params.get('mode')) ? params.get('mode') : 'login';
  const titles = {
    login: ['Вхід до кабінету', 'Увійдіть, щоб переглянути персональний простір Dwelchain.'],
    register: ['Створити кабінет', 'Оберіть роль і заповніть основні контактні дані.'],
    recover: ['Відновити доступ', 'Вкажіть email, який буде пов’язаний із вашим кабінетом.']
  };
  setMeta(titles[mode][0], `${titles[mode][1]} Демонстраційний frontend без реальної авторизації.`);
  const authNav = `<nav class="auth-tabs" aria-label="Вхід і реєстрація"><a class="${mode === 'login' ? 'is-active' : ''}" href="/auth?mode=login" ${mode === 'login' ? 'aria-current="page"' : ''}>Вхід</a><a class="${mode === 'register' ? 'is-active' : ''}" href="/auth?mode=register" ${mode === 'register' ? 'aria-current="page"' : ''}>Реєстрація</a></nav>`;
  let content = '';
  if (mode === 'login') {
    content = `<p class="eyebrow"><span></span> Особистий кабінет</p><h2>Увійти</h2><p class="auth-card__lead">Введіть дані та оберіть свою роль.</p><form class="portal-form" data-portal-form novalidate><fieldset class="role-picker"><legend>Увійти як</legend><label><input type="radio" name="role" value="tenant" checked><span><b>Орендар</b><small>Шукаю житло та планую перегляди</small></span></label><label><input type="radio" name="role" value="landlord"><span><b>Орендодавець</b><small>Керую власними об’єктами</small></span></label></fieldset>${field('Email', '<input name="email" type="email" autocomplete="email" placeholder="name@example.com" aria-describedby="auth-email-error" required>', 'auth-email')}${field('Пароль', '<input name="password" type="password" autocomplete="current-password" placeholder="Щонайменше 8 символів" aria-describedby="auth-password-error" required>', 'auth-password')}<div class="auth-form__meta"><label class="checkbox-field"><input type="checkbox" name="remember"><span>Запам’ятати мене</span></label><a href="/auth?mode=recover">Забули пароль?</a></div><p class="portal-form-status" data-form-status tabindex="-1" aria-live="polite"></p><button class="button button--primary button--full" type="submit">Увійти</button></form>`;
  }
  if (mode === 'register') {
    content = `<p class="eyebrow"><span></span> Новий користувач</p><h2>Створити кабінет</h2><p class="auth-card__lead">Спочатку оберіть, як ви плануєте користуватися платформою.</p><form class="portal-form" data-portal-form novalidate><fieldset class="role-picker"><legend>Оберіть роль</legend><label><input type="radio" name="role" value="tenant" checked><span><b>Орендар</b><small>Шукаю житло та планую перегляди</small></span></label><label><input type="radio" name="role" value="landlord"><span><b>Орендодавець</b><small>Розміщую та контролюю власні об’єкти</small></span></label></fieldset><div class="form-grid">${field('Ім’я та прізвище', '<input name="name" autocomplete="name" aria-describedby="register-name-error" required>', 'register-name')}${field('Телефон', '<input name="phone" type="tel" autocomplete="tel" placeholder="+380 00 000 00 00" aria-describedby="register-phone-error" required>', 'register-phone')}${field('Email', '<input name="email" type="email" autocomplete="email" placeholder="name@example.com" aria-describedby="register-email-error" required>', 'register-email')}${field('Місто', '<select name="city" aria-describedby="register-city-error" required><option value="Київ">Київ</option></select>', 'register-city')}${field('Пароль', '<input name="password" type="password" autocomplete="new-password" placeholder="Щонайменше 8 символів" aria-describedby="register-password-error" required>', 'register-password')}${field('Повторіть пароль', '<input name="passwordConfirm" type="password" autocomplete="new-password" aria-describedby="register-password-confirm-error" required>', 'register-password-confirm')}</div><p class="portal-form-status" data-form-status tabindex="-1" aria-live="polite"></p><button class="button button--primary button--full" type="submit">Створити кабінет</button></form>`;
  }
  if (mode === 'recover') {
    content = `<a class="auth-back" href="/auth?mode=login">← Повернутися до входу</a><p class="eyebrow"><span></span> Відновлення доступу</p><h2>Відновити пароль</h2><p class="auth-card__lead">У робочій версії на цей email буде надіслано інструкцію.</p><form class="portal-form" data-portal-form novalidate>${field('Email', '<input name="email" type="email" autocomplete="email" placeholder="name@example.com" aria-describedby="recover-email-error" required>', 'recover-email')}<p class="portal-form-status" data-form-status tabindex="-1" aria-live="polite"></p><button class="button button--primary button--full" type="submit">Отримати інструкцію</button></form>`;
  }
  root.innerHTML = `${authNav}${content}`;
  const form = root.querySelector('[data-portal-form]');
  bindPortalForm(form, currentForm => {
    if (mode === 'recover') return '<strong>Форму заповнено.</strong><span>У цій версії прототипу лист не надсилається.</span>';
    const role = new FormData(currentForm).get('role') === 'landlord' ? 'landlord' : 'tenant';
    const label = role === 'landlord' ? 'орендодавця' : 'орендаря';
    window.location.assign(`/account?role=${role}`);
    return `<strong>Відкриваємо кабінет ${label}…</strong>`;
  });
}

async function loadAccounts() {
  return fetch(new URL('../data/accounts.json', import.meta.url), { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Не вдалося завантажити кабінет: ${response.status}`);
      return response.json();
    });
}

function getProperty(id) {
  return properties.find(item => item.id === id);
}

function statusClass(status) {
  if (/заверш/i.test(status)) return 'is-complete';
  if (/нова/i.test(status)) return 'is-new';
  return 'is-pending';
}

function statusBadge(status) {
  return `<span class="account-status ${statusClass(status)}">${status}</span>`;
}

function accountNavigation(role, view) {
  const items = role === 'tenant'
    ? [['overview', 'Огляд'], ['saved', 'Збережені об’єкти'], ['viewings', 'Мої перегляди'], ['profile', 'Профіль']]
    : [['overview', 'Огляд'], ['properties', 'Мої об’єкти'], ['requests', 'Заявки клієнтів'], ['profile', 'Профіль']];
  return items.map(([key, label]) => `<a class="${view === key ? 'is-active' : ''}" href="/account?role=${role}&view=${key}" ${view === key ? 'aria-current="page"' : ''}><span aria-hidden="true">${key === 'overview' ? '◇' : key === 'profile' ? '○' : key === 'requests' || key === 'viewings' ? '□' : '▦'}</span>${label}</a>`).join('');
}

function statCards(stats) {
  return `<div class="account-stats">${stats.map(([value, label, note]) => `<article><strong>${value}</strong><span>${label}</span><small>${note}</small></article>`).join('')}</div>`;
}

function renderViewings(viewings) {
  return `<div class="account-table" role="table" aria-label="Перегляди"><div class="account-table__row account-table__head" role="row"><span>Об’єкт</span><span>Дата і час</span><span>Статус</span><span></span></div>${viewings.map(item => { const property = getProperty(item.propertyId); return `<div class="account-table__row" role="row"><div><b>${property?.title || 'Об’єкт недоступний'}</b><small>${property?.district || 'Район уточнюється'}</small></div><div><b>${item.date}</b><small>${item.time}</small></div><div>${statusBadge(item.status)}</div><a href="/property?id=${item.propertyId}">Переглянути →</a></div>`; }).join('')}</div>`;
}

function renderRequests(requests) {
  return `<div class="account-table account-table--requests" role="table" aria-label="Заявки клієнтів"><div class="account-table__row account-table__head" role="row"><span>Заявка</span><span>Об’єкт</span><span>Клієнт</span><span>Статус</span></div>${requests.map(item => { const property = getProperty(item.propertyId); return `<div class="account-table__row" role="row"><div><b>${item.id}</b><small>${item.date} · ${item.channel}</small></div><div><a href="/property?id=${item.propertyId}">${property?.title || 'Об’єкт недоступний'}</a><small>${property?.district || ''}</small></div><div><b>${item.client}</b><small>Контакт у робочій версії</small></div><div>${statusBadge(item.status)}</div></div>`; }).join('')}</div>`;
}

function emptyAccountState(title, copy, action = '') {
  return `<div class="portal-state"><span>◇</span><h2>${title}</h2><p>${copy}</p>${action}</div>`;
}

function profileForm(profile, role) {
  return `<form class="portal-form account-profile-form" data-portal-form novalidate><div class="form-grid">${field('Ім’я та прізвище', `<input name="name" autocomplete="name" value="${profile.name}" aria-describedby="profile-name-error" required>`, 'profile-name')}${field('Телефон', `<input name="phone" type="tel" autocomplete="tel" value="${profile.phone}" aria-describedby="profile-phone-error" required>`, 'profile-phone')}${field('Email', `<input name="email" type="email" autocomplete="email" value="${profile.email}" aria-describedby="profile-email-error" required>`, 'profile-email')}${field('Місто', `<select name="city" aria-describedby="profile-city-error" required><option>${profile.city}</option></select>`, 'profile-city')}</div>${field('Роль у системі', `<input value="${role === 'tenant' ? 'Орендар' : 'Орендодавець'}" readonly>`, 'profile-role')}<p class="portal-form-status" data-form-status tabindex="-1" aria-live="polite"></p><button class="button button--primary" type="submit">Зберегти зміни</button></form>`;
}

function renderOwnerProperties(items) {
  return `<div class="owner-property-list">${items.map(item => `<article class="owner-property-row"><a class="owner-property-row__image" href="/property?id=${item.id}">${item.image ? `<img src="${item.image}" alt="${item.imageAlt || item.title}">` : '<span class="property-card__placeholder"><b>D</b><small>Фото ще не додано</small></span>'}</a><div><div class="owner-property-row__meta"><span>${item.deal === 'rent' ? 'Оренда' : 'Купівля'}</span>${statusBadge('Активне')}</div><h3><a href="/property?id=${item.id}">${item.title}</a></h3><p>${item.district} · ${propertyTypes[item.type] || 'Нерухомість'}</p><strong>${formatUsd(item.priceUsd)}${item.deal === 'rent' ? '<small> на місяць</small>' : ''}</strong></div><div class="owner-property-row__actions"><a class="button button--primary" href="/property-editor?id=${item.id}">Редагувати</a><a class="text-link" href="/property?id=${item.id}">Переглянути <span>→</span></a></div></article>`).join('')}</div>`;
}

function renderAccountContent(role, view, data, forceState) {
  const profile = data[role];
  if (forceState === 'error') return `<div class="portal-state portal-state--error"><span>!</span><h2>Не вдалося відкрити розділ</h2><p>Це демонстраційний error state кабінету.</p><a class="button button--primary" href="/account?role=${role}&view=${view}">Спробувати ще раз</a></div>`;
  if (view === 'profile') return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Налаштування</p><h1>Профіль користувача</h1><p>Контактні дані для майбутньої роботи із заявками.</p></div></header>${profileForm(profile, role)}`;
  if (role === 'tenant' && view === 'saved') {
    const saved = forceState === 'empty' ? [] : profile.savedPropertyIds.map(getProperty).filter(Boolean);
    return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Ваша добірка</p><h1>Збережені об’єкти</h1><p>Поверніться до пропозицій, які хочете порівняти або переглянути.</p></div><a class="button button--primary" href="/catalog?deal=rent">Знайти об’єкти</a></header>${saved.length ? `<div class="account-property-grid">${saved.map(renderPropertyCard).join('')}</div>` : emptyAccountState('Поки що немає збережених об’єктів', 'Додайте пропозиції з каталогу до майбутньої персональної добірки.', '<a class="button button--primary" href="/catalog?deal=rent">Перейти до каталогу</a>')}`;
  }
  if (role === 'tenant' && view === 'viewings') {
    const viewings = forceState === 'empty' ? [] : profile.viewings;
    return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Планування</p><h1>Мої перегляди</h1><p>Запити на перегляд і їхній поточний демонстраційний статус.</p></div><a class="button button--primary" href="/catalog?deal=rent">Обрати об’єкт</a></header>${viewings.length ? renderViewings(viewings) : emptyAccountState('Переглядів ще немає', 'Оберіть об’єкт у каталозі та заповніть форму запису на перегляд.', '<a class="button button--primary" href="/catalog">Перейти до каталогу</a>')}`;
  }
  if (role === 'landlord' && view === 'properties') {
    const items = forceState === 'empty' ? [] : profile.propertyIds.map(getProperty).filter(Boolean);
    return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Керування</p><h1>Мої об’єкти</h1><p>Опубліковані та підготовлені оголошення орендодавця.</p></div><a class="button button--primary" href="/property-editor">Додати об’єкт</a></header>${items.length ? renderOwnerProperties(items) : emptyAccountState('Об’єктів ще немає', 'Створіть першу демонстраційну картку нерухомості.', '<a class="button button--primary" href="/property-editor">Додати об’єкт</a>')}`;
  }
  if (role === 'landlord' && view === 'requests') {
    const requests = forceState === 'empty' ? [] : profile.requests;
    return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Звернення</p><h1>Заявки клієнтів</h1><p>Запити щодо перегляду об’єктів і бажаного способу зв’язку.</p></div></header>${requests.length ? renderRequests(requests) : emptyAccountState('Нових заявок немає', 'У робочій версії тут з’являтимуться звернення щодо ваших об’єктів.')}`;
  }
  if (role === 'tenant') {
    const saved = profile.savedPropertyIds.map(getProperty).filter(Boolean).slice(0, 2);
    return `<header class="account-content__header account-content__header--welcome"><div><p class="eyebrow"><span></span> Кабінет орендаря</p><h1>Вітаємо, ${profile.name.split(' ')[0]}</h1><p>Продовжуйте пошук, переглядайте збережені пропозиції та контролюйте запити.</p></div><a class="button button--primary" href="/catalog?deal=rent">Знайти житло</a></header>${statCards([[profile.savedPropertyIds.length, 'Збережені об’єкти', 'у вашій добірці'], [profile.viewings.filter(item => !/заверш/i.test(item.status)).length, 'Майбутній перегляд', 'очікує підтвердження'], [profile.viewings.length, 'Усі запити', 'історія переглядів']])}<div class="account-columns"><section class="account-panel"><header><div><span>Найближча подія</span><h2>Запланований перегляд</h2></div><a href="/account?role=tenant&view=viewings">Усі перегляди →</a></header>${renderViewings(profile.viewings.slice(0, 1))}</section><section class="account-panel"><header><div><span>Добірка</span><h2>Збережені об’єкти</h2></div><a href="/account?role=tenant&view=saved">Переглянути всі →</a></header><div class="account-mini-list">${saved.map(item => `<a href="/property?id=${item.id}"><img src="${item.image}" alt=""><span><b>${item.title}</b><small>${item.district} · ${formatUsd(item.priceUsd)}${item.deal === 'rent' ? ' / місяць' : ''}</small></span></a>`).join('')}</div></section></div>`;
  }
  const ownerItems = profile.propertyIds.map(getProperty).filter(Boolean);
  return `<header class="account-content__header account-content__header--welcome"><div><p class="eyebrow"><span></span> Кабінет орендодавця</p><h1>Вітаємо, ${profile.name.split(' ')[0]}</h1><p>Керуйте оголошеннями й переглядайте нові звернення щодо оренди.</p></div><a class="button button--primary" href="/property-editor">Додати об’єкт</a></header>${statCards([[ownerItems.length, 'Мої об’єкти', 'активні оголошення'], [profile.requests.filter(item => /нова/i.test(item.status)).length, 'Нова заявка', 'потребує перегляду'], [profile.requests.length, 'Усі звернення', 'за тестовий період']])}<div class="account-columns"><section class="account-panel"><header><div><span>Оголошення</span><h2>Активні об’єкти</h2></div><a href="/account?role=landlord&view=properties">Керувати →</a></header>${renderOwnerProperties(ownerItems.slice(0, 1))}</section><section class="account-panel"><header><div><span>Клієнти</span><h2>Останні заявки</h2></div><a href="/account?role=landlord&view=requests">Переглянути всі →</a></header>${renderRequests(profile.requests.slice(0, 2))}</section></div>`;
}

async function renderAccount() {
  const root = document.getElementById('account-root');
  const role = params.get('role') === 'landlord' ? 'landlord' : 'tenant';
  const allowedViews = role === 'tenant' ? ['overview', 'saved', 'viewings', 'profile'] : ['overview', 'properties', 'requests', 'profile'];
  const view = allowedViews.includes(params.get('view')) ? params.get('view') : 'overview';
  const forceState = ['empty', 'error'].includes(params.get('state')) ? params.get('state') : '';
  setMeta(role === 'tenant' ? 'Кабінет орендаря' : 'Кабінет орендодавця', 'Демонстраційний особистий кабінет Dwelchain без реальної авторизації та збереження даних.');
  try {
    const data = await loadAccounts();
    const profile = data[role];
    const initials = profile.name.split(' ').map(part => part[0]).slice(0, 2).join('');
    root.innerHTML = `<div class="prototype-notice"><b>Демонстраційний кабінет</b><span>Дані не зберігаються та не надсилаються.</span></div><div class="account-shell"><aside class="account-sidebar"><div class="account-user"><span>${initials}</span><div><strong>${profile.name}</strong><small>${role === 'tenant' ? 'Орендар' : 'Орендодавець'}</small></div></div><div class="account-role-switch" aria-label="Перемикання демонстраційної ролі"><a class="${role === 'tenant' ? 'is-active' : ''}" href="/account?role=tenant">Орендар</a><a class="${role === 'landlord' ? 'is-active' : ''}" href="/account?role=landlord">Орендодавець</a></div><nav class="account-nav" aria-label="Розділи особистого кабінету">${accountNavigation(role, view)}</nav></aside><section class="account-content">${renderAccountContent(role, view, data, forceState)}</section></div>`;
    root.querySelectorAll('[data-portal-form]').forEach(form => bindPortalForm(form, '<strong>Зміни підготовлено.</strong><span>У цій версії прототипу дані не зберігаються.</span>'));
  } catch (error) {
    root.innerHTML = `<div class="portal-state portal-state--error portal-state--page"><span>!</span><h1>Не вдалося завантажити кабінет</h1><p>Перевірте локальні дані та спробуйте ще раз.</p><button class="button button--primary" type="button" data-retry>Спробувати ще раз</button></div>`;
    root.querySelector('[data-retry]').addEventListener('click', () => location.reload());
  }
}

function editorForm(item) {
  const editing = Boolean(item);
  return `<form class="portal-form property-editor-form" data-portal-form novalidate><div class="form-grid">${field('Тип угоди', `<select name="deal" aria-describedby="editor-deal-error" required><option value="">Оберіть</option><option value="rent" ${item?.deal === 'rent' ? 'selected' : ''}>Оренда</option><option value="sale" ${item?.deal === 'sale' ? 'selected' : ''}>Продаж</option></select>`, 'editor-deal')}${field('Тип нерухомості', `<select name="type" aria-describedby="editor-type-error" required><option value="">Оберіть</option><option value="apartment" ${item?.type === 'apartment' ? 'selected' : ''}>Квартира</option><option value="house" ${item?.type === 'house' ? 'selected' : ''}>Будинок / таунхаус</option></select>`, 'editor-type')}${field('Назва об’єкта', `<input name="title" value="${item?.title || ''}" placeholder="Наприклад, квартира біля Дніпра" aria-describedby="editor-title-error" required>`, 'editor-title', 'field--wide')}${field('Район', `<select name="district" aria-describedby="editor-district-error" required><option value="">Оберіть район</option>${['Печерський', 'Шевченківський', 'Подільський', 'Голосіївський', 'Оболонський', 'Солом’янський'].map(district => `<option ${item?.district === district ? 'selected' : ''}>${district}</option>`).join('')}</select>`, 'editor-district')}${field('Орієнтовна адреса', `<input name="address" value="${item?.address || ''}" placeholder="Без номера квартири" aria-describedby="editor-address-error" required>`, 'editor-address')}${field('Ціна, $', `<input name="priceUsd" type="number" min="1" value="${item?.priceUsd || ''}" placeholder="2400" aria-describedby="editor-price-error" required>`, 'editor-price')}${field('Кімнати', `<input name="rooms" type="number" min="1" value="${item?.rooms || ''}" aria-describedby="editor-rooms-error" required>`, 'editor-rooms')}${field('Площа, м²', `<input name="area" type="number" min="1" value="${item?.area || ''}" aria-describedby="editor-area-error" required>`, 'editor-area')}${field('Поверх', `<input name="floor" type="number" min="1" value="${item?.floor || ''}" aria-describedby="editor-floor-error" required>`, 'editor-floor')}${field('Поверховість', `<input name="totalFloors" type="number" min="1" value="${item?.totalFloors || ''}" aria-describedby="editor-total-floors-error" required>`, 'editor-total-floors')}</div>${field('Короткий опис', `<textarea name="short" rows="3" maxlength="220" aria-describedby="editor-short-error" required>${item?.short || ''}</textarea>`, 'editor-short')}${field('Повний опис — за бажанням', `<textarea name="description" rows="5" maxlength="1200" aria-describedby="editor-description-error">${item?.description || ''}</textarea>`, 'editor-description')}<fieldset class="editor-options"><legend>Додаткові характеристики</legend><label><input type="checkbox" name="furnished" ${item?.furnished ? 'checked' : ''}><span>Меблі</span></label><label><input type="checkbox" name="parking" ${item?.parking ? 'checked' : ''}><span>Паркінг</span></label><label><input type="checkbox" name="balcony" ${item?.balcony ? 'checked' : ''}><span>Балкон / тераса</span></label></fieldset><label class="file-upload property-editor-upload"><input type="file" name="photos" accept="image/*" multiple data-editor-files><span><b>${editing ? 'Замінити або додати фотографії' : 'Додати фотографії'}</b><small data-file-status>Файли залишаються у браузері й не завантажуються</small></span></label><p class="portal-form-status" data-form-status tabindex="-1" aria-live="polite"></p><div class="property-editor-actions"><a class="button button--secondary" href="/account?role=landlord&view=properties">Скасувати</a><button class="button button--primary" type="submit">${editing ? 'Зберегти зміни' : 'Створити об’єкт'}</button></div></form>`;
}

function renderEditorPreview(item) {
  return `<aside class="editor-preview"><span>Попередній вигляд</span><div class="editor-preview__image" data-editor-image>${item?.image ? `<img src="${item.image}" alt="${item.imageAlt || item.title}">` : '<span class="property-card__placeholder"><b>D</b><small>Фото ще не додано</small></span>'}</div><div><small data-editor-deal>${item?.deal === 'sale' ? 'Купівля' : 'Оренда'}</small><strong data-editor-title>${item?.title || 'Назва майбутнього об’єкта'}</strong><b data-editor-price>${item?.priceUsd ? formatUsd(item.priceUsd) : 'Ціна не вказана'}</b><p>Це лише локальний preview картки. Публікація не виконується.</p></div></aside>`;
}

function renderPropertyEditor() {
  const root = document.getElementById('property-editor-root');
  if (dataLoadError) {
    root.innerHTML = `<div class="portal-state portal-state--error portal-state--page"><span>!</span><h1>Не вдалося відкрити редактор</h1><p>Локальні дані об’єктів недоступні.</p><button class="button button--primary" type="button" data-retry>Спробувати ще раз</button></div>`;
    root.querySelector('[data-retry]').addEventListener('click', () => location.reload());
    return;
  }
  const item = params.get('id') ? getProperty(params.get('id')) : null;
  const editing = Boolean(item);
  setMeta(editing ? 'Редагувати об’єкт' : 'Додати об’єкт', 'Демонстраційна frontend-форма об’єкта Dwelchain без реального завантаження фотографій і збереження даних.');
  root.innerHTML = `<nav class="breadcrumbs" aria-label="Навігаційний шлях"><a href="/">Головна</a><span>·</span><a href="/account?role=landlord&view=properties">Кабінет орендодавця</a><span>·</span><span>${editing ? 'Редагування об’єкта' : 'Новий об’єкт'}</span></nav><header class="editor-header"><div><p class="eyebrow"><span></span> Кабінет орендодавця</p><h1>${editing ? 'Редагувати об’єкт' : 'Додати об’єкт'}</h1><p>Заповніть дані, які формуватимуть майбутню картку та детальну сторінку.</p></div><span>Чернетка · frontend</span></header><div class="property-editor-layout"><section class="property-editor-card"><div class="prototype-notice"><b>Демонстраційна форма</b><span>Дані й фотографії не зберігаються та не надсилаються.</span></div>${editorForm(item)}</section>${renderEditorPreview(item)}</div>`;
  const form = root.querySelector('[data-portal-form]');
  bindPortalForm(form, '<strong>Об’єкт підготовлено.</strong><span>У цій версії прототипу дані та фотографії не зберігаються.</span>');
  const syncPreview = () => {
    root.querySelector('[data-editor-title]').textContent = form.elements.title.value.trim() || 'Назва майбутнього об’єкта';
    root.querySelector('[data-editor-deal]').textContent = form.elements.deal.value === 'sale' ? 'Купівля' : 'Оренда';
    root.querySelector('[data-editor-price]').textContent = form.elements.priceUsd.value ? formatUsd(Number(form.elements.priceUsd.value)) : 'Ціна не вказана';
  };
  ['title', 'deal', 'priceUsd'].forEach(name => form.elements[name].addEventListener('input', syncPreview));
  let previewUrl = '';
  form.elements.photos.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = form.elements.photos.files[0];
    if (!file) return;
    previewUrl = URL.createObjectURL(file);
    root.querySelector('[data-editor-image]').innerHTML = `<img src="${previewUrl}" alt="Попередній перегляд обраної фотографії">`;
  });
}

if (portalPage === 'auth') renderAuth();
if (portalPage === 'account') renderAccount();
if (portalPage === 'property-editor') renderPropertyEditor();
