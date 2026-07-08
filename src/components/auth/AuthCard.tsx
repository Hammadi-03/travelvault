import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Mountain } from 'lucide-react'
import { Link } from 'react-router-dom'
import FaultyTerminal from '@/components/ui/FaultyTerminal'

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden px-4">
      {/* Faulty Terminal background */}
      <div className="absolute inset-0 z-0 select-none">
        <FaultyTerminal
          scale={1.8}
          gridMul={[2.5, 1.2]}
          digitSize={1.1}
          timeScale={0.4}
          pause={false}
          scanlineIntensity={0.3}
          glitchAmount={1.2}
          flickerAmount={0.5}
          noiseAmp={0.4}
          chromaticAberration={0.05}
          dither={0}
          curvature={0.1}
          tint="#00ff66" // Green tint for a classic terminal look
          mouseReact={true}
          mouseStrength={0.4}
          pageLoadAnimation={true}
          brightness={0.35}
        />
      </div>

      <motion.div
        className="relative w-full max-w-[400px] z-10"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Card */}
        <div className="bg-white rounded-[32px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="group mb-6">
              <div className="size-16 rounded-full bg-black flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105">
                <Mountain className="size-8 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-semibold text-[#1d1d1f] text-center tracking-tight">
              {title}
            </h1>
            <p className="text-[15px] text-[#86868b] text-center mt-2 max-w-xs">
              {description}
            </p>
          </div>

          {children}

          {/* Footer */}
          {footer && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-[13px] text-[#86868b]">
              {footer}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
