> ## 🗄 Репозиторий заархивирован
>
> Разработка переехала в **[theYahia/WWmcp](https://github.com/theYahia/WWmcp)** — монорепозиторий MCP-серверов для незападных API: СНГ, MENA, Африка, LATAM, Юго-Восточная Азия. Общее ядро `@theyahia/mcp-core`, единый CI, единый релизный конвейер.
>
> Актуальная версия того, что лежало здесь: [`servers/amocrm/`](https://github.com/theYahia/WWmcp/tree/main/servers/amocrm)
>
> Пакет в npm прежний — [`@theyahia/amocrm-mcp`](https://www.npmjs.com/package/@theyahia/amocrm-mcp), ставится и работает как раньше.
> Здесь больше ничего не обновляется. Задачи и pull request'ы — в WWmcp.
>
> **Archived — development moved to [theYahia/WWmcp](https://github.com/theYahia/WWmcp),** a monorepo of MCP servers for non-Western APIs.
> The current version of this package now lives at [`servers/amocrm/`](https://github.com/theYahia/WWmcp/tree/main/servers/amocrm).
> The npm package [`@theyahia/amocrm-mcp`](https://www.npmjs.com/package/@theyahia/amocrm-mcp) is unchanged.
> Please open issues and pull requests there.

# amoCRM MCP — сделки, контакты и воронка продаж через нейросеть

Если вы искали, как подключить amoCRM к ИИ-ассистенту, спросить состояние воронки обычными словами, завести сделку или найти контакт не открывая интерфейс — это оно. 19 инструментов для [amoCRM](https://www.amocrm.ru/): сделки, контакты, компании, воронки, задачи, примечания, поиск, события и неразобранное. OAuth 2.0 с автообновлением токена, ограничение 7 запросов/сек и повтор с экспоненциальной задержкой.

## Установка

```bash
npx -y @theyahia/amocrm-mcp
```

## Настройка MCP

Добавьте в конфигурацию Claude Desktop, Cursor или любого другого MCP-клиента:

```json
{
  "mcpServers": {
    "amocrm": {
      "command": "npx",
      "args": ["-y", "@theyahia/amocrm-mcp"],
      "env": {
        "AMOCRM_SUBDOMAIN": "mycompany",
        "AMOCRM_ACCESS_TOKEN": "your-access-token",
        "AMOCRM_REFRESH_TOKEN": "your-refresh-token",
        "AMOCRM_CLIENT_ID": "your-client-id",
        "AMOCRM_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## Переменные окружения

| Переменная | Обяз. | Описание |
|----------|----------|-------------|
| `AMOCRM_SUBDOMAIN` | да | Поддомен вашего amoCRM (например, `mycompany` из `mycompany.amocrm.ru`) |
| `AMOCRM_ACCESS_TOKEN` | да | OAuth access-токен |
| `AMOCRM_REFRESH_TOKEN` | нет | OAuth refresh-токен (включает автообновление при 401) |
| `AMOCRM_CLIENT_ID` | нет | OAuth client ID (нужен для обновления токена) |
| `AMOCRM_CLIENT_SECRET` | нет | OAuth client secret (нужен для обновления токена) |

> `AMOCRM_DOMAIN` тоже принимается как алиас `AMOCRM_SUBDOMAIN` (обратная совместимость).

## Инструменты (19)

### Сделки
| Инструмент | Описание |
|------|-------------|
| `list_leads` | Поиск и список сделок с фильтрами (воронка, статусы, запрос). Подтягивает контакты и причины отказа. |
| `get_lead` | Одна сделка по ID вместе со связанными контактами и элементами каталога. |
| `create_lead` | Создать сделку с названием, бюджетом, воронкой, статусом и пользовательскими полями. |
| `update_lead` | Обновить поля сделки — перевести между этапами, изменить бюджет, сменить ответственного. |

### Контакты
| Инструмент | Описание |
|------|-------------|
| `list_contacts` | Поиск контактов по имени, телефону, e-mail. |
| `get_contact` | Один контакт со всеми пользовательскими полями. |
| `create_contact` | Создать контакт с телефоном, e-mail и пользовательскими полями. |

### Компании
| Инструмент | Описание |
|------|-------------|
| `list_companies` | Поиск компаний. Подтягивает связанные сделки и контакты. |
| `create_company` | Создать компанию с пользовательскими полями. |

### Воронки
| Инструмент | Описание |
|------|-------------|
| `list_pipelines` | Все воронки продаж вместе с их статусами (этапами). |

### Задачи
| Инструмент | Описание |
|------|-------------|
| `list_tasks` | Список задач с фильтрами по сущности, выполненности и ответственному. |
| `create_task` | Создать задачу, привязанную к сделке, контакту или компании, с дедлайном. |
| `complete_task` | Отметить задачу выполненной и добавить текст результата. |

### Неразобранное
| Инструмент | Описание |
|------|-------------|
| `list_unsorted` | Входящие неразобранные заявки (формы, разбор почты). |
| `accept_unsorted` | Принять неразобранную заявку в воронку. |

### Примечания
| Инструмент | Описание |
|------|-------------|
| `add_note` | Добавить примечание (common, call_in, call_out, service_message) к любой сущности. |

### Поиск
| Инструмент | Описание |
|------|-------------|
| `search` | Универсальный поиск по сделкам, контактам и компаниям. |

### События
| Инструмент | Описание |
|------|-------------|
| `list_events` | Лента событий — смены статусов, звонки, примечания, связи. |

### Аккаунт
| Инструмент | Описание |
|------|-------------|
| `get_account` | Информация об аккаунте, пользователи, типы задач, настройки amojo. |

## Демо-промпты

**Обзор продаж:**
> «Покажи все сделки в воронке „Продажи“, которые сейчас на этапе „Переговоры“. С контактами.»

**Работа с задачами:**
> «Создай задачу-перезвон по сделке #12345, дедлайн завтра в 10:00. Потом выведи все мои невыполненные задачи.»

**Заведение нового клиента:**
> «Создай контакт „Иван Петров“ с телефоном +79001234567, потом компанию „Петров Солюшнс“ и сделку „Разработка сайта“ на 150 000 рублей в основной воронке.»

## Как настроить OAuth 2.0

1. Откройте настройки аккаунта amoCRM: `https://YOUR_SUBDOMAIN.amocrm.ru/settings/widgets/`
2. Создайте новую интеграцию (внешняя интеграция)
3. Укажите redirect URI: `https://YOUR_SUBDOMAIN.amocrm.ru`
4. Скопируйте **Client ID** и **Client Secret**
5. Авторизуйте интеграцию, чтобы получить первичный **код авторизации**
6. Обменяйте код на токены:

```bash
curl -X POST https://YOUR_SUBDOMAIN.amocrm.ru/oauth2/access_token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "grant_type": "authorization_code",
    "code": "YOUR_AUTH_CODE",
    "redirect_uri": "https://YOUR_SUBDOMAIN.amocrm.ru"
  }'
```

7. Сохраните `access_token` и `refresh_token` из ответа
8. Сервер сам обновит просроченный токен, если заданы `AMOCRM_REFRESH_TOKEN`, `AMOCRM_CLIENT_ID` и `AMOCRM_CLIENT_SECRET`

## Обработка ошибок

- **401 Unauthorized** — автообновление токена, если настроены реквизиты для refresh, затем повтор запроса
- **429 Rate Limited** — учитывает заголовок `Retry-After`, ждёт и повторяет
- **5xx** — повтор с экспоненциальной задержкой (до 3 попыток)
- **Ограничение частоты** — встроенная пауза 150 мс между запросами (~7 запросов/сек), чтобы укладываться в лимиты amoCRM

## Разработка

```bash
git clone https://github.com/theYahia/amocrm-mcp.git
cd amocrm-mcp
npm install
npm run build
npm test
```

## Лицензия

MIT

---

Telegram: [@vhodvai](https://t.me/vhodvai)
