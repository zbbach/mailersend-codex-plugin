#!/usr/bin/env node

const API_BASE_URL = process.env.MAILERSEND_BASE_URL || "https://api.mailersend.com/v1";

const tools = [
  {
    name: "mailersend_send_email",
    description: "Send an asynchronous transactional email through MailerSend. Returns the x-message-id when MailerSend accepts it.",
    inputSchema: {
      type: "object",
      required: ["from", "to", "subject"],
      properties: {
        from: { $ref: "#/$defs/emailIdentity" },
        to: { type: "array", minItems: 1, items: { $ref: "#/$defs/emailIdentity" } },
        subject: { type: "string" },
        text: { type: "string" },
        html: { type: "string" },
        template_id: { type: "string" },
        cc: { type: "array", items: { $ref: "#/$defs/emailIdentity" } },
        bcc: { type: "array", items: { $ref: "#/$defs/emailIdentity" } },
        reply_to: { $ref: "#/$defs/emailIdentity" },
        tags: { type: "array", items: { type: "string" } },
        personalization: { type: "array", items: { type: "object" } },
        metadata: { type: "object", additionalProperties: true },
        attachments: { type: "array", items: { type: "object" } },
        send_at: { type: "integer", description: "Unix timestamp for scheduled send time." }
      },
      $defs: {
        emailIdentity: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string" },
            name: { type: "string" }
          }
        }
      }
    }
  },
  {
    name: "mailersend_send_bulk_email",
    description: "Send multiple asynchronous email payloads through MailerSend bulk email.",
    inputSchema: {
      type: "object",
      required: ["messages"],
      properties: {
        messages: {
          type: "array",
          minItems: 1,
          items: { type: "object", additionalProperties: true }
        }
      }
    }
  },
  {
    name: "mailersend_get_bulk_email_status",
    description: "Get validation and processing status for a MailerSend bulk email request.",
    inputSchema: {
      type: "object",
      required: ["bulk_email_id"],
      properties: {
        bulk_email_id: { type: "string" }
      }
    }
  },
  {
    name: "mailersend_verify_email",
    description: "Verify a single email address through MailerSend Email Verification.",
    inputSchema: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string" }
      }
    }
  },
  {
    name: "mailersend_list_domains",
    description: "List MailerSend sending domains.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "integer" },
        limit: { type: "integer", minimum: 10, maximum: 100 },
        verified: { type: "boolean" }
      }
    }
  },
  {
    name: "mailersend_get_domain",
    description: "Get a single MailerSend domain by ID.",
    inputSchema: {
      type: "object",
      required: ["domain_id"],
      properties: {
        domain_id: { type: "string" }
      }
    }
  },
  {
    name: "mailersend_get_domain_dns_records",
    description: "Get DNS records for a MailerSend domain.",
    inputSchema: {
      type: "object",
      required: ["domain_id"],
      properties: {
        domain_id: { type: "string" }
      }
    }
  },
  {
    name: "mailersend_get_activity",
    description: "Get delivery activity for a MailerSend domain over a timestamp range.",
    inputSchema: {
      type: "object",
      required: ["domain_id", "date_from", "date_to"],
      properties: {
        domain_id: { type: "string" },
        date_from: { type: "integer", description: "UTC Unix timestamp." },
        date_to: { type: "integer", description: "UTC Unix timestamp." },
        page: { type: "integer" },
        limit: { type: "integer", minimum: 10, maximum: 100 },
        event: { type: "array", items: { type: "string" } }
      }
    }
  }
];

const toolHandlers = {
  mailersend_send_email: (args) => mailersendRequest("POST", "/email", args, { includeHeaders: ["x-message-id"] }),
  mailersend_send_bulk_email: (args) => mailersendRequest("POST", "/bulk-email", args.messages),
  mailersend_get_bulk_email_status: (args) => mailersendRequest("GET", `/bulk-email/${encodeURIComponent(args.bulk_email_id)}`),
  mailersend_verify_email: (args) => mailersendRequest("POST", "/email-verification/verify", { email: args.email }),
  mailersend_list_domains: (args) => mailersendRequest("GET", withQuery("/domains", args)),
  mailersend_get_domain: (args) => mailersendRequest("GET", `/domains/${encodeURIComponent(args.domain_id)}`),
  mailersend_get_domain_dns_records: (args) => mailersendRequest("GET", `/domains/${encodeURIComponent(args.domain_id)}/dns-records`),
  mailersend_get_activity: (args) => {
    const { domain_id, ...query } = args;
    return mailersendRequest("GET", withQuery(`/activity/${encodeURIComponent(domain_id)}`, query));
  }
};

function withQuery(path, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) query.append(`${key}[]`, String(item));
    } else {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

async function mailersendRequest(method, path, body, options = {}) {
  const token = process.env.MAILERSEND_API_TOKEN;
  if (!token || token === "${MAILERSEND_API_TOKEN}") {
    throw new Error("MAILERSEND_API_TOKEN is required. Create a MailerSend API token and expose it in the Codex environment.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest"
  };

  const request = { method, headers };
  if (body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, request);
  const responseText = await response.text();
  let responseBody = null;
  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  }

  const selectedHeaders = {};
  for (const header of options.includeHeaders || []) {
    const value = response.headers.get(header);
    if (value) selectedHeaders[header] = value;
  }

  const result = {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: selectedHeaders,
    body: responseBody
  };

  if (!response.ok) {
    const error = new Error(`MailerSend request failed with ${response.status} ${response.statusText}`);
    error.result = result;
    throw error;
  }

  return result;
}

const serverInfo = {
  name: "mailersend",
  version: "0.1.0"
};

process.stdin.setEncoding("utf8");
let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line) void handleLine(line);
  }
});

async function handleLine(line) {
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    sendError(null, -32700, "Parse error", { message: error.message });
    return;
  }

  if (!Object.hasOwn(message, "id")) return;

  try {
    if (message.method === "initialize") {
      sendResult(message.id, {
        protocolVersion: message.params?.protocolVersion || "2024-11-05",
        capabilities: { tools: {} },
        serverInfo
      });
      return;
    }

    if (message.method === "tools/list") {
      sendResult(message.id, { tools });
      return;
    }

    if (message.method === "tools/call") {
      const name = message.params?.name;
      const args = message.params?.arguments || {};
      const handler = toolHandlers[name];
      if (!handler) {
        sendError(message.id, -32602, `Unknown tool: ${name}`);
        return;
      }
      const result = await handler(args);
      sendResult(message.id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      });
      return;
    }

    sendError(message.id, -32601, `Method not found: ${message.method}`);
  } catch (error) {
    sendResult(message.id, {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(error.result || { error: error.message }, null, 2)
        }
      ]
    });
  }
}

function sendResult(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function sendError(id, code, message, data) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } })}\n`);
}
