export default function Loading() {
  return (
    <div className="mx-auto grid w-full gap-6 px-4 py-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:px-8 lg:py-10" aria-busy="true" aria-label="Carregando o carro">
      <div className="aspect-[4/3] rounded-card bg-paper-3" />
      <div className="grid content-start gap-4">
        <div className="h-8 w-3/4 rounded-card bg-paper-3" />
        <div className="h-10 w-1/2 rounded-card bg-paper-2" />
        <div className="h-12 rounded-full bg-paper-2" />
        <div className="h-12 rounded-full bg-paper-2" />
      </div>
    </div>
  );
}
