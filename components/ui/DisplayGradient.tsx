export function DisplayGradient({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display italic bg-gradient-to-r from-accent-alt to-accent bg-clip-text text-transparent">
      {children}
    </span>
  );
}
