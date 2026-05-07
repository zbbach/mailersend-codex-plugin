---
name: mailersend
description: Use MailerSend from Codex to send transactional email, verify email addresses, inspect sending domains, DNS records, bulk email status, and delivery activity.
---

# MailerSend

Use this skill when the user asks to send or inspect transactional email through MailerSend.

## Requirements

- The MCP server reads `MAILERSEND_API_TOKEN` from the environment.
- Use only verified MailerSend sender domains for `from.email`.
- Confirm recipient, subject, and message body before sending to real recipients unless the user has already supplied all send details in the same turn.

## Available MCP Tools

- `mailersend_send_email`: Send one asynchronous transactional email with `from`, `to`, `subject`, and optional `text`, `html`, `template_id`, `personalization`, `cc`, `bcc`, `reply_to`, `tags`, `metadata`, `attachments`, and `send_at`.
- `mailersend_send_bulk_email`: Send an array of email payloads through the bulk endpoint.
- `mailersend_get_bulk_email_status`: Check the status and validation errors for a bulk send.
- `mailersend_verify_email`: Validate a single email address.
- `mailersend_list_domains`: List sending domains, optionally filtered by `verified`.
- `mailersend_get_domain`: Fetch one domain by ID.
- `mailersend_get_domain_dns_records`: Fetch DNS records for a domain.
- `mailersend_get_activity`: Fetch domain activity using `domain_id`, `date_from`, and `date_to` Unix timestamps.

## Safety Defaults

- Do not invent email copy for outbound messages unless the user asks for drafting help.
- Prefer plain-text plus HTML only when the user supplies or approves both.
- Surface the returned `x-message-id` after a successful single email send.
