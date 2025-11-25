import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Tag, Grid3x3, Layers } from "lucide-react";

import ConfiguracaoWorkspace from "../components/configuracoes/ConfiguracaoWorkspace";
import GerenciadorCategoria from "../components/configuracoes/GerenciadorCategoria";
import GerenciadorSubcategoria from "../components/configuracoes/GerenciadorSubcategoria";
import GerenciadorEtapaObra from "../components/configuracoes/GerenciadorEtapaObra";

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState("workspace");
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const categoriasData = await base44.entities.CategoriaGasto.list();
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          Configurações
        </h1>
        <p className="text-slate-600">Personalize e configure o sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Dados da Construtora</span>
            <span className="sm:hidden">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Categorias</span>
            <span className="sm:hidden">Cat.</span>
          </TabsTrigger>
          <TabsTrigger value="subcategorias" className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden sm:inline">Tipos</span>
            <span className="sm:hidden">Tipos</span>
          </TabsTrigger>
          <TabsTrigger value="etapas" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Etapas</span>
            <span className="sm:hidden">Etap.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <ConfiguracaoWorkspace />
        </TabsContent>

        <TabsContent value="categorias">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Categorias de Gastos</h2>
            <GerenciadorCategoria />
          </Card>
        </TabsContent>

        <TabsContent value="subcategorias">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Tipos (Subcategorias)</h2>
            <GerenciadorSubcategoria categorias={categorias} />
          </Card>
        </TabsContent>

        <TabsContent value="etapas">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Etapas da Obra</h2>
            <GerenciadorEtapaObra />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}