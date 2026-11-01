export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:px-8 lg:py-10" aria-busy="true" aria-label="Carregando a vitrine">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-paper-3" />
        <div className="h-8 w-48 rounded-card bg-paper-3" />
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="overflow-hidden rounded-card border border-rule">
            <div className="aspect-[4/3] bg-paper-3" />
            <div className="grid gap-3 p-4">
              <div className="h-5 w-2/3 rounded-card bg-paper-3" />
              <div className="h-8 w-1/2 rounded-card bg-paper-2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
