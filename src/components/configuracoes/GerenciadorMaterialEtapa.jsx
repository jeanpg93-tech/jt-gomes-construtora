import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GerenciadorMaterialEtapa() {
  const [materiais, setMateriais] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [materialEtapas, setMaterialEtapas] = useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedEtapas, setSelectedEtapas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMaterialId) {
      loadEtapasDoMaterial(selectedMaterialId);
    } else {
      setSelectedEtapas([]);
    }
  }, [selectedMaterialId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matData, etapaData, matEtapaData] = await Promise.all([
        base44.entities.Material.list(),
        base44.entities.EtapaObra.list(),
        base44.entities.MaterialEtapa.list()
      ]);
      setMateriais(matData);
      setEtapas(etapaData.sort((a, b) => (a.ordem || 999) - (b.ordem || 999)));
      setMaterialEtapas(matEtapaData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEtapasDoMaterial = async (materialId) => {
    const etapasIds = materialEtapas
      .filter(me => me.material_id === materialId)
      .map(me => me.etapa_obra_id);
    setSelectedEtapas(etapasIds);
  };

  const handleToggleEtapa = (etapaId) => {
    setSelectedEtapas(prev => 
      prev.includes(etapaId) 
        ? prev.filter(id => id !== etapaId)
        : [...prev, etapaId]
    );
  };

  const handleSave = async () => {
    if (!selectedMaterialId) return;

    try {
      // Remover associações antigas
      const oldAssociations = materialEtapas.filter(me => me.material_id === selectedMaterialId);
      for (const assoc of oldAssociations) {
        await base44.entities.MaterialEtapa.delete(assoc.id);
      }

      // Criar novas associações
      for (const etapaId of selectedEtapas) {
        await base44.entities.MaterialEtapa.create({
          material_id: selectedMaterialId,
          etapa_obra_id: etapaId
        });
      }

      await loadData();
      alert('Associações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar associações:', error);
      alert('Erro ao salvar associações. Tente novamente.');
    }
  };

  const getMaterialEtapas = (materialId) => {
    const etapasIds = materialEtapas
      .filter(me => me.material_id === materialId)
      .map(me => me.etapa_obra_id);
    return etapas.filter(e => etapasIds.includes(e.id));
  };

  if (loading) {
    return <p className="text-center text-slate-500">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Formulário para associar material a etapas */}
      <div className="bg-slate-50 p-4 rounded-lg border">
        <h4 className="font-medium text-slate-800 mb-3">Associar Material às Etapas</h4>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Selecione o Material</label>
            <Select 
              value={selectedMaterialId} 
              onValueChange={setSelectedMaterialId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um material" />
              </SelectTrigger>
              <SelectContent>
                {materiais.map(mat => (
                  <SelectItem key={mat.id} value={mat.id}>
                    {mat.nome} ({mat.unidade_medida})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMaterialId && (
            <div>
              <label className="text-xs text-slate-600 mb-2 block">
                Selecione as Etapas em que este material pode ser usado
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-3 rounded border">
                {etapas.map(etapa => (
                  <div key={etapa.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`etapa-${etapa.id}`}
                      checked={selectedEtapas.includes(etapa.id)}
                      onCheckedChange={() => handleToggleEtapa(etapa.id)}
                    />
                    <label 
                      htmlFor={`etapa-${etapa.id}`} 
                      className="text-sm cursor-pointer"
                    >
                      {etapa.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMaterialId && (
            <Button onClick={handleSave} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Salvar Associações
            </Button>
          )}
        </div>
      </div>

      {/* Lista de materiais e suas etapas associadas */}
      <div>
        <h4 className="font-medium text-slate-800 mb-3">Materiais e suas Etapas</h4>
        <div className="space-y-2">
          {materiais.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhum material cadastrado. Cadastre materiais primeiro.
            </p>
          ) : (
            materiais.map(mat => {
              const etapasMaterial = getMaterialEtapas(mat.id);
              return (
                <div key={mat.id} className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-slate-800">{mat.nome}</h5>
                        <p className="text-sm text-slate-500">Unidade: {mat.unidade_medida}</p>
                        {etapasMaterial.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {etapasMaterial.map(etapa => (
                              <span 
                                key={etapa.id} 
                                className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                              >
                                {etapa.nome}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">Sem etapas associadas</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}