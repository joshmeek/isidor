import React from 'react'
import Hero from '@/components/Hero'
// import Features from '@/components/Features'
// import CTA from '@/components/CTA'

export default function Home() {
  return (
    <main className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-b from-white to-gray-50">
      <Hero />
    </main>
  )
}

export const dynamic = 'force-static'