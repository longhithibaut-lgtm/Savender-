import { useState } from 'react'
import { redeemCode } from '../store.js'

export default function Redeem() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function submit() {
    setError('')
    setResult(null)
    const res = redeemCode(code)
    if (res.error) {
      setError(res.error)
      return
    }
    setResult(res)
  }

  return (
    <div className="container narrow">
      <div className="section-head">
        <h2>Code VIP / Accès</h2>
        <p className="muted">
          Entrez le code reçu à la réservation ou fourni par l’hôte.
        </p>
      </div>

      <div className="card">
        <input
          className="input input-code"
          placeholder="XXXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button className="btn btn-block" onClick={submit}>
          Valider le code
        </button>

        {error && <p className="error center">{error}</p>}

        {result && (
          <div className="redeem-result">
            <div className="confirm-check small">✓</div>
            <h3>{result.title}</h3>
            <p>{result.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
