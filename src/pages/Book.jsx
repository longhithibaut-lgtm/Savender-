import { useMemo, useState } from 'react'
import { useStore } from '../useStore.js'
import {
  slotsFor,
  dateKey,
  priceWithDiscount,
  createOrder,
  formatTime,
} from '../store.js'
import { navigate } from '../router.js'

function nextDays(n) {
  const days = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

export default function Book({ id }) {
  const state = useStore()
  const offering = state.offerings.find((o) => o.id === id)

  const days = useMemo(() => nextDays(7), [])
  const [day, setDay] = useState(() => dateKey(days[0]))
  const [selected, setSelected] = useState(null)
  const [username, setUsername] = useState('')
  const [confirmed, setConfirmed] = useState(null)
  const [error, setError] = useState('')

  if (!offering) {
    return (
      <div className="container">
        <div className="card empty">
          <h2>Offre introuvable</h2>
          <button className="btn" onClick={() => navigate('/')}>
            Retour au catalogue
          </button>
        </div>
      </div>
    )
  }

  const slots = slotsFor(offering, day)
  const { base, final, hasDiscount } = priceWithDiscount(offering)

  function submit() {
    setError('')
    if (selected == null) {
      setError('Sélectionnez un créneau.')
      return
    }
    const res = createOrder({
      offeringId: offering.id,
      date: day,
      start: selected,
      bookerUsername: username,
    })
    if (res.error) {
      setError(res.error)
      setSelected(null)
      return
    }
    setConfirmed(res.order)
  }

  if (confirmed) {
    return (
      <div className="container">
        <div className="card confirm">
          <div className="confirm-check">✓</div>
          <h2>Réservation confirmée</h2>
          <p className="muted">
            {confirmed.offeringName} — {confirmed.date} à{' '}
            {formatTime(confirmed.start)}
          </p>
          <div className="code-box">
            <span className="muted">Votre code d’accès</span>
            <strong>{confirmed.accessCode}</strong>
          </div>
          <p className="muted small">
            Conservez ce code. Présentez-le dans l’onglet « Code VIP » pour
            valider votre accès.
          </p>
          <div className="row">
            <button className="btn" onClick={() => navigate('/bookings')}>
              Mes réservations
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              Catalogue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <button className="back" onClick={() => navigate('/')}>
        ← Catalogue
      </button>

      <div className="book-layout">
        <div className="card book-info" style={{ '--accent': offering.accent }}>
          <span className="chip">{offering.category}</span>
          <h2>{offering.name}</h2>
          <p className="muted">{offering.description}</p>
          <div className="price big">
            {hasDiscount && (
              <span className="price-old">
                {base}
                {state.settings.currency}
              </span>
            )}
            <span className="price-now">
              {final}
              {state.settings.currency}
            </span>
            <span className="muted"> / {offering.slotMinutes} min</span>
          </div>
        </div>

        <div className="card book-form">
          <h3>1. Choisissez un jour</h3>
          <div className="day-strip">
            {days.map((d) => {
              const k = dateKey(d)
              const isToday = k === dateKey(new Date())
              return (
                <button
                  key={k}
                  className={'day' + (k === day ? ' active' : '')}
                  onClick={() => {
                    setDay(k)
                    setSelected(null)
                  }}
                >
                  <span className="day-dow">
                    {isToday
                      ? "Auj."
                      : d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </span>
                  <span className="day-num">{d.getDate()}</span>
                </button>
              )
            })}
          </div>

          <h3>2. Choisissez un créneau</h3>
          {slots.length === 0 ? (
            <p className="muted">Aucun créneau ce jour.</p>
          ) : (
            <div className="slot-grid">
              {slots.map((s) => (
                <button
                  key={s.start}
                  disabled={s.booked}
                  className={
                    'slot' +
                    (s.booked ? ' booked' : '') +
                    (selected === s.start ? ' active' : '')
                  }
                  onClick={() => setSelected(s.start)}
                >
                  {formatTime(s.start)}
                  {s.booked && <span className="slot-x">pris</span>}
                </button>
              ))}
            </div>
          )}

          <h3>3. Votre identifiant</h3>
          <input
            className="input"
            placeholder="Pseudo ou e-mail pour retrouver la réservation"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <button className="btn btn-block" onClick={submit}>
            Confirmer — {final}
            {state.settings.currency}
          </button>
        </div>
      </div>
    </div>
  )
}
