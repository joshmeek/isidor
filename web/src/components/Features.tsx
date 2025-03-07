'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpenIcon, SparklesIcon, ShieldCheckIcon, BeakerIcon } from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Ancient Wisdom',
    description: 'Drawing from centuries of human knowledge about health, wellness, and the interconnectedness of mind and body.',
    icon: BookOpenIcon,
  },
  {
    name: 'AI Enhancement',
    description: 'Advanced algorithms analyze your biometric data to uncover patterns and optimize your personal wellness journey.',
    icon: SparklesIcon,
  },
  {
    name: 'Sacred Privacy',
    description: 'Your data is treated with reverence. Complete control and encryption ensure your information remains protected.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Scientific Rigor',
    description: 'Every insight is grounded in peer-reviewed research, combining timeless wisdom with modern scientific validation.',
    icon: BeakerIcon,
  },
]

export default function Features() {
  return (
    <div className="relative py-32 overflow-hidden bg-gradient-to-b from-blue-50 to-amber-50">
      <div className="absolute inset-0 bg-[url('/patterns/sacred-geometry.svg')] opacity-5" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Wisdom of the Ages, Power of the Future
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Harmonizing ancient knowledge with artificial intelligence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-amber-100 hover:border-blue-200 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-100 to-blue-100 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-100 to-blue-100 p-[1px]">
                  <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-blue-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900 mb-3">{feature.name}</h3>
              <p className="text-gray-600">{feature.description}</p>
              
              {/* Sacred geometry accent */}
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-[url('/patterns/sacred-geometry-accent.svg')] opacity-5 group-hover:opacity-10 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Light pillars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 w-px h-full bg-gradient-to-b from-amber-200 via-transparent to-transparent transform -skew-x-12" />
        <div className="absolute right-1/4 w-px h-full bg-gradient-to-b from-blue-200 via-transparent to-transparent transform skew-x-12" />
      </div>
    </div>
  )
} 