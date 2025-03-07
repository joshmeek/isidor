'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Hero() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [glowColor, setGlowColor] = useState('blue')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubmitted) return
    
    // Change glow color permanently
    setGlowColor('green')
    
    // Set submitted state permanently
    setIsSubmitted(true)
    
    // Keep the email in the field
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      
      {/* Content container with glow effect */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Very visible glow around content */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className={`absolute w-[120%] max-w-3xl h-[600px] rounded-full ${
              glowColor === 'blue' 
                ? 'bg-blue-400/30' 
                : 'bg-emerald-400/40'
            } blur-[100px] transition-colors duration-1000`}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center max-w-xl relative z-20"
        >
          {/* Clean logo/title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-8xl font-extralight tracking-wider text-slate-800 mb-6"
          >
            isidor
          </motion.h1>

          {/* Main tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl text-slate-700 font-light mb-3"
          >
            AI-powered protocols for human optimization
          </motion.p>

          {/* Secondary tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="text-sm text-slate-500 font-light max-w-md mx-auto mb-12"
          >
            Powered by data, controlled by you
          </motion.p>

          {/* Integrated email input with submit button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 1 }}
            className="max-w-md mx-auto relative"
          >
            <form onSubmit={handleSubmit} className="relative">
              <div className={`absolute -inset-1 ${
                glowColor === 'blue' 
                  ? 'bg-gradient-to-r from-blue-300/50 to-indigo-300/50' 
                  : 'bg-gradient-to-r from-emerald-300/60 to-green-300/60'
              } rounded-full blur-md transition-colors duration-1000`}></div>
              <div className="relative flex items-center bg-white rounded-full shadow-sm border border-slate-100 pr-1.5 overflow-hidden">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  disabled={isSubmitted}
                  className="flex-grow px-5 py-3.5 bg-transparent text-slate-700 placeholder:text-slate-400
                    focus:outline-none focus:ring-0 rounded-l-full disabled:opacity-80"
                />
                
                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="p-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white/90 rounded-full
                        flex items-center justify-center shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="submit"
                      type="submit"
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 bg-gradient-to-r from-slate-700 to-slate-600 text-white/90 rounded-full
                        hover:brightness-110 transition-all duration-300 flex items-center justify-center
                        group shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
                        className="w-4 h-4 transform group-hover:translate-y-[-1px] transition-transform duration-300">
                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </form>
            
            {/* Always show the join message */}
            <div className="mt-3 text-xs text-slate-400">
              Join the alpha waitlist
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 