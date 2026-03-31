# @theyahia/amocrm-mcp

Lightweight MCP server for amoCRM API. 10 tools, OAuth 2.0 with auto-refresh, zero config.

> **Why not [caiborg-ai/amocrm-mcp](https://github.com/caiborg-ai/amocrm-mcp)?**
> That project has 36 tools covering every corner of amoCRM API — great if you need full coverage.
> **This one is built for plug & play:** 10 essential tools that cover 90% of daily CRM workflows, minimal setup, fast startup. Pick the one that fits.

---

## Tools (10)

| # | Tool | Description |
|---|------|-------------|
| 1 | `get_leads` | Get leads with filtering and pagination |
| 2 | `create_lead` | Create a new lead |
| 3 | `update_lead` | Update lead (name, price, status, pipeline) |
| 4 | `get_contacts` | Get contacts with filtering and pagination |
| 5 | `create_contact` | Create a new contact |
| 6 | `get_companies` | Get companies with filtering and pagination |
| 7 | `get_pipelines` | Get sales pipelines and statuses |
| 8 | `create_task` | Create a task (call, meeting, email) |
| 9 | `add_note` | Add a note to lead/contact/company |
| 10 | `search` | Universal CRM search |

## Skills (LLM prompts)

| Skill | What it does |
|-------|-------------|
| `skill-enrich-lead` | Enrich lead by INN via dadata-mcp |
| `skill-pipeline-report` | Pipeline report: leads by stage with totals |

## Auth: OAuth 2.0

| Variable | Required | Description |
|----------|----------|-------------|
| `AMOCRM_DOMAIN` | Yes | amoCRM domain (`mycompany.amocrm.ru`) |
| `AMOCRM_ACCESS_TOKEN` | Yes | OAuth access token |
| `AMOCRM_REFRESH_TOKEN` | - | Refresh token (for auto-renewal) |
| `AMOCRM_CLIENT_ID` | - | Integration Client ID |
| `AMOCRM_CLIENT_SECRET` | - | Integration Client Secret |

**Auto-refresh:** on 401, the server automatically calls `POST /oauth2/access_token` with refresh_token and retries the request. All 5 env vars needed for this.

No integration? Just use `AMOCRM_DOMAIN` + `AMOCRM_ACCESS_TOKEN` — works as a Bearer token.

## Installation

```bash
npx -y @theyahia/amocrm-mcp
```

## MCP Configuration (Claude Desktop / Cursor)

```json
{
  "mcpServers": {
    "amocrm": {
      "command": "npx",
      "args": ["-y", "@theyahia/amocrm-mcp"],
      "env": {
        "AMOCRM_DOMAIN": "mycompany.amocrm.ru",
        "AMOCRM_ACCESS_TOKEN": "your-access-token",
        "AMOCRM_REFRESH_TOKEN": "your-refresh-token",
        "AMOCRM_CLIENT_ID": "your-client-id",
        "AMOCRM_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## Streamable HTTP (remote / multi-client)

```bash
npx @theyahia/amocrm-mcp --http 3000
# Endpoint: POST http://localhost:3000/mcp
# Health:   GET  http://localhost:3000/health
```

## Smithery

[![smithery badge](https://smithery.ai/badge/@theyahia/amocrm-mcp)](https://smithery.ai/server/@theyahia/amocrm-mcp)

Config in `smithery.yaml` — all 5 env vars supported.

---

**Need amoCRM?** Sign up here: [amostart.ru](https://www.amostart.ru)

## License

MIT
