import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-[#100b2a] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#ecfeca]">
            Dofus Forjamagia
          </Link>
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-[#ecfeca] hover:text-[#adca9a] transition-colors font-medium"
            >
              Romper Runas
            </Link>
            <Link
              href="/precios"
              className="text-[#ecfeca] hover:text-[#adca9a] transition-colors font-medium"
            >
              Precios Runas
            </Link>
            <Link
              href="/equipo"
              className="text-[#ecfeca] hover:text-[#adca9a] transition-colors font-medium"
            >
              Equipo
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
