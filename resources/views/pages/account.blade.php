<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Демонстраційний особистий кабінет орендаря або орендодавця Dwelchain.">
  <title>Особистий кабінет | Dwelchain</title>
  <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('assets/images/favicon-32.png') }}">
  <link rel="apple-touch-icon" href="{{ asset('assets/images/favicon-180.png') }}">
  <link rel="stylesheet" href="{{ asset('assets/css/styles.css') }}?v=20260727-loaders1">
  @include('partials.boot')
</head>
<body data-page="account" data-portal-page="account">
  @include('partials.account-icons')
  <div data-site-header></div>
  <main class="account-page">
    <div class="section-shell" id="account-root" aria-live="polite">
      <div class="portal-loading portal-loading--page" role="status"><span></span><b>Завантажуємо кабінет…</b></div>
    </div>
  </main>
  <div data-site-footer></div>
  <script type="module" src="{{ asset('assets/js/portal.js') }}?v=20260727-images1"></script>
</body>
</html>
