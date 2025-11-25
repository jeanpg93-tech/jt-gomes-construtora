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

export default function Dashboard() {
  const [obras, setObras] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [gastosAdmin, setGastosAdmin] = useState([]); // New state for administrative expenses
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
        base44.entities.GastoAdministrativo.list('-created_date'), // Fetch GastoAdministrativo
        base44.entities.CategoriaGasto.list(),
        base44.entities.EtapaObra.list()
      ]);
      
      setObras(obraData);
      setGastos(gastoData);
      setReceitas(receitaData);
      setGastosAdmin(gastosAdminData); // Set state for administrative expenses
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
    
    // CORRIGIDO: Somar apenas gastos PAGOS
    const totalGastos = gastosFiltrados
      .filter(g => g.status_pagamento === 'pago')
      .reduce((sum, gasto) => sum + (gasto.valor || 0), 0);
    
    const totalReceitas = receitasFiltradas.reduce((sum, receita) => sum + (receita.valor || 0), 0);
    const lucroTotal = totalReceitas - totalGastos;
    
    const receitasPrevistas = receitasFiltradas
      .filter(r => r.status === 'prevista')
      .reduce((sum, r) => sum + (r.valor || 0), 0);
    
    // Total de gastos programados (não pagos)
    const gastosProgramados = gastosFiltrados
      .filter(g => ['programado', 'atrasado', 'pendente'].includes(g.status_pagamento))
      .reduce((sum, g) => sum + (g.valor || 0), 0);
      
    const hoje = new Date();
    // CORRIGIDO: Gastos PAGOS no mês atual
    const gastosObraEstesMes = gastosFiltrados
      .filter(g => {
        if (g.status_pagamento !== 'pago') return false;
        const dataParaUsar = g.data_pagamento || g.data;
        if (!dataParaUsar) return false;
        
        const dataGasto = new Date(dataParaUsar);
        return dataGasto.getMonth() === hoje.getMonth() && 
               dataGasto.getFullYear() === hoje.getFullYear();
      })
      .reduce((sum, g) => sum + (g.valor || 0), 0);

    // Gastos admin no mês atual
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
      gastosProgramados, // Novo: total programado
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
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </div>
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
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-blue-200 rounded animate-pulse"></div>
            <div className="absolute bottom-2 left-0 right-0 h-2 bg-blue-300 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="absolute bottom-4 left-0 right-0 h-2 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
            <div className="absolute bottom-6 left-0 right-0 h-2 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.6s'}}></div>
            <div className="absolute bottom-8 left-0 right-0 h-2 bg-blue-600 rounded animate-pulse" style={{animationDelay: '0.8s'}}></div>
            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 text-yellow-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-2">Construindo seus dados...</p>
          <p className="text-xs text-slate-400">Aguarde, estamos organizando suas informações</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }
        .animate-bounce-soft {
          animation: bounce-soft 2s ease-in-out infinite;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Início
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Visão geral das suas obras e finanças
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
            <Select value={selectedObraId} onValueChange={setSelectedObraId}>
              <SelectTrigger className="w-[250px] glass-effect hover-lift">
                <SelectValue placeholder="Selecione uma obra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Obras</SelectItem>
                {obras.filter(o => o.ativa !== false).map(obra => (
                  <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link to={createPageUrl("Gastos")}>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover-lift">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Gastos
              </Button>
            </Link>
        </div>
      </div>

      <div className="animate-slideInRight" style={{animationDelay: '0.1s'}}>
        <PagamentosVencimento gastos={gastosFiltradosParaVisualizacao} onEditGasto={handleEditGasto} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="animate-slideInRight" style={{animationDelay: '0.2s'}}>
          <StatsCard
            title="Receitas"
            value={`R$ ${stats.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`R$ ${stats.receitasPrevistas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} previstas`}
            icon={TrendingUp}
            color="green"
          />
        </div>
        <div className="animate-slideInRight" style={{animationDelay: '0.3s'}}>
          <StatsCard
            title="Gastos Pagos (Obras)"
            value={`R$ ${stats.totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Pagos este mês:</span>
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
                  <span className="text-slate-700 font-medium">Programados:</span>
                  <span className="font-bold text-yellow-600">
                    R$ {stats.gastosProgramados.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            }
            icon={TrendingDown}
            color="red"
          />
        </div>
        <div className="animate-slideInRight" style={{animationDelay: '0.4s'}}>
          <StatsCard
            title="Lucro"
            value={`R$ ${stats.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`${stats.margemLucro.toFixed(1)}% margem`}
            icon={stats.lucroTotal >= 0 ? Target : AlertCircle}
            color={stats.lucroTotal >= 0 ? 'green' : 'red'}
          />
        </div>
      </div>

      <div className="animate-slideInRight" style={{animationDelay: '0.5s'}}>
        <GastosRecentes 
          gastos={gastosFiltradosParaVisualizacao.slice(0, 5)} 
          gastosAdmin={gastosAdmin.slice(0, 5)} // Pass admin expenses
        />
      </div>

      {showEditForm && (
        <GastoForm
          gasto={editingGasto}
          obras={obras.filter(o => o.ativa !== false)}
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