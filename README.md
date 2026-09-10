# TGStat MCP HTTP Bridge

HTTP-обёртка для [@theyahia/tgstat-mcp](https://www.npmjs.com/package/@theyahia/tgstat-mcp) с транспортом Streamable HTTP.
Позволяет использовать TGStat MCP Server через HTTP — идеально для развёртывания на облачных платформах.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mrvolkomorov/tgstat-mcp-http)

---

## Быстрый деплой (один клик)

### Render ✅

1. Нажми кнопку **Deploy to Render** выше
2. Подключи GitHub-аккаунт (если ещё не подключён)
3. Введи `TGSTAT_TOKEN` — свой API-токен TGStat
4. Нажми **Apply** — через минуту сервер будет готов

### Northflank 🚀

> Northflank не поддерживает кнопку деплоя для произвольных репозиториев — только для шаблонов из [Stacks](https://northflank.com/stacks).
> Создать проект вручную через Northflank Dashboard — 2 минуты:

1. Зарегистрируйся / войди в [Northflank Dashboard](https://app.northflank.com)
2. Создай новый проект (если нет) → **New Project**
3. Внутри проекта: **Add Service → Web Service**
4. Подключи GitHub и выбери репозиторий `mrvolkomorov/tgstat-mcp-http`
5. В настройках Build выбери **Dockerfile** (он уже есть в репозитории)
6. В разделе **Environment Variables** добавь:
   - `TGSTAT_TOKEN` — твой API-токен TGStat
7. Нажми **Deploy**

> Репозиторий уже содержит [`Dockerfile`](./Dockerfile) на `node:20-alpine` — Northflank подхватит его автоматически.

### Railway 🚆

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

---

## Ревью кода: совместимость с платформами

| Платформа | Статус | Комментарий |
|-----------|:------:|-------------|
| **Render** | ✅ Полностью | `PORT` из env, health check, CORS. `render.yaml` в репозитории. |
| **Northflank** | ✅ Полностью | Node.js + Dockerfile. Создать Web Service вручную (2 мин). |
| **Railway** | ✅ Полностью | Изначально спроектирован под Railway. |

Код (`server.js`) универсален — не требует изменений для любой из платформ.
