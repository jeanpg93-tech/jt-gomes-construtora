import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash2, DollarSign, User, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GastoAdministrativoCard({ gasto, onEdit, onDelete, onDuplicate }) {
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriasData, fornecedoresData] = await Promise.all([
        base44.entities.CategoriaGastoAdministrativo.list(),
        base44.entities.Fornecedor.list()
      ]);
      setCategorias(categoriasData);
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = gasto.status_pagamento === 'pago' 
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';

  const statusLabel = gasto.status_pagamento === 'pago' ? 'Pago' : 'Pendente';

  const categoriaNome = categorias.find(c => c.id === gasto.categoria_id)?.nome || 'Sem categoria';
  const fornecedorNome = fornecedores.find(f => f.id === gasto.fornecedor_id)?.nome || null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-1">{gasto.descricao}</h3>
            <Badge variant="outline" className="text-xs">
              {loading ? '...' : categoriaNome}
            </Badge>
          </div>
          <Badge className={`${statusColor} border ml-2`}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            {format(new Date(gasto.data), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
          <div className="flex items-center gap-1 text-lg font-bold text-red-600">
            <DollarSign className="w-5 h-5" />
            {gasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {fornecedorNome && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4" />
            {fornecedorNome}
          </div>
        )}

        {gasto.forma_pagamento && (
          <p className="text-xs text-slate-500">
            Pagamento: <span className="font-medium text-slate-700">{gasto.forma_pagamento.toUpperCase()}</span>
          </p>
        )}

        {gasto.observacoes && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
            {gasto.observacoes}
          </p>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onEdit(gasto)} className="flex-1">
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDuplicate(gasto)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Duplicar gasto"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(gasto.id)} 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}