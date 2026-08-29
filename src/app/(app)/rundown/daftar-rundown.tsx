'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { RundownItem } from '@/db/schema';
import { UbahRundown } from './form-rundown';

export function DaftarRundown({ items }: { items: RundownItem[] }) {
  const [sedangDiubah, setSedangDiubah] = useState<number | null>(null);

  return (
    <ul className="mt-3 border-t border-garis">
      {items.map((item) =>
        sedangDiubah === item.id ? (
          <li key={item.id}>
            <UbahRundown item={item} onSelesai={() => setSedangDiubah(null)} />
          </li>
        ) : (
          <li key={item.id} className="flex gap-4 border-b border-garis px-5 py-3">
            <div className="w-14 shrink-0">
              <p className="angka text-sm">{item.waktuMulai}</p>
              {item.waktuSelesai && (
                <p className="angka text-xs text-tinta-samar">{item.waktuSelesai}</p>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm">{item.kegiatan}</p>
              {(item.pic || item.catatan) && (
                <p className="mt-0.5 text-xs text-tinta-samar">
                  {item.pic && `PIC: ${item.pic}`}
                  {item.pic && item.catatan && ' · '}
                  {item.catatan}
                </p>
              )}
            </div>

            <button
              type="button"
              aria-label={`Ubah ${item.kegiatan}`}
              onClick={() => setSedangDiubah(item.id)}
              className="shrink-0 text-tinta-samar"
            >
              <Pencil className="size-4" />
            </button>
          </li>
        ),
      )}
    </ul>
  );
}
