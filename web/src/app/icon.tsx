import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 20,
                    background: '#0a1628',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F6AD55',
                    borderRadius: '20%',
                    border: '1px solid #F6AD55',
                    boxShadow: '0 0 4px #F6AD55',
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: '20px', height: '20px' }}
                >
                    {/* Crescent Moon */}
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
                    {/* Small Star near the tip */}
                    <path d="M20 3l-1.5 3L17 3l3-1.5z" strokeWidth="0" fill="currentColor" opacity="0.8" style={{ transform: 'scale(0.5) translate(10px, 10px)' }} />
                </svg>
            </div>
        ),
        // ImageResponse options
        {
            // For convenience, we can re-use the exported icons size metadata
            // config to also set the ImageResponse's width and height.
            ...size,
        }
    )
}
