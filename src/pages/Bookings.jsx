import { useState } from 'react'
import { useStore } from '../useStore.js'
import { ordersForUser, cancelOrder, formatTime } from '../store.js'

export default function Bookings() {
  const state = useStore()
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState('')

  const orders = searched ? ordersForUser(searched) : []

  return (
    <div className="container">
      <div className="section-head">
        <h2>Mes réservations</h2>
        <p className="muted">
          Retrouvez vos créneaux avec l’identifiant utilisé à la réservation.
        </p>
      </div>

      <div className="card">
        <div className="row">
          <input
            className="input"
            placeholder="Votre pseudo ou e-mail"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearched(query.trim())}
          />
          <button className="btn" onClick={() => setSearched(query.trim())}>
            Rechercher
          </button>
        </div>
      </div>

      {searched && (
        <div className="list">
          {orders.length === 0 ? (
            <div className="card empty">
              <p>Aucune réservation pour « {searched} ».</p>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className={'card order' + (o.status !== 'active' ? ' dim' : '')}
              >
                <div className="order-main">
                  <h4>{o.offeringName}</h4>
                  <p className="muted">
                    {o.date} · {formatTime(o.start)} – {formatTime(o.end)}
                  </p>
                  <span className="code-inline">{o.accessCode}</span>
                </div>
                <div className="order-side">
                  <span
                    className={
                      'status ' +
                      (o.status === 'active' ? 'ok' : 'cancelled')
                    }
                  >
                    {o.status === 'active' ? 'Active' : 'Annulée'}
                  </span>
                  <span className="paid">
                    {o.pricePaid}
                    {state.settings.currency}
                  </span>
                  {o.status === 'active' && (
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => cancelOrder(o.id, o.bookerUsername)}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
