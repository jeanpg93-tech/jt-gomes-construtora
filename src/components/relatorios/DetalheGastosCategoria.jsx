import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/relatorios";

export default function DetalheGastosCategoria({ categorias = [] }) {
  if (!categorias.length) return null;

  return (
    <Card className="shadow-lg border-0 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800">Detalhamento por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-800">{categoria.nome}</h3>
                <p className="text-sm text-slate-500">{categoria.quantidade} lançamentos</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-red-100 text-red-700">Pago: {formatCurrency(categoria.pago)}</Badge>
                <Badge className="bg-amber-100 text-amber-700">Pendente: {formatCurrency(categoria.pendente)}</Badge>
                <Badge className="bg-blue-100 text-blue-700">Total: {formatCurrency(categoria.total)}</Badge>
              </div>
            </div>
            {categoria.subcategorias.length > 0 && (
              <div className="space-y-2">
                {categoria.subcategorias.map((subcategoria) => (
                  <div key={subcategoria.id} className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between">
                    <span className="font-medium text-slate-700">{subcategoria.nome}</span>
                    <div className="flex flex-wrap gap-3 text-slate-600">
                      <span>Pago: {formatCurrency(subcategoria.pago)}</span>
                      <span>Pendente: {formatCurrency(subcategoria.pendente)}</span>
                      <span>Total: {formatCurrency(subcategoria.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}