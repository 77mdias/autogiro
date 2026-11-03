export default function Loading() {
  return (
    <div className="mx-auto grid w-full gap-8 px-4 py-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-8 lg:py-10" aria-busy="true" aria-label="Carregando a simulação">
      <div className="flex items-center gap-4">
        <div className="size-20 shrink-0 rounded-card bg-paper-3" />
        <div className="h-6 w-48 rounded-card bg-paper-3" />
      </div>
      <div className="grid content-start gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-card bg-paper-2" />
        ))}
      </div>
    </div>
  );
}
