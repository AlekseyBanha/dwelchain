import { dataLoadError, properties, propertyTypes, formatUah, formatUsd, imageAlts } from './data.js?v=20260727-images1';
import { initDialogs, mountChrome, renderMapMock, renderPropertyCard } from './components.js?v=20260727-images1';

mountChrome();
initDialogs();

const page = document.body.dataset.page;

const advancedFilterKeys = ['minArea', 'maxArea', 'floor', 'totalFloors', 'furnished', 'renovation', 'pets', 'parking', 'balcony', 'buildingType', 'developer', 'marketType'];
const filterNames = {
  city: 'Місто',
  deal: 'Тип угоди',
  district: 'Район',
  type: 'Тип нерухомості',
  rooms: 'Кімнати',
  minPrice: 'Ціна від',
  maxPrice: 'Ціна до',
  minArea: 'Площа від',
  maxArea: 'Площа до',
  floor: 'Поверх',
  totalFloors: 'Поверховість',
  furnished: 'Меблі',
  renovation: 'Ремонт',
  pets: 'Тварини',
  parking: 'Паркінг',
  balcony: 'Балкон / тераса',
  buildingType: 'Тип будинку',
  developer: 'Забудовник',
  marketType: 'Ринок'
};
const filterValueLabels = {
  deal: { sale: 'Купівля', rent: 'Оренда' },
  type: propertyTypes,
  floor: { '1': '1', '2-5': '2–5', '6-10': '6–10', '11+': '11+', last: 'останній' },
  totalFloors: { '1-5': 'до 5', '6-9': '6–9', '10-16': '10–16', '17+': '17+' },
  furnished: { yes: 'є', no: 'без меблів' },
  renovation: { premium: 'преміальний', modern: 'сучасний', basic: 'базовий', 'needs-renovation': 'потребує ремонту' },
  pets: { yes: 'можна', no: 'не можна' },
  parking: { yes: 'є', no: 'немає' },
  balcony: { yes: 'є', no: 'немає' },
  buildingType: { monolith: 'монолітний', brick: 'цегляний', panel: 'панельний', townhouse: 'таунхаус', house: 'приватний будинок' },
  marketType: { 'new-build': 'новобудова', secondary: 'вторинка' }
};

function matchesNumericBucket(value, bucket, lastValue = null) {
  if (!bucket) return true;
  if (bucket === 'last') return value === lastValue;
  if (bucket.endsWith('+')) return value >= Number(bucket.slice(0, -1));
  if (bucket.includes('-')) {
    const [min, max] = bucket.split('-').map(Number);
    return value >= min && value <= max;
  }
  return value === Number(bucket);
}

function propertyMatchesFilters(item, state) {
  const roomMatch = !state.rooms || (state.rooms === '4' ? item.rooms >= 4 : item.rooms === Number(state.rooms));
  const booleanMatch = (key, value) => !state[key] || item[value] === (state[key] === 'yes');
  return (!state.city || item.city === state.city)
    && (!state.deal || item.deal === state.deal)
    && (!state.district || item.district === state.district)
    && (!state.type || item.type === state.type)
    && roomMatch
    && (!state.minPrice || item.priceUsd >= Number(state.minPrice))
    && (!state.maxPrice || item.priceUsd <= Number(state.maxPrice))
    && (!state.minArea || item.area >= Number(state.minArea))
    && (!state.maxArea || item.area <= Number(state.maxArea))
    && matchesNumericBucket(item.floor, state.floor, item.totalFloors)
    && matchesNumericBucket(item.totalFloors, state.totalFloors)
    && booleanMatch('furnished', 'furnished')
    && (!state.renovation || item.renovation === state.renovation)
    && booleanMatch('pets', 'petsAllowed')
    && booleanMatch('parking', 'parking')
    && booleanMatch('balcony', 'balcony')
    && (!state.buildingType || item.buildingType === state.buildingType)
    && (!state.developer || item.developer === state.developer)
    && (!state.marketType || item.marketType === state.marketType);
}

function validateFilterRanges(form, errorElement) {
  const pairs = [
    { min: 'minPrice', max: 'maxPrice', label: 'ціна', invalid: 'Ціна має бути додатним числом.' },
    { min: 'minArea', max: 'maxArea', label: 'площа', invalid: 'Площа має бути додатним числом.' }
  ];
  let message = '';
  let firstInvalid = null;
  pairs.forEach(pair => {
    const minInput = form.elements[pair.min];
    const maxInput = form.elements[pair.max];
    if (!minInput || !maxInput) return;
    const min = minInput.value === '' ? null : Number(minInput.value);
    const max = maxInput.value === '' ? null : Number(maxInput.value);
    const invalidNumber = (min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0));
    const invalidRange = min !== null && max !== null && min > max;
    const pairMessage = invalidNumber ? pair.invalid : invalidRange ? `Мінімальна ${pair.label} не може бути більшою за максимальну.` : '';
    [minInput, maxInput].forEach(input => pairMessage ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid'));
    if (!message && pairMessage) {
      message = pairMessage;
      firstInvalid = minInput;
    }
  });
  errorElement.textContent = message;
  return { valid: !message, firstInvalid };
}

function setupAdvancedFilters(form, toggleId, panelId) {
  const toggle = document.getElementById(toggleId);
  const panel = document.getElementById(panelId);
  const setExpanded = expanded => {
    panel.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    updateLabel();
  };
  const activeCount = () => advancedFilterKeys.filter(key => form.elements[key]?.value).length;
  const updateLabel = () => {
    const count = activeCount();
    const base = toggle.getAttribute('aria-expanded') === 'true' ? 'Згорнути фільтри' : 'Більше фільтрів';
    toggle.querySelector('span').textContent = count ? `${base} · ${count}` : base;
  };
  toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
  if (activeCount()) setExpanded(true);
  updateLabel();
  return { updateLabel, setExpanded };
}

function filterChipText(key, value) {
  if (key === 'minPrice' || key === 'maxPrice') return `${filterNames[key]} ${new Intl.NumberFormat('uk-UA').format(value)} $`;
  if (key === 'minArea' || key === 'maxArea') return `${filterNames[key]} ${new Intl.NumberFormat('uk-UA').format(value)} м²`;
  if (key === 'rooms') return value === '1' ? '1 кімната' : value === '4' ? '4+ кімнати' : `${value} кімнати`;
  const label = filterValueLabels[key]?.[value] || value;
  if (['deal', 'district', 'type', 'city'].includes(key)) return label;
  return `${filterNames[key]}: ${label}`;
}

if (page === 'home') initHome();
if (page === 'catalog') initCatalog();
if (page === 'property') initProperty();
if (page === 'map') initMapPage();
if (page === 'design-system') initDesignSystem();

function initHome() {
  const recommendationError = '<div class="inline-notification inline-notification--error" role="alert">Не вдалося завантажити рекомендовані об’єкти. Оновіть сторінку, щоб спробувати ще раз.</div>';
  const recommendedByDeal = deal => properties
    .filter(item => item.deal === deal)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || Number(Boolean(b.image)) - Number(Boolean(a.image)) || Number(b.isNew) - Number(a.isNew) || b.order - a.order)[0];
  const saleRecommendation = recommendedByDeal('sale');
  const rentRecommendation = recommendedByDeal('rent');
  document.getElementById('featured-sale').innerHTML = dataLoadError
    ? recommendationError
    : saleRecommendation
      ? renderPropertyCard(saleRecommendation)
      : '<div class="inline-notification">Рекомендовані об’єкти для купівлі поки не додано.</div>';
  document.getElementById('featured-rent').innerHTML = dataLoadError
    ? recommendationError
    : rentRecommendation
      ? renderPropertyCard(rentRecommendation)
      : '<div class="inline-notification">Рекомендовані об’єкти для оренди поки не додано.</div>';
  document.getElementById('hero-search').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    params.set('city', document.getElementById('home-city').value);
    for (const [key, value] of form.entries()) if (value) params.set(key, value);
    window.location.href = `/catalog?${params.toString()}`;
  });
}

function initCatalog() {
  const form = document.getElementById('catalog-filter');
  const grid = document.getElementById('catalog-grid');
  const chips = document.getElementById('filter-chips');
  const count = document.getElementById('result-count');
  const countLabel = document.getElementById('result-count-label');
  const toolbar = document.getElementById('catalog-toolbar');
  const loading = document.getElementById('catalog-loading');
  const empty = document.getElementById('empty-state');
  const errorState = document.getElementById('error-state');
  const loadMore = document.getElementById('load-more');
  const loadMoreWrap = document.getElementById('load-more-wrap');
  const sort = document.getElementById('sort-select');
  const error = document.getElementById('filter-error');
  const minPrice = form.elements.minPrice;
  const maxPrice = form.elements.maxPrice;
  const minArea = form.elements.minArea;
  const maxArea = form.elements.maxArea;
  const mapViewLink = document.getElementById('map-view-link');
  let visible = 6;
  let renderToken = 0;
  let loadingReleaseTimer = null;
  const params = new URLSearchParams(window.location.search);
  let forcedState = params.get('catalogState');
  [...form.elements].forEach(control => { if (control.name && params.has(control.name)) control.value = params.get(control.name); });
  if (params.has('sort')) sort.value = params.get('sort');
  const disclosure = setupAdvancedFilters(form, 'catalog-more-filters', 'catalog-advanced-filters');

  function propertyCountWord(value) {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return 'об’єкт';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'об’єкти';
    return 'об’єктів';
  }

  function currentState() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function syncUrl(state) {
    const next = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => { if (value) next.set(key, value); });
    if (sort.value !== 'recommended') next.set('sort', sort.value);
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
    const mapParams = new URLSearchParams(next);
    mapParams.delete('sort');
    mapViewLink.href = `/map${mapParams.size ? `?${mapParams}` : ''}`;
  }

  function filteredItems(state) {
    const items = properties.filter(item => propertyMatchesFilters(item, state));
    const mode = sort.value;
    return items.sort((a, b) => mode === 'price-asc' ? a.priceUsd - b.priceUsd : mode === 'price-desc' ? b.priceUsd - a.priceUsd : mode === 'new' ? Number(b.isNew) - Number(a.isNew) || b.order - a.order : b.featured - a.featured || b.order - a.order);
  }

  function setCatalogView(view, hasMore = false) {
    loading.hidden = view !== 'loading';
    toolbar.hidden = view !== 'list';
    grid.hidden = view !== 'list';
    empty.hidden = view !== 'empty';
    errorState.hidden = view !== 'error';
    loadMoreWrap.hidden = view !== 'list' || !hasMore;
  }

  function render() {
    const token = ++renderToken;
    count.textContent = '…';
    setCatalogView('loading');
    requestAnimationFrame(() => {
      if (token !== renderToken) return;
      if (forcedState === 'loading') {
        if (!loadingReleaseTimer) loadingReleaseTimer = setTimeout(() => {
          loadingReleaseTimer = null;
          forcedState = null;
          const next = new URLSearchParams(location.search);
          next.delete('catalogState');
          history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
          render();
        }, 450);
        return;
      }
      try {
        if (dataLoadError || forcedState === 'error') throw new Error('Catalog data error state');
        const state = currentState();
        const items = filteredItems(state);
        syncUrl(state);
        disclosure.updateLabel();
        count.textContent = items.length;
        countLabel.textContent = propertyCountWord(items.length);
        grid.innerHTML = items.slice(0, visible).map(renderPropertyCard).join('');
        chips.innerHTML = Object.entries(state).filter(([, value]) => value).map(([key, value]) => `<span class="filter-chip">${filterChipText(key, value)}<button type="button" data-clear-filter="${key}" aria-label="Видалити фільтр: ${filterNames[key]} — ${filterChipText(key, value)}">×</button></span>`).join('') + (Object.values(state).some(Boolean) ? '<button class="clear-all" type="button" data-clear-all>Очистити фільтри</button>' : '<span class="toolbar-note">Фільтри не застосовано</span>');
        setCatalogView(items.length ? 'list' : 'empty', items.length > visible);
      } catch {
        count.textContent = '—';
        countLabel.textContent = 'об’єктів';
        setCatalogView('error');
      }
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const validation = validateFilterRanges(form, error);
    if (!validation.valid) { validation.firstInvalid?.focus(); return; }
    visible = 6; render();
  });
  [minPrice, maxPrice, minArea, maxArea].forEach(input => input.addEventListener('input', () => validateFilterRanges(form, error)));
  sort.addEventListener('change', () => { visible = 6; render(); });
  chips.addEventListener('click', event => {
    const clear = event.target.closest('[data-clear-filter]');
    if (clear) { form.elements[clear.dataset.clearFilter].value = ''; visible = 6; render(); }
    if (event.target.closest('[data-clear-all]')) resetFilters();
  });
  loadMore.addEventListener('click', () => { visible += 3; render(); });
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('reset-empty').addEventListener('click', resetFilters);
  document.getElementById('retry-catalog').addEventListener('click', () => {
    forcedState = null;
    const next = new URLSearchParams(location.search);
    next.delete('catalogState');
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
    render();
  });
  function resetFilters() {
    forcedState = null;
    form.reset();
    sort.value = 'recommended';
    error.textContent = '';
    [minPrice, maxPrice, minArea, maxArea].forEach(input => input.removeAttribute('aria-invalid'));
    disclosure.setExpanded(false);
    visible = 6;
    render();
  }
  render();
}

function initMapPage() {
  const form = document.getElementById('map-filter');
  const markers = document.getElementById('map-markers');
  const list = document.getElementById('map-results-list');
  const loading = document.getElementById('map-results-loading');
  const empty = document.getElementById('map-results-empty');
  const errorState = document.getElementById('map-results-error');
  const count = document.getElementById('map-result-count');
  const countLabel = document.getElementById('map-result-label');
  const filterError = document.getElementById('map-filter-error');
  const catalogViewLink = document.getElementById('catalog-view-link');
  const catalogHeaderLink = document.getElementById('map-catalog-link');
  const popup = document.getElementById('map-popup');
  const surface = document.querySelector('.map-catalog__surface');
  let activeId = null;
  let zoom = 0;
  let renderToken = 0;
  let loadingReleaseTimer = null;

  const params = new URLSearchParams(location.search);
  let forcedState = params.get('mapState');
  [...form.elements].forEach(control => {
    if (control.name && params.has(control.name)) control.value = params.get(control.name);
  });
  const disclosure = setupAdvancedFilters(form, 'map-more-filters', 'map-advanced-filters');

  function countWord(value) {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return 'об’єкт';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'об’єкти';
    return 'об’єктів';
  }

  function syncUrl(state) {
    const next = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => { if (value) next.set(key, value); });
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
    const catalogHref = `/catalog${next.size ? `?${next}` : ''}`;
    catalogViewLink.href = catalogHref;
    catalogHeaderLink.href = catalogHref;
  }

  function currentState() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function filteredItems(state) {
    return properties.filter(item => propertyMatchesFilters(item, state));
  }

  function mapCard(item) {
    const unit = item.deal === 'rent' ? ' / місяць' : '';
    const imageAlt = item.imageAlt || imageAlts[item.image] || `Фотографія об’єкта: ${item.title}`;
    const image = item.image
      ? `<img src="${item.image}" alt="${imageAlt}" loading="lazy">`
      : '<span class="map-result-card__placeholder" aria-label="Фотографія об’єкта відсутня">D</span>';
    return `<article class="map-result-card" data-map-card="${item.id}" tabindex="0" aria-label="${item.title}, ${formatUsd(item.priceUsd)}${unit}">
      <a class="map-result-card__image" href="/property?id=${item.id}" aria-label="Переглянути об’єкт: ${item.title}">${image}<span>${item.deal === 'sale' ? 'Купівля' : 'Оренда'}</span></a>
      <div class="map-result-card__body">
        <div class="map-result-card__price"><strong>${formatUsd(item.priceUsd)}</strong><small>${unit}</small></div>
        <h3><a href="/property?id=${item.id}">${item.title}</a></h3>
        <p>${item.district || 'Район уточнюється'} · ${propertyTypes[item.type]}</p>
        <div><span>${item.rooms} кімн.</span><span>${item.area} м²</span><span>${item.floor}${item.totalFloors ? ` / ${item.totalFloors}` : ''} пов.</span>${Number.isInteger(item.mapPosition) ? '' : '<span class="map-result-card__location-state">Розташування уточнюється</span>'}</div>
      </div>
    </article>`;
  }

  function marker(item) {
    const unit = item.deal === 'rent' ? '/міс' : '';
    return `<button class="map-marker" type="button" data-map-position="${item.mapPosition}" data-map-marker="${item.id}" aria-label="${item.title}, ${formatUsd(item.priceUsd)} ${unit}" aria-pressed="${item.id === activeId}">
      <span>${formatUsd(item.priceUsd)}${unit}</span><i></i>
    </button>`;
  }

  function popupMarkup(item) {
    const unit = item.deal === 'rent' ? ' на місяць' : '';
    const imageAlt = item.imageAlt || imageAlts[item.image] || `Фотографія об’єкта: ${item.title}`;
    const image = item.image
      ? `<img src="${item.image}" alt="${imageAlt}">`
      : '<span class="map-popup__placeholder" aria-label="Фотографія об’єкта відсутня">D</span>';
    return `<span class="map-popup__image">${image}</span><div><small>${item.district || 'Район уточнюється'} · ${item.deal === 'sale' ? 'Купівля' : 'Оренда'}</small><h3>${item.title}</h3><strong>${formatUsd(item.priceUsd)}${unit}</strong><a href="/property?id=${item.id}">Переглянути об’єкт <span aria-hidden="true">→</span></a></div>`;
  }

  function selectItem(id, scrollCard = false) {
    activeId = id;
    const item = properties.find(property => property.id === id);
    markers.querySelectorAll('[data-map-marker]').forEach(node => {
      const active = node.dataset.mapMarker === id;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-pressed', String(active));
    });
    list.querySelectorAll('[data-map-card]').forEach(node => {
      const active = node.dataset.mapCard === id;
      node.classList.toggle('is-active', active);
      if (active) node.setAttribute('aria-current', 'true');
      else node.removeAttribute('aria-current');
    });
    popup.hidden = !item;
    popup.innerHTML = item ? popupMarkup(item) : '';
    if (scrollCard) list.querySelector(`[data-map-card="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function setMapView(view) {
    loading.hidden = view !== 'loading';
    list.hidden = view !== 'content';
    empty.hidden = view !== 'empty';
    errorState.hidden = view !== 'error';
    if (view !== 'content') popup.hidden = true;
  }

  function render() {
    const token = ++renderToken;
    count.textContent = '…';
    setMapView('loading');
    requestAnimationFrame(() => {
      if (token !== renderToken) return;
      if (forcedState === 'loading') {
        if (!loadingReleaseTimer) loadingReleaseTimer = setTimeout(() => {
          loadingReleaseTimer = null;
          forcedState = null;
          const next = new URLSearchParams(location.search);
          next.delete('mapState');
          history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
          render();
        }, 450);
        return;
      }
      try {
        if (dataLoadError || forcedState === 'error') throw new Error('Map data error state');
        const state = currentState();
        const items = filteredItems(state);
        syncUrl(state);
        disclosure.updateLabel();
        count.textContent = items.length;
        countLabel.textContent = countWord(items.length);
        const markerItems = items.filter(item => Number.isInteger(item.mapPosition));
        activeId = items.some(item => item.id === activeId) ? activeId : markerItems[0]?.id || items[0]?.id || null;
        markers.innerHTML = markerItems.map(marker).join('');
        list.innerHTML = items.map(mapCard).join('');
        setMapView(items.length ? 'content' : 'empty');
        if (activeId) selectItem(activeId);
      } catch {
        count.textContent = '—';
        countLabel.textContent = 'об’єктів';
        markers.innerHTML = '';
        list.innerHTML = '';
        setMapView('error');
      }
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const validation = validateFilterRanges(form, filterError);
    if (!validation.valid) { validation.firstInvalid?.focus(); return; }
    render();
  });
  ['minPrice', 'maxPrice', 'minArea', 'maxArea'].forEach(name => form.elements[name].addEventListener('input', () => validateFilterRanges(form, filterError)));
  form.addEventListener('reset', () => requestAnimationFrame(() => {
    filterError.textContent = '';
    ['minPrice', 'maxPrice', 'minArea', 'maxArea'].forEach(name => form.elements[name].removeAttribute('aria-invalid'));
    disclosure.setExpanded(false);
    render();
  }));
  document.getElementById('map-reset-empty').addEventListener('click', () => form.reset());
  document.getElementById('map-retry').addEventListener('click', () => {
    if (dataLoadError) { location.reload(); return; }
    forcedState = null;
    const next = new URLSearchParams(location.search);
    next.delete('mapState');
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
    render();
  });
  markers.addEventListener('click', event => {
    const pin = event.target.closest('[data-map-marker]');
    if (pin) selectItem(pin.dataset.mapMarker, true);
  });
  list.addEventListener('pointerover', event => {
    const card = event.target.closest('[data-map-card]');
    if (card) selectItem(card.dataset.mapCard);
  });
  list.addEventListener('focusin', event => {
    const card = event.target.closest('[data-map-card]');
    if (card) selectItem(card.dataset.mapCard);
  });
  list.addEventListener('click', event => {
    const card = event.target.closest('[data-map-card]');
    if (card && !event.target.closest('a')) selectItem(card.dataset.mapCard);
  });
  document.querySelector('.map-catalog__controls').addEventListener('click', event => {
    const action = event.target.closest('[data-map-zoom]')?.dataset.mapZoom;
    if (!action) return;
    zoom = Math.min(3, Math.max(0, zoom + (action === 'in' ? 1 : -1)));
    surface.dataset.zoom = String(zoom);
  });
  render();
}

function initProperty() {
  const root = document.getElementById('property-root');
  if (dataLoadError) {
    document.title = 'Помилка завантаження | Dwelchain';
    root.innerHTML = `<section class="not-found section-shell"><span>!</span><h1>Не вдалося завантажити об’єкт</h1><p>Перевірте з’єднання та спробуйте оновити сторінку.</p><button class="button button--primary" id="retry-property" type="button">Спробувати ще раз</button></section>`;
    document.getElementById('retry-property').addEventListener('click', () => location.reload());
    return;
  }
  const id = new URLSearchParams(location.search).get('id') || properties[0]?.id;
  const item = properties.find(property => property.id === id);
  if (!item) {
    document.title = 'Об’єкт не знайдено | Dwelchain';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Перевірте адресу сторінки або поверніться до каталогу нерухомості Dwelchain.');
    root.innerHTML = `<section class="not-found section-shell"><span>404</span><h1>Об’єкт не знайдено</h1><p>Перевірте адресу сторінки або поверніться до каталогу.</p><a class="button button--primary" href="/catalog">Повернутися до каталогу</a></section>`;
    return;
  }
  document.title = `${item.title} | Dwelchain`;
  const metaFacts = [item.area ? `${item.area} м²` : '', item.rooms ? `${item.rooms} кімн.` : '', item.district ? `${item.district}, Київ` : 'Київ'].filter(Boolean).join(', ');
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${item.title}: ${metaFacts}. Фото, ціна, характеристики та приблизне розташування.`);
  const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
  const galleryAlt = (image, index) => imageAlts[image] || `${item.title}, фотографія ${index + 1}`;
  const similar = properties.filter(property => property.id !== item.id && (property.district === item.district || property.type === item.type)).slice(0, 3);
  while (similar.length < 3) { const candidate = properties.find(property => property.id !== item.id && !similar.includes(property)); if (!candidate) break; similar.push(candidate); }
  const unit = item.deal === 'rent' ? ' на місяць' : '';
  const facts = [
    item.rooms ? ['Кімнати', item.rooms] : null,
    item.area ? ['Площа', `${item.area} м²`] : null,
    item.floor && item.totalFloors ? ['Поверх', `${item.floor} / ${item.totalFloors}`] : item.floor ? ['Поверх', item.floor] : null,
    propertyTypes[item.type] ? ['Тип', propertyTypes[item.type]] : null
  ].filter(Boolean);
  root.innerHTML = `<section class="property-head section-shell">
      <nav class="breadcrumbs" aria-label="Навігаційний шлях"><a href="/">Головна</a><span>·</span><a href="/catalog">Каталог</a><span>·</span><span>${item.title}</span></nav>
      <div class="property-head__row"><div><div class="property-head__badges"><span class="badge badge--dark">${item.deal === 'sale' ? 'Купівля' : 'Оренда'}</span>${item.isNew ? '<span class="badge">Нове оголошення</span>' : ''}</div><h1>${item.title}</h1><p>${item.district || 'Район уточнюється'}${item.address ? ` · ${item.address}` : ''}</p></div><div class="property-head__price"><strong>${formatUsd(item.priceUsd)}<small>${unit}</small></strong><span>≈ ${formatUah(item.priceUah)}${item.deal === 'sale' ? ` · ${formatUsd(Math.round(item.priceUsd / item.area))}/м²` : ' на місяць'}</span></div></div>
    </section>
    ${images.length ? `<section class="gallery section-shell">
      <button class="gallery__main" type="button" data-gallery-index="0" aria-label="Відкрити фото: ${galleryAlt(images[0], 0)}"><img src="${images[0]}" alt="${galleryAlt(images[0], 0)}"></button>
      <div class="gallery__side">${images.slice(1, 5).map((image, index) => `<button type="button" data-gallery-index="${index + 1}" aria-label="Відкрити фото: ${galleryAlt(image, index + 1)}"><img src="${image}" alt="${galleryAlt(image, index + 1)}"></button>`).join('')}</div>
      <button class="gallery__all button button--glass" type="button" data-gallery-index="0">Переглянути всі фото · ${images.length}</button>
    </section>` : `<section class="gallery gallery--empty section-shell" aria-label="Фотографії об’єкта відсутні"><div class="gallery__placeholder"><b>D</b><strong>Фотографії ще не додано</strong><span>Перегляньте характеристики й опис нижче.</span></div></section>`}
    <section class="property-layout section-shell">
      <div class="property-content">
        <section class="property-section"><p class="eyebrow"><span></span> Основні характеристики</p><div class="fact-grid">${facts.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('')}</div></section>
        <section class="property-section description-section"><p class="eyebrow"><span></span> Опис</p><h2>Про об’єкт</h2><div class="description-text" id="description-text"><p>${item.description}</p><p>Ціну, комплектацію та доступність потрібно уточнити у менеджера.</p></div><button class="text-link description-toggle" id="description-toggle" type="button">Показати весь опис <span>↓</span></button></section>
        <section class="property-section" id="approximate-location"><p class="eyebrow"><span></span> Локація</p><h2>Орієнтовне розташування</h2>${renderMapMock(item)}</section>
      </div>
      <aside class="contact-card"><p class="eyebrow"><span></span> Зв’язок щодо об’єкта</p><strong class="contact-card__price">${formatUsd(item.priceUsd)}<small>${unit}</small></strong><span>≈ ${formatUah(item.priceUah)}</span><p>Оберіть зручний час перегляду або поставте запитання щодо характеристик об’єкта.</p><button class="button button--primary button--full" type="button" data-modal-open="viewing-modal">Записатися на перегляд</button><button class="button button--secondary button--full" type="button" data-modal-open="manager-modal">Зв’язатися з менеджером</button><div class="contact-card__person"><span>DW</span><div><strong>Менеджер Dwelchain</strong><small>Контакт щодо об’єкта</small></div></div></aside>
    </section>
    <section class="section section-shell"><div class="section-heading"><div><p class="eyebrow"><span></span> Ще у добірці</p><h2>Схожі об’єкти</h2></div><a class="text-link" href="/catalog">До каталогу <span>→</span></a></div><div class="property-grid">${similar.map(renderPropertyCard).join('')}</div></section>
    ${images.length ? `<dialog class="gallery-modal" id="gallery-modal" role="dialog" aria-modal="true" aria-label="Галерея об’єкта"><button type="button" data-gallery-close aria-label="Закрити галерею">×</button><img id="gallery-modal-image" src="${images[0]}" alt="${galleryAlt(images[0], 0)}"><div>${images.map((image, index) => `<button type="button" data-gallery-thumb="${index}" aria-label="Відкрити фото: ${galleryAlt(image, index)}" aria-pressed="${index === 0}"><img src="${image}" alt="${galleryAlt(image, index)}"></button>`).join('')}</div></dialog>` : ''}`;

  const description = document.getElementById('description-text');
  const viewingProperty = document.getElementById('viewing-property');
  if (viewingProperty) { viewingProperty.value = item.title; viewingProperty.defaultValue = item.title; }
  document.getElementById('description-toggle').addEventListener('click', event => { const expanded = description.classList.toggle('is-expanded'); event.currentTarget.innerHTML = expanded ? 'Згорнути опис <span>↑</span>' : 'Показати весь опис <span>↓</span>'; });
  if (images.length) {
    const dialog = document.getElementById('gallery-modal');
    const modalImage = document.getElementById('gallery-modal-image');
    let galleryTrigger = null;
    let selectedIndex = 0;
    const selectImage = index => {
      selectedIndex = (index + images.length) % images.length;
      modalImage.src = images[selectedIndex];
      modalImage.alt = galleryAlt(images[selectedIndex], selectedIndex);
      dialog.querySelectorAll('[data-gallery-thumb]').forEach(thumb => {
        const active = Number(thumb.dataset.galleryThumb) === selectedIndex;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-pressed', String(active));
      });
    };
    root.addEventListener('click', event => {
      const open = event.target.closest('[data-gallery-index]');
      if (open) {
        galleryTrigger = open;
        selectImage(Number(open.dataset.galleryIndex));
        dialog.showModal();
        document.body.classList.add('modal-open');
        dialog.querySelector('[data-gallery-close]')?.focus();
      }
      const thumb = event.target.closest('[data-gallery-thumb]');
      if (thumb) {
        selectImage(Number(thumb.dataset.galleryThumb));
      }
      if (event.target.closest('[data-gallery-close]')) dialog.close();
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); selectImage(selectedIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); selectImage(selectedIndex - 1); }
      if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('button:not([disabled])')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    dialog.addEventListener('close', () => {
      requestAnimationFrame(() => document.body.classList.toggle('modal-open', Boolean(document.querySelector('dialog[open]'))));
      setTimeout(() => galleryTrigger?.focus(), 0);
    });
  }
}

function initDesignSystem() {
  document.getElementById('design-card').innerHTML = properties[0] ? renderPropertyCard(properties[0]) : '<div class="inline-notification inline-notification--error">Картка недоступна через помилку локальних даних.</div>';
  document.getElementById('design-map').innerHTML = renderMapMock({ district: 'Печерський', address: 'поблизу Ботанічного саду', mapPosition: 0 });
  document.getElementById('design-map-empty').innerHTML = renderMapMock('');
}
