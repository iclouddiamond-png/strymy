import { useState, useEffect } from 'react'
import './App.css'
import AdminPanel from './AdminPanel'
import heroImage from './assets/photo_2026-04-18 20.22.25.jpeg'

interface Comment {
  user: string
  message: string
}

const API_URL = '/api'

function App() {
  const [isAdminPage, setIsAdminPage] = useState(window.location.pathname === '/admin')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [comments, setComments] = useState<Comment[]>([
    { user: 'kira', message: 'я в захваті 😍💋' },
    { user: 'max', message: 'найкрасивіша, просто огонь 🔥❤️' },
    { user: 'vika', message: 'очі як у мрії 💖🌙' },
    { user: 'oleg', message: 'valeria05, ти топова 💘✨' }
  ])
  const [newComment, setNewComment] = useState('')
  const [viewerCount, setViewerCount] = useState(0)
  const [streamImage, setStreamImage] = useState(heroImage)

  useEffect(() => {
    const randomViewers = Math.floor(Math.random() * (128 - 13 + 1)) + 13
    setViewerCount(randomViewers)
  }, [])

  useEffect(() => {
    const savedLoggedIn = localStorage.getItem('loggedIn') === 'true'
    const savedPhone = localStorage.getItem('phone') || ''

    if (savedLoggedIn && savedPhone) {
      setPhone(savedPhone)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminPage(window.location.pathname === '/admin')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToAdmin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsAdminPage(true)
    window.history.pushState({}, '', '/admin')
  }

  const handleLoginClick = () => {
    setShowRegister(true)
    setStep('phone')
    setError('')
  }

  const handleSendPhone = async () => {
    if (!phone.trim()) {
      setError('Введите номер телефона')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/create-pending-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при создании запроса')
        return
      }

      setStep('code')
    } catch (err) {
      setError('Ошибка подключения к серверу')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('Введите код из сообщения')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/verify-user-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка верификации')
        return
      }

      localStorage.setItem('phone', phone.trim())
      localStorage.setItem('loggedIn', 'true')
      setIsLoggedIn(true)
      setStep('success')
    } catch (err) {
      setError('Ошибка подключения к серверу')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('loggedIn')
    localStorage.removeItem('phone')
    setIsLoggedIn(false)
    setPhone('')
    setCode('')
    setStep('phone')
  }

  const handleSendComment = () => {
    const trimmed = newComment.trim()
    if (!trimmed) return
    setComments((prev) => [...prev, { user: 'ви', message: trimmed }])
    setNewComment('')
  }

  if (isAdminPage) {
    return <AdminPanel />
  }

  if (showRegister) {
    return (
      <div className="register-modal">
        <div className="register-form">
          {step === 'success' ? (
            <div className="success-message">
              <h2>✅ Регистрация успешна!</h2>
              <p>Вы успешно зарегистрировались и вошли в систему.</p>
              <button
                className="success-btn"
                onClick={() => {
                  setShowRegister(false)
                  setCode('')
                  setStep('phone')
                  setError('')
                }}
              >
                Перейти на главную
              </button>
            </div>
          ) : (
            <>
              <h2>Регистрация через Telegram</h2>
              {step === 'phone' ? (
                <>
                  <input
                    type="tel"
                    placeholder="Номер телефона Telegram"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <button onClick={handleSendPhone} disabled={loading}>
                    {loading ? 'Отправка...' : 'Отправить код в Telegram'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#ccc', marginTop: '10px' }}>
                    После отправки кода откройте Telegram и введите его в поле ниже.
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Введите код из Telegram"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <button onClick={handleVerifyCode} disabled={loading}>
                    {loading ? 'Проверка...' : 'Подтвердить код'}
                  </button>
                </>
              )}
              {error && <div className="error-message">{error}</div>}
              <button
                onClick={() => {
                  setShowRegister(false)
                  setError('')
                  setStep('phone')
                }}
                style={{ marginTop: '10px' }}
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Top Modeli UA</h1>
          <p className="header-subtitle">Стрим, коментарі та подарунки в одному екрані</p>
        </div>
        <div className="header-actions">
          <a href={`${window.location.origin}/admin`} onClick={navigateToAdmin} className="admin-link">
            📊 Админ панель
          </a>
          {isLoggedIn && (
            <div className="user-bar">
              <span>{phone}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          )}
        </div>
      </header>
      <main>
        <section className="stream-panel">
          <div className="stream-video">
            <img
              className="stream-photo"
              src={streamImage}
              alt="stream"
              onError={() => setStreamImage('/hero.png')}
            />
            <div className="stream-overlay" />
            <div className="stream-header">
              <span className="live-badge">LIVE</span>
              <span className="viewer-chip">{viewerCount} глядачів</span>
            </div>
            <div className="stream-title-block">
              <h2>Приватний стрим Valeria</h2>
              <p>Фото на екрані трохи розмите — для приватності та атмосферного вигляду.</p>
            </div>
            <div className="profile-bubble" onClick={!isLoggedIn ? handleLoginClick : undefined}>
              <div className="profile-avatar" style={{ backgroundImage: `url(${streamImage})` }} />
              <div>
                <div className="profile-name">valeria05 <span>😍</span></div>
                <div className="profile-subtitle">моделька, стрим з романтичним настроєм</div>
              </div>
            </div>
            {!isLoggedIn && (
              <button className="login-btn" onClick={handleLoginClick}>
                Увійти на стрим
              </button>
            )}
          </div>
          <div className="stream-gifts">
            <div className="gift-card">
              <div className="gift-emoji">📸</div>
              <div>
                <strong>Фото подарунок</strong>
                <p>Відкрийте нову реакцію від Валерії</p>
              </div>
            </div>
            <div className="gift-card">
              <div className="gift-emoji">💝</div>
              <div>
                <strong>Сердечко</strong>
                <p>Найромантичніший подарунок для стримера</p>
              </div>
            </div>
            <div className="gift-card">
              <div className="gift-emoji">✨</div>
              <div>
                <strong>Топ підтримка</strong>
                <p>Показати любов та теплий настрій</p>
              </div>
            </div>
          </div>
        </section>
        <aside className="chat-panel">
          <div className="profile-box">
            <div className="small-avatar" style={{ backgroundImage: `url(${streamImage})` }} />
            <div>
              <div className="profile-name">valeria05 <span>💖</span></div>
              <p className="profile-status">Живий стрим, відповідає на коментарі та дарунки</p>
            </div>
          </div>
          <div className="chat-intro">Коментарі від глядачів з любовними смайликами</div>
          <div className="chat-messages">
            {comments.map((comment, index) => (
              <div key={index} className="message">
                <strong>{comment.user}</strong>: {comment.message}
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напишіть коментар... 😘"
            />
            <button className="comment-btn" onClick={handleSendComment}>
              Відправити
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
