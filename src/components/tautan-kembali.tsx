import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function TautanKembali({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-5 -mb-3 inline-flex items-center gap-0.5 px-4 py-1 text-sm text-tinta-lembut"
    >
      <ChevronLeft className="size-4" />
      {label}
    </Link>
  );
}
