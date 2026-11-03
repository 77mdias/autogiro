export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6" aria-busy="true" aria-label="Carregando o formulário do carro">
      <div className="h-9 w-48 rounded-card bg-paper-3" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="aspect-[16/10] rounded-card bg-paper-3" />
        <div className="grid content-start gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-card bg-paper-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
