const OPEN_CLASS = 'is-open';

function optionLabel(option) {
  return option.textContent.trim() || option.value || '';
}

function selectedLabel(select) {
  const option = select.selectedOptions[0] || select.options[0];
  return option ? optionLabel(option) : '';
}

function closeAll(except = null) {
  document.querySelectorAll(`.dc-select.${OPEN_CLASS}`).forEach(wrap => {
    if (wrap !== except) closeSelect(wrap);
  });
}

function positionList(wrap) {
  const trigger = wrap.querySelector('.dc-select__trigger');
  const list = wrap.querySelector('.dc-select__list');
  if (!trigger || !list) return;
  const rect = trigger.getBoundingClientRect();
  const maxHeight = Math.min(280, window.innerHeight * 0.5);
  const spaceBelow = window.innerHeight - rect.bottom - 12;
  const spaceAbove = rect.top - 12;
  const openUp = spaceBelow < Math.min(maxHeight, 160) && spaceAbove > spaceBelow;
  const height = Math.min(maxHeight, openUp ? spaceAbove : spaceBelow);
  list.style.position = 'fixed';
  list.style.left = `${Math.round(rect.left)}px`;
  list.style.width = `${Math.round(rect.width)}px`;
  list.style.maxHeight = `${Math.max(120, Math.round(height))}px`;
  list.style.right = 'auto';
  if (openUp) {
    list.style.top = 'auto';
    list.style.bottom = `${Math.round(window.innerHeight - rect.top + 6)}px`;
  } else {
    list.style.top = `${Math.round(rect.bottom + 6)}px`;
    list.style.bottom = 'auto';
  }
}

function closeSelect(wrap) {
  wrap.classList.remove(OPEN_CLASS);
  const trigger = wrap.querySelector('.dc-select__trigger');
  const list = wrap.querySelector('.dc-select__list');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (list) {
    list.hidden = true;
    list.style.position = '';
    list.style.left = '';
    list.style.width = '';
    list.style.maxHeight = '';
    list.style.right = '';
    list.style.top = '';
    list.style.bottom = '';
  }
}

function openSelect(wrap) {
  const select = wrap.querySelector('select');
  if (!select || select.disabled) return;
  closeAll(wrap);
  rebuildOptions(wrap);
  wrap.classList.add(OPEN_CLASS);
  const trigger = wrap.querySelector('.dc-select__trigger');
  const list = wrap.querySelector('.dc-select__list');
  trigger?.setAttribute('aria-expanded', 'true');
  if (list) list.hidden = false;
  positionList(wrap);
  list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
}

function rebuildOptions(wrap) {
  const select = wrap.querySelector('select');
  const list = wrap.querySelector('.dc-select__list');
  if (!select || !list) return;
  list.replaceChildren();
  [...select.options].forEach((option, index) => {
    const item = document.createElement('li');
    item.className = 'dc-select__option';
    item.setAttribute('role', 'option');
    item.dataset.index = String(index);
    item.setAttribute('aria-selected', option.selected ? 'true' : 'false');
    if (option.disabled) {
      item.setAttribute('aria-disabled', 'true');
      item.classList.add('is-disabled');
    }
    item.textContent = optionLabel(option);
    list.appendChild(item);
  });
}

function syncTrigger(wrap) {
  const select = wrap.querySelector('select');
  const trigger = wrap.querySelector('.dc-select__trigger');
  const value = wrap.querySelector('.dc-select__value');
  if (!select || !trigger || !value) return;
  value.textContent = selectedLabel(select);
  trigger.classList.toggle('is-placeholder', !select.value);
  trigger.disabled = select.disabled;
  wrap.classList.toggle('is-disabled', select.disabled);
  rebuildOptions(wrap);
}

function chooseIndex(wrap, index) {
  const select = wrap.querySelector('select');
  if (!select || !select.options[index] || select.options[index].disabled) return;
  select.selectedIndex = index;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
  syncTrigger(wrap);
  closeSelect(wrap);
  wrap.querySelector('.dc-select__trigger')?.focus();
}

function enhanceOne(select) {
  if (select.dataset.dcSelect === '1' || select.closest('.dc-select')) return;
  select.dataset.dcSelect = '1';

  const wrap = document.createElement('div');
  wrap.className = 'dc-select';
  if (select.closest('.field--compact')) wrap.classList.add('dc-select--compact');
  if (select.closest('.hub-city')) wrap.classList.add('dc-select--hub');
  if (select.closest('.sort-control')) wrap.classList.add('dc-select--sort');

  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add('dc-select__native');
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dc-select__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  if (select.id) trigger.id = `${select.id}-trigger`;
  if (select.getAttribute('aria-label')) trigger.setAttribute('aria-label', select.getAttribute('aria-label'));
  else if (select.name) trigger.setAttribute('aria-label', select.name);

  const value = document.createElement('span');
  value.className = 'dc-select__value';
  const chevron = document.createElement('span');
  chevron.className = 'dc-select__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(value, chevron);

  const list = document.createElement('ul');
  list.className = 'dc-select__list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  if (trigger.id) list.id = `${trigger.id}-list`;
  trigger.setAttribute('aria-controls', list.id || '');

  wrap.append(trigger, list);
  syncTrigger(wrap);

  trigger.addEventListener('click', event => {
    event.preventDefault();
    if (wrap.classList.contains(OPEN_CLASS)) closeSelect(wrap);
    else openSelect(wrap);
  });

  trigger.addEventListener('keydown', event => {
    const open = wrap.classList.contains(OPEN_CLASS);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openSelect(wrap);
      else if (event.key === 'Enter' || event.key === ' ') {
        const current = list.querySelector('[aria-selected="true"]');
        if (current) chooseIndex(wrap, Number(current.dataset.index));
      } else if (event.key === 'ArrowDown') {
        const next = (select.selectedIndex + 1) % select.options.length;
        chooseIndex(wrap, next);
        openSelect(wrap);
      } else if (event.key === 'ArrowUp') {
        const prev = (select.selectedIndex - 1 + select.options.length) % select.options.length;
        chooseIndex(wrap, prev);
        openSelect(wrap);
      }
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeSelect(wrap);
    }
  });

  list.addEventListener('click', event => {
    const option = event.target.closest('.dc-select__option');
    if (!option || option.classList.contains('is-disabled')) return;
    chooseIndex(wrap, Number(option.dataset.index));
  });

  select.addEventListener('change', () => syncTrigger(wrap));
  select.addEventListener('focus', () => trigger.focus());

  const form = select.closest('form');
  form?.addEventListener('reset', () => {
    requestAnimationFrame(() => syncTrigger(wrap));
  });
}

export function enhanceSelects(root = document) {
  const scope = root.querySelectorAll ? root : document;
  scope.querySelectorAll('select').forEach(enhanceOne);
  if (root.matches?.('select')) enhanceOne(root);
}

export function initSelects() {
  enhanceSelects(document);
  document.addEventListener('click', event => {
    if (!event.target.closest('.dc-select')) closeAll();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAll();
  });

  document.addEventListener('scroll', () => closeAll(), true);
  window.addEventListener('resize', () => closeAll());

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('select')) enhanceOne(node);
        else if (node.querySelectorAll) enhanceSelects(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
