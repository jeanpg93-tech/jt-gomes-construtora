import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import StatsCard from "../components/dashboard/StatsCard";
import GastosRecentes from "../components/dashboard/GastosRecentes";
import PagamentosVencimento from "../components/dashboard/PagamentosVencimento";
import GastoForm from "../components/gastos/GastoForm";

export default function Inicio() {
  const [obras, setObras] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [gastosAdmin, setGastosAdmin] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedObraId, setSelectedObraId] = useState("all");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [etapasObra, setEtapasObra] = useState([]);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      await base44.auth.me();
      setUserAuthenticated(true);
      loadData();
    } catch (error) {
      console.log('Usuário não autenticado, redirecionando para login...', error);
      await base44.auth.redirectToLogin(window.location.href);
    }
  };

  useEffect(() => {
    if (userAuthenticated) {
      loadData();
    }
  }, [selectedObraId, userAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [obraData, gastoData, receitaData, gastosAdminData, categoriaData, etapaData] = await Promise.all([
        base44.entities.Obra.list('-created_date'),
        base44.entities.Gasto.list('-created_date'),
        base44.entities.Receita.list('-created_date'),
        base44.entities.GastoAdministrativo.list('-created_date'),
        base44.entities.CategoriaGasto.list(),
        base44.entities.EtapaObra.list()
      ]);
      
      setObras(obraData);
      setGastos(gastoData);
      setReceitas(receitaData);
      setGastosAdmin(gastosAdminData);
      setCategorias(categoriaData);
      setEtapasObra(etapaData.sort((a, b) => (a.ordem || 999) - (b.ordem || 999)));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGasto = (gasto) => {
    setEditingGasto(gasto);
    setShowEditForm(true);
  };

  const handleSaveGasto = async (data) => {
    try {
      await base44.entities.Gasto.update(editingGasto.id, data);
      setShowEditForm(false);
      setEditingGasto(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
    }
  };

  const calcularEstatisticas = () => {
    const gastosFiltrados = selectedObraId === "all" 
      ? gastos 
      : gastos.filter(g => g.obra_id === selectedObraId);
    
    const receitasFiltradas = selectedObraId === "all"
      ? receitas
      : receitas.filter(r => r.obra_id === selectedObraId);
    
    const totalGastos = gastosFiltrados.reduce((sum, gasto) => sum + (gasto.valor || 0), 0);
    const totalReceitas = receitasFiltradas.reduce((sum, receita) => sum + (receita.valor || 0), 0);
    const lucroTotal = totalReceitas - totalGastos;
    
    const receitasPrevistas = receitasFiltradas
      .filter(r => r.status === 'prevista')
      .reduce((sum, r) => sum + (r.valor || 0), 0);
      
    const hoje = new Date();
    const gastosObraEstesMes = gastosFiltrados
      .filter(g => {
        const dataParaUsar = g.data_pagamento || g.data;
        if (!dataParaUsar) return false;
        
        const dataGasto = new Date(dataParaUsar);
        return dataGasto.getMonth() === hoje.getMonth() && 
               dataGasto.getFullYear() === hoje.getFullYear();
      })
      .reduce((sum, g) => sum + (g.valor || 0), 0);

    const gastosAdminEstesMes = gastosAdmin
      .filter(g => {
        if (!g.data) return false;
        const dataGasto = new Date(g.data);
        return dataGasto.getMonth() === hoje.getMonth() && 
               dataGasto.getFullYear() === hoje.getFullYear();
      })
      .reduce((sum, g) => sum + (g.valor || 0), 0);

    return {
      totalGastos,
      totalReceitas,
      lucroTotal,
      receitasPrevistas,
      gastosObraEstesMes,
      gastosAdminEstesMes,
      gastosTotaisEstesMes: gastosObraEstesMes + gastosAdminEstesMes,
      margemLucro: totalReceitas > 0 ? ((lucroTotal / totalReceitas) * 100) : 0
    };
  };

  if (!userAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-20"></div>
            <div className="relative animate-spin rounded-full h-24 w-24 border-8 border-slate-200 border-t-blue-600"></div>
          </div>
          <p className="text-slate-600 font-medium animate-pulse">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const stats = calcularEstatisticas();

  const gastosFiltradosParaVisualizacao = selectedObraId === "all" 
    ? gastos 
    : gastos.filter(g => g.obra_id === selectedObraId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Início
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            Visão geral das suas obras e finanças
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedObraId} onValueChange={setSelectedObraId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione uma obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Obras</SelectItem>
              {obras.map(obra => (
                <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link to={createPageUrl("Gastos")}>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <TrendingDown className="w-4 h-4 mr-2" />
              Gastos
            </Button>
          </Link>
        </div>
      </div>

      <PagamentosVencimento gastos={gastosFiltradosParaVisualizacao} onEditGasto={handleEditGasto} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Receitas"
          value={`R$ ${stats.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`R$ ${stats.receitasPrevistas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} previstas`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Gastos (Obras)"
          value={`R$ ${stats.totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Obras este mês:</span>
                <span className="font-semibold text-slate-700">
                  R$ {stats.gastosObraEstesMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Admin este mês:</span>
                <span className="font-semibold text-slate-700">
                  R$ {stats.gastosAdminEstesMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-medium">Total este mês:</span>
                <span className="font-bold text-slate-900">
                  R$ {stats.gastosTotaisEstesMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          }
          icon={TrendingDown}
          color="red"
        />
        <StatsCard
          title="Lucro"
          value={`R$ ${stats.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${stats.margemLucro.toFixed(1)}% margem`}
          icon={stats.lucroTotal >= 0 ? Target : AlertCircle}
          color={stats.lucroTotal >= 0 ? 'green' : 'red'}
        />
      </div>

      <GastosRecentes 
        gastos={gastosFiltradosParaVisualizacao.slice(0, 5)} 
        gastosAdmin={gastosAdmin.slice(0, 5)}
      />

      {showEditForm && (
        <GastoForm
          gasto={editingGasto}
          obras={obras}
          categorias={categorias}
          etapasObra={etapasObra}
          onSave={handleSaveGasto}
          onCancel={() => {
            setShowEditForm(false);
            setEditingGasto(null);
          }}
        />
      )}
    </div>
  );
}