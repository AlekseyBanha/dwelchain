<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Нерухомість у Києві для життя та інвестицій. Порівнюйте ціни, характеристики й райони, обирайте об’єкт і звертайтеся до менеджера щодо перегляду.">
  <title>Нерухомість у Києві для купівлі та оренди | Dwelchain</title>
  <link rel="icon" type="image/png" href="{{ asset('assets/images/dwelchain-mark.png') }}">
  <link rel="stylesheet" href="{{ asset('assets/css/styles.css') }}?v=20260727-loaders1">
  @include('partials.boot')
</head>
<body data-page="home">
  <div data-site-header></div>
  <main>
    <section class="home-hub section-shell" data-section-tone="light" aria-labelledby="home-hub-title">
      <div class="home-hub__browser">
        <div class="home-hub__top">
          <div>
            <p class="eyebrow"><span></span> Пошук нерухомості</p>
            <h2>Оберіть потрібний напрям</h2>
          </div>
          <label class="hub-city">
            <span>Місто</span>
            <select id="home-city" aria-label="Місто"><option value="Київ">Київ</option></select>
          </label>
        </div>

        <div class="hub-group">
          <div class="hub-group__heading"><h3>Купівля</h3><a href="{{ url('/catalog') }}?deal=sale">Усі об’єкти <span aria-hidden="true">→</span></a></div>
          <div class="hub-tiles">
            <a class="hub-tile" href="{{ url('/catalog') }}?deal=sale" aria-label="Усі об’єкти для купівлі"><img src="{{ asset('assets/images/residence.png') }}" alt=""><span>Усі об’єкти</span></a>
            <a class="hub-tile" href="{{ url('/catalog') }}?deal=sale&amp;type=apartment"><img src="{{ asset('assets/images/living-room.png') }}" alt=""><span>Квартири</span></a>
            <a class="hub-tile" href="{{ url('/catalog') }}?deal=sale&amp;type=house"><img src="{{ asset('assets/images/villa.png') }}" alt=""><span>Будинки</span></a>
            <a class="hub-tile" href="{{ url('/catalog') }}?city=Київ&amp;deal=sale&amp;type=house&amp;buildingType=townhouse"><img src="{{ asset('assets/images/villa.png') }}" alt=""><span>Таунхауси</span></a>
          </div>
        </div>

        <div class="hub-group">
          <div class="hub-group__heading"><h3>Оренда</h3><a href="{{ url('/catalog') }}?deal=rent">Усі об’єкти <span aria-hidden="true">→</span></a></div>
          <div class="hub-tiles">
            <a class="hub-tile" href="{{ url('/catalog') }}?deal=rent" aria-label="Усі об’єкти для оренди"><img src="{{ asset('assets/images/bedroom.png') }}" alt=""><span>Усі об’єкти</span></a>
            <a class="hub-tile" href="{{ url('/catalog') }}?deal=rent&amp;type=apartment"><img src="{{ asset('assets/images/living-room.png') }}" alt=""><span>Квартири</span></a>
            <a class="hub-tile" href="{{ url('/catalog') }}?deal=rent&amp;type=house"><img src="{{ asset('assets/images/residence.png') }}" alt=""><span>Будинки</span></a>
            <a class="hub-tile" href="{{ url('/catalog') }}?city=Київ&amp;deal=rent&amp;type=house&amp;buildingType=townhouse"><img src="{{ asset('assets/images/villa.png') }}" alt=""><span>Таунхауси</span></a>
          </div>
        </div>

        <form class="hub-search" id="hero-search" aria-label="Пошук за параметрами">
          <label class="field field--compact"><span>Угода</span><select name="deal"><option value="sale">Купівля</option><option value="rent">Оренда</option></select></label>
          <label class="field field--compact"><span>Тип</span><select name="type"><option value="">Усі типи</option><option value="apartment">Квартира</option><option value="house">Будинок</option></select></label>
          <label class="field field--compact"><span>Район</span><select name="district"><option value="">Усі райони</option><option>Печерський</option><option>Шевченківський</option><option>Подільський</option><option>Голосіївський</option><option>Оболонський</option><option>Солом’янський</option></select></label>
          <label class="field field--compact"><span>Кімнати</span><select name="rooms"><option value="">Будь-які</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></label>
          <button class="button button--primary" type="submit">Переглянути об’єкти <span aria-hidden="true">→</span></button>
        </form>
      </div>

      <div class="home-hub__feature">
        <img src="{{ asset('assets/images/villa.png') }}" alt="Сучасний будинок із ландшафтним подвір’ям">
        <div class="home-hub__feature-copy">
          <p class="eyebrow eyebrow--gold"><span></span> Dwelchain · Київ</p>
          <h1 id="home-hub-title">Нерухомість для купівлі та оренди</h1>
          <p>Оберіть напрям, налаштуйте параметри та переходьте до об’єктів, які відповідають вашому запиту.</p>
          <div class="home-hub__actions">
            <a class="button button--primary" href="{{ url('/catalog') }}">Переглянути каталог <span aria-hidden="true">→</span></a>
            <button class="button button--primary" type="button" data-modal-open="manager-modal">Зв’язатися з менеджером</button>
          </div>
        </div>
        <a class="home-hub__property" href="{{ url('/property') }}?id=holosiivska-villa">
          <span>Рекомендований об’єкт</span>
          <strong>Будинок із садом у Голосіївському районі</strong>
          <b>Переглянути <span aria-hidden="true">↗</span></b>
        </a>
      </div>
    </section>

    <section class="section section-shell home-recommendations" id="featured" data-section-tone="dark">
      <div class="section-heading">
        <div><p class="eyebrow"><span></span> Добірка</p><h2>Рекомендовані об’єкти</h2></div>
      </div>
      <div class="recommendation-split">
        <section class="recommendation-group recommendation-group--sale" aria-labelledby="recommended-sale-title">
          <header class="recommendation-group__header">
            <div><span>Для купівлі</span><h3 id="recommended-sale-title">Рекомендовані об’єкти продажу</h3></div>
            <a href="{{ url('/catalog') }}?city=Київ&amp;deal=sale">Переглянути всі <span aria-hidden="true">→</span></a>
          </header>
          <div class="recommendation-group__slot" id="featured-sale"></div>
        </section>
        <section class="recommendation-group recommendation-group--rent" aria-labelledby="recommended-rent-title">
          <header class="recommendation-group__header">
            <div><span>Для оренди</span><h3 id="recommended-rent-title">Рекомендовані об’єкти оренди</h3></div>
            <a href="{{ url('/catalog') }}?city=Київ&amp;deal=rent">Переглянути всі <span aria-hidden="true">→</span></a>
          </header>
          <div class="recommendation-group__slot" id="featured-rent"></div>
        </section>
      </div>
    </section>

    <section class="operation-model" id="about" data-section-tone="light" aria-labelledby="operation-model-title">
      <div class="section-shell">
        <header class="operation-model__header">
          <p class="operation-model__label">Як працює платформа</p>
          <h2 id="operation-model-title">Шлях користувача в <span>Dwelchain</span></h2>
          <p>Від першого запиту до вибору конкретного об’єкта — у зрозумілій послідовності без непотрібних переходів.</p>
        </header>
        <div class="operation-model__grid">
          <article class="operation-card">
            <i aria-hidden="true">⌕</i>
            <span>Крок 01</span>
            <h3>Сформуйте запит</h3>
            <p>Оберіть місто, район, тип угоди, бюджет і потрібні характеристики нерухомості.</p>
          </article>
          <article class="operation-card">
            <i aria-hidden="true">◇</i>
            <span>Крок 02</span>
            <h3>Перегляньте добірку</h3>
            <p>Каталог покаже об’єкти, що відповідають заданим параметрам, із цінами та ключовими даними.</p>
          </article>
          <article class="operation-card">
            <i aria-hidden="true">⌖</i>
            <span>Крок 03</span>
            <h3>Оцініть розташування</h3>
            <p>Перемкніться на карту та перегляньте приблизне розташування пропозицій у районах Києва.</p>
          </article>
          <article class="operation-card">
            <i aria-hidden="true">▣</i>
            <span>Крок 04</span>
            <h3>Порівняйте деталі</h3>
            <p>Відкрийте фотографії, площу, поверх, опис та інші характеристики вибраного об’єкта.</p>
          </article>
          <article class="operation-card">
            <i aria-hidden="true">◷</i>
            <span>Крок 05</span>
            <h3>Оберіть час перегляду</h3>
            <p>Оберіть бажану дату й час та заповніть коротку форму запиту на перегляд.</p>
          </article>
          <article class="operation-card">
            <i aria-hidden="true">↗</i>
            <span>Крок 06</span>
            <h3>Уточніть запит</h3>
            <p>Скористайтеся формою зв’язку, щоб поставити запитання менеджеру щодо вибраного об’єкта.</p>
          </article>
        </div>
        <div class="operation-model__summary">
          <div>
            <h3>Один маршрут від параметрів до перегляду</h3>
            <p>Каталог, карта та детальна сторінка працюють як єдиний сценарій вибору нерухомості.</p>
          </div>
          <div class="operation-model__fact"><strong>Список + карта</strong><span>два режими пошуку</span></div>
          <div class="operation-model__fact"><strong>Картка об’єкта</strong><span>фото й характеристики</span></div>
          <a class="button button--primary" href="{{ url('/catalog') }}">Переглянути об’єкти <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>

    <section class="business-model" id="business-model" data-section-tone="dark" aria-labelledby="business-model-title">
      <div class="section-shell">
        <header class="business-model__header">
          <p class="business-model__label">?&nbsp; Як ми працюємо</p>
          <h2 id="business-model-title">Операційна модель <span>Dwelchain</span></h2>
          <p>Ми не просто сайт оголошень. Dwelchain — це команда спеціалістів, яка проходить кожен крок угоди разом з вами.</p>
        </header>

        <div class="business-model__grid">
          <article class="business-step">
            <i aria-hidden="true">✓</i>
            <span>Крок 01</span>
            <h3>Збір об’єктів спеціалістами</h3>
            <p>Штатні колектори Dwelchain виїжджають до власника, оглядають нерухомість, збирають документи та вносять об’єкт у систему.</p>
          </article>
          <article class="business-step">
            <i aria-hidden="true">▣</i>
            <span>Крок 02</span>
            <h3>Фото- та відеозйомка</h3>
            <p>Наш фотограф проводить професійну зйомку: широкоформатні фото, відеотур та планування приміщень для публікації на платформі.</p>
          </article>
          <article class="business-step">
            <i aria-hidden="true">▤</i>
            <span>Крок 03</span>
            <h3>Юридична консультація</h3>
            <p>Юрист перевіряє документи на об’єкт, виявляє обтяження та консультує власника ще до публікації оголошення.</p>
          </article>
          <article class="business-step">
            <i aria-hidden="true">▽</i>
            <span>Крок 04</span>
            <h3>CRM з фільтрами клієнтів</h3>
            <p>Дистанційні консультанти працюють через CRM: деталізовані профілі покупців і орендарів за бюджетом, районом, площею, кількістю кімнат і терміном. Підбір — точний і швидкий.</p>
          </article>
          <article class="business-step">
            <i aria-hidden="true">◉</i>
            <span>Крок 05</span>
            <h3>Покази субпідрядними агентами</h3>
            <p>Покази виконують субпідрядні агенти-шоумени. Вони не ведуть угоду — тільки представляють об’єкт і закривають показ. Отримують 25% комісії Dwelchain за кожен закритий показ.</p>
          </article>
          <article class="business-step">
            <i aria-hidden="true">♧</i>
            <span>Крок 06</span>
            <h3>Підтримка на всіх етапах</h3>
            <p>AI-асистент та call-центр доступні цілодобово: юридичні запити, статус угоди, бронювання показів — все в одному застосунку.</p>
          </article>
        </div>

        <div class="business-model__summary">
          <div class="business-model__summary-copy">
            <h3>Субпідрядний агент-шоумен</h3>
            <p>Dwelchain не наймає класичних рієлторів. Агенти-шоумени — незалежні підрядники, що спеціалізуються лише на проведенні показів та закритті зустрічей. Вони отримують <strong>25% від комісії Dwelchain</strong> за кожен успішний показ.</p>
            <p>Це означає: жодного тиску, жодних конфліктів інтересів. Агент зацікавлений лише в тому, щоб показ відбувся — рішення приймає клієнт.</p>
          </div>
          <div class="business-model__metric"><strong>25%</strong><span>комісії агенту від Dwelchain</span></div>
          <div class="business-model__metric"><strong>0</strong><span>конфліктів інтересів</span></div>
        </div>
      </div>
    </section>

    <section class="section-shell home-map-promo" data-section-tone="light" aria-labelledby="home-map-title">
      <div class="home-map-promo__visual" role="img" aria-label="Стилізована карта Києва з приблизними позначками вартості об’єктів">
        <span class="home-map-promo__river" aria-hidden="true"></span>
        <span class="home-map-promo__road home-map-promo__road--one" aria-hidden="true"></span>
        <span class="home-map-promo__road home-map-promo__road--two" aria-hidden="true"></span>
        <span class="home-map-promo__road home-map-promo__road--three" aria-hidden="true"></span>
        <span class="home-map-promo__district home-map-promo__district--one">Поділ</span>
        <span class="home-map-promo__district home-map-promo__district--two">Печерськ</span>
        <span class="home-map-promo__district home-map-promo__district--three">Голосіїв</span>
        <span class="home-map-promo__marker home-map-promo__marker--one"><b>285 000 $</b><i></i></span>
        <span class="home-map-promo__marker home-map-promo__marker--two"><b>540 000 $</b><i></i></span>
        <span class="home-map-promo__marker home-map-promo__marker--three"><b>1 200 $/міс.</b><i></i></span>
        <span class="home-map-promo__notice">Приблизне розташування</span>
      </div>
      <div class="home-map-promo__copy">
        <p class="eyebrow"><span></span> Пошук за районами</p>
        <h2 id="home-map-title">Досліджуйте об’єкти на карті</h2>
        <p>Переглядайте пропозиції у контексті районів Києва, звужуйте вибір фільтрами та відкривайте потрібний об’єкт зі списку поруч.</p>
        <div class="home-map-promo__points">
          <article><span>01</span><div><h3>Ціни на маркерах</h3><p>Швидко зіставляйте бюджет і район без переходу між картками.</p></div></article>
          <article><span>02</span><div><h3>Єдині фільтри</h3><p>Угода, тип, кімнати та максимальна ціна працюють прямо на сторінці карти.</p></div></article>
        </div>
        <a class="button button--primary" href="{{ url('/map') }}">Відкрити карту <span aria-hidden="true">→</span></a>
      </div>
    </section>

    <section class="investor-section" id="investors" data-section-tone="dark" aria-labelledby="investor-title">
      <div class="section-shell investor-section__layout">
        <div class="investor-section__copy">
          <p class="eyebrow eyebrow--gold"><span></span> Інвесторам</p>
          <h2 id="investor-title">Рішення починається з прозорого порівняння</h2>
          <p class="investor-section__lead">Dwelchain збирає в одному інтерфейсі дані, потрібні для первинної оцінки об’єкта: ціну, площу, район, характеристики та фотографії.</p>
          <div class="investor-benefits">
            <article><span>01</span><div><h3>Зрозуміла ціна входу</h3><p>Основна ціна, орієнтовний еквівалент у гривнях і ціна за м? відображаються безпосередньо в картці.</p></div></article>
            <article><span>02</span><div><h3>Контекст розташування</h3><p>Каталог і карта допомагають порівняти пропозиції у вибраних районах Києва.</p></div></article>
            <article><span>03</span><div><h3>Наступний крок із менеджером</h3><p>Сформулюйте критерії інвестиційного запиту та уточніть деталі конкретних об’єктів.</p></div></article>
          </div>
          <div class="investor-section__actions">
            <a class="button button--primary" href="{{ url('/catalog') }}?deal=sale">Переглянути об’єкти для купівлі <span aria-hidden="true">→</span></a>
            <button class="button button--dark-outline" type="button" data-modal-open="manager-modal">Обговорити запит</button>
          </div>
        </div>
        <aside class="investment-profile" aria-label="Приклад профілю об’єкта для первинного порівняння">
          <div class="investment-profile__top">
            <span>Приклад первинної оцінки</span>
            <b>Купівля</b>
          </div>
          <p>Квартира з панорамними вікнами на Печерську</p>
          <strong>285 000 $</strong>
          <div class="investment-profile__facts">
            <span><small>Площа</small><b>92 м?</b></span>
            <span><small>Кімнати</small><b>3</b></span>
            <span><small>Район</small><b>Печерський</b></span>
            <span><small>Ціна за м?</small><b>3 098 $</b></span>
          </div>
          <div class="investment-profile__route">
            <span>Каталог</span><i></i><span>Карта</span><i></i><span>Перегляд</span>
          </div>
          <a href="{{ url('/property') }}?id=pechersk-skyline">Відкрити приклад об’єкта <span aria-hidden="true">↗</span></a>
          <small>Дохідність та інвестиційні ризики потребують окремої оцінки. Інформація має ознайомчий характер і не є фінансовою рекомендацією.</small>
        </aside>
      </div>
    </section>

    <section class="section section-shell owner-cta" data-section-tone="light">
      <div class="owner-cta__image"><img src="{{ asset('assets/images/residence.png') }}" alt="Житловий комплекс із внутрішнім зеленим подвір’ям"></div>
      <div class="owner-cta__copy"><p class="eyebrow eyebrow--gold"><span></span> Для власників і девелоперів</p><h2>Запропонуйте об’єкт для розміщення</h2><p>Додайте основні дані про квартиру, будинок або інший об’єкт. Менеджер допоможе уточнити інформацію для майбутнього розміщення.</p><button class="button button--light" type="button" data-account-offer>Запропонувати об’єкт <span aria-hidden="true">→</span></button></div>
    </section>

    <section class="section section-shell contact" id="contacts" data-section-tone="dark">
      <div class="contact__copy"><p class="eyebrow"><span></span> Потрібна допомога?</p><h2>Уточніть деталі з менеджером</h2><p>Поставте запитання щодо пошуку, конкретного об’єкта або підготовки до перегляду.</p></div>
      <div class="contact__details" aria-label="Контактні дані Dwelchain">
        <a href="tel:+380441234567"><span>Телефон</span><strong>+380 44 123 45 67</strong></a>
        <a href="mailto:hello@dwelchain.com"><span>Email</span><strong>hello@dwelchain.com</strong></a>
        <div><span>Місто</span><strong>Київ, Україна</strong></div>
        <div><span>Графік</span><strong>Пн–Пт, 09:00–18:00</strong></div>
      </div>
      <div class="contact__actions"><a class="button button--primary" href="{{ url('/catalog') }}">Переглянути об’єкти</a><button class="button button--secondary" type="button" data-modal-open="manager-modal">Зв’язатися з менеджером</button></div>
    </section>
  </main>
  <div data-site-footer></div>
  <script type="module" src="{{ asset('assets/js/app.js') }}?v=20260726-selects3"></script>
</body>
</html>
