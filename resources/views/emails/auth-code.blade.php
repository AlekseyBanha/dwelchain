<x-mail::message>
# {{ $purpose === 'password_reset' ? 'Відновлення пароля' : 'Підтвердження email' }}

Ваш код для Dwelchain:

**{{ $code }}**

Код дійсний {{ $ttlMinutes }} хв. Якщо ви не надсилали запит — проігноруйте цей лист.

Дякуємо,<br>
{{ config('app.name') }}
</x-mail::message>
