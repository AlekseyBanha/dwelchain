import { initDialogs, mountChrome, renderPropertyCard } from './components.js?v=20260726-selects3';
import { dataLoadError, formatUsd, properties, propertyTypes } from './data.js?v=20260725-accounts1';
import { initAuthPage, logout } from './auth.js?v=20260726-selects3';

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

const accountNavIcons = {
  overview: 'icon-overview',
  offer: 'icon-add-property',
  properties: 'icon-properties',
  saved: 'icon-properties',
  requests: 'icon-requests',
  viewings: 'icon-requests',
  profile: 'icon-profile'
};

function accountNavIcon(key) {
  const id = accountNavIcons[key] || 'icon-overview';
  return `<span aria-hidden="true"><svg class="account-nav__icon" width="18" height="18" focusable="false"><use href="#${id}"></use></svg></span>`;
}

function accountNavigation(role, view) {
  const items = role === 'tenant'
    ? [['overview', 'Огляд'], ['saved', 'Збережені об’єкти'], ['viewings', 'Мої перегляди'], ['profile', 'Профіль']]
    : [['overview', 'Огляд'], ['offer', 'Запропонувати об’єкт'], ['properties', 'Мої об’єкти'], ['requests', 'Заявки клієнтів'], ['profile', 'Профіль']];
  return items.map(([key, label]) => `<a class="${view === key ? 'is-active' : ''}" href="/account?role=${role}&view=${key}" ${view === key ? 'aria-current="page"' : ''}>${accountNavIcon(key)}${label}</a>`).join('');
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
  const rolesLabel = [
    profile.is_tenant || role === 'tenant' ? 'Орендар' : null,
    profile.is_landlord || role === 'landlord' ? 'Орендодавець' : null
  ].filter(Boolean).join(' · ') || (role === 'tenant' ? 'Орендар' : 'Орендодавець');
  return `<form class="portal-form account-profile-form" data-portal-form novalidate><div class="form-grid">${field('Ім’я та прізвище', `<input name="name" autocomplete="name" value="${profile.name || ''}" aria-describedby="profile-name-error" required>`, 'profile-name')}${field('Телефон', `<input name="phone" type="tel" autocomplete="tel" value="${profile.phone || ''}" aria-describedby="profile-phone-error" required>`, 'profile-phone')}${field('Email', `<input name="email" type="email" autocomplete="email" value="${profile.email || ''}" aria-describedby="profile-email-error" required>`, 'profile-email')}${field('Місто', `<select name="city" aria-describedby="profile-city-error" required><option>${profile.city || 'Київ'}</option></select>`, 'profile-city')}</div>${field('Роль у системі', `<input value="${rolesLabel}" readonly>`, 'profile-role')}<p class="portal-form-status" data-form-status tabindex="-1" aria-live="polite"></p><button class="button button--primary" type="submit">Зберегти зміни</button></form>`;
}

function offerForm(profile) {
  return `<form class="portal-form account-offer-form" data-portal-form novalidate>
    <div class="form-grid">
      ${field('Ім’я', `<input name="name" autocomplete="name" value="${profile.name || ''}" required>`, 'offer-name')}
      ${field('Телефон', `<input name="phone" type="tel" autocomplete="tel" value="${profile.phone || ''}" placeholder="+380 00 000 00 00" required>`, 'offer-phone')}
      ${field('Email — за бажанням', `<input name="email" type="email" autocomplete="email" value="${profile.email || ''}" placeholder="name@example.com">`, 'offer-email')}
      ${field('Тип угоди', '<select name="deal" required><option value="">Оберіть</option><option>Продаж</option><option>Оренда</option></select>', 'offer-deal')}
      ${field('Тип нерухомості', '<select name="type" required><option value="">Оберіть</option><option>Квартира</option><option>Будинок</option></select>', 'offer-type')}
      ${field('Район або орієнтовна адреса', '<input name="location" required>', 'offer-location')}
      ${field('Орієнтовна ціна, $', '<input name="price" type="number" min="0" placeholder="Наприклад, 250 000">', 'offer-price')}
    </div>
    ${field('Короткий опис — за бажанням', '<textarea name="description" rows="3" maxlength="1000"></textarea>', 'offer-description')}
    <label class="file-upload"><input type="file" name="photos" accept="image/*" multiple><span><b>Додати фотографії</b><small data-file-status>Файли залишаються тільки у браузері й не надсилаються</small></span></label>
    <p class="portal-form-status" data-form-status tabindex="-1" aria-live="polite"></p>
    <button class="button button--primary" type="submit">Надіслати пропозицію</button>
  </form>`;
}

function renderOwnerProperties(items) {
  return `<div class="owner-property-list">${items.map(item => `<article class="owner-property-row"><a class="owner-property-row__image" href="/property?id=${item.id}">${item.image ? `<img src="${item.image}" alt="${item.imageAlt || item.title}">` : '<span class="property-card__placeholder"><b>D</b><small>Фото ще не додано</small></span>'}</a><div><div class="owner-property-row__meta"><span>${item.deal === 'rent' ? 'Оренда' : 'Купівля'}</span>${statusBadge('Активне')}</div><h3><a href="/property?id=${item.id}">${item.title}</a></h3><p>${item.district} · ${propertyTypes[item.type] || 'Нерухомість'}</p><strong>${formatUsd(item.priceUsd)}${item.deal === 'rent' ? '<small> на місяць</small>' : ''}</strong></div><div class="owner-property-row__actions"><a class="button button--primary" href="/property-editor?id=${item.id}">Редагувати</a><a class="text-link" href="/property?id=${item.id}">Переглянути <span>→</span></a></div></article>`).join('')}</div>`;
}

function renderAccountContent(role, view, data, forceState) {
  const profile = data[role];
  if (forceState === 'error') return `<div class="portal-state portal-state--error"><span>!</span><h2>Не вдалося відкрити розділ</h2><p>Це демонстраційний error state кабінету.</p><a class="button button--primary" href="/account?role=${role}&view=${view}">Спробувати ще раз</a></div>`;
  if (view === 'profile') return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Налаштування</p><h1>Профіль користувача</h1><p>Контактні дані для майбутньої роботи із заявками.</p></div></header>${profileForm(profile, role)}`;
  if (role === 'landlord' && view === 'offer') {
    return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Розміщення об’єкта</p><h1>Запропонувати об’єкт</h1><p>Заповніть основні відомості. Менеджер допоможе уточнити дані перед публікацією.</p></div></header>${offerForm(profile)}`;
  }
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
    return `<header class="account-content__header"><div><p class="eyebrow"><span></span> Керування</p><h1>Мої об’єкти</h1><p>Опубліковані та підготовлені оголошення орендодавця.</p></div><a class="button button--primary" href="/account?role=landlord&view=offer">Запропонувати об’єкт</a></header>${items.length ? renderOwnerProperties(items) : emptyAccountState('Об’єктів ще немає', 'Надішліть пропозицію — менеджер допоможе з розміщенням.', '<a class="button button--primary" href="/account?role=landlord&view=offer">Запропонувати об’єкт</a>')}`;
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
  return `<header class="account-content__header account-content__header--welcome"><div><p class="eyebrow"><span></span> Кабінет орендодавця</p><h1>Вітаємо, ${profile.name.split(' ')[0]}</h1><p>Керуйте оголошеннями й переглядайте нові звернення щодо оренди.</p></div><a class="button button--primary" href="/account?role=landlord&view=offer">Запропонувати об’єкт</a></header>${statCards([[ownerItems.length, 'Мої об’єкти', 'активні оголошення'], [profile.requests.filter(item => /нова/i.test(item.status)).length, 'Нова заявка', 'потребує перегляду'], [profile.requests.length, 'Усі звернення', 'за тестовий період']])}<div class="account-columns"><section class="account-panel"><header><div><span>Оголошення</span><h2>Активні об’єкти</h2></div><a href="/account?role=landlord&view=properties">Керувати →</a></header>${renderOwnerProperties(ownerItems.slice(0, 1))}</section><section class="account-panel"><header><div><span>Клієнти</span><h2>Останні заявки</h2></div><a href="/account?role=landlord&view=requests">Переглянути всі →</a></header>${renderRequests(profile.requests.slice(0, 2))}</section></div>`;
}

async function renderAccount() {
  const root = document.getElementById('account-root');
  const authUser = window.Dwelchain?.user;
  if (!window.Dwelchain?.authenticated || !authUser) {
    window.location.replace('/auth?mode=login');
    return;
  }

  const isTenant = Boolean(authUser.is_tenant);
  const isLandlord = Boolean(authUser.is_landlord);
  const requestedView = params.get('view');

  // UI-режим кабінету (як у прототипі): перемикач завжди доступний.
  let role = params.get('role') === 'landlord' ? 'landlord' : 'tenant';
  if (requestedView === 'offer') {
    role = 'landlord';
  }

  const allowedViews = role === 'tenant'
    ? ['overview', 'saved', 'viewings', 'profile']
    : ['overview', 'offer', 'properties', 'requests', 'profile'];
  const view = allowedViews.includes(requestedView) ? requestedView : 'overview';
  const forceState = ['empty', 'error'].includes(params.get('state')) ? params.get('state') : '';
  setMeta(role === 'tenant' ? 'Кабінет орендаря' : 'Кабінет орендодавця', 'Особистий кабінет Dwelchain.');

  try {
    const data = await loadAccounts();
    const demoProfile = data[role] || data.tenant || data.landlord;
    const profile = {
      ...demoProfile,
      name: authUser.name || demoProfile?.name || 'Користувач',
      phone: authUser.phone || demoProfile?.phone || '',
      email: authUser.email || demoProfile?.email || '',
      city: authUser.city || demoProfile?.city || 'Київ',
      is_tenant: isTenant,
      is_landlord: isLandlord,
      savedPropertyIds: demoProfile?.savedPropertyIds || [],
      viewings: demoProfile?.viewings || [],
      propertyIds: demoProfile?.propertyIds || [],
      requests: demoProfile?.requests || []
    };
    data[role] = profile;

    const initials = profile.name.split(' ').map(part => part[0]).filter(Boolean).slice(0, 2).join('') || 'D';
    const roleSwitch = `<div class="account-role-switch" aria-label="Перемикання ролі"><a class="${role === 'tenant' ? 'is-active' : ''}" href="/account?role=tenant">Орендар</a><a class="${role === 'landlord' ? 'is-active' : ''}" href="/account?role=landlord">Орендодавець</a></div>`;
    const roleLabel = role === 'tenant' ? 'Орендар' : 'Орендодавець';

    root.innerHTML = `<div class="account-shell"><aside class="account-sidebar"><div class="account-user"><span>${initials}</span><div><strong>${profile.name}</strong><small>${roleLabel}</small></div></div>${roleSwitch}<nav class="account-nav" aria-label="Розділи особистого кабінету">${accountNavigation(role, view)}</nav><button class="account-logout" type="button" data-account-logout>Вийти</button></aside><section class="account-content">${renderAccountContent(role, view, data, forceState)}</section></div>`;
    root.querySelector('[data-account-logout]')?.addEventListener('click', () => logout());
    root.querySelectorAll('[data-portal-form]').forEach(form => {
      const isOffer = form.classList.contains('account-offer-form');
      bindPortalForm(form, isOffer
        ? '<strong>Пропозицію підготовлено.</strong><span>У наступній фазі вона зберігатиметься в базі для менеджера.</span>'
        : '<strong>Зміни підготовлено.</strong><span>У цій версії дані профілю ще не зберігаються на сервері.</span>');
    });
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

if (portalPage === 'auth') initAuthPage();
if (portalPage === 'account') renderAccount();
if (portalPage === 'property-editor') renderPropertyEditor();
