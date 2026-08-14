import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="font-display text-5xl">404</h1>
      <p>This page doesn&apos;t exist.</p>
      <Link href="/" className="underline">Back to home</Link>
    </main>
  );
}
