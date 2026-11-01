import { useState } from 'react'
import { useStore } from '../useStore.js'
import {
  updateSettings,
  createOffering,
  updateOffering,
  deleteOffering,
  createCode,
  deleteCode,
  cancelOrder,
  resetAll,
  formatTime,
} from '../store.js'

function PinGate({ onOk, pin }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  return (
    <div className="container narrow">
      <div className="section-head">
        <h2>Panneau admin</h2>
        <p className="muted">Accès réservé à l’hôte.</p>
      </div>
      <div className="card">
        <input
          className="input input-code"
          type="password"
          placeholder="Code PIN"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (value === pin) onOk()
              else setError('PIN incorrect.')
            }
          }}
        />
        <button
          className="btn btn-block"
          onClick={() => (value === pin ? onOk() : setError('PIN incorrect.'))}
        >
          Déverrouiller
        </button>
        {error && <p className="error center">{error}</p>}
        <p className="muted small center">PIN de démo : 2468</p>
      </div>
    </div>
  )
}

const emptyOffering = {
  name: '',
  category: '',
  description: '',
  pricePerSlot: 10,
  slotMinutes: 60,
  openHour: 9,
  closeHour: 20,
  active: true,
  overrideAvailability: false,
  overrideSlotsPerDay: 6,
  accent: '#8b5cf6',
}

function OfferingEditor({ offering, onClose }) {
  const [form, setForm] = useState(offering || emptyOffering)
  const field = (k) => ({
    value: form[k],
    onChange: (e) =>
      setForm((f) => ({
        ...f,
        [k]:
          e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      })),
  })

  function save() {
    if (offering) updateOffering(offering.id, form)
    else createOffering(form)
    onClose()
  }

  return (
    <div className="card editor">
      <h3>{offering ? 'Modifier l’offre' : 'Nouvelle offre'}</h3>
      <label>Nom<input className="input" {...field('name')} /></label>
      <label>Catégorie<input className="input" {...field('category')} /></label>
      <label>
        Description
        <textarea className="input" rows={3} {...field('description')} />
      </label>
      <div className="grid-2">
        <label>
          Prix / créneau
          <input className="input" type="number" min="0" {...field('pricePerSlot')} />
        </label>
        <label>
          Durée (min)
          <input className="input" type="number" min="5" step="5" {...field('slotMinutes')} />
        </label>
        <label>
          Ouverture (h)
          <input className="input" type="number" min="0" max="24" {...field('openHour')} />
        </label>
        <label>
          Fermeture (h)
          <input className="input" type="number" min="0" max="24" {...field('closeHour')} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" {...field('active')} checked={form.active} />
        Offre active (visible au catalogue)
      </label>
      <label className="check">
        <input
          type="checkbox"
          {...field('overrideAvailability')}
          checked={form.overrideAvailability}
        />
        Limiter la disponibilité (remplace la disponibilité réelle)
      </label>
      {form.overrideAvailability && (
        <label>
          Créneaux max / jour
          <input
            className="input"
            type="number"
            min="1"
            {...field('overrideSlotsPerDay')}
          />
        </label>
      )}
      <label className="color-row">
        Couleur d’accent
        <input type="color" {...field('accent')} />
      </label>
      <div className="row">
        <button className="btn" onClick={save}>
          Enregistrer
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  const state = useStore()
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState('offerings')
  const [editing, setEditing] = useState(null) // offering object, 'new', or null

  if (!unlocked)
    return <PinGate pin={state.settings.adminPin} onOk={() => setUnlocked(true)} />

  return (
    <div className="container">
      <div className="section-head">
        <h2>Panneau admin</h2>
        <p className="muted">{state.settings.brand} — gestion complète.</p>
      </div>

      <div className="tabs">
        {[
          ['offerings', 'Offres'],
          ['codes', 'Codes VIP'],
          ['orders', 'Réservations'],
          ['settings', 'Réglages'],
        ].map(([k, label]) => (
          <button
            key={k}
            className={'tab' + (tab === k ? ' active' : '')}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'offerings' && (
        <>
          {editing === 'new' && (
            <OfferingEditor onClose={() => setEditing(null)} />
          )}
          {editing && editing !== 'new' && (
            <OfferingEditor offering={editing} onClose={() => setEditing(null)} />
          )}
          {!editing && (
            <button className="btn" onClick={() => setEditing('new')}>
              + Ajouter une offre
            </button>
          )}
          <div className="list">
            {state.offerings.map((o) => (
              <div key={o.id} className="card order">
                <div className="order-main">
                  <h4>
                    <span
                      className="dot"
                      style={{ background: o.accent }}
                      aria-hidden
                    />
                    {o.name}{' '}
                    {!o.active && <span className="status cancelled">masquée</span>}
                  </h4>
                  <p className="muted">
                    {o.category} · {o.pricePerSlot}
                    {state.settings.currency} · {o.slotMinutes}min ·{' '}
                    {o.openHour}h–{o.closeHour}h
                    {o.overrideAvailability &&
                      ` · max ${o.overrideSlotsPerDay}/j`}
                  </p>
                </div>
                <div className="order-side">
                  <button
                    className="btn btn-ghost btn-small"
                    onClick={() => setEditing(o)}
                  >
                    Éditer
                  </button>
                  <button
                    className="btn btn-ghost btn-small danger"
                    onClick={() => {
                      if (confirm(`Supprimer « ${o.name} » ?`)) deleteOffering(o.id)
                    }}
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'codes' && <CodesTab state={state} />}

      {tab === 'orders' && (
        <div className="list">
          {state.orders.length === 0 ? (
            <div className="card empty">
              <p>Aucune réservation.</p>
            </div>
          ) : (
            state.orders.map((o) => (
              <div
                key={o.id}
                className={'card order' + (o.status !== 'active' ? ' dim' : '')}
              >
                <div className="order-main">
                  <h4>{o.offeringName}</h4>
                  <p className="muted">
                    {o.bookerUsername} · {o.date} · {formatTime(o.start)}–
                    {formatTime(o.end)}
                  </p>
                  <span className="code-inline">{o.accessCode}</span>
                </div>
                <div className="order-side">
                  <span
                    className={
                      'status ' + (o.status === 'active' ? 'ok' : 'cancelled')
                    }
                  >
                    {o.status === 'active' ? 'Active' : 'Annulée'}
                  </span>
                  {o.status === 'active' && (
                    <button
                      className="btn btn-ghost btn-small danger"
                      onClick={() => cancelOrder(o.id)}
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

      {tab === 'settings' && <SettingsTab state={state} />}
    </div>
  )
}

function CodesTab({ state }) {
  const [note, setNote] = useState('')
  const [offeringId, setOfferingId] = useState('')
  const [expiry, setExpiry] = useState('')

  return (
    <>
      <div className="card editor">
        <h3>Générer un code VIP</h3>
        <label>
          Offre liée (optionnel)
          <select
            className="input"
            value={offeringId}
            onChange={(e) => setOfferingId(e.target.value)}
          >
            <option value="">— Aucune —</option>
            {state.offerings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Note / instructions d’accès
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex : lien visio, consignes…"
          />
        </label>
        <label>
          Expiration (laisser vide = pas d’expiration)
          <input
            className="input"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </label>
        <button
          className="btn"
          onClick={() => {
            createCode({ offeringId, note, expiry })
            setNote('')
            setExpiry('')
          }}
        >
          + Générer
        </button>
      </div>

      <div className="list">
        {state.codes.length === 0 ? (
          <div className="card empty">
            <p>Aucun code généré.</p>
          </div>
        ) : (
          state.codes.map((c) => {
            const off = state.offerings.find((o) => o.id === c.offeringId)
            return (
              <div key={c.id} className={'card order' + (c.redeemed ? ' dim' : '')}>
                <div className="order-main">
                  <h4 className="code-inline big">{c.code}</h4>
                  <p className="muted">
                    {off ? off.name : 'Non liée'}
                    {c.note && ` · ${c.note}`}
                    {c.expiry && ` · exp. ${c.expiry}`}
                  </p>
                </div>
                <div className="order-side">
                  <span className={'status ' + (c.redeemed ? 'cancelled' : 'ok')}>
                    {c.redeemed ? 'Utilisé' : 'Valide'}
                  </span>
                  <button
                    className="btn btn-ghost btn-small danger"
                    onClick={() => deleteCode(c.id)}
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

function SettingsTab({ state }) {
  const { settings } = state
  const [form, setForm] = useState(settings)
  const field = (k) => ({
    value: form[k],
    onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })),
  })

  return (
    <div className="card editor">
      <h3>Marque</h3>
      <label>Nom<input className="input" {...field('brand')} /></label>
      <label>Accroche<input className="input" {...field('tagline')} /></label>
      <label>Devise<input className="input" {...field('currency')} /></label>

      <h3>Remise globale</h3>
      <div className="grid-2">
        <label>
          Nom de la promo
          <input className="input" {...field('discountName')} />
        </label>
        <label>
          Remise (%)
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            {...field('discountPercent')}
          />
        </label>
      </div>

      <h3>Sécurité</h3>
      <label>
        Code PIN admin
        <input className="input" {...field('adminPin')} />
      </label>

      <div className="row">
        <button
          className="btn"
          onClick={() =>
            updateSettings({
              ...form,
              discountPercent: Number(form.discountPercent) || 0,
            })
          }
        >
          Enregistrer les réglages
        </button>
        <button
          className="btn btn-ghost danger"
          onClick={() => {
            if (
              confirm(
                'Réinitialiser TOUTES les données (offres, réservations, codes) ?',
              )
            )
              resetAll()
          }}
        >
          Réinitialiser la démo
        </button>
      </div>
    </div>
  )
}
