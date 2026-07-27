<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Каталог квартир і будинків у Києві з пошуком за ціною, площею, поверхом, станом, комплектацією та типом будинку.">
  <title>Каталог нерухомості в Києві | Dwelchain</title>
  <link rel="icon" type="image/png" href="{{ asset('assets/images/dwelchain-mark.png') }}">
  <link rel="stylesheet" href="{{ asset('assets/css/styles.css') }}?v=20260727-loaders1">
  @include('partials.boot')
</head>
<body data-page="catalog">
  <div data-site-header></div>
  <main>
    <section class="catalog-hero section-shell">
      <nav class="breadcrumbs breadcrumbs--compact" aria-label="Навігаційний шлях"><a href="{{ url('/') }}">Головна</a><span>·</span><span>Каталог</span></nav>
      <p class="eyebrow"><span></span> Нерухомість у Києві</p>
      <div class="catalog-hero__row"><div><h1>Каталог нерухомості</h1><p>Порівнюйте об’єкти за районом, ціною та основними характеристиками.</p></div><div class="catalog-hero__count" aria-live="polite"><span>Знайдено</span><strong id="result-count">12</strong><span id="result-count-label">об’єктів</span></div></div>
    </section>

    <section class="catalog-filter-wrap" aria-label="Фільтри каталогу">
      <form class="catalog-filter section-shell" id="catalog-filter">
        <div class="catalog-filter__primary">
          <label class="field field--compact"><span>Місто</span><select name="city"><option value="">Усі міста</option><option value="Київ" selected>Київ</option></select></label>
          <label class="field field--compact"><span>Тип угоди</span><select name="deal"><option value="">Усі угоди</option><option value="sale">Купівля</option><option value="rent">Оренда</option></select></label>
          <label class="field field--compact"><span>Район</span><select name="district"><option value="">Усі райони</option><option>Печерський</option><option>Шевченківський</option><option>Подільський</option><option>Голосіївський</option><option>Оболонський</option><option>Солом’янський</option></select></label>
          <label class="field field--compact"><span>Тип</span><select name="type"><option value="">Усі типи</option><option value="apartment">Квартира</option><option value="house">Будинок</option></select></label>
          <label class="field field--compact"><span>Кімнати</span><select name="rooms"><option value="">Будь-які</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></label>
          <label class="field field--compact"><span>Ціна від, $</span><input name="minPrice" type="number" min="0" step="100" placeholder="Від" aria-describedby="filter-error"></label>
          <label class="field field--compact"><span>Ціна до, $</span><input name="maxPrice" type="number" min="0" step="100" placeholder="До" aria-describedby="filter-error"></label>
          <button class="button button--primary catalog-filter__submit" type="submit">Показати об’єкти <span aria-hidden="true">→</span></button>
        </div>
        <div class="catalog-filter__advanced" id="catalog-advanced-filters" hidden>
          <label class="field field--compact"><span>Площа від, м?</span><input name="minArea" type="number" min="0" step="1" placeholder="Від" aria-describedby="filter-error"></label>
          <label class="field field--compact"><span>Площа до, м?</span><input name="maxArea" type="number" min="0" step="1" placeholder="До" aria-describedby="filter-error"></label>
          <label class="field field--compact"><span>Поверх</span><select name="floor"><option value="">Будь-який</option><option value="1">1</option><option value="2-5">2–5</option><option value="6-10">6–10</option><option value="11+">11+</option><option value="last">Останній</option></select></label>
          <label class="field field--compact"><span>Поверховість</span><select name="totalFloors"><option value="">Будь-яка</option><option value="1-5">До 5</option><option value="6-9">6–9</option><option value="10-16">10–16</option><option value="17+">17+</option></select></label>
          <label class="field field--compact"><span>Меблі</span><select name="furnished"><option value="">Неважливо</option><option value="yes">Є</option><option value="no">Без меблів</option></select></label>
          <label class="field field--compact"><span>Ремонт</span><select name="renovation"><option value="">Будь-який</option><option value="premium">Преміальний</option><option value="modern">Сучасний</option><option value="basic">Базовий</option><option value="needs-renovation">Потребує ремонту</option></select></label>
          <label class="field field--compact"><span>Тварини</span><select name="pets"><option value="">Неважливо</option><option value="yes">Можна</option><option value="no">Не можна</option></select></label>
          <label class="field field--compact"><span>Паркінг</span><select name="parking"><option value="">Неважливо</option><option value="yes">Є</option><option value="no">Немає</option></select></label>
          <label class="field field--compact"><span>Балкон / тераса</span><select name="balcony"><option value="">Неважливо</option><option value="yes">Є</option><option value="no">Немає</option></select></label>
          <label class="field field--compact"><span>Тип будинку</span><select name="buildingType"><option value="">Усі типи</option><option value="monolith">Монолітний</option><option value="brick">Цегляний</option><option value="panel">Панельний</option><option value="townhouse">Таунхаус</option><option value="house">Приватний будинок</option></select></label>
          <label class="field field--compact"><span>Забудовник</span><select name="developer"><option value="">Усі забудовники</option><option value="City Garden">City Garden</option><option value="Urban Residence">Urban Residence</option><option value="Riverside Development">Riverside Development</option><option value="Приватний власник">Приватний власник</option></select></label>
          <label class="field field--compact"><span>Ринок</span><select name="marketType"><option value="">Новобудова / вторинка</option><option value="new-build">Новобудова</option><option value="secondary">Вторинка</option></select></label>
        </div>
        <div class="catalog-filter__commands">
          <button class="button button--secondary filter-more-toggle" id="catalog-more-filters" type="button" aria-expanded="false" aria-controls="catalog-advanced-filters"><span>Більше фільтрів</span><i aria-hidden="true">↓</i></button>
          <a class="button button--secondary filter-map-link" id="map-view-link" href="{{ url('/map') }}">Показати на карті <span aria-hidden="true">→</span></a>
          <button class="button button--secondary" id="reset-filters" type="button">Очистити фільтри</button>
          <p class="filter-error" id="filter-error" role="alert" aria-live="assertive"></p>
        </div>
      </form>
    </section>

    <section class="section section-shell catalog-results">
      <div class="catalog-toolbar" id="catalog-toolbar" hidden>
        <div class="filter-chips" id="filter-chips" aria-live="polite"></div>
        <label class="sort-control"><span>Сортування</span><select id="sort-select"><option value="recommended">За замовчуванням</option><option value="new">Спочатку додані недавно</option><option value="price-asc">Спочатку дешевші</option><option value="price-desc">Спочатку дорожчі</option></select></label>
      </div>
      <div class="catalog-loading" id="catalog-loading" role="status" aria-live="polite"><span class="sr-only">Завантажуємо об’єкти…</span><div></div><div></div><div></div></div>
      <div class="property-grid" id="catalog-grid" hidden></div>
      <div class="empty-state" id="empty-state" hidden><span aria-hidden="true">⌕</span><h2>За цими параметрами нічого не знайдено</h2><p>Змініть параметри пошуку або очистьте фільтри.</p><button class="button button--secondary" id="reset-empty" type="button">Очистити фільтри</button></div>
      <div class="empty-state error-state" id="error-state" role="alert" hidden><span aria-hidden="true">!</span><h2>Не вдалося завантажити об’єкти</h2><p>Оновіть сторінку або спробуйте ще раз.</p><button class="button button--secondary" id="retry-catalog" type="button">Спробувати ще раз</button></div>
      <div class="load-more-wrap" id="load-more-wrap" hidden><button class="button button--secondary" id="load-more" type="button">Показати ще</button></div>
    </section>

    <section class="section section-shell compact-cta"><div><p class="eyebrow eyebrow--gold"><span></span> Маєте нерухомість?</p><h2>Запропонуйте об’єкт для розміщення в Dwelchain</h2></div><button class="button button--light" type="button" data-account-offer>Запропонувати об’єкт <span aria-hidden="true">→</span></button></section>
  </main>
  <div data-site-footer></div>
  <script type="module" src="{{ asset('assets/js/app.js') }}?v=20260726-selects3"></script>
</body>
</html>
