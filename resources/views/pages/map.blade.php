<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Орієнтовне розташування об’єктів Dwelchain у Києві. Фільтруйте нерухомість і переходьте до детальної сторінки об’єкта.">
  <title>Об’єкти на карті Києва | Dwelchain</title>
  <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('assets/images/favicon-32.png') }}">
  <link rel="apple-touch-icon" href="{{ asset('assets/images/favicon-180.png') }}">
  <link rel="stylesheet" href="{{ asset('assets/css/styles.css') }}?v=20260727-loaders1">
  @include('partials.boot')
</head>
<body data-page="map">
  <div data-site-header></div>
  <main>
    <section class="map-page-head section-shell">
      <nav class="breadcrumbs" aria-label="Навігаційний шлях"><a href="{{ url('/') }}">Головна</a><span>·</span><span>Карта</span></nav>
      <div class="map-page-head__row">
        <div>
          <p class="eyebrow"><span></span> Пошук за розташуванням</p>
          <h1>Об’єкти на карті Києва</h1>
          <p>Оберіть параметри та переглядайте приблизне розташування об’єктів. Точну адресу менеджер повідомить після підтвердження перегляду.</p>
        </div>
        <div class="map-page-head__count"><strong id="map-result-count">—</strong><span id="map-result-label">об’єктів</span></div>
      </div>
    </section>

    <section class="map-filter-wrap" aria-label="Фільтри карти">
      <form class="map-filter section-shell" id="map-filter">
        <div class="catalog-filter__primary">
          <label class="field field--compact"><span>Місто</span><select name="city"><option value="">Усі міста</option><option value="Київ" selected>Київ</option></select></label>
          <label class="field field--compact"><span>Тип угоди</span><select name="deal"><option value="">Усі угоди</option><option value="sale">Купівля</option><option value="rent">Оренда</option></select></label>
          <label class="field field--compact"><span>Район</span><select name="district"><option value="">Усі райони</option><option>Печерський</option><option>Шевченківський</option><option>Подільський</option><option>Голосіївський</option><option>Оболонський</option><option>Солом’янський</option></select></label>
          <label class="field field--compact"><span>Тип</span><select name="type"><option value="">Усі типи</option><option value="apartment">Квартира</option><option value="house">Будинок</option></select></label>
          <label class="field field--compact"><span>Кімнати</span><select name="rooms"><option value="">Будь-які</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></label>
          <label class="field field--compact"><span>Ціна від, $</span><input name="minPrice" type="number" min="0" step="100" placeholder="Від" aria-describedby="map-filter-error"></label>
          <label class="field field--compact"><span>Ціна до, $</span><input name="maxPrice" type="number" min="0" step="100" placeholder="До" aria-describedby="map-filter-error"></label>
          <button class="button button--primary" type="submit">Показати на карті <span aria-hidden="true">→</span></button>
        </div>
        <div class="catalog-filter__advanced" id="map-advanced-filters" hidden>
          <label class="field field--compact"><span>Площа від, м?</span><input name="minArea" type="number" min="0" step="1" placeholder="Від" aria-describedby="map-filter-error"></label>
          <label class="field field--compact"><span>Площа до, м?</span><input name="maxArea" type="number" min="0" step="1" placeholder="До" aria-describedby="map-filter-error"></label>
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
          <button class="button button--secondary filter-more-toggle" id="map-more-filters" type="button" aria-expanded="false" aria-controls="map-advanced-filters"><span>Більше фільтрів</span><i aria-hidden="true">↓</i></button>
          <a class="button button--secondary filter-map-link" id="catalog-view-link" href="{{ url('/catalog') }}">Показати списком <span aria-hidden="true">→</span></a>
          <button class="button button--secondary" type="reset">Очистити фільтри</button>
          <p class="map-filter__error" id="map-filter-error" role="alert" aria-live="assertive"></p>
        </div>
      </form>
    </section>

    <section class="map-explorer section-shell" aria-label="Карта та список нерухомості">
      <div class="map-catalog" id="map-catalog">
        <div class="map-catalog__surface" data-zoom="0">
          <span class="map-catalog__river" aria-hidden="true"></span>
          <span class="map-catalog__road map-catalog__road--one" aria-hidden="true"></span>
          <span class="map-catalog__road map-catalog__road--two" aria-hidden="true"></span>
          <span class="map-catalog__road map-catalog__road--three" aria-hidden="true"></span>
          <span class="map-catalog__road map-catalog__road--four" aria-hidden="true"></span>
          <span class="map-catalog__district map-catalog__district--one">Поділ</span>
          <span class="map-catalog__district map-catalog__district--two">Печерськ</span>
          <span class="map-catalog__district map-catalog__district--three">Голосіїв</span>
          <span class="map-catalog__district map-catalog__district--four">Оболонь</span>
          <div class="map-catalog__markers" id="map-markers"></div>
        </div>
        <article class="map-popup" id="map-popup" aria-live="polite" hidden></article>
        <div class="map-catalog__controls" aria-label="Масштаб карти">
          <button type="button" data-map-zoom="in" aria-label="Збільшити масштаб">+</button>
          <button type="button" data-map-zoom="out" aria-label="Зменшити масштаб">?</button>
        </div>
        <div class="map-catalog__notice"><span aria-hidden="true">⌖</span><div><strong>Приблизне розташування</strong><small>Маркери не відображають точні адреси приватних об’єктів</small></div></div>
      </div>

      <aside class="map-results" aria-labelledby="map-results-title">
        <div class="map-results__head"><div><p class="eyebrow"><span></span> Каталог</p><h2 id="map-results-title">Об’єкти поруч</h2></div><a id="map-catalog-link" href="{{ url('/catalog') }}">Сітка <span aria-hidden="true">→</span></a></div>
        <div class="map-results__loading" id="map-results-loading" role="status" aria-live="polite"><span class="sr-only">Завантажуємо об’єкти на карті…</span><i></i><i></i><i></i></div>
        <div class="map-results__list" id="map-results-list" aria-live="polite" hidden></div>
        <div class="map-results__empty" id="map-results-empty" hidden><span>?</span><strong>Об’єктів не знайдено</strong><p>Змініть параметри або очистіть фільтри.</p><button class="button button--secondary" type="button" id="map-reset-empty">Очистити фільтри</button></div>
        <div class="map-results__error" id="map-results-error" role="alert" hidden><span>!</span><strong>Не вдалося завантажити об’єкти</strong><p>Оновіть сторінку або спробуйте завантажити дані ще раз.</p><button class="button button--secondary" type="button" id="map-retry">Спробувати ще раз</button></div>
      </aside>
    </section>

    <section class="section section-shell contact">
      <div><p class="eyebrow"><span></span> Потрібна допомога?</p><h2>Уточніть розташування з менеджером</h2></div>
      <div class="contact__actions"><a class="button button--primary" href="{{ url('/catalog') }}">Переглянути каталог</a><button class="button button--secondary" type="button" data-modal-open="manager-modal">Зв’язатися з менеджером</button></div>
    </section>
  </main>
  <div data-site-footer></div>
  <script type="module" src="{{ asset('assets/js/app.js') }}?v=20260727-images1"></script>
</body>
</html>
