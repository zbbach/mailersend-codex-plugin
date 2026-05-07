# MailerSend Codex Plugin

This is a local Codex plugin for MailerSend. It adds MailerSend MCP tools and a Codex skill for transactional email workflows.

- A plugin manifest at `.codex-plugin/plugin.json`
- A dependency-free Node.js MCP server at `scripts/mailersend-mcp.mjs`
- A MailerSend skill at `skills/mailersend/SKILL.md`

## What It Can Do

- Send one transactional email
- Send bulk email payloads
- Check bulk email status
- Verify an email address
- List sending domains
- Fetch domain details
- Fetch domain DNS records
- Fetch delivery activity for a domain

## Configure

Create a MailerSend API token and expose it before running Codex with the plugin:

```bash
export MAILERSEND_API_TOKEN="..."
```

The server uses `https://api.mailersend.com/v1` by default. For tests or proxies, override it with:

```bash
export MAILERSEND_BASE_URL="https://api.mailersend.com/v1"
```

## Test

```bash
cd plugins/mailersend
npm run smoke
```

The smoke test verifies that the MCP server starts and lists MailerSend tools. It does not send email.

## Included Tools

- `mailersend_send_email`
- `mailersend_send_bulk_email`
- `mailersend_get_bulk_email_status`
- `mailersend_verify_email`
- `mailersend_list_domains`
- `mailersend_get_domain`
- `mailersend_get_domain_dns_records`
- `mailersend_get_activity`

The implementation follows the public MailerSend API endpoints for sending email, bulk email, domains, DNS records, email verification, and activity.

## Notes

- This plugin does not store your MailerSend token.
- Use only verified MailerSend sender domains for `from.email`.
- The MCP server is dependency-free and uses the built-in `fetch` available in Node.js 18+.
