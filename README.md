# TGStat MCP HTTP Bridge

HTTP-обёртка для [@theyahia/tgstat-mcp](https://www.npmjs.com/package/@theyahia/tgstat-mcp) с транспортом Streamable HTTP.
Позволяет использовать TGStat MCP Server через HTTP — идеально для развёртывания на облачных платформах.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mrvolkomorov/tgstat-mcp-http)

---

## Быстрый деплой (один клик)

### Render

1. Нажми кнопку **Deploy to Render** выше
2. Подключи GitHub-аккаунт (если ещё не подключён)
3. Введи `TGSTAT_TOKEN` — свой API-токен TGStat
4. Нажми **Apply** — через минуту сервер будет готов

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-url)

1. Нажми **Deploy on Railway**
2. Добавь переменную окружения `TGSTAT_TOKEN`
3. Готово

---

## Переменные окружения

| Переменная | Обязательно | Описание |
|------------|:-----------:|----------|
| `TGSTAT_TOKEN` | ✅ | API-токен TGStat (получить: https://tgstat.ru/api) |

## Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/mcp` | MCP JSON-RPC endpoint (Streamable HTTP) |
| `GET`  | `/health` | Health check |

## Локальный запуск

```bash
TGSTAT_TOKEN=your_token_here npm start
```

## Ревью кода

Код полностью совместим с Render. Единственная особенность — в `start` скрипте используется `rm -rf node_modules/.cache` для сброса кэша npx на Railway. На Render это не нужно, но и не вредит. Подробнее см. [Issue #1](https://github.com/mrvolkomorov/tgstat-mcp-http/issues).
