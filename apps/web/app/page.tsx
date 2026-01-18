export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">
          Agenda de Blocos
        </p>
        <h1 className="text-4xl font-semibold md:text-5xl">
          Planeje seu carnaval com rapidez e clareza.
        </h1>
        <p className="text-lg text-slate-300">
          Começamos o MVP com foco em programação, detalhes dos desfiles e sua agenda
          pessoal. Em breve: mapa, exportação e compartilhamento.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-semibold">Próximos passos do produto</h2>
        <ul className="mt-4 space-y-2 text-slate-300">
          <li>• Conectar API e listagens de desfiles.</li>
          <li>• Filtros por data, região e tipo.</li>
          <li>• Agenda local com alerta de conflitos.</li>
        </ul>
      </section>
    </main>
  );
}
