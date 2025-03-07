import React from 'react'
import Hero from '@/components/Hero'
// import Features from '@/components/Features'
// import CTA from '@/components/CTA'

export default function Home() {
  return (
    <main className="h-screen w-full bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <Hero />
    </main>
  )
}

export const dynamic = 'force-static'