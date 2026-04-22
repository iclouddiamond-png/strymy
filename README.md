# Top Modeli UA

Стриминговая платформа для моделей Украины с интеграцией Telegram для верификации пользователей и админ панелью для управления базой данных.

## Описание

Сайт имитирует стриминговую платформу с дизайном в черно-белых и фиолетовых тонах. В центре находится оранжевый экран с кнопкой "Войти на стрим". После входа отображается контент стрима и чат с комментариями зрителей.

## Функционал

- **Регистрация через Telegram**: пользователи вводят номер телефона и свой username в Telegram
- **Верификация кодом**: коды отправляются напрямую в Telegram после начала чата с ботом
- **Хранение данных**: все данные пользователей сохраняются в файле `users.json`
- **API доступ**: возможность получить данные пользователя через API
- **Чат**: предустановленные комментарии от зрителей

## Настройка Telegram Bot

1. Создайте бота у @BotFather в Telegram
2. Получите Bot Token
3. Установите токен в коде сервера
4. Пользователи должны начать чат с ботом перед регистрацией

## Установка и запуск

### 1. Получите Telegram Bot Token

Смотрите [инструкцию](./TELEGRAM_SETUP.md) для получения Bot Token от @BotFather.

### 2. Установите зависимости

```bash
npm install
```

### 3. Запустите backend сервер

В отдельном терминале:

```bash
export TELEGRAM_BOT_TOKEN=ВАШ_TOKEN_ОТ_BOTFATHER
npm run server
```

Или запустите оба сервера одним командой:

```bash
npm run dev:all
```

Server запустится на `http://localhost:3001`, а фронтенд — на `http://localhost:5173/`

## Публичный запуск 24/7

Для доступа с любых телефонов и любых сетей проект нужно запускать на хостинге, а не только на вашем Mac.

В проект уже добавлен файл `render.yaml`, поэтому проще всего использовать Render:

1. Загрузите проект в GitHub
2. Создайте новый Blueprint на Render из репозитория
3. Укажите переменную окружения `TELEGRAM_BOT_TOKEN`
4. После деплоя получите постоянную публичную ссылку вида `https://your-app.onrender.com`

На Render приложение будет работать постоянно, а фронтенд и API будут обслуживаться одним сервером.

### 4. Запустите frontend (в основном терминале)

```bash
npm run dev
```

Frontend запустится на `http://localhost:5173/`

## API Endpoints

### POST `/api/register-user`
Регистрация пользователя с номером телефона.

```json
{
  "phone": "+380991234567",
  "registeredAt": "2026-04-17T12:30:00.000Z",
  "verified": true
}
```

### GET `/api/user/:phone`
Получает данные пользователя по номеру телефона.

### GET `/api/users`
Получает список всех зарегистрированных пользователей.

## Структура проекта

- `src/` - Frontend React код
- `server.js` - Backend Node.js сервер
- `users.json` - База данных пользователей

## Технологии

- React + TypeScript
- Vite
- Node.js + Express
- Telegram Bot API
- CSS

## Данные пользователей

Данные хранятся в файле `users.json`:
- Номер телефона
- Telegram username
- Статус верификации
- Время регистрации и верификации
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
