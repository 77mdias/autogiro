export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6" aria-busy="true" aria-label="Carregando o estoque">
      <div className="h-9 w-40 rounded-card bg-paper-3" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {[0, 1, 2].map((i) => (
          <li key={i} className="overflow-hidden rounded-card border border-rule">
            <div className="aspect-[16/10] bg-paper-3" />
            <div className="grid gap-3 p-4">
              <div className="h-5 w-2/3 rounded-card bg-paper-3" />
              <div className="h-7 w-1/2 rounded-card bg-paper-2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
