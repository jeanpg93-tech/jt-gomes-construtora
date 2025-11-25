import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, User, Briefcase, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

export default function GastosRecentes({ gastos = [], gastosAdmin = [] }) {
  const [categorias, setCategorias] = useState([]);
  const [categoriasAdmin, setCategoriasAdmin] = useState([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const [cats, catsAdmin] = await Promise.all([
          base44.entities.CategoriaGasto.list(),
          base44.entities.CategoriaGastoAdministrativo.list()
        ]);
        setCategorias(cats);
        setCategoriasAdmin(catsAdmin);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    fetchCategorias();
  }, []);

  const getCategoriaNome = (categoriaId, isAdmin = false) => {
    const lista = isAdmin ? categoriasAdmin : categorias;
    return lista.find(c => c.id === categoriaId)?.nome || '...';
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      programado: 'bg-blue-100 text-blue-800 border-blue-200',
      pago: 'bg-green-100 text-green-800 border-green-200',
      atrasado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendente: 'Pendente',
      pago: 'Pago',
      atrasado: 'Atrasado',
      programado: 'Programado'
    };
    return labels[status] || status;
  };

  // Combinar gastos e gastos admin, ordenar por data
  const todosGastos = [
    ...(gastos || []).map(g => ({ ...g, tipo: 'obra' })),
    ...(gastosAdmin || []).map(g => ({ ...g, tipo: 'admin' }))
  ].sort((a, b) => {
    const dataA = new Date(a.data_pagamento || a.data);
    const dataB = new Date(b.data_pagamento || b.data);
    return dataB.getTime() - dataA.getTime();
  }).slice(0, 10);

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Gastos Recentes
          </CardTitle>
          <div className="flex gap-2">
            <Link to={createPageUrl("Gastos")}>
              <Button variant="outline" size="sm">
                Ver Obras
              </Button>
            </Link>
            <Link to={createPageUrl("GastosAdministrativos")}>
              <Button variant="outline" size="sm">
                Ver Admin
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {todosGastos.length > 0 ? (
          <div className="space-y-3">
            {todosGastos.map((gasto) => {
              const isAdmin = gasto.tipo === 'admin';
              const categoria = getCategoriaNome(gasto.categoria_id, isAdmin);
              const statusColor = getStatusColor(gasto.status_pagamento);
              const statusLabel = getStatusLabel(gasto.status_pagamento);
              
              return (
                <div
                  key={`${gasto.tipo}-${gasto.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800">{gasto.descricao}</p>
                      {isAdmin ? (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 border flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 border flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Obra
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {categoria}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(gasto.data_pagamento || gasto.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      {gasto.fornecedor && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {gasto.fornecedor}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-red-600 whitespace-nowrap">
                      R$ {gasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <Badge className={`${statusColor} text-xs mt-1 whitespace-nowrap`}>
                      {statusLabel}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum gasto registrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}