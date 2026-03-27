import type { SVGProps } from 'react'

type CowIconProps = SVGProps<SVGSVGElement>

export function CowIcon(props: CowIconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M8 10 5.5 5.8l5 2.4L12.6 7h6.8l2.1 1.2 5-2.4L24 10v8.2A4.8 4.8 0 0 1 19.2 23H12.8A4.8 4.8 0 0 1 8 18.2Z"
        fill="var(--color-cow-fill)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12.2" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <circle cx="19.8" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <path
        d="M12.2 18.4h7.6a2.8 2.8 0 0 1-2.8 3h-2a2.8 2.8 0 0 1-2.8-3Z"
        fill="var(--color-cow-accent)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="14.4" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
      <circle cx="17.6" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
    </svg>
  )
}
