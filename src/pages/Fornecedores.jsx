import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Plus, Search, Edit, Trash2, Building2, UserCircle } from "lucide-react";

import FornecedorForm from "../components/fornecedor/FornecedorForm";

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fornecedoresData = await base44.entities.Fornecedor.list('-created_date');
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingFornecedor(null);
    loadData();
  };

  const handleEdit = (fornecedor) => {
    setEditingFornecedor(fornecedor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      await base44.entities.Fornecedor.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      alert('Erro ao excluir fornecedor. Tente novamente.');
    }
  };

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fornecedor.nome.toLowerCase().includes(searchLower) ||
      (fornecedor.cpf_cnpj && fornecedor.cpf_cnpj.toLowerCase().includes(searchLower)) ||
      (fornecedor.email && fornecedor.email.toLowerCase().includes(searchLower)) ||
      (fornecedor.telefone && fornecedor.telefone.toLowerCase().includes(searchLower)) ||
      (fornecedor.contato && fornecedor.contato.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            Fornecedores
          </h1>
          <p className="text-slate-600">Gerencie fornecedores para usar em gastos e contratos</p>
        </div>
        <Button 
          onClick={() => {
            setEditingFornecedor(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Busca */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <FornecedorForm
          fornecedor={editingFornecedor}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingFornecedor(null);
          }}
        />
      )}

      {/* Lista de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFornecedores.map((fornecedor) => (
          <Card key={fornecedor.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${fornecedor.tipo === 'juridica' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    {fornecedor.tipo === 'juridica' ? (
                      <Building2 className="w-6 h-6 text-purple-600" />
                    ) : (
                      <UserCircle className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {fornecedor.nome}
                    </CardTitle>
                    {fornecedor.nome_fantasia && (
                      <p className="text-xs text-slate-500">{fornecedor.nome_fantasia}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                {fornecedor.cpf_cnpj && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold">{fornecedor.tipo === 'juridica' ? 'CNPJ:' : 'CPF:'}</span>
                    <span>{fornecedor.cpf_cnpj}</span>
                  </div>
                )}
                
                {(fornecedor.telefone || fornecedor.email || fornecedor.contato) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold">Contato:</span>
                    <span>{fornecedor.telefone || fornecedor.email || fornecedor.contato}</span>
                  </div>
                )}
                
                {fornecedor.cidade && fornecedor.estado && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold">Cidade:</span>
                    <span>{fornecedor.cidade}/{fornecedor.estado}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(fornecedor)}
                  className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(fornecedor.id)}
                  className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFornecedores.length === 0 && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos da busca.' 
                : 'Cadastre fornecedores para usar em gastos e contratos.'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => {
                  setEditingFornecedor(null);
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Fornecedor
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}