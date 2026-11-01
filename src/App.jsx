import { useStore } from './useStore.js'
import { useRoute, navigate } from './router.js'
import Home from './pages/Home.jsx'
import Book from './pages/Book.jsx'
import Bookings from './pages/Bookings.jsx'
import Redeem from './pages/Redeem.jsx'
import Admin from './pages/Admin.jsx'

function Nav({ brand }) {
  const { parts } = useRoute()
  const top = '/' + (parts[0] || '')
  const link = (to, label) => (
    <a
      href={'#' + to}
      className={'nav-link' + (top === to ? ' active' : '')}
    >
      {label}
    </a>
  )
  return (
    <header className="nav">
      <a href="#/" className="brand">
        <span className="brand-mark" aria-hidden>
          ∿
        </span>
        {brand}
      </a>
      <nav className="nav-links">
        {link('/', 'Catalogue')}
        {link('/bookings', 'Mes réservations')}
        {link('/redeem', 'Code VIP')}
        {link('/admin', 'Admin')}
      </nav>
    </header>
  )
}

function Footer({ brand }) {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {brand}. Démo de plateforme de réservation.
        Les données sont stockées localement dans votre navigateur.
      </p>
    </footer>
  )
}

export default function App() {
  const state = useStore()
  const { parts } = useRoute()
  const section = parts[0] || ''

  let page
  if (section === '' ) page = <Home />
  else if (section === 'book') page = <Book id={parts[1]} />
  else if (section === 'bookings') page = <Bookings />
  else if (section === 'redeem') page = <Redeem />
  else if (section === 'admin') page = <Admin />
  else
    page = (
      <div className="container">
        <div className="card empty">
          <h2>Page introuvable</h2>
          <button className="btn" onClick={() => navigate('/')}>
            Retour au catalogue
          </button>
        </div>
      </div>
    )

  return (
    <div className="app">
      <Nav brand={state.settings.brand} />
      <main>{page}</main>
      <Footer brand={state.settings.brand} />
    </div>
  )
}
