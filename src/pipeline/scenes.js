import { clamp, span, smooth, lerp, rng } from './useCanvasScene.js'

// Each factory returns { resize(w, h), draw(ctx, p, t, dt) }. p is the scroll
// progress through the scene (0..1); t is seconds of wall time (frozen when
// the visitor prefers reduced motion).

const INK = '#0d0f13'
const PAPER = '#eef0f2'
const HOT = '#ff4f1f'
const SUN = '#ffc21a'
const MONO = "'Martian Mono Variable', ui-monospace, monospace"

// The part of the frame the drawing owns: right side on wide screens, top on
// narrow ones. Text sits in the rest.
function stage(w, h) {
  if (w >= 900) return { x: w * 0.44, y: h * 0.12, w: w * 0.56 - 200, h: h * 0.76, wide: true }
  return { x: 16, y: h * 0.1, w: w - 32, h: h * 0.44, wide: false }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.min(r, w / 2, h / 2))
}

function label(ctx, text, x, y, color, size = 11, align = 'left') {
  ctx.font = `500 ${size}px ${MONO}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

// A label that must stay inside its column: shrink it, and drop it rather
// than let it run into the next column.
function fitLabel(ctx, text, x, y, max, color, size) {
  for (let px = size; px >= 7; px--) {
    ctx.font = `500 ${px}px ${MONO}`
    if (ctx.measureText(text).width <= max) return label(ctx, text, x, y, color, px)
  }
}

/* ------------------------------------------------------------------ INGEST */
// A memory-mapped ring buffer taking a stream of log lines. Mid-scroll the
// consumer slows (backpressure), the ring fills, and the overflow spills to
// disk instead of being dropped; then the consumer catches up and drains it.
export function createIngest() {
  let s
  const rand = rng(7)
  const lanes = Array.from({ length: 70 }, () => ({ o: rand(), y: rand() - 0.5, len: 6 + rand() * 18 }))
  return {
    resize(w, h) { s = stage(w, h) },
    draw(ctx, p, t) {
      const R = Math.min(s.w, s.h) * (s.wide ? 0.3 : 0.36)
      const cx = s.x + s.w * (s.wide ? 0.62 : 0.6)
      const cy = s.y + s.h * 0.42
      const N = 64
      const rate = lerp(0.25, 1, smooth(span(p, 0, 0.45)))
      const back = span(p, 0.5, 0.66) - span(p, 0.8, 0.94)
      const fill = clamp(lerp(0.3, 1, span(p, 0.5, 0.66)) - 0.7 * span(p, 0.8, 0.94))
      const spilled = Math.round(16 * (span(p, 0.6, 0.76) - span(p, 0.84, 0.97)))
      const head = t * (0.6 + 2.2 * rate) + p * 9

      // Incoming lines converge on the write head.
      const hx = cx + Math.cos(head - Math.PI / 2) * R
      const hy = cy + Math.sin(head - Math.PI / 2) * R
      const x0 = s.wide ? s.x - s.w * 0.05 : s.x
      ctx.lineCap = 'round'
      for (let i = 0; i < lanes.length * rate; i++) {
        const L = lanes[i]
        const ph = (L.o + t * (0.25 + rate * 0.9)) % 1
        const x = lerp(x0, cx - R * 0.95, ph)
        const y = lerp(cy + L.y * R * 2.2, cy + L.y * R * 0.6, ph)
        ctx.strokeStyle = `rgba(13,15,19,${0.15 + 0.6 * ph})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + L.len, y)
        ctx.stroke()
      }

      // Ring slots: filled from the read tail up to the write head.
      const filled = Math.round(fill * N)
      const headSlot = Math.floor(((head / (Math.PI * 2)) % 1) * N)
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2
        const d = (headSlot - i + N) % N
        const on = d < filled
        ctx.save()
        ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
        ctx.rotate(a)
        ctx.fillStyle = on ? INK : 'rgba(13,15,19,0.16)'
        roundRect(ctx, -9, -4, 18, 8, 2)
        ctx.fill()
        ctx.restore()
      }
      // Write head marker.
      ctx.fillStyle = PAPER
      ctx.beginPath()
      ctx.arc(hx, hy, 6, 0, Math.PI * 2)
      ctx.fill()

      label(ctx, 'mmap ring buffer', cx, cy - 8, INK, s.wide ? 13 : 11, 'center')
      label(ctx, `${Math.round(fill * 100)}% full`, cx, cy + 14, 'rgba(13,15,19,0.65)', s.wide ? 12 : 10, 'center')

      // Disk spill: overflow is written down, never dropped.
      const bw = Math.max(10, R * 0.16)
      const dy = cy + R + (s.wide ? 48 : 30)
      const cols = 8
      for (let i = 0; i < 16; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = cx - (cols * (bw + 4)) / 2 + col * (bw + 4)
        const y = dy + row * (bw * 0.6 + 4)
        ctx.fillStyle = i < spilled ? INK : 'rgba(13,15,19,0.1)'
        roundRect(ctx, x, y, bw, bw * 0.6, 2)
        ctx.fill()
      }
      label(ctx, spilled ? `disk spill · ${spilled} segments` : 'disk spill · idle', cx, dy - 16, INK, 11, 'center')

      if (back > 0.05) {
        ctx.globalAlpha = Math.min(1, back * 3)
        ctx.fillStyle = INK
        const txt = 'BACKPRESSURE'
        ctx.font = `700 12px ${MONO}`
        const tw = ctx.measureText(txt).width + 20
        roundRect(ctx, cx - tw / 2, cy - R - 44, tw, 24, 12)
        ctx.fill()
        label(ctx, txt, cx, cy - R - 32, HOT, 12, 'center')
        ctx.globalAlpha = 1
      }
    },
  }
}

/* ------------------------------------------------------------------- STORE */
// Row-shaped JSON records re-lay themselves into columns, then each column
// compresses by its own codec. The highlighted row is our event.
export function createStore() {
  let s
  const rand = rng(21)
  const COLS = [
    { name: 'tenant', codec: 'LowCardinality', ratio: 0.12, short: 'LowCard' },
    { name: 'ts', codec: 'ZSTD', ratio: 0.2, short: 'ZSTD' },
    { name: 'src_ip', codec: 'ZSTD', ratio: 0.36, short: 'ZSTD' },
    { name: 'user', codec: 'LowCardinality', ratio: 0.18, short: 'LowCard' },
    { name: 'action', codec: 'LowCardinality', ratio: 0.1, short: 'LowCard' },
    { name: 'payload', codec: 'typed JSON', ratio: 0.62, short: 'JSON' },
  ]
  const ROWS = 14
  const EVENT = 4
  const cells = Array.from({ length: ROWS }, () => COLS.map(() => 0.4 + rand() * 1.1))
  return {
    resize(w, h) { s = stage(w, h) },
    draw(ctx, p, t) {
      const pivot = smooth(span(p, 0.15, 0.48))
      const squeeze = smooth(span(p, 0.55, 0.85))
      const top = s.y + 56
      const rowH = (s.h - 92) / ROWS
      const cellH = rowH * 0.62
      const colW = s.w / COLS.length

      COLS.forEach((c, f) => {
        const x = s.x + f * colW
        ctx.globalAlpha = pivot
        fitLabel(ctx, c.name, x + 2, top - 38, colW - 10, PAPER, s.wide ? 12 : 10)
        ctx.globalAlpha = squeeze
        fitLabel(ctx, c.short, x + 2, top - 20, colW - 10, 'rgba(238,240,242,0.75)', s.wide ? 11 : 9)
        ctx.globalAlpha = 1
      })

      for (let r = 0; r < ROWS; r++) {
        const stagger = clamp(pivot * 1.4 - (r / ROWS) * 0.4)
        let rx = s.x
        const rowTotal = cells[r].reduce((a, b) => a + b, 0)
        for (let f = 0; f < COLS.length; f++) {
          const wRow = (cells[r][f] / rowTotal) * s.w - 4
          const wCol = colW - 10
          const xCol = s.x + f * colW
          const k = COLS[f].ratio
          const yRow = top + r * rowH
          const yCol = top + r * rowH * lerp(1, k, squeeze)
          const x = lerp(rx, xCol, stagger)
          const y = lerp(yRow, yCol, squeeze)
          const cw = lerp(wRow, wCol, stagger)
          const ch = cellH * lerp(1, k, squeeze)
          const isEvent = r === EVENT
          ctx.fillStyle = isEvent ? HOT : `rgba(238,240,242,${0.28 + 0.5 * ((r * 7 + f * 3) % 5) / 5})`
          roundRect(ctx, x, y, cw, ch, Math.min(4, ch / 2))
          ctx.fill()
          rx += wRow + 4
        }
      }
      if (squeeze > 0.02) {
        // Outline of the space the data used before.
        ctx.setLineDash([4, 6])
        ctx.strokeStyle = `rgba(238,240,242,${0.5 * squeeze})`
        ctx.lineWidth = 1
        ctx.strokeRect(s.x - 4, top - 6, s.w + 4, ROWS * rowH + 2)
        ctx.setLineDash([])
      }
      // The event row pulses so the eye can follow it.
      const pulse = 0.5 + 0.5 * Math.sin(t * 3)
      ctx.fillStyle = `rgba(255,79,31,${0.25 * pulse})`
      ctx.beginPath()
      ctx.arc(s.x - 14, top + EVENT * rowH * lerp(1, 0.3, squeeze) + cellH / 2, 5, 0, Math.PI * 2)
      ctx.fill()
    },
  }
}

/* ------------------------------------------------------------------ DETECT */
// User and entity activity as a field of dots. Simple rules ring dozens of
// them; the models clear most of those rings and keep the real anomaly.
export function createDetect() {
  let s
  let dots = []
  let alerts = []
  let eventDot
  const build = () => {
    const rand = rng(99)
    const n = s.wide ? 520 : 260
    const centers = [[0.3, 0.35], [0.66, 0.3], [0.45, 0.7], [0.8, 0.68]]
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5
    dots = Array.from({ length: n }, () => {
      const c = centers[Math.floor(rand() * centers.length)]
      return { x: c[0] + gauss() * 0.12, y: c[1] + gauss() * 0.13, ph: rand() * 6.28, sp: 0.3 + rand() * 0.7 }
    })
    alerts = Array.from({ length: 40 }, (_, i) => ({ i: Math.floor(rand() * n), keep: i < 7 }))
    eventDot = { x: 0.96, y: 0.08 }
  }
  const pos = (d, t) => [
    s.x + (d.x + Math.sin(t * d.sp + d.ph) * 0.006) * s.w,
    s.y + (d.y + Math.cos(t * d.sp * 0.8 + d.ph) * 0.006) * s.h,
  ]
  return {
    resize(w, h) { s = stage(w, h); build() },
    draw(ctx, p, t) {
      const rules = span(p, 0.08, 0.32)
      const models = smooth(span(p, 0.42, 0.82))
      ctx.fillStyle = 'rgba(238,240,242,0.55)'
      for (const d of dots) {
        const [x, y] = pos(d, t)
        ctx.fillRect(x - 1.25, y - 1.25, 2.5, 2.5)
      }
      alerts.forEach((a, k) => {
        const appear = clamp(rules * 40 - k)
        const gone = a.keep ? 0 : clamp(models * 33 - (k % 33))
        const alpha = appear * (1 - gone)
        if (alpha <= 0.01) return
        const [x, y] = pos(dots[a.i], t)
        ctx.strokeStyle = `rgba(255,194,26,${0.9 * alpha})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(x, y, 7 + 3 * (1 - appear), 0, Math.PI * 2)
        ctx.stroke()
      })
      // The event: far from every cluster.
      const ex = s.x + eventDot.x * s.w
      const ey = s.y + eventDot.y * s.h + (s.wide ? 20 : 12)
      ctx.fillStyle = HOT
      ctx.beginPath()
      ctx.arc(ex, ey, 5, 0, Math.PI * 2)
      ctx.fill()
      const flagged = span(p, 0.5, 0.7)
      if (flagged > 0) {
        const r = 12 + 4 * Math.sin(t * 4)
        ctx.strokeStyle = `rgba(255,79,31,${flagged})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ex, ey, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = flagged
        label(ctx, 'anomaly · sample event', ex - 22, ey, HOT, s.wide ? 12 : 10, 'right')
        ctx.globalAlpha = 1
      }
    },
  }
}

/* ----------------------------------------------------------------- RESPOND */
// Alerts pour in as cards. First the low-priority ones are closed where they
// lie; then the rest move to the analyst's queue, where duplicates stack
// into one case each. The queue ends much shorter than the pile it came from.
export function createRespond() {
  let s
  const rand = rng(5)
  const GROUPS = 6
  const alerts = Array.from({ length: 32 }, (_, i) => ({
    g: i === 0 ? 0 : Math.floor(rand() * GROUPS),
    low: i !== 0 && rand() < 0.32,
    px: rand(),
    py: rand(),
    rot: (rand() - 0.5) * 0.5,
    d: rand() * 0.18,
    event: i === 0,
  }))
  // Stack depth counts only the alerts that actually reach the queue.
  const depth = {}
  for (const a of alerts) {
    if (a.low) continue
    a.dup = depth[a.g] ?? 0
    depth[a.g] = a.dup + 1
  }
  const cases = Object.keys(depth).length
  return {
    resize(w, h) { s = stage(w, h) },
    draw(ctx, p) {
      const cw = s.wide ? Math.min(150, s.w * 0.26) : s.w * 0.34
      const slotH = (s.h - 70) / GROUPS
      const ch = Math.min(cw * 0.5, slotH - 16)
      const laneX = s.x + s.w - cw - 8
      const pileW = s.w - cw - 70
      const closing = (a) => smooth(span(p, 0.1 + a.d * 0.5, 0.32 + a.d * 0.5))
      const move = (a) => smooth(span(p, 0.36 + a.d, 0.66 + a.d))
      const slotY = (g) => s.y + 30 + g * slotH

      label(ctx, 'incoming alerts', s.x, s.y + 4, INK, 11)
      label(ctx, 'analyst queue', laneX, s.y + 4, INK, 11)

      const order = [...alerts].sort((a, b) => (a.low ? -1 : move(a)) - (b.low ? -1 : move(b)))
      for (const a of order) {
        const fromX = s.x + a.px * Math.max(0, pileW - cw)
        const fromY = s.y + 30 + a.py * (s.h - ch - 40)
        let x = fromX
        let y = fromY
        let k = 0
        let alpha = 1
        let strike = 0
        if (a.low) {
          const c = closing(a)
          strike = Math.min(1, c * 2)
          alpha = 1 - span(c, 0.5, 1)
          if (alpha <= 0.01) continue
        } else {
          k = move(a)
          x = lerp(fromX, laneX + a.dup * 4, k)
          y = lerp(fromY, slotY(a.g) - a.dup * 4 + (slotH - ch) / 2, k)
        }
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(x + cw / 2, y + ch / 2)
        ctx.rotate(a.rot * (1 - k))
        ctx.fillStyle = a.event ? HOT : PAPER
        ctx.strokeStyle = INK
        ctx.lineWidth = 1.5
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 6)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = INK
        ctx.fillRect(-cw / 2 + 10, -ch / 2 + 9, cw * 0.5, 3)
        ctx.fillRect(-cw / 2 + 10, -ch / 2 + 17, cw * 0.32, 3)
        if (strike > 0) {
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(-cw / 2 + 6, 0)
          ctx.lineTo(-cw / 2 + 6 + (cw - 12) * strike, 0)
          ctx.stroke()
        }
        ctx.restore()
      }

      // Case counts, once the stacks have landed.
      const settled = span(p, 0.72, 0.84)
      if (settled > 0) {
        ctx.globalAlpha = settled
        for (let g = 0; g < GROUPS; g++) {
          const n = depth[g] ?? 0
          if (n > 1) label(ctx, `${n} merged`, laneX - 14, slotY(g) + slotH / 2, INK, 11, 'right')
        }
        label(ctx, `${alerts.length} alerts → ${cases} cases`, laneX + cw, s.y + s.h - 6, INK, 12, 'right')
        ctx.globalAlpha = 1
      }
    },
  }
}
