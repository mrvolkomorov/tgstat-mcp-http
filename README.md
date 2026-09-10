# TGStat MCP HTTP Bridge

HTTP-обёртка для [@theyahia/tgstat-mcp](https://www.npmjs.com/package/@theyahia/tgstat-mcp) с транспортом Streamable HTTP.
Позволяет использовать TGStat MCP Server через HTTP — идеально для развёртывания на облачных платформах.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mrvolkomorov/tgstat-mcp-http)
[![Deploy on Northflank](https://assets.northflank.com/deploy_to_northflank_smm_36700fb050.svg)](https://northflank.com/stacks)

---

## Быстрый деплой (один клик)

### Render ✅

1. Нажми кнопку **Deploy to Render** выше
2. Подключи GitHub-аккаунт (если ещё не подключён)
3. Введи `TGSTAT_TOKEN` — свой API-токен TGStat
4. Нажми **Apply** — через минуту сервер будет готов

### Northflank 🚧

> Northflank пока не поддерживает автоматическую кнопку деплоя для произвольного репозитория (в отличие от Render).
> Нужно создать проект вручную — это занимает 2 минуты.

1. Нажми **Deploy on Northflank**, зарегистрируйся / войди
2. Создай **новый проект**
3. Добавь **Service → Web Service**
4. Выбери репозиторий `mrvolkomorov/tgstat-mcp-http`
5. В разделе **Build** выбери **Dockerfile** (он уже есть в репозитории)
6. В **Environment Variables** добавь:
   - `TGSTAT_TOKEN` — твой API-токен TGStat
7. Нажми **Deploy**

> Готово! На проект уже есть [`Dockerfile`](./Dockerfile) и [`package.json`](./package.json) — Northflank подхватит всё автоматически.

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
| **Render** | ✅ Полностью | `PORT` из env, health check, CORS — всё работает. `render.yaml` прилагается. |
| **Northflank** | ✅ Совместимо | Node.js + Dockerfile. Надо создать проект вручную (см. инструкцию выше). |
| **Railway** | ✅ Полностью | Изначально спроектирован под Railway. |

Код (`server.js`) не требует изменений для какой-либо из платформ — используется универсальный `process.env.PORT || 8080` и чистый HTTP-сервер.
