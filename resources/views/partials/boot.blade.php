<meta name="csrf-token" content="{{ csrf_token() }}">
<link rel="preload" as="image" href="{{ asset('assets/images/dwelchain-logo-clean.webp') }}" fetchpriority="high">
<script>
  window.Dwelchain = Object.assign({}, window.Dwelchain || {}, {
    csrfToken: @json(csrf_token()),
    authenticated: @json(auth()->check()),
    user: @json(auth()->user()?->toClientArray()),
    pendingEmailChange: @json(session('pending_email_change')),
    routes: {
      register: @json(url('/auth/register')),
      login: @json(url('/auth/login')),
      verify: @json(url('/auth/email/verify')),
      resend: @json(url('/auth/email/resend-code')),
      forgot: @json(url('/auth/password/forgot')),
      reset: @json(url('/auth/password/reset')),
      logout: @json(url('/auth/logout')),
      me: @json(url('/auth/me')),
      account: @json(url('/account')),
      auth: @json(url('/auth')),
      profileUpdate: @json(url('/account/profile')),
      profileEmailConfirm: @json(url('/account/profile/email/confirm')),
      profileEmailResend: @json(url('/account/profile/email/resend')),
      profileEmailCancel: @json(url('/account/profile/email/cancel'))
    },
    auth: {
      codeTtlMinutes: @json((int) config('dwelchain.auth.code_ttl_minutes', 10)),
      resendCooldownSeconds: @json((int) config('dwelchain.auth.resend_cooldown_seconds', 60)),
      passwordMin: @json((int) config('dwelchain.auth.password_min', 8))
    }
  });
</script>
