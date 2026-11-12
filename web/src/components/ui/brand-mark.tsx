// Kams mark: the lime "awning" piece from the Spoke art set on an olive tile.
export function BrandMark({ height }: { height: number; priority?: boolean }) {
  return (
    <svg width={height} height={height} viewBox="0 0 32 32" aria-hidden="true" className="max-w-none shrink-0">
      <rect width="32" height="32" rx="9" fill="var(--color-olive)" />
      <path d="M26 10.5 19.6 7 6 14.7V21l13.5-7.4 6.5 3.6z" fill="var(--color-lime)" />
      <circle cx="22.5" cy="22.5" r="3" fill="var(--color-pink)" />
    </svg>
  );
}
