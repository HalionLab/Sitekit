interface Props { tone?: 'accent-alt' | 'accent'; children: React.ReactNode; }

export function EyebrowLabel({ tone = 'accent', children }: Props) {
  const color = tone === 'accent-alt' ? 'text-accent-alt' : 'text-accent';
  return (
    <p className={`font-mono text-xs tracking-[0.22em] uppercase ${color}`}>
      <span aria-hidden>— </span>{children}
    </p>
  );
}
