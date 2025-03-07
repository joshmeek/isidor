'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <div className="relative py-32 overflow-hidden bg-gradient-to-b from-amber-50 to-white">
      <div className="absolute inset-0 bg-[url('/patterns/sacred-geometry.svg')] opacity-5" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6 tracking-tight">
            Begin Your Journey of Enlightenment
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join a community of seekers combining ancient wisdom with cutting-edge technology to unlock human potential.
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="relative max-w-lg mx-auto"
          >
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-amber-200/30 via-blue-300/30 to-emerald-200/30 rounded-full" />
            <form className="relative flex flex-col sm:flex-row justify-center gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-6 py-4 rounded-full bg-white/80 border border-amber-200/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent backdrop-blur-sm shadow-inner"
              />
              <button
                type="submit"
                className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-400 text-white font-semibold overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:scale-105 sm:w-auto w-full"
              >
                <span className="relative z-10">Join the Journey</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Sacred geometry accents */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[url('/patterns/sacred-geometry-accent.svg')] opacity-5 transform -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[url('/patterns/sacred-geometry-accent.svg')] opacity-5 transform translate-x-1/2 rotate-90" />
        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
      </div>
      
      {/* Light rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 w-1/2 h-full bg-gradient-to-b from-amber-200/20 via-transparent to-transparent transform -translate-x-1/2 rotate-45" />
        <div className="absolute -top-1/2 left-1/2 w-1/2 h-full bg-gradient-to-b from-blue-200/20 via-transparent to-transparent transform -translate-x-1/2 -rotate-45" />
      </div>
    </div>
  )
} 