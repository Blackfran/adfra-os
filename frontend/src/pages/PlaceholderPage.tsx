export function PlaceholderPage({ title, blurb }: { title: string; blurb: string }) {
  return (
    <section className="space-y-2">
      <h1 className="page-title">{title}</h1>
      <p className="text-sm text-mist">{blurb}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-line/80 bg-panel/50 px-4 py-10 text-center text-sm text-mist">
        Módulo en construcción — kickoff fase 1
      </div>
    </section>
  )
}
