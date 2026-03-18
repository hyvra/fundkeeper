import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Fundkeeper — Crypto Fund Back Office'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #34d399, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#09090b',
            }}
          >
            F
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: 'white', display: 'flex' }}>
            Fundkeeper
          </div>
        </div>
        <div style={{ fontSize: 28, color: '#71717a', display: 'flex' }}>
          Your fund&apos;s books. Done.
        </div>
      </div>
    ),
    { ...size }
  )
}
