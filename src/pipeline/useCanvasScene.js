import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

// Runs a canvas scene. The loop only runs while the scene is on screen and the
// tab is visible; with reduced motion, time is frozen and the scene redraws
// only when scroll progress changes.
export function useCanvasScene(createScene, progress) {
  const canvasRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const scene = createScene()
    let w = 0
    let h = 0
    let raf = 0
    let visible = false
    let last = performance.now()
    let t = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene.resize(w, h)
      draw(0)
    }

    const draw = (dt) => {
      ctx.clearRect(0, 0, w, h)
      scene.draw(ctx, progress.get(), t, dt)
    }

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt
      draw(dt)
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (raf || reduce || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const onVisibility = () => (document.hidden ? stop() : visible && start())
    document.addEventListener('visibilitychange', onVisibility)

    // Reduced motion: redraw on scroll only.
    const unsub = reduce ? progress.on('change', () => draw(0)) : () => {}

    resize()
    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      unsub()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [createScene, progress, reduce])

  return canvasRef
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
// Map p from [a, b] to [0, 1].
export const span = (p, a, b) => clamp((p - a) / (b - a))
export const smooth = (x) => x * x * (3 - 2 * x)
export const lerp = (a, b, x) => a + (b - a) * x

// Deterministic random, so every visitor sees the same scene.
export function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let r = Math.imul(s ^ (s >>> 15), 1 | s)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
