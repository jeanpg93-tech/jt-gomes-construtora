import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DetalheGastosCategoria({ gastos, categoria }) {
  if (!categoria || !categoria.id) {
    return null;
  }

  const gastosCategoria = gastos
    .filter(g => g.categoria_id === categoria.id)
    .sort((a, b) => {
      const dataA = new Date(a.data_pagamento || a.data);
      const dataB = new Date(b.data_pagamento || b.data);
      return dataB.getTime() - dataA.getTime();
    });

  const total = gastosCategoria.reduce((sum, g) => sum + (g.valor || 0), 0);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <Card className="shadow-lg border-0 h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {categoria.nome}
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800">
            {formatCurrency(total)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {gastosCategoria.length > 0 ? (
            gastosCategoria.map((gasto) => (
              <div key={gasto.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{gasto.descricao}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(gasto.data_pagamento || gasto.data)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(gasto.valor)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              Nenhum gasto nesta categoria
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}