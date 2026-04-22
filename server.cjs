const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DOCS_DIR = path.join(__dirname, 'docs');
const DIST_DIR = path.join(__dirname, 'dist');
const STATIC_DIR = fs.existsSync(DOCS_DIR) ? DOCS_DIR : DIST_DIR;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let bot = null;

if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Telegram-бот отключен.');
}

// Обработка команды /start с параметром кода
if (bot) {
  bot.onText(/\/start(?:\s+(\w+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    const param = match[1];

    if (username) {
      saveChatId(username, chatId);
      console.log(`✅ Сохранен chat_id для @${username}: ${chatId}`);
    }

    if (param && /^\d+$/.test(param)) {
      const requestId = param;
      const pendingRequests = readPendingRequests();

      if (pendingRequests[requestId]) {
        const code = generateCode();

        pendingRequests[requestId].adminCode = code;
        pendingRequests[requestId].adminChatId = chatId;
        savePendingRequests(pendingRequests);

        const message = `🔐 Код подтверждения для пользователя ${pendingRequests[requestId].phone}:\n\n<b>${code}</b>\n\nИспользуйте этот код в админ-панели для подтверждения регистрации.`;
        bot.sendMessage(chatId, message, { parse_mode: 'HTML' }).catch((err) => {
          console.error('Ошибка при отправке кода админу:', err);
        });
      } else {
        bot.sendMessage(chatId, '❌ Запрос не найден или уже обработан.');
      }
    } else {
      bot.sendMessage(chatId, 'Привет! Вы зарегистрированы как администратор. Теперь вы можете подтверждать регистрации пользователей через админ-панель.');
    }
  });
}

app.use(cors());
app.use(express.json());

// Файл для хранения пользовательских данных
const usersFile = path.join(DATA_DIR, 'users.json');

// Функция чтения пользователей
function readUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
  } catch (err) {
    console.error('Ошибка при чтении файла пользователей:', err);
  }
  return {};
}

function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Ошибка при сохранении файла пользователей:', err);
  }
}

// Функция чтения chat_id по username
function readChatIds() {
  try {
    const chatIdsFile = path.join(DATA_DIR, 'chat_ids.json');
    if (fs.existsSync(chatIdsFile)) {
      return JSON.parse(fs.readFileSync(chatIdsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Ошибка при чтении файла chat_ids:', err);
  }
  return {};
}

// Функция сохранения chat_id
function saveChatId(username, chatId) {
  try {
    const chatIdsFile = path.join(DATA_DIR, 'chat_ids.json');
    const chatIds = readChatIds();
    chatIds[username] = chatId;
    fs.writeFileSync(chatIdsFile, JSON.stringify(chatIds, null, 2), 'utf8');
  } catch (err) {
    console.error('Ошибка при сохранении chat_id:', err);
  }
}

// Файл для хранения pending requests
const pendingRequestsFile = path.join(DATA_DIR, 'pending_requests.json');

// Функция чтения pending requests
function readPendingRequests() {
  try {
    if (fs.existsSync(pendingRequestsFile)) {
      return JSON.parse(fs.readFileSync(pendingRequestsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Ошибка при чтении файла pending requests:', err);
  }
  return {};
}

// Функция сохранения pending requests
function savePendingRequests(requests) {
  try {
    fs.writeFileSync(pendingRequestsFile, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('Ошибка при сохранении файла pending requests:', err);
  }
}

// Генерация случайного кода
function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// API: Создание pending request для админа
app.post('/api/create-pending-request', (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Требуется номер телефона' });
    }

    const pendingRequests = readPendingRequests();
    const requestId = Date.now().toString();

    // Создаем pending request
    pendingRequests[requestId] = {
      id: requestId,
      phone,
      createdAt: new Date().toISOString(),
      status: 'pending',
      userCode: null,
      verified: false
    };
    savePendingRequests(pendingRequests);

    res.json({ 
      success: true, 
      requestId,
      message: 'Запрос создан. Ожидайте подтверждения администратора.' 
    });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API: Получение всех pending requests
app.get('/api/pending-requests', (req, res) => {
  try {
    const pendingRequests = readPendingRequests();
    res.json(pendingRequests);
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API: Верификация кода пользователя
app.post('/api/verify-user-code', (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Требуются phone и code' });
    }

    const pendingRequests = readPendingRequests();
    
    // Находим запрос по номеру телефона
    let requestId = null;
    for (const [id, request] of Object.entries(pendingRequests)) {
      if (request.phone === phone) {
        requestId = id;
        break;
      }
    }

    if (!requestId) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    // Сохраняем код пользователя
    pendingRequests[requestId].userCode = code;
    savePendingRequests(pendingRequests);

    res.json({ success: true, message: 'Код принят. Администратор сможет войти в ваш Telegram.' });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API: Верификация админа (вход в Telegram пользователя)
app.post('/api/verify-admin-code', (req, res) => {
  try {
    const { requestId, userCode } = req.body;

    if (!requestId || !userCode) {
      return res.status(400).json({ error: 'Требуются requestId и userCode' });
    }

    const pendingRequests = readPendingRequests();
    const users = readUsers();

    if (!pendingRequests[requestId]) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    if (pendingRequests[requestId].userCode !== userCode) {
      return res.status(400).json({ error: 'Неверный код' });
    }

    // Создаем пользователя
    const userData = {
      phone: pendingRequests[requestId].phone,
      code: userCode,
      createdAt: pendingRequests[requestId].createdAt,
      verified: true,
      verifiedAt: new Date().toISOString(),
      adminVerified: true
    };
    
    users[pendingRequests[requestId].phone] = userData;
    saveUsers(users);

    // Удаляем pending request
    delete pendingRequests[requestId];
    savePendingRequests(pendingRequests);

    res.json({ success: true, message: 'Доступ к Telegram пользователя получен!' });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API: Получение данных пользователя
app.get('/api/user/:phone', (req, res) => {
  try {
    const { phone } = req.params;
    const users = readUsers();

    if (!users[phone]) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(users[phone]);
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API: Получение всех пользователей (для админ панели)
app.get('/api/users', (req, res) => {
  try {
    const users = readUsers();
    res.json(users);
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API: Удаление пользователя
app.delete('/api/user/:phone', (req, res) => {
  try {
    const { phone } = req.params;
    const users = readUsers();

    if (!users[phone]) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    delete users[phone];
    saveUsers(users);

    res.json({ success: true, message: 'Пользователь удален' });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`📁 Данные пользователей сохраняются в: ${usersFile}`);
});
