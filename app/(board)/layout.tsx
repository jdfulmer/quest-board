export default function BoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col">
      {/* Top bar */}
      <header className="border-b border-parchment-500/20 px-4 py-3 flex items-center justify-between">
        <a
          href="/"
          className="font-[family-name:var(--font-display)] text-gold text-xl hover:text-gold-light transition-colors"
        >
          Quest Board
        </a>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
