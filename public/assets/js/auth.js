const AUTH_GATED_MODALS = new Set(['viewing-modal']);
const OFFER_ACCOUNT_URL = '/account?role=landlord&view=offer';
const PENDING_REDIRECT_KEY = 'dwelchain.pendingRedirect';
const PENDING_MODAL_KEY = 'dwelchain.pendingModal';

function boot() {
  return window.Dwelchain || {
    authenticated: false,
    user: null,
    csrfToken: document.querySelector('meta[name="csrf-token"]')?.content || '',
    routes: {
      register: '/auth/register',
      login: '/auth/login',
      verify: '/auth/email/verify',
      resend: '/auth/email/resend-code',
      forgot: '/auth/password/forgot',
      reset: '/auth/password/reset',
      logout: '/auth/logout',
      me: '/auth/me',
      account: '/account',
      auth: '/auth'
    },
    auth: {
      codeTtlMinutes: 10,
      resendCooldownSeconds: 60,
      passwordMin: 8
    }
  };
}

function setAuthState({ authenticated, user, csrfToken } = {}) {
  const state = boot();
  if (typeof authenticated === 'boolean') state.authenticated = authenticated;
  if (user !== undefined) state.user = user;
  if (csrfToken) {
    state.csrfToken = csrfToken;
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) meta.content = csrfToken;
  }
  window.Dwelchain = state;
  return state;
}

export function isAuthenticated() {
  return Boolean(boot().authenticated);
}

export function accountHomeUrl(user = boot().user) {
  if (user?.is_landlord && !user?.is_tenant) return '/account?role=landlord';
  return '/account?role=tenant';
}

export function offerAccountUrl() {
  return OFFER_ACCOUNT_URL;
}

export async function api(url, { method = 'GET', body } = {}) {
  const state = boot();
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': state.csrfToken || ''
  };

  const options = { method, headers, credentials: 'same-origin' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (data?.csrf_token) setAuthState({ csrfToken: data.csrf_token });

  if (!response.ok) {
    const error = new Error(data?.message || 'Запит не вдався.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function field(label, input, id, className = '') {
  return `<label class="field ${className}"><span>${label}</span>${input}<small class="field-error" id="${id}-error" data-field-error></small></label>`;
}

function setFieldError(input, message = '') {
  input.toggleAttribute('aria-invalid', Boolean(message));
  const error = input.closest('.field, .portal-choice')?.querySelector('[data-field-error]');
  if (error) error.textContent = message;
}

function clearFormErrors(form) {
  form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-field-error]').forEach(node => { node.textContent = ''; });
}

function applyServerErrors(form, errors = {}) {
  Object.entries(errors).forEach(([name, messages]) => {
    const input = form.elements[name] || form.elements[name === 'password' ? 'password' : name];
    if (input && typeof input !== 'string' && 'tagName' in input) {
      setFieldError(input, Array.isArray(messages) ? messages[0] : String(messages));
    }
  });
}

function validateAuthField(input, form) {
  const minPassword = boot().auth?.passwordMin || 8;
  const value = input.type === 'checkbox' ? input.checked : input.value.trim();
  let message = '';
  if (input.required && !value) message = input.type === 'checkbox' ? 'Підтвердьте цей пункт.' : 'Заповніть поле.';
  if (!message && input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Вкажіть коректний email.';
  if (!message && input.type === 'tel' && value && value.replace(/\D/g, '').length < 10) message = 'Вкажіть телефон щонайменше з 10 цифр.';
  if (!message && input.name === 'password' && value && value.length < minPassword) message = `Пароль має містити щонайменше ${minPassword} символів.`;
  if (!message && (input.name === 'password_confirmation' || input.name === 'passwordConfirm') && value !== form.elements.password?.value) message = 'Паролі не збігаються.';
  if (!message && input.name === 'code' && value && !/^\d{6}$/.test(value)) message = 'Введіть 6-значний код.';
  setFieldError(input, message);
  return !message;
}

function rolePicker(name = 'role', selected = 'tenant') {
  return `<fieldset class="role-picker"><legend>Оберіть роль</legend>
    <label><input type="radio" name="${name}" value="tenant" ${selected === 'tenant' ? 'checked' : ''}><span><b>Орендар</b><small>Шукаю житло та планую перегляди</small></span></label>
    <label><input type="radio" name="${name}" value="landlord" ${selected === 'landlord' ? 'checked' : ''}><span><b>Орендодавець</b><small>Розміщую та контролюю власні об’єкти</small></span></label>
  </fieldset>`;
}

function statusMessage(text = '', type = '') {
  return `<p class="portal-form-status ${type}" data-form-status tabindex="-1" aria-live="polite">${text}</p>`;
}

function setStatus(form, text, type = '') {
  const node = form.querySelector('[data-form-status]');
  if (!node) return;
  node.className = `portal-form-status ${type}`.trim();
  node.textContent = text;
  if (text) node.focus({ preventScroll: true });
}

function setStatusLoading(form, label = 'Обробляємо…') {
  const node = form.querySelector('[data-form-status]');
  if (!node) return;
  node.className = 'portal-form-status is-loading';
  node.innerHTML = `<span class="portal-form-status__spinner" aria-hidden="true"></span><span>${label}</span>`;
}

function setButtonLoading(button, loading, busyLabel = 'Завантаження') {
  if (!button) return;
  button.classList.toggle('is-loading', loading);
  button.disabled = loading;
  button.setAttribute('aria-busy', loading ? 'true' : 'false');
  if (loading) button.setAttribute('aria-label', busyLabel);
  else button.removeAttribute('aria-label');
}

function verifyMarkup(email, { compact = false, purpose = 'register' } = {}) {
  const lead = purpose === 'password_reset'
    ? 'Введіть код із листа та новий пароль.'
    : 'Ми надіслали 6-значний код на вашу пошту. Введіть його, щоб підтвердити email.';
  const passwordFields = purpose === 'password_reset'
    ? `${field('Новий пароль', '<input name="password" type="password" autocomplete="new-password" placeholder="Щонайменше 8 символів" required>', 'auth-new-password')}${field('Повторіть пароль', '<input name="password_confirmation" type="password" autocomplete="new-password" required>', 'auth-new-password-confirm')}`
    : '';

  return `<div class="auth-step" data-auth-step="verify">
    ${compact ? '' : '<p class="eyebrow"><span></span> Підтвердження</p>'}
    <h2>${purpose === 'password_reset' ? 'Новий пароль' : 'Код з пошти'}</h2>
    <p class="auth-card__lead">${lead}</p>
    <form class="portal-form" data-auth-form="verify" novalidate>
      <input type="hidden" name="email" value="${email}">
      <input type="hidden" name="purpose" value="${purpose}">
      ${field('Код з листа', '<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" aria-describedby="auth-code-error" required>', 'auth-code')}
      ${passwordFields}
      ${statusMessage()}
      <button class="button button--primary button--full" type="submit">${purpose === 'password_reset' ? 'Зберегти пароль' : 'Підтвердити'}</button>
      <button class="button button--secondary button--full" type="button" data-auth-resend>Надіслати код ще раз</button>
    </form>
  </div>`;
}

function loginMarkup({ compact = false } = {}) {
  return `<div class="auth-step" data-auth-step="login">
    ${compact ? '<p class="eyebrow"><span></span> Потрібен вхід</p><h2 id="auth-gate-title">Увійдіть або зареєструйтеся</h2><p class="auth-card__lead">Щоб продовжити, увійдіть або створіть кабінет.</p>' : '<p class="eyebrow"><span></span> Особистий кабінет</p><h2>Увійти</h2><p class="auth-card__lead">Введіть email і пароль.</p>'}
    <form class="portal-form" data-auth-form="login" novalidate>
      ${field('Email', '<input name="email" type="email" autocomplete="email" placeholder="name@example.com" required>', 'auth-email')}
      ${field('Пароль', '<input name="password" type="password" autocomplete="current-password" placeholder="Щонайменше 8 символів" required>', 'auth-password')}
      <div class="auth-form__meta"><label class="checkbox-field"><input type="checkbox" name="remember"><span>Запам’ятати мене</span></label><button class="auth-text-btn" type="button" data-auth-goto="recover">Забули пароль?</button></div>
      ${statusMessage()}
      <button class="button button--primary button--full" type="submit">Увійти</button>
    </form>
    <p class="auth-switch">Немає кабінету? <button type="button" data-auth-goto="register">Зареєструватися</button></p>
  </div>`;
}

function registerMarkup({ compact = false } = {}) {
  return `<div class="auth-step" data-auth-step="register">
    ${compact ? '<p class="eyebrow"><span></span> Реєстрація</p><h2>Створити кабінет</h2>' : '<p class="eyebrow"><span></span> Новий користувач</p><h2>Створити кабінет</h2>'}
    <p class="auth-card__lead">Оберіть роль і заповніть контактні дані.</p>
    <form class="portal-form" data-auth-form="register" novalidate>
      ${rolePicker()}
      <div class="form-grid">
        ${field('Ім’я та прізвище', '<input name="name" autocomplete="name" required>', 'register-name')}
        ${field('Телефон', '<input name="phone" type="tel" autocomplete="tel" placeholder="+380 00 000 00 00" required>', 'register-phone')}
        ${field('Email', '<input name="email" type="email" autocomplete="email" placeholder="name@example.com" required>', 'register-email')}
        ${field('Місто', '<select name="city" required><option value="Київ">Київ</option></select>', 'register-city')}
        ${field('Пароль', '<input name="password" type="password" autocomplete="new-password" placeholder="Щонайменше 8 символів" required>', 'register-password')}
        ${field('Повторіть пароль', '<input name="password_confirmation" type="password" autocomplete="new-password" required>', 'register-password-confirm')}
      </div>
      ${statusMessage()}
      <button class="button button--primary button--full" type="submit">Створити кабінет</button>
    </form>
    <p class="auth-switch">Уже є акаунт? <button type="button" data-auth-goto="login">Увійти</button></p>
  </div>`;
}

function recoverMarkup() {
  return `<div class="auth-step" data-auth-step="recover">
    <button class="auth-back auth-text-btn" type="button" data-auth-goto="login">← Повернутися до входу</button>
    <p class="eyebrow"><span></span> Відновлення доступу</p>
    <h2>Відновити пароль</h2>
    <p class="auth-card__lead">Вкажіть email — надішлемо код для створення нового пароля.</p>
    <form class="portal-form" data-auth-form="recover" novalidate>
      ${field('Email', '<input name="email" type="email" autocomplete="email" placeholder="name@example.com" required>', 'recover-email')}
      ${statusMessage()}
      <button class="button button--primary button--full" type="submit">Отримати код</button>
    </form>
  </div>`;
}

function afterAuthSuccess(data) {
  setAuthState({
    authenticated: true,
    user: data.user,
    csrfToken: data.csrf_token
  });

  sessionStorage.removeItem(PENDING_MODAL_KEY);

  const pendingRedirect = sessionStorage.getItem(PENDING_REDIRECT_KEY);
  sessionStorage.removeItem(PENDING_REDIRECT_KEY);

  if (pendingRedirect && pendingRedirect.startsWith('/')) {
    window.location.assign(pendingRedirect);
    return;
  }

  window.location.assign(accountHomeUrl(data.user));
}

async function handleAuthSubmit(form, root, options) {
  const type = form.dataset.authForm;
  const routes = boot().routes;
  clearFormErrors(form);
  const visible = [...form.querySelectorAll('input:not([type="hidden"]), select, textarea')];
  const invalid = visible.filter(input => input.type === 'radio' ? false : !validateAuthField(input, form));
  if (invalid.length) {
    setStatus(form, 'Перевірте позначені поля.', 'is-error');
    invalid[0].focus();
    return;
  }

  const submit = form.querySelector('[type="submit"]');
  const actions = [...form.querySelectorAll('button')];
  actions.forEach(button => {
    if (button === submit) setButtonLoading(button, true, 'Обробляємо запит');
    else button.disabled = true;
  });
  setStatusLoading(form);

  try {
    const fd = new FormData(form);
    let data;

    if (type === 'login') {
      data = await api(routes.login, {
        method: 'POST',
        body: {
          email: fd.get('email'),
          password: fd.get('password'),
          remember: fd.get('remember') === 'on'
        }
      });
    } else if (type === 'register') {
      data = await api(routes.register, {
        method: 'POST',
        body: {
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email'),
          password: fd.get('password'),
          password_confirmation: fd.get('password_confirmation'),
          role: fd.get('role') || 'tenant',
          city: fd.get('city') || 'Київ'
        }
      });
    } else if (type === 'recover') {
      data = await api(routes.forgot, {
        method: 'POST',
        body: { email: fd.get('email') }
      });
    } else if (type === 'verify') {
      const purpose = fd.get('purpose') || 'register';
      if (purpose === 'password_reset') {
        data = await api(routes.reset, {
          method: 'POST',
          body: {
            email: fd.get('email'),
            code: fd.get('code'),
            password: fd.get('password'),
            password_confirmation: fd.get('password_confirmation')
          }
        });
      } else {
        data = await api(routes.verify, {
          method: 'POST',
          body: {
            email: fd.get('email'),
            code: fd.get('code'),
            purpose: 'register'
          }
        });
      }
    }

    if (data?.status === 'verification_required' || (type === 'recover' && data?.status === 'ok')) {
      const purpose = type === 'recover' || form.elements.purpose?.value === 'password_reset'
        ? 'password_reset'
        : 'register';
      root.innerHTML = verifyMarkup(data.email || fd.get('email'), { compact: options.compact, purpose });
      bindAuthRoot(root, options);
      const nextForm = root.querySelector('[data-auth-form]');
      setStatus(nextForm, data.message || 'Код надіслано на пошту.', 'is-success');
      return;
    }

    if (data?.authenticated) {
      afterAuthSuccess(data);
      return;
    }

    setStatus(form, data?.message || 'Готово.', 'is-success');
  } catch (error) {
    const errors = error.data?.errors || {};
    applyServerErrors(form, errors);
    const first = Object.values(errors)[0];
    const message = Array.isArray(first) ? first[0] : (error.data?.message || error.message || 'Сталася помилка.');
    setStatus(form, message, 'is-error');
  } finally {
    actions.forEach(button => {
      if (button === submit) setButtonLoading(button, false);
      else button.disabled = false;
    });
  }
}

function bindAuthRoot(root, options = {}) {
  root.querySelectorAll('[data-auth-goto]').forEach(button => {
    button.addEventListener('click', () => {
      renderAuthInto(root, button.dataset.authGoto, options);
    });
  });

  root.querySelectorAll('[data-auth-form]').forEach(form => {
    form.querySelectorAll('input, select, textarea').forEach(input => {
      const eventName = input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input';
      input.addEventListener(eventName, () => setFieldError(input));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      handleAuthSubmit(form, root, options);
    });
  });

  root.querySelectorAll('[data-auth-resend]').forEach(button => {
    button.addEventListener('click', async () => {
      const form = button.closest('form');
      const email = form?.elements.email?.value;
      const purpose = form?.elements.purpose?.value || 'register';
      if (!email) return;
      const submit = form.querySelector('[type="submit"]');
      setButtonLoading(button, true, 'Надсилаємо код');
      if (submit) submit.disabled = true;
      setStatusLoading(form, 'Надсилаємо код…');
      try {
        const data = await api(boot().routes.resend, {
          method: 'POST',
          body: { email, purpose }
        });
        setStatus(form, data.message || 'Новий код надіслано.', 'is-success');
      } catch (error) {
        const first = Object.values(error.data?.errors || {})[0];
        setStatus(form, Array.isArray(first) ? first[0] : (error.data?.message || error.message), 'is-error');
      } finally {
        setButtonLoading(button, false);
        if (submit) submit.disabled = false;
      }
    });
  });
}

export function renderAuthInto(root, mode = 'login', options = {}) {
  if (!root) return;
  const tabs = options.compact
    ? ''
    : `<nav class="auth-tabs" aria-label="Вхід і реєстрація">
        <button type="button" class="${mode === 'login' || mode === 'recover' || mode === 'verify' ? 'is-active' : ''}" data-auth-goto="login" ${mode === 'login' ? 'aria-current="page"' : ''}>Вхід</button>
        <button type="button" class="${mode === 'register' ? 'is-active' : ''}" data-auth-goto="register" ${mode === 'register' ? 'aria-current="page"' : ''}>Реєстрація</button>
      </nav>`;

  let body = loginMarkup(options);
  if (mode === 'register') body = registerMarkup(options);
  if (mode === 'recover') body = recoverMarkup();
  if (mode === 'verify') body = verifyMarkup(options.email || '', options);

  root.innerHTML = `${tabs}${body}`;
  bindAuthRoot(root, options);
}

export function authGateMarkup() {
  return '';
}

export function openAuthGate(options = {}) {
  const { pendingModalId = null, redirectTo = null } = typeof options === 'string'
    ? { pendingModalId: options }
    : options;

  sessionStorage.removeItem(PENDING_MODAL_KEY);
  if (redirectTo && redirectTo.startsWith('/')) {
    sessionStorage.setItem(PENDING_REDIRECT_KEY, redirectTo);
  } else if (pendingModalId === 'viewing-modal') {
    sessionStorage.setItem(PENDING_REDIRECT_KEY, accountHomeUrl());
  } else {
    sessionStorage.removeItem(PENDING_REDIRECT_KEY);
  }

  window.location.assign(`${boot().routes.auth}?mode=login`);
}

export function goToOfferForm() {
  if (isAuthenticated()) {
    window.location.assign(OFFER_ACCOUNT_URL);
    return;
  }
  openAuthGate({ redirectTo: OFFER_ACCOUNT_URL });
}

export async function logout() {
  try {
    await api(boot().routes.logout, { method: 'POST' });
  } catch {
    // Сесію все одно скидаємо локально і ведемо на auth.
  }
  setAuthState({ authenticated: false, user: null });
  sessionStorage.removeItem(PENDING_REDIRECT_KEY);
  sessionStorage.removeItem(PENDING_MODAL_KEY);
  window.location.assign(`${boot().routes.auth}?mode=login`);
}

export function shouldGateModal(modalId) {
  return AUTH_GATED_MODALS.has(modalId) && !isAuthenticated();
}

export function initAuthPage() {
  const root = document.getElementById('auth-root');
  if (!root) return;
  if (isAuthenticated()) {
    window.location.replace(accountHomeUrl());
    return;
  }
  const params = new URLSearchParams(location.search);
  const mode = ['login', 'register', 'recover'].includes(params.get('mode')) ? params.get('mode') : 'login';
  const titles = {
    login: ['Вхід до кабінету', 'Увійдіть, щоб переглянути персональний простір Dwelchain.'],
    register: ['Створити кабінет', 'Оберіть роль і заповніть основні контактні дані.'],
    recover: ['Відновити доступ', 'Вкажіть email, який пов’язаний із вашим кабінетом.']
  };
  document.title = `${titles[mode][0]} | Dwelchain`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', titles[mode][1]);
  renderAuthInto(root, mode, { compact: false });
}

export { AUTH_GATED_MODALS, OFFER_ACCOUNT_URL };
