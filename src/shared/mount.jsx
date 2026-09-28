import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { guardFraming } from './guard.js'

export function mount(App) {
  if (!guardFraming()) return
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </StrictMode>,
  )
}
