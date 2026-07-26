<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Демонстраційні екрани входу, реєстрації та відновлення доступу до кабінету Dwelchain.">
  <title>Вхід до кабінету | Dwelchain</title>
  <link rel="icon" type="image/png" href="{{ asset('assets/images/dwelchain-mark.png') }}">
  <link rel="stylesheet" href="{{ asset('assets/css/styles.css') }}?v=20260726-selects4">
  @include('partials.boot')
</head>
<body data-page="auth" data-portal-page="auth">
  <div data-site-header></div>
  <main class="auth-page">
    <section class="auth-layout section-shell" aria-labelledby="auth-page-title">
      <aside class="auth-intro">
        <p class="eyebrow eyebrow--gold"><span></span> Особистий кабінет</p>
        <h1 id="auth-page-title">Ваші об’єкти та заявки — в одному просторі</h1>
        <p>Переглядайте збережені пропозиції, контролюйте запити на перегляд або керуйте власними оголошеннями.</p>
        <ul>
          <li><b>Для орендаря</b><span>Збережені об’єкти й заплановані перегляди.</span></li>
          <li><b>Для орендодавця</b><span>Власні оголошення та запити від клієнтів.</span></li>
        </ul>
      </aside>
      <section class="auth-card" id="auth-root" aria-live="polite">
        <div class="portal-loading" role="status"><span></span><b>Готуємо форму…</b></div>
      </section>
    </section>
  </main>
  <div data-site-footer></div>
  <script type="module" src="{{ asset('assets/js/portal.js') }}?v=20260726-selects3"></script>
</body>
</html>
