type Props = {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  subtitle?: string | null
}

const sizes = {
  sm: { box: 'h-8 w-8 text-[0.7rem]', name: 'text-base', sub: 'text-[10px]' },
  md: { box: 'h-9 w-9 text-[0.8rem]', name: 'text-[1.2rem] sm:text-[1.35rem]', sub: 'text-[11px]' },
  lg: { box: 'h-12 w-12 text-lg', name: 'text-3xl sm:text-4xl', sub: 'text-sm' },
} as const

export function BrandMark({ size = 'md', showName = true, subtitle }: Props) {
  const s = sizes[size]
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className={`flex shrink-0 flex-col items-center justify-center rounded-[0.65rem] bg-accent font-display font-bold leading-none text-ink shadow-sm ${s.box}`}
        aria-hidden
      >
        <span>AF</span>
        <span className="mt-0.5 scale-90 text-[0.35em] font-semibold tracking-wide text-ink/85">AdFra</span>
      </div>
      {showName && (
        <div className="min-w-0">
          <p className={`font-display truncate font-bold tracking-tight text-foam ${s.name}`}>AdFra Ges</p>
          {subtitle ? <p className={`truncate font-medium text-mist ${s.sub}`}>{subtitle}</p> : null}
        </div>
      )}
    </div>
  )
}
