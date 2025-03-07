'use client'

import { useCallback } from 'react'
import type { Engine } from 'tsparticles-engine'
import Particles from 'react-tsparticles'
import { loadSlim } from 'tsparticles-slim'

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="absolute inset-0"
      options={{
        fpsLimit: 60,
        particles: {
          color: {
            value: '#3B82F6',
          },
          links: {
            color: '#3B82F6',
            distance: 200,
            enable: true,
            opacity: 0.1,
            width: 0.5,
          },
          move: {
            enable: true,
            speed: 0.5,
            direction: 'none',
            random: true,
            straight: false,
            outModes: {
              default: 'out',
            },
            attract: {
              enable: true,
              rotateX: 600,
              rotateY: 1200,
            },
          },
          number: {
            density: {
              enable: true,
              area: 1500,
            },
            value: 40,
          },
          opacity: {
            value: 0.1,
            random: true,
            animation: {
              enable: true,
              speed: 0.2,
              minimumValue: 0.05,
              sync: false,
            },
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 2 },
            random: true,
            animation: {
              enable: true,
              speed: 0.5,
              minimumValue: 0.5,
              sync: false,
            },
          },
        },
        detectRetina: true,
        fullScreen: false,
        background: {
          color: 'transparent',
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: 'grab',
            },
          },
          modes: {
            grab: {
              distance: 200,
              links: {
                opacity: 0.2,
              },
            },
          },
        },
      }}
    />
  )
} 