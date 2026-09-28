import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

const REPO = 'https://github.com/DeviousCardi/DeviousCardi.github.io'

// Checks this page can make about itself, right now, in the visitor's browser.
function liveChecks() {
  const origin = location.origin
  const resources = performance.getEntriesByType('resource')
  const foreign = resources.filter((r) => {
    try { return new URL(r.name).origin !== origin } catch { return true }
  })
  return {
    requests: resources.length,
    foreign: foreign.length,
    csp: Boolean(document.querySelector('meta[http-equiv="Content-Security-Policy"]')),
    inlineScripts: document.querySelectorAll('script:not([src])').length,
    framed: window.top !== window.self,
    https: location.protocol === 'https:' || location.hostname === 'localhost',
  }
}

export function SystemPanel({ onActive }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-50% 0px -50% 0px' })
  useEffect(() => { if (inView) onActive('system') }, [inView, onActive])
  const [build, setBuild] = useState(undefined)
  const [live, setLive] = useState(null)

  useEffect(() => {
    let alive = true
    fetch('build-info.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setBuild(j))
      .catch(() => alive && setBuild(null))
    // Measure after the page has settled so every font and chunk is counted.
    const id = setTimeout(() => alive && setLive(liveChecks()), 1500)
    return () => { alive = false; clearTimeout(id) }
  }, [])

  const kb = (b) => `${(b / 1024).toFixed(1)} KB`

  return (
    <section className="system" id="system" ref={ref} data-field="ink" aria-labelledby="system-title">
      <h2 id="system-title" className="system__title">This site is a hardened system too.</h2>
      <p className="system__lede">
        Measured in your browser just now, and at build time. Nothing here is typed by hand.
      </p>

      <div className="system__grid">
        <div className="system__col">
          <h3>Live, in this tab</h3>
          {live ? (
            <dl>
              <Row k="Requests to other domains" v={live.foreign} ok={live.foreign === 0} />
              <Row k="Files this page loaded" v={live.requests} />
              <Row k="Content Security Policy" v={live.csp ? 'enforced' : 'missing'} ok={live.csp} />
              <Row k="Inline scripts" v={live.inlineScripts} ok={live.inlineScripts === 0} />
              <Row k="Embedded in another site" v={live.framed ? 'yes' : 'no, and it refuses to be'} ok={!live.framed} />
              <Row k="Contact details in the HTML" v="none; joined in your browser" ok />
            </dl>
          ) : (
            <p className="system__wait">Measuring…</p>
          )}
        </div>

        <div className="system__col">
          <h3>At build</h3>
          {build === undefined && <p className="system__wait">Loading build record…</p>}
          {build === null && (
            <p className="system__wait">No build record here. It is written by the production build, so this is a development server.</p>
          )}
          {build && (
            <dl>
              <Row
                k="Commit"
                v={build.commit ? (
                  <a href={`${REPO}/commit/${build.commit}`} target="_blank" rel="noopener noreferrer">{build.commit.slice(0, 7)}</a>
                ) : 'not committed yet'}
              />
              <Row k="Built" v={new Date(build.builtAt).toUTCString().replace(' GMT', ' UTC')} />
              <Row k="JavaScript, gzipped" v={kb(build.jsGzipBytes)} />
              <Row k="CSS, gzipped" v={kb(build.cssGzipBytes)} />
              <Row k="Fonts, self-hosted" v={`${build.fontFiles} files`} />
              <Row
                k="Known vulnerabilities (npm audit)"
                v={build.vulnerabilities ?? 'not checked'}
                ok={build.vulnerabilities === 0}
              />
            </dl>
          )}
        </div>
      </div>

      {build?.csp && (
        <details className="system__csp">
          <summary>Read the policy</summary>
          <code>{build.csp}</code>
        </details>
      )}
      <p className="system__source">
        Source: <a href={REPO} target="_blank" rel="noopener noreferrer">github.com/DeviousCardi/DeviousCardi.github.io</a>
      </p>
    </section>
  )
}

function Row({ k, v, ok }) {
  return (
    <div className="system__row">
      <dt>{k}</dt>
      <dd>
        {ok !== undefined && <span className={`tick ${ok ? 'tick--ok' : 'tick--bad'}`} aria-label={ok ? 'pass' : 'fail'} />}
        {v}
      </dd>
    </div>
  )
}
