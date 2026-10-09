import { useEffect, useRef, useState } from 'react'
import {
  motion,
  animate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { createIngest, createStore, createDetect, createRespond } from './scenes.js'
import { useCanvasScene, span, lerp } from './useCanvasScene.js'
import { person, links, experience, projects, skills } from '../shared/content.js'
import { useContact } from '../shared/contact.js'
import { ExternalLink } from '../shared/ExternalLink.jsx'
import { Icon } from '../shared/Icon.jsx'
import { SystemPanel } from './SystemPanel.jsx'

const ease = [0.16, 1, 0.3, 1]

const fmtInt = (v) => Math.round(v).toLocaleString('en-US')
const cut = (n) => `−${Math.round(n)}%`
const gain = (n) => `+${Math.round(n)}%`

// The pipeline, in the order an event actually travels through it.
const stages = [
  {
    id: 'ingest',
    name: 'Ingest',
    tone: 'hot',
    create: createIngest,
    title: 'Rebuilt log ingestion in Rust.',
    body: 'JVM services and their network hand-offs became a memory-mapped circular buffer. When consumers fall behind, it spills to disk instead of dropping data.',
    stats: [
      { value: 100000, format: fmtInt, unit: 'logs / sec, no GC pauses' },
      { value: 33, format: cut, unit: 'compute cost' },
    ],
  },
  {
    id: 'store',
    name: 'Store',
    tone: 'cobalt',
    create: createStore,
    title: 'Moved storage from OpenSearch to ClickHouse.',
    body: 'ReplicatedMergeTree tables with ZSTD codecs, LowCardinality encoding, typed JSON fields and bloom-filter skip indexes. Search stays sub-second over billions of events.',
    stats: [
      { value: 68, format: cut, unit: 'storage cost' },
      { fixed: '10 TB', unit: 'ingested per day' },
    ],
  },
  {
    id: 'detect',
    name: 'Detect',
    tone: 'ink',
    create: createDetect,
    title: 'UEBA models that keep the real anomaly.',
    body: 'Python models using Isolation Forest, autoencoder, GNN and Random Forest over user and entity activity, replacing rules that rang on everything.',
    stats: [
      { value: 82, format: cut, unit: 'false positives' },
      { fixed: '+25%', unit: 'detection coverage' },
    ],
  },
  {
    id: 'respond',
    name: 'Respond',
    tone: 'sun',
    create: createRespond,
    title: 'An AI-enabled SOAR platform.',
    body: 'Enrichment, playbook response and case merging. Similarity scoring closes duplicate and low-priority cases, and threat hunters query it through a RAG interface.',
    stats: [{ value: 75, format: gain, unit: 'cases handled per analyst' }],
  },
  {
    id: 'access',
    name: 'Access',
    tone: 'green',
    title: 'Built the IAM service end to end.',
    body: 'AWS IAM-style allow and deny policies evaluated on every request, REST and gRPC APIs, and enterprise sign-in through SAML, OIDC and LDAP.',
    stats: [{ fixed: 'SAML · OIDC · LDAP', unit: 'enterprise sign-in' }],
  },
]

const railStops = [...stages.map((s) => ({ id: s.id, name: s.name })), { id: 'you', name: 'You' }]

export default function App() {
  const contact = useContact()
  const [active, setActive] = useState('hero')
  // The bar steps out of the way while reading down and returns on scroll up.
  const [away, setAway] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setAway(y > 120 && y > prev)
    setScrolled(y > 8)
    // The bar takes the colour of whichever field is directly under it.
    for (const el of document.querySelectorAll('[data-field]')) {
      const r = el.getBoundingClientRect()
      if (r.top <= 32 && r.bottom > 32) {
        document.documentElement.dataset.tone = el.dataset.field
        break
      }
    }
  })
  // The fixed bar and rail take their colour from the field they sit on.

  return (
    <>
      <a className="skip" href="#you">Skip to contact and resume</a>
      <header className={`bar ${away ? 'is-away' : ''} ${scrolled ? 'is-solid' : ''}`}>
        <a className="bar__name" href="#top">Aarav Jadav</a>
        <nav className="bar__links" aria-label="Contact">
          <a href={person.resumePdf} download>Resume<span className="wide-only"> PDF</span></a>
          <a href={contact?.mailto ?? '#you'}>Email</a>
          <ExternalLink href={links.github}>GitHub</ExternalLink>
        </nav>
      </header>
      <Rail active={active} hidden={!stages.some((s) => s.id === active)} />

      <main id="top">
        <Hero onActive={setActive} />
        {stages.map((s, i) => (
          <Scene key={s.id} stage={s} index={i} onActive={setActive} />
        ))}
        <You contact={contact} onActive={setActive} />
        <SystemPanel onActive={setActive} />
      </main>
    </>
  )
}

/* ----------------------------------------------------------------- hero */

const sampleEvent = '{"ts":"2026-09-28T04:12:09Z","tenant":"t-0417","user":"svc-backup","src":"10.40.7.19","action":"login","result":"fail","count":37}'

function Hero({ onActive }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-50% 0px -50% 0px' })
  useEffect(() => { if (inView) onActive('hero') }, [inView, onActive])
  const reduce = useReducedMotion()
  const intro = useMotionValue(reduce ? 1 : 0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Loads narrow and expands to full width; scrolling away compresses it again.
  const wdth = useTransform([intro, scrollYProgress], ([i, s]) => lerp(75, lerp(125, 80, s), i))
  const fvs = useTransform(wdth, (w) => `'wdth' ${w.toFixed(1)}`)
  const [typed, setTyped] = useState(reduce ? sampleEvent.length : 0)

  useEffect(() => {
    if (reduce) return
    const a = animate(intro, 1, { duration: 1.4, ease, delay: 0.15 })
    return () => a.stop()
  }, [intro, reduce])

  useEffect(() => {
    if (reduce || typed >= sampleEvent.length) return
    const id = setTimeout(() => setTyped((n) => Math.min(sampleEvent.length, n + 3)), typed === 0 ? 900 : 16)
    return () => clearTimeout(id)
  }, [typed, reduce])

  return (
    <section className="hero" ref={ref} data-field="paper" aria-labelledby="hero-name">
      <motion.h1 id="hero-name" className="hero__name" style={{ fontVariationSettings: fvs }}>
        <span>Aarav</span>
        <span>Sunil Jadav</span>
      </motion.h1>
      <div className="hero__foot">
        <motion.p
          className="hero__lede"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.6 }}
        >
          Backend &amp; full-stack engineer. I lead the 7+ engineers behind a multi-tenant security platform used by
          30+ enterprises. Scroll to follow one event through the systems I built.
        </motion.p>
        <div className="event" aria-label="Sample event">
          <span className="event__tag">sample event</span>
          <code className="event__line">
            {sampleEvent.slice(0, typed)}
            <span className="event__caret" aria-hidden="true" />
          </code>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- scenes */

function Scene({ stage, index, onActive }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const inView = useInView(ref, { margin: '-50% 0px -50% 0px' })
  useEffect(() => { if (inView) onActive(stage.id) }, [inView, onActive, stage.id])

  return (
    <section id={stage.id} ref={ref} data-field={stage.tone} className={`scene tone-${stage.tone}`} aria-labelledby={`${stage.id}-title`}>
      <div className="scene__frame">
        {stage.create ? <SceneCanvas create={stage.create} progress={scrollYProgress} /> : <Policy progress={scrollYProgress} />}
        <div className="scene__text">
          <p className="scene__step">
            <span>{String(index + 1).padStart(2, '0')}</span> {stage.name}
          </p>
          <motion.h2
            id={`${stage.id}-title`}
            className="scene__title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease }}
          >
            {stage.title}
          </motion.h2>
          <p className="scene__body">{stage.body}</p>
          <dl className="stats">
            {stage.stats.map((st) => (
              <Stat key={st.unit} stat={st} />
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function SceneCanvas({ create, progress }) {
  const ref = useCanvasScene(create, progress)
  return <canvas ref={ref} className="scene__canvas" aria-hidden="true" />
}

// The final figure is always what the page says: it is in the DOM from the
// first render, and screen readers only ever get that. The count-up runs once,
// when the number first comes into view, then settles on the same text.
function Stat({ stat }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const final = stat.format ? stat.format(stat.value) : stat.fixed

  useEffect(() => {
    if (!inView || reduce || !stat.format) return
    const el = ref.current
    const a = animate(0, stat.value, {
      duration: 1.4,
      ease,
      onUpdate: (v) => { el.textContent = stat.format(v) },
      onComplete: () => { el.textContent = final },
    })
    return () => { a.stop(); el.textContent = final }
  }, [inView, reduce, stat, final])

  return (
    <div className="stat">
      <dt className="stat__unit">{stat.unit}</dt>
      <dd className="stat__value">
        <span ref={ref} aria-hidden="true">{final}</span>
        <span className="sr-only">{final}</span>
      </dd>
    </div>
  )
}

// IAM: a request walks down a policy, statement by statement, and gets a verdict.
const policy = [
  { text: '{', role: 'x' },
  { text: '  "Effect": "Deny",', role: 'deny' },
  { text: '  "Action": "logs:Delete",', role: 'deny' },
  { text: '  "Resource": "tenant/*"', role: 'deny' },
  { text: '},', role: 'x' },
  { text: '{', role: 'x' },
  { text: '  "Effect": "Allow",', role: 'allow' },
  { text: '  "Action": "logs:Query",', role: 'allow' },
  { text: '  "Resource": "tenant/t-0417/*",', role: 'allow' },
  { text: '  "Condition": { "idp": ["saml", "oidc", "ldap"] }', role: 'allow' },
  { text: '}', role: 'x' },
]

function Policy({ progress }) {
  const [line, setLine] = useState(-1)
  useMotionValueEvent(progress, 'change', (p) => {
    const next = Math.floor(span(p, 0.12, 0.7) * (policy.length + 1)) - 1
    setLine((cur) => (cur === next ? cur : next))
  })
  const verdict = line >= policy.length - 1
  return (
    <div className="policy" aria-hidden="true">
      <p className="policy__req">
        <b>request</b> svc-backup → logs:Query tenant/t-0417 via SAML
      </p>
      <pre className="policy__doc">
        {policy.map((l, i) => (
          <span key={i} className={`policy__line ${i <= line ? `is-${l.role}` : ''} ${i === line ? 'is-cursor' : ''}`}>
            {l.text}
            {'\n'}
          </span>
        ))}
      </pre>
      <motion.p
        className="policy__verdict"
        initial={false}
        animate={verdict ? { opacity: 1, scale: 1, rotate: -4 } : { opacity: 0, scale: 1.4, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        ALLOW
      </motion.p>
    </div>
  )
}

/* ----------------------------------------------------------- rail + you */

function Rail({ active, hidden }) {
  return (
    <nav className={`rail ${hidden ? 'is-hidden' : ''}`} aria-label="Pipeline stages">
      <ol>
        {railStops.map((s) => (
          <li key={s.id} className={active === s.id ? 'is-active' : ''}>
            <a href={`#${s.id}`}>
              {active === s.id && (
                <motion.span layoutId="rail-dot" className="rail__dot" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <span className="rail__name">{s.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function You({ contact, onActive }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-50% 0px -50% 0px' })
  useEffect(() => { if (inView) onActive('you') }, [inView, onActive])
  const job = experience[0]

  return (
    <section id="you" ref={ref} data-field="paper" className="you" aria-labelledby="you-title">
      <div className="you__head">
        <p className="scene__step"><span>06</span> Delivered</p>
        <h2 id="you-title" className="you__title">Hiring for backend, data or full-stack? Let’s talk.</h2>
      </div>

      <div className="contact">
        <ContactRow label="Email" value={contact?.email} href={contact?.mailto} icon="mail" />
        <ContactRow label="Phone" value={contact?.phone} href={contact?.tel} icon="phone" />
        <ContactRow label="GitHub" value="DeviousCardi" href={links.github} icon="github" external />
        <ContactRow label="LinkedIn" value="aarav-jadav" href={links.linkedin} icon="linkedin" external />
        <a className="crow crow--pdf" href={person.resumePdf} download>
          <span className="crow__label"><Icon name="download" /> Resume</span>
          <span className="crow__value">Download PDF</span>
          <Icon name="arrow" className="crow__arrow" />
        </a>
      </div>

      <div className="cv">
        <article className="cv__block cv__block--wide">
          <h3>{job.company}</h3>
          <p className="cv__meta">{job.title} · {job.when}</p>
          <ul className="cv__items">
            {job.items.map((it) => (
              <li key={it.headline}><b>{it.headline}.</b> {it.text}</li>
            ))}
          </ul>
        </article>
        <div className="cv__side">
          {experience.slice(1).map((j) => (
            <article className="cv__block" key={j.id}>
              <h3>{j.company}</h3>
              <p className="cv__meta">{[j.title, j.when, j.place].filter(Boolean).join(' · ')}</p>
              {j.items.map((it) => (
                <p key={it.headline} className="cv__text"><b>{it.headline}.</b> {it.text}{it.links && <> {' · '}{it.links.map((link, index) => <span key={link.url}>{index > 0 && ' · '}<ExternalLink href={link.url}>{link.label}</ExternalLink></span>)}</>}</p>
              ))}
            </article>
          ))}
          {projects.map((p) => (
            <article className="cv__block" key={p.id}>
              <h3>{p.url ? <ExternalLink href={p.url}>{p.name}</ExternalLink> : p.name}</h3>
              <p className="cv__meta">{p.lang} · {p.when} · {p.status}</p>
              <p className="cv__text">{p.text}</p>
            </article>
          ))}
          <article className="cv__block">
            <h3>Education</h3>
            <p className="cv__text">{person.education}</p>
          </article>
        </div>
        <div className="cv__skills">
          {skills.map((g) => (
            <div key={g.group}>
              <h3>{g.group}</h3>
              <p>{g.items.join(' · ')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactRow({ label, value, href, icon, external }) {
  const inner = (
    <>
      <span className="crow__label"><Icon name={icon} /> {label}</span>
      <span className="crow__value">{value ?? 'Turn on JavaScript to show this'}</span>
      <Icon name="arrow" className="crow__arrow" />
    </>
  )
  if (!href) return <div className="crow">{inner}</div>
  return external ? <ExternalLink className="crow" href={href}>{inner}</ExternalLink> : <a className="crow" href={href}>{inner}</a>
}
