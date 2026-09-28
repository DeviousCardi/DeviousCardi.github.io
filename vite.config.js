import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'

// GitHub Pages cannot send response headers, so the policy ships as a <meta>
// tag. It is added to built pages only: the dev server injects inline styles
// for hot reload, which this policy would (correctly) block.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityMeta = {
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    )
  },
}

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch (e) {
    return e.stdout?.toString().trim() ?? ''
  }
}

// Facts about this build, measured rather than written by hand, served as
// build-info.json for the "hardened system" panel on the page.
const buildInfo = {
  name: 'build-info',
  apply: 'build',
  generateBundle(_, bundle) {
    let js = 0
    let css = 0
    let fonts = 0
    for (const file of Object.values(bundle)) {
      const body = file.type === 'chunk' ? file.code : file.source
      if (file.fileName.endsWith('.js')) js += gzipSync(body).length
      else if (file.fileName.endsWith('.css')) css += gzipSync(body).length
      else if (file.fileName.endsWith('.woff2')) fonts += 1
    }
    let vulnerabilities = null
    try {
      const audit = JSON.parse(sh('npm audit --omit=dev --json'))
      vulnerabilities = audit.metadata?.vulnerabilities?.total ?? null
    } catch {
      vulnerabilities = null
    }
    const sha = process.env.GITHUB_SHA || sh('git rev-parse HEAD')
    const commit = /^[0-9a-f]{40}$/.test(sha) ? sha : null
    const info = {
      commit,
      builtAt: new Date().toISOString(),
      jsGzipBytes: js,
      cssGzipBytes: css,
      fontFiles: fonts,
      csp: CSP,
      vulnerabilities,
    }
    this.emitFile({ type: 'asset', fileName: 'build-info.json', source: JSON.stringify(info, null, 2) })
  },
}

export default defineConfig({
  plugins: [react(), securityMeta, buildInfo],
  build: {
    // Keep fonts as files: font-src 'self' does not allow data: URIs.
    assetsInlineLimit: 0,
    sourcemap: false,
  },
})
