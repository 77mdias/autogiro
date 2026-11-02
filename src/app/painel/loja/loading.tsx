export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12" aria-busy="true" aria-label="Carregando a loja">
      <div className="h-10 w-48 rounded-card bg-paper-3 lg:col-span-2" />
      <div className="grid gap-6">
        <div className="h-24 rounded-card bg-paper-2" />
        <div className="h-40 rounded-card bg-paper-3" />
      </div>
      <div className="h-72 rounded-card bg-paper-2" />
    </div>
  );
}
