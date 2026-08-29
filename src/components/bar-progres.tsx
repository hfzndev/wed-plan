import { cn } from '@/lib/cn';

/**
 * Bar tipis satu warna. Melebihi 100% ditandai warna bahaya dan bar penuh —
 * angka aslinya tetap ditampilkan di teks supaya tidak menyesatkan.
 */
export function BarProgres({
  nilai,
  maks,
  warna = 'terracotta',
  className,
}: {
  nilai: number;
  maks: number;
  warna?: 'terracotta' | 'sage';
  className?: string;
}) {
  const lebih = maks > 0 && nilai > maks;
  const persen = maks > 0 ? Math.min(100, Math.max(0, (nilai / maks) * 100)) : 0;

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-garis', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width]',
          lebih ? 'bg-bahaya' : warna === 'sage' ? 'bg-sage' : 'bg-terracotta',
        )}
        style={{ width: `${persen}%` }}
      />
    </div>
  );
}
