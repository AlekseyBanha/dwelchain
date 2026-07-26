import { formatUah, formatUsd, imageAlts, propertyTypes } from './data.js?v=20260725-accounts1';
import { authGateMarkup, goToOfferForm, openAuthGate, shouldGateModal } from './auth.js?v=20260726-selects3';
import { initSelects } from './select.js?v=20260726-selects3';

export function headerMarkup(active) {
  const cabinetHref = window.Dwelchain?.authenticated ? '/account' : '/auth';
  return `<header class="site-header"><div class="section-shell site-header__inner">
    <a class="brand" href="/" aria-label="Перейти на головну сторінку Dwelchain"><img class="brand__logo" src="/assets/images/dwelchain-logo-clean.png" alt=""></a>
    <nav class="site-nav" aria-label="Основна навігація">
      <a class="${active === 'home' ? 'is-active' : ''}" href="/">Головна</a>
      <a class="${active === 'catalog' || active === 'property' ? 'is-active' : ''}" href="/catalog">Каталог</a>
      <a class="${active === 'map' ? 'is-active' : ''}" href="/map">Карта</a>
      <a href="/#business-model">Інвесторам</a>
      <a class="${active === 'auth' || active === 'account' ? 'is-active' : ''}" href="${cabinetHref}">Кабінет</a>
    </nav>
    <div class="site-header__actions">
      <button class="button button--header" type="button" data-modal-open="manager-modal">Зв’язатися з менеджером</button>
      <button class="button button--header" type="button" data-account-offer>Запропонувати об’єкт <span aria-hidden="true">→</span></button>
    </div>
  </div></header>`;
}

export function footerMarkup() {
  // TEMPORARY PROTOTYPE CONTACTS: replace with approved client details before production.
  return `<footer class="site-footer" id="site-footer"><div class="section-shell">
    <div class="site-footer__top"><div><a class="brand brand--footer" href="/" aria-label="Перейти на головну сторінку Dwelchain"><img class="brand__logo" src="/assets/images/dwelchain-logo-clean.png" alt=""></a><p>Нерухомість для купівлі та оренди в Києві.</p></div>
    <div><strong>Навігація</strong><a href="/catalog">Каталог</a><a href="/map">Карта</a><a href="${window.Dwelchain?.authenticated ? '/account' : '/auth'}">Особистий кабінет</a><a href="/#about">Про сервіс</a><a href="/#business-model">Інвесторам</a><button class="button button--footer" type="button" data-modal-open="manager-modal">Зв’язатися з менеджером</button><button class="button button--footer" type="button" data-account-offer>Запропонувати об’єкт</button></div>
    <div><strong>Контакти</strong><a href="tel:+380441234567">+380 44 123 45 67</a><a href="mailto:hello@dwelchain.com">hello@dwelchain.com</a><span>Київ, Україна</span><span>Пн–Пт, 09:00–18:00</span><span>Telegram · Viber · WhatsApp</span></div></div>
    <div class="site-footer__bottom"><span>© 2026 Dwelchain.</span><span>Нерухомість для життя та інвестицій.</span></div>
  </div></footer>`;
}

export function renderPropertyCard(property) {
  const unit = property.deal === 'rent' ? 'на місяць' : '';
  const secondaryPrice = property.deal === 'sale'
    ? `≈ ${formatUah(property.priceUah)} · ${formatUsd(Math.round(property.priceUsd / property.area))}/м²`
    : `≈ ${formatUah(property.priceUah)} на місяць`;
  const imageAlt = property.imageAlt || imageAlts[property.image] || `Фотографія об’єкта: ${property.title}`;
  const image = property.image
    ? `<img src="${property.image}" alt="${imageAlt}" loading="lazy">`
    : '<span class="property-card__placeholder" aria-label="Фотографія об’єкта відсутня"><b>D</b><small>Фото ще не додано</small></span>';
  return `<article class="property-card">
    <a class="property-card__image" href="/property?id=${property.id}" aria-label="Переглянути об’єкт: ${property.title}">
      ${image}
      <span class="badge badge--image">${property.deal === 'sale' ? 'Купівля' : 'Оренда'}</span>
      ${property.isNew ? '<span class="badge badge--new">Нове оголошення</span>' : ''}
    </a>
    <div class="property-card__body">
      <div class="property-card__price"><div><strong>${formatUsd(property.priceUsd)}</strong><span>${unit}</span></div><small>${secondaryPrice}</small></div>
      <h3><a href="/property?id=${property.id}">${property.title}</a></h3>
      <p class="property-card__location">${property.district || 'Район уточнюється'}${property.address ? ` · ${property.address}` : ''}</p>
      <div class="property-card__facts"><span><b>${property.rooms ?? '—'}</b> кімн.</span><span><b>${property.area ?? '—'}</b> м²</span><span><b>${property.floor ?? '—'}</b>${property.totalFloors ? ` / ${property.totalFloors}` : ''} поверх</span></div>
      <p class="property-card__description">${property.short}</p>
      <div class="property-card__footer"><span>${propertyTypes[property.type]}</span><a href="/property?id=${property.id}">Переглянути об’єкт <span aria-hidden="true">→</span></a></div>
    </div>
  </article>`;
}

function formField(label, input, errorId) {
  return `<label class="field"><span>${label}</span>${input}<small class="field-error" id="${errorId}" data-field-error></small></label>`;
}

export function dialogsMarkup() {
  return `<dialog class="modal" id="viewing-modal" role="dialog" aria-labelledby="viewing-title" aria-modal="true"><div class="modal__panel"><button class="modal__close" type="button" data-modal-close aria-label="Закрити форму запису на перегляд">×</button><p class="eyebrow"><span></span> Запит на перегляд</p><h2 id="viewing-title">Записатися на перегляд</h2><p class="modal__lead">Оберіть зручні дату й час. У цій версії прототипу дані не надсилаються.</p><form class="demo-form" data-demo-form novalidate>
    <div class="form-grid">${formField('Обраний об’єкт','<input id="viewing-property" name="property" value="Об’єкт буде визначено на сторінці оголошення" aria-describedby="viewing-property-error" readonly>','viewing-property-error')}${formField('Ім’я','<input id="viewing-name" name="name" autocomplete="name" aria-describedby="viewing-name-error" required>','viewing-name-error')}${formField('Телефон','<input id="viewing-phone" name="phone" type="tel" autocomplete="tel" placeholder="+380 00 000 00 00" aria-describedby="viewing-phone-error" required>','viewing-phone-error')}${formField('Email — за бажанням','<input id="viewing-email" name="email" type="email" autocomplete="email" placeholder="name@example.com" aria-describedby="viewing-email-error">','viewing-email-error')}${formField('Бажана дата','<input id="viewing-date" name="date" type="date" aria-describedby="viewing-date-error" required>','viewing-date-error')}${formField('Бажаний час','<input id="viewing-time" name="time" type="time" aria-describedby="viewing-time-error" required>','viewing-time-error')}</div>${formField('Коментар — за бажанням','<textarea id="viewing-comment" name="comment" rows="3" maxlength="600" placeholder="Наприклад, зручний час для дзвінка" aria-describedby="viewing-comment-error"></textarea>','viewing-comment-error')}<p class="form-message" aria-live="polite"></p><button class="button button--primary button--full" type="submit">Надіслати заявку</button></form></div></dialog>
  <dialog class="modal" id="manager-modal" role="dialog" aria-labelledby="manager-title" aria-modal="true"><div class="modal__panel"><button class="modal__close" type="button" data-modal-close aria-label="Закрити форму зв’язку з менеджером">×</button><p class="eyebrow"><span></span> Зв’язок із менеджером</p><h2 id="manager-title">Поставити запитання</h2><p class="modal__lead">Опишіть, що хочете уточнити. У цій версії прототипу дані не надсилаються.</p><form class="demo-form" data-demo-form novalidate><div class="form-grid">${formField('Ім’я','<input id="manager-name" name="name" autocomplete="name" aria-describedby="manager-name-error" required>','manager-name-error')}${formField('Телефон','<input id="manager-phone" name="phone" type="tel" autocomplete="tel" placeholder="+380 00 000 00 00" aria-describedby="manager-phone-error" required>','manager-phone-error')}${formField('Email — за бажанням','<input id="manager-email" name="email" type="email" autocomplete="email" placeholder="name@example.com" aria-describedby="manager-email-error">','manager-email-error')}${formField('Зручний спосіб зв’язку','<select id="manager-channel" name="channel" aria-describedby="manager-channel-error" required><option value="">Оберіть</option><option>Телефон</option><option>Telegram</option><option>Viber</option><option>WhatsApp</option><option>Email</option></select>','manager-channel-error')}</div>${formField('Запитання','<textarea id="manager-question" name="question" rows="4" maxlength="1000" placeholder="Що хочете уточнити про об’єкт?" aria-describedby="manager-question-error" required></textarea>','manager-question-error')}<p class="form-message" aria-live="polite"></p><button class="button button--primary button--full" type="submit">Надіслати запитання</button></form></div></dialog>${authGateMarkup()}`;
}

export function renderMapMock(location) {
  const district = typeof location === 'string' ? location : location?.district;
  const landmark = typeof location === 'object' ? location?.address : '';
  const coordinatesKnown = typeof location === 'string' || Number.isInteger(location?.mapPosition);
  if (!district || !coordinatesKnown) return `<div class="map-location map-location--empty"><div class="map-mock map-mock--empty" role="img" aria-label="Розташування об’єкта не вказано"><span class="map-mock__empty-mark" aria-hidden="true">D</span><p>Інформацію про розташування уточнюйте у менеджера</p></div></div>`;
  return `<div class="map-location"><p class="section-copy">${district}, Київ.${landmark ? ` Орієнтир: ${landmark}.` : ''} Точну адресу менеджер повідомить після підтвердження перегляду.</p><div class="map-mock" role="img" aria-label="Орієнтовне розташування об’єкта: ${district} район, Київ"><div class="map-mock__road map-mock__road--one"></div><div class="map-mock__road map-mock__road--two"></div><div class="map-mock__road map-mock__road--three"></div><span class="map-mock__river"></span><span class="map-mock__pin"><b>D</b></span><div class="map-mock__controls" aria-hidden="true"><span>+</span><span>−</span></div><div class="map-mock__label"><small>Приблизний район</small><strong>${district}, Київ</strong>${landmark ? `<span>${landmark}</span>` : ''}</div></div></div>`;
}

export function mountChrome() {
  const active = document.body.dataset.page;
  document.querySelectorAll('[data-site-header]').forEach(node => node.innerHTML = headerMarkup(active));
  document.querySelectorAll('[data-site-footer]').forEach(node => node.innerHTML = footerMarkup());
  document.body.insertAdjacentHTML('beforeend', dialogsMarkup());
  initSelects();
}

export function initDialogs() {
  const triggers = new WeakMap();
  const syncScrollLock = () => document.body.classList.toggle('modal-open', Boolean(document.querySelector('dialog[open]')));
  document.addEventListener('click', event => {
    const offer = event.target.closest('[data-account-offer]');
    if (offer) {
      event.preventDefault();
      goToOfferForm();
      return;
    }
    const opener = event.target.closest('[data-modal-open]');
    if (opener) {
      const modalId = opener.dataset.modalOpen;
      if (shouldGateModal(modalId)) {
        event.preventDefault();
        openAuthGate({ pendingModalId: modalId });
        return;
      }
      const dialog = document.getElementById(modalId);
      if (dialog) { triggers.set(dialog, opener); dialog.showModal(); syncScrollLock(); setTimeout(() => (dialog.querySelector('input:not([type="file"]):not([readonly]), .dc-select__trigger, select, textarea') || dialog.querySelector('button'))?.focus(), 0); }
    }
    const closer = event.target.closest('[data-modal-close]');
    if (closer) closer.closest('dialog')?.close();
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), .dc-select__trigger:not([disabled]), textarea:not([disabled]), a[href]')].filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('close', () => {
      requestAnimationFrame(syncScrollLock);
      triggers.get(dialog)?.focus();
    });
  });
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => input.min = today);
  document.querySelectorAll('[data-demo-form]').forEach(form => {
    const clearFieldError = input => {
      input.removeAttribute('aria-invalid');
      input.closest('.field')?.querySelector('[data-field-error]')?.replaceChildren();
    };
    const validateField = input => {
      clearFieldError(input);
      let text = '';
      const value = input.value.trim();
      if (input.required && !value) text = input.tagName === 'SELECT' ? 'Оберіть значення.' : 'Заповніть це поле.';
      else if (input.type === 'tel' && value.replace(/\D/g, '').length < 10) text = 'Вкажіть номер щонайменше з 10 цифр.';
      else if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) text = 'Вкажіть email у форматі name@example.com.';
      else if (input.type === 'date' && value && value < today) text = 'Оберіть сьогоднішню або майбутню дату.';
      else if (input.type === 'number' && value && Number(value) < 0) text = 'Значення не може бути від’ємним.';
      if (text) {
        input.setAttribute('aria-invalid', 'true');
        const target = input.closest('.field')?.querySelector('[data-field-error]');
        if (target) target.textContent = text;
      }
      return !text;
    };
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => clearFieldError(input));
      input.addEventListener('change', () => clearFieldError(input));
    });
    const file = form.querySelector('input[type="file"]');
    file?.addEventListener('change', () => {
      const status = form.querySelector('[data-file-status]');
      status.textContent = file.files.length ? `Вибрано файлів: ${file.files.length}. Вони не надсилатимуться.` : 'Файли залишаються тільки у браузері й не надсилаються';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const message = form.querySelector('.form-message');
      const fields = [...form.querySelectorAll('input:not([type="file"]), select, textarea')];
      const invalid = fields.filter(input => !validateField(input));
      if (invalid.length) { message.textContent = 'Перевірте виділені поля.'; message.className = 'form-message is-error'; invalid[0].focus(); return; }
      message.textContent = 'Форму заповнено. У цій версії прототипу дані не надсилаються.';
      message.className = 'form-message is-success';
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
      form.querySelectorAll('[data-field-error]').forEach(node => node.replaceChildren());
      const status = form.querySelector('[data-file-status]');
      if (status) status.textContent = 'Файли залишаються тільки у браузері й не надсилаються';
    });
  });
}
