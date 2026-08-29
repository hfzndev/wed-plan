export function KepalaHalaman({
  eyebrow,
  judul,
  ket,
  aksi,
}: {
  eyebrow?: string;
  judul: string;
  ket?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-8 pb-5">
      <div className="min-w-0">
        {eyebrow && <p className="label-kecil">{eyebrow}</p>}
        <h1 className="mt-1 text-[1.75rem] leading-tight">{judul}</h1>
        {ket && <p className="mt-1.5 text-sm text-tinta-lembut">{ket}</p>}
      </div>
      {aksi && <div className="shrink-0 pt-1">{aksi}</div>}
    </header>
  );
}

export function KosongState({ judul, ket, aksi }: { judul: string; ket?: string; aksi?: React.ReactNode }) {
  return (
    <div className="kartu mx-5 px-5 py-10 text-center">
      <p className="text-sm font-medium">{judul}</p>
      {ket && <p className="mx-auto mt-1.5 max-w-xs text-sm text-tinta-lembut">{ket}</p>}
      {aksi && <div className="mt-4 flex justify-center">{aksi}</div>}
    </div>
  );
}
