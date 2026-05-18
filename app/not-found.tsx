import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-slate-500">Rute yang Anda buka tidak tersedia di sistem rekrutmen.</p>
        <Link className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" href="/">
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}
