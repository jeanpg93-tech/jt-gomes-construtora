import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

// Cores para as fatias da pizza
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', 
  '#FF5733', '#C70039', '#900C3F', '#581845', '#3498DB',
  '#2ECC71', '#F1C40F', '#E67E22', '#9B59B6', '#34495E'
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].payload.totalGeral;
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(2) : 0;
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="font-bold">{`${data.name}`}</p>
        <p>{`Valor: R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</p>
        <p>{`Percentual: ${percent}%`}</p>
      </div>
    );
  }
  return null;
};

export default function GraficoGastosPizza({ gastos, categorias }) {
  const totalGeral = gastos.reduce((sum, g) => sum + (g.valor || 0), 0);

  const data = categorias
    .map(cat => {
      const gastosDaCategoria = gastos.filter(g => g.categoria_id === cat.id);
      const totalCategoria = gastosDaCategoria.reduce((sum, g) => sum + g.valor, 0);
      return {
        name: cat.nome,
        value: totalCategoria,
      };
    })
    .filter(item => item.value > 0)
    .map(item => ({ ...item, totalGeral })) // Adiciona total geral a cada item para o tooltip
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Sem dados para exibir o gráfico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          iconSize={10}
          wrapperStyle={{
            fontSize: '12px',
            lineHeight: '20px',
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}