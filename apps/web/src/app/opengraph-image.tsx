import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt =
  'Launch Ramp — AI powered customer service';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0a0a0a 0%, #262626 50%, #171717 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#fafafa',
              lineHeight: 1.1,
            }}
          >
            Launch Ramp
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 32,
              fontWeight: 500,
              color: '#a3a3a3',
            }}
          >
            AI Powered Customer Service
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
