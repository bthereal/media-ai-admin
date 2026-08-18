export default function BrandLogo({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="brand-logo" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--item-active-text)" />
      <rect x="5" y="6.5" width="14" height="9.5" rx="1.4" fill="#fff" />
      <path d="M10 9v5.4l4.6-2.7L10 9Z" fill="var(--item-active-text)" />
      <path d="M10.3 16.4h3.4l1.3 2.3H9l1.3-2.3Z" fill="#fff" />
    </svg>
  )
}
