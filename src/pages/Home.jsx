import { useStore } from '../useStore.js'
import { priceWithDiscount } from '../store.js'
import { navigate } from '../router.js'

function OfferingCard({ offering, currency }) {
  const { base, final, hasDiscount } = priceWithDiscount(offering)
  return (
    <div
      className="card offering"
      style={{ '--accent': offering.accent }}
      onClick={() => navigate('/book/' + offering.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate('/book/' + offering.id)
      }}
    >
      <div className="offering-top">
        <span className="chip">{offering.category}</span>
        <span className="duration">{offering.slotMinutes} min / créneau</span>
      </div>
      <h3>{offering.name}</h3>
      <p className="muted">{offering.description}</p>
      <div className="offering-bottom">
        <div className="price">
          {hasDiscount && (
            <span className="price-old">
              {base}
              {currency}
            </span>
          )}
          <span className="price-now">
            {final}
            {currency}
          </span>
        </div>
        <span className="btn btn-small">Réserver →</span>
      </div>
    </div>
  )
}

export default function Home() {
  const state = useStore()
  const { settings } = state
  const active = state.offerings.filter((o) => o.active)

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-glow" aria-hidden />
        <span className="badge">● En ligne — réservation instantanée</span>
        <h1>
          {settings.brand}
          <span className="hero-dot">.</span>
        </h1>
        <p className="hero-tag">{settings.tagline}</p>
        <div className="hero-actions">
          <button className="btn" onClick={() => navigate('/redeem')}>
            J’ai un code VIP
          </button>
          <a className="btn btn-ghost" href="#catalogue">
            Voir le catalogue
          </a>
        </div>
        {settings.discountPercent > 0 && (
          <div className="promo">
            🎉 {settings.discountName || 'Promo'} : −{settings.discountPercent}% sur
            tous les créneaux
          </div>
        )}
      </section>

      <section id="catalogue" className="catalogue">
        <div className="section-head">
          <h2>Catalogue</h2>
          <p className="muted">
            Choisissez une offre, sélectionnez un créneau, recevez votre code
            d’accès instantanément.
          </p>
        </div>
        {active.length === 0 ? (
          <div className="card empty">
            <p>Aucune offre disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid">
            {active.map((o) => (
              <OfferingCard key={o.id} offering={o} currency={settings.currency} />
            ))}
          </div>
        )}
      </section>

      <section className="steps">
        <div className="step">
          <span className="step-n">1</span>
          <h4>Choisissez</h4>
          <p className="muted">Parcourez les offres et les créneaux libres.</p>
        </div>
        <div className="step">
          <span className="step-n">2</span>
          <h4>Réservez</h4>
          <p className="muted">
            Bloquez votre créneau en quelques secondes, sans compte.
          </p>
        </div>
        <div className="step">
          <span className="step-n">3</span>
          <h4>Accédez</h4>
          <p className="muted">
            Recevez un code d’accès unique et les instructions de l’hôte.
          </p>
        </div>
      </section>
    </div>
  )
}
