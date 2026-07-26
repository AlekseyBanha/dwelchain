<meta name="csrf-token" content="{{ csrf_token() }}">
<script>
  window.Dwelchain = Object.assign({}, window.Dwelchain || {}, {
    csrfToken: @json(csrf_token()),
    authenticated: @json(auth()->check()),
    user: @json(auth()->user()?->toClientArray()),
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
      auth: @json(url('/auth'))
    },
    auth: {
      codeTtlMinutes: @json((int) config('dwelchain.auth.code_ttl_minutes', 10)),
      resendCooldownSeconds: @json((int) config('dwelchain.auth.resend_cooldown_seconds', 60)),
      passwordMin: @json((int) config('dwelchain.auth.password_min', 8))
    }
  });
</script>
