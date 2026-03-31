import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, TrendingDown } from "lucide-react";

import GastoAdministrativoForm from "../components/gastosadmin/GastoAdministrativoForm";
import GastoAdministrativoCard from "../components/gastosadmin/GastoAdministrativoCard";

export default function GastosAdministrativos() {
  const [gastosAdmin, setGastosAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const gastosData = await base44.entities.GastoAdministrativo.list('-created_date');
      setGastosAdmin(gastosData);
    } catch (error) {
      console.error('Erro ao carregar gastos administrativos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSave = async (data) => {
    try {
      // Função para adicionar 1 dia à data (para compensar timezone)
      const addOneDay = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString + 'T00:00:00'); // Parse as local time to avoid timezone issues
        date.setDate(date.getDate() + 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Função para converter valor corretamente
      const parseValor = (valor) => {
        if (valor === null || valor === undefined || valor === '') return 0;
        
        if (typeof valor === 'number' && !isNaN(valor)) {
          return parseFloat(valor.toFixed(2));
        }
        
        if (typeof valor === 'string') {
          let valorLimpo = valor.trim().replace(/R\$/g, '').replace(/\s/g, '');
          
          if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
            // Case: "1.234,56"
            valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
          }
          else if (valorLimpo.includes(',')) {
            // Case: "123,45"
            valorLimpo = valorLimpo.replace(',', '.');
          }
          else if (valorLimpo.includes('.')) {
            // Case: "123.45" (decimal) or "1.234" (thousands)
            const partes = valorLimpo.split('.');
            if (partes.length === 2 && partes[1].length === 2) {
              // It's a decimal with two places, keep it as is
            } 
            else if (partes.length > 2 || (partes.length === 2 && partes[1].length !== 2)) {
              // It's a thousands separator or multiple dots, remove all dots
              valorLimpo = valorLimpo.replace(/\./g, '');
            }
          }
          
          const numero = Number(valorLimpo);
          if (isNaN(numero)) return 0;
          return parseFloat(numero.toFixed(2));
        }
        
        return 0;
      };

      const processedData = {
        descricao: data.descricao,
        categoria_id: data.categoria_id,
        valor: parseValor(data.valor),
        data: data.data,
        fornecedor_id: data.fornecedor_id || null,
        forma_pagamento: data.forma_pagamento || null,
        status_pagamento: data.status_pagamento,
        observacoes: data.observacoes || null
      };

      // Verifica se tem ID válido para decidir entre update ou create
      if (editingGasto && editingGasto.id) {
        await base44.entities.GastoAdministrativo.update(editingGasto.id, processedData);
      } else {
        await base44.entities.GastoAdministrativo.create(processedData);
      }
      setShowForm(false);
      setEditingGasto(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar gasto administrativo:', error);
      alert('Erro ao salvar gasto administrativo. Por favor, tente novamente.');
    }
  };

  const handleEdit = (gasto) => {
    setEditingGasto(gasto);
    setShowForm(true);
  };

  const handleDuplicate = (gasto) => {
    // Remove o ID e a data de criação para criar um novo registro
    const gastoDuplicado = {
      ...gasto,
      id: undefined,
      created_date: undefined,
      created_by: undefined,
      updated_date: undefined,
      data: getTodayDate() // Usa a data de hoje para o duplicado
    };
    setEditingGasto(gastoDuplicado);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este gasto administrativo?')) {
      try {
        await base44.entities.GastoAdministrativo.delete(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir gasto administrativo:', error);
      }
    }
  };

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const totalGastosAdmin = gastosAdmin.reduce((sum, g) => sum + (g.valor || 0), 0);
  const gastosPagos = gastosAdmin.filter(g => g.status_pagamento === 'pago').reduce((sum, g) => sum + (g.valor || 0), 0);
  const gastosPendentes = gastosAdmin.filter(g => g.status_pagamento === 'pendente').reduce((sum, g) => sum + (g.valor || 0), 0);
  
  const gastosMesAtual = gastosAdmin.filter(g => {
    if (!g.data) return false;
    const dataGasto = new Date(g.data);
    return dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual;
  }).reduce((sum, g) => sum + (g.valor || 0), 0);

  const gastosAnoAtual = gastosAdmin.filter(g => {
    if (!g.data) return false;
    const dataGasto = new Date(g.data);
    return dataGasto.getFullYear() === anoAtual;
  }).reduce((sum, g) => sum + (g.valor || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-600" />
            Gastos Administrativos
          </h1>
          <p className="text-slate-600">Gerencie as despesas operacionais da empresa</p>
        </div>
        <Button 
          onClick={() => {
            setEditingGasto(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Gasto Administrativo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {totalGastosAdmin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500">{gastosAdmin.length} lançamento(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Mês Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {gastosMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Ano Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {gastosAnoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {gastosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gastosAdmin.map(gasto => (
          <GastoAdministrativoCard
            key={gasto.id}
            gasto={gasto}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        ))}
      </div>

      {gastosAdmin.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum gasto administrativo registrado</h3>
            <p className="text-slate-500 mb-4">Comece adicionando despesas operacionais da empresa</p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Gasto
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <GastoAdministrativoForm
          gasto={editingGasto}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingGasto(null);
          }}
        />
      )}
    </div>
  );
}