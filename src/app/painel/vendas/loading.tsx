export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6" aria-busy="true" aria-label="Carregando as vendas">
      <div className="h-9 w-48 rounded-card bg-paper-3" />
      <ul className="grid grid-cols-1 gap-4">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-28 rounded-card border border-rule bg-paper-2" />
        ))}
      </ul>
    </div>
  );
}
