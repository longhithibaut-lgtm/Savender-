// ---------------------------------------------------------------------------
// Savender data layer
//
// A tiny observable store persisted to localStorage. It is intentionally
// framework-free and side-effect-isolated so it can be swapped for a real
// HTTP/API backend later without touching the UI: every component talks to
// the store only through the exported action functions and `useStore`.
// ---------------------------------------------------------------------------

const KEY = 'savender_state_v2'

const listeners = new Set()

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

function genCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 10; i++) {
    if (i === 5) out += '-'
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

// --- seed data -------------------------------------------------------------
function seed() {
  const now = Date.now()
  return {
    settings: {
      brand: 'Savender',
      tagline: 'Réservation de créneaux instantanée & codes d’accès VIP',
      currency: '€',
      adminPin: '2468', // demo PIN — change in the admin panel
      discountName: '',
      discountPercent: 0,
    },
    offerings: [
      {
        id: uid('off'),
        name: 'Studio de rendu GPU',
        category: 'Compute',
        description:
          'Accès à une station de rendu GPU (que vous possédez / exploitez légalement). Idéal pour partager du temps machine entre créateurs.',
        pricePerSlot: 9,
        slotMinutes: 60,
        openHour: 8,
        closeHour: 22,
        active: true,
        overrideAvailability: false,
        overrideSlotsPerDay: 6,
        accent: '#8b5cf6',
      },
      {
        id: uid('off'),
        name: 'Salle de coworking — poste VIP',
        category: 'Espace',
        description:
          'Réservation d’un poste premium dans votre espace de coworking : écran, fibre dédiée, casse-tête en moins.',
        pricePerSlot: 5,
        slotMinutes: 30,
        openHour: 9,
        closeHour: 19,
        active: true,
        overrideAvailability: false,
        overrideSlotsPerDay: 10,
        accent: '#22d3ee',
      },
      {
        id: uid('off'),
        name: 'Session coaching 1:1',
        category: 'Service',
        description:
          'Créneaux de coaching individuel. À la réservation, le client reçoit un code d’accès et le lien/instructions que vous renseignez.',
        pricePerSlot: 25,
        slotMinutes: 45,
        openHour: 10,
        closeHour: 18,
        active: true,
        overrideAvailability: false,
        overrideSlotsPerDay: 5,
        accent: '#f472b6',
      },
    ],
    orders: [],
    codes: [], // admin-generated standalone access codes
    createdAt: now,
  }
}

// --- persistence -----------------------------------------------------------
function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.settings && Array.isArray(parsed.offerings)) return parsed
    }
  } catch {
    /* ignore corrupt state */
  }
  const s = seed()
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable (private mode) — keep in-memory only */
  }
  return s
}

let state = load()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function set(updater) {
  state = typeof updater === 'function' ? updater(state) : updater
  persist()
  emit()
}

// --- subscription API (for useSyncExternalStore) ---------------------------
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState() {
  return state
}

// ---------------------------------------------------------------------------
// Availability helpers
// ---------------------------------------------------------------------------

export function dateKey(d) {
  // local YYYY-MM-DD
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Build the list of slots for an offering on a given date key.
// Each slot: { start (minutes from midnight), end, label, booked (bool) }
export function slotsFor(offering, dayKey) {
  const slots = []
  const step = offering.slotMinutes
  const openMin = offering.openHour * 60
  const closeMin = offering.closeHour * 60

  const bookedStarts = new Set(
    state.orders
      .filter(
        (o) =>
          o.offeringId === offering.id &&
          o.date === dayKey &&
          o.status === 'active',
      )
      .map((o) => o.start),
  )

  let count = 0
  for (let t = openMin; t + step <= closeMin; t += step) {
    // admin override: cap the number of exposed slots per day
    if (offering.overrideAvailability && count >= offering.overrideSlotsPerDay) {
      break
    }
    slots.push({
      start: t,
      end: t + step,
      label: `${formatTime(t)} – ${formatTime(t + step)}`,
      booked: bookedStarts.has(t),
    })
    count++
  }
  return slots
}

export function priceWithDiscount(offering) {
  const { discountPercent } = state.settings
  const base = offering.pricePerSlot
  if (!discountPercent) return { base, final: base, hasDiscount: false }
  const final = Math.max(0, +(base * (1 - discountPercent / 100)).toFixed(2))
  return { base, final, hasDiscount: true }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function updateSettings(patch) {
  set((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function createOffering(data) {
  const offering = {
    id: uid('off'),
    name: data.name?.trim() || 'Nouvelle offre',
    category: data.category?.trim() || 'Général',
    description: data.description?.trim() || '',
    pricePerSlot: Number(data.pricePerSlot) || 0,
    slotMinutes: Number(data.slotMinutes) || 60,
    openHour: clampHour(data.openHour, 8),
    closeHour: clampHour(data.closeHour, 20),
    active: data.active !== false,
    overrideAvailability: !!data.overrideAvailability,
    overrideSlotsPerDay: Number(data.overrideSlotsPerDay) || 6,
    accent: data.accent || '#8b5cf6',
  }
  set((s) => ({ ...s, offerings: [...s.offerings, offering] }))
  return offering
}

export function updateOffering(id, patch) {
  set((s) => ({
    ...s,
    offerings: s.offerings.map((o) =>
      o.id === id
        ? {
            ...o,
            ...patch,
            pricePerSlot:
              patch.pricePerSlot !== undefined
                ? Number(patch.pricePerSlot) || 0
                : o.pricePerSlot,
            slotMinutes:
              patch.slotMinutes !== undefined
                ? Number(patch.slotMinutes) || o.slotMinutes
                : o.slotMinutes,
            openHour:
              patch.openHour !== undefined
                ? clampHour(patch.openHour, o.openHour)
                : o.openHour,
            closeHour:
              patch.closeHour !== undefined
                ? clampHour(patch.closeHour, o.closeHour)
                : o.closeHour,
            overrideSlotsPerDay:
              patch.overrideSlotsPerDay !== undefined
                ? Number(patch.overrideSlotsPerDay) || o.overrideSlotsPerDay
                : o.overrideSlotsPerDay,
          }
        : o,
    ),
  }))
}

export function deleteOffering(id) {
  set((s) => ({
    ...s,
    offerings: s.offerings.filter((o) => o.id !== id),
  }))
}

function clampHour(v, fallback) {
  const n = Number(v)
  if (Number.isNaN(n)) return fallback
  return Math.min(24, Math.max(0, Math.round(n)))
}

// Booking --------------------------------------------------------------------
export function createOrder({ offeringId, date, start, bookerUsername }) {
  const offering = state.offerings.find((o) => o.id === offeringId)
  if (!offering) return { error: 'Offre introuvable.' }
  if (!bookerUsername || !bookerUsername.trim())
    return { error: 'Indiquez un identifiant de réservation.' }

  const taken = state.orders.some(
    (o) =>
      o.offeringId === offeringId &&
      o.date === date &&
      o.start === start &&
      o.status === 'active',
  )
  if (taken) return { error: 'Ce créneau vient d’être réservé. Choisissez-en un autre.' }

  const { final } = priceWithDiscount(offering)
  const order = {
    id: uid('ord'),
    offeringId,
    offeringName: offering.name,
    date,
    start,
    end: start + offering.slotMinutes,
    bookerUsername: bookerUsername.trim(),
    pricePaid: final,
    accessCode: genCode(),
    status: 'active',
    createdAt: Date.now(),
  }
  set((s) => ({ ...s, orders: [order, ...s.orders] }))
  return { order }
}

export function cancelOrder(id, bookerUsername) {
  let ok = false
  set((s) => ({
    ...s,
    orders: s.orders.map((o) => {
      if (
        o.id === id &&
        (!bookerUsername || o.bookerUsername === bookerUsername) &&
        o.status === 'active'
      ) {
        ok = true
        return { ...o, status: 'cancelled' }
      }
      return o
    }),
  }))
  return ok
}

export function ordersForUser(username) {
  if (!username) return []
  return state.orders
    .filter((o) => o.bookerUsername.toLowerCase() === username.toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt)
}

// Standalone VIP access codes (admin) ---------------------------------------
export function createCode({ offeringId, note, expiry }) {
  const code = {
    id: uid('code'),
    code: genCode(),
    offeringId: offeringId || null,
    note: note?.trim() || '',
    expiry: expiry || '', // '' = no expiry
    redeemed: false,
    createdAt: Date.now(),
  }
  set((s) => ({ ...s, codes: [code, ...s.codes] }))
  return code
}

export function deleteCode(id) {
  set((s) => ({ ...s, codes: s.codes.filter((c) => c.id !== id) }))
}

// Redeem a code: matches either a standalone VIP code or a booking access code.
export function redeemCode(raw) {
  const value = (raw || '').trim().toUpperCase()
  if (!value) return { error: 'Entrez un code.' }

  const vip = state.codes.find((c) => c.code === value)
  if (vip) {
    if (vip.expiry) {
      const exp = new Date(vip.expiry + 'T23:59:59')
      if (Date.now() > exp.getTime()) return { error: 'Ce code a expiré.' }
    }
    if (vip.redeemed) return { error: 'Ce code a déjà été utilisé.' }
    set((s) => ({
      ...s,
      codes: s.codes.map((c) => (c.id === vip.id ? { ...c, redeemed: true } : c)),
    }))
    const offering = state.offerings.find((o) => o.id === vip.offeringId)
    return {
      kind: 'vip',
      title: offering ? offering.name : 'Accès VIP',
      note: vip.note || 'Code VIP validé. Suivez les instructions fournies par l’hôte.',
    }
  }

  const order = state.orders.find((o) => o.accessCode === value)
  if (order) {
    if (order.status !== 'active') return { error: 'Cette réservation n’est plus active.' }
    return {
      kind: 'booking',
      title: order.offeringName,
      note: `Réservation confirmée pour « ${order.bookerUsername} » le ${order.date} à ${formatTime(
        order.start,
      )}.`,
    }
  }

  return { error: 'Code inconnu.' }
}

// Admin: reset everything to seed (useful for demos)
export function resetAll() {
  set(seed())
}
