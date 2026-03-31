# @theyahia/amocrm-mcp

MCP server for amoCRM API -- leads, contacts, pipelines management.

## Tools

| Tool | Description |
|------|-------------|
| `get_leads` | Получить список сделок с фильтрацией и пагинацией |
| `create_lead` | Создать новую сделку |
| `get_contacts` | Получить список контактов |
| `create_contact` | Создать новый контакт |
| `get_pipelines` | Получить список воронок продаж и статусов |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AMOCRM_DOMAIN` | Домен вашего amoCRM (например `mycompany.amocrm.ru`) |
| `AMOCRM_ACCESS_TOKEN` | Access token для API |

## Installation

```bash
npx -y @theyahia/amocrm-mcp
```

## MCP Configuration

```json
{
  "mcpServers": {
    "amocrm": {
      "command": "npx",
      "args": ["-y", "@theyahia/amocrm-mcp"],
      "env": {
        "AMOCRM_DOMAIN": "mycompany.amocrm.ru",
        "AMOCRM_ACCESS_TOKEN": "your-token"
      }
    }
  }
}
```

## License

MIT
