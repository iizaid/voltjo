# VoltJo Auth Email Branding

This file covers branding and operational guidance for VoltJo authentication emails. It does not add SMTP or template code to the application.

## Supabase Dashboard Paths

Supabase currently exposes hosted auth email branding from the dashboard auth area.

- Email templates: `Authentication -> Email Templates`
- SMTP / custom mail delivery: look in the Supabase auth settings area for the SMTP or Custom SMTP section. Dashboard labels can shift slightly between releases, so verify the exact section name in your current project UI.

If you need automation later, Supabase also supports auth configuration through its Management API. Keep that outside the product runtime.

## Production Recommendation

Use a branded sender identity in production:

```txt
VoltJo <no-reply@your-domain>
```

Use Custom SMTP before launch. Default hosted mail delivery is acceptable for development and internal testing, but it is not the right long-term setup for branded transactional email.

## Security Rules

- Never commit SMTP usernames, passwords, tokens, or provider credentials to GitHub.
- Never place SMTP secrets in client code.
- Store production email credentials only in secure server-side environment management.
- Rotate credentials immediately if they are ever exposed.

## Recommended Arabic Confirmation Copy

Subject:

```txt
فعّل حسابك في VoltJo
```

Body:

```txt
مرحبًا،

شكرًا لإنشاء حسابك في VoltJo.
اضغط على رابط التأكيد أدناه لتفعيل حسابك وإكمال تسجيل الدخول.

إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.

VoltJo
```

## Recommended English Confirmation Copy

Subject:

```txt
Confirm your VoltJo account
```

Body:

```txt
Hello,

Thanks for creating your VoltJo account.
Use the confirmation link below to activate your account and complete sign-in.

If you did not request this account, you can safely ignore this email.

VoltJo
```

## Operational Notes

- Review every auth email template before production launch, not only signup confirmation.
- Check Arabic rendering in major inboxes, especially Gmail web/mobile.
- Confirm that the email link target points back to the VoltJo auth callback flow, not a generic Supabase-hosted experience.
