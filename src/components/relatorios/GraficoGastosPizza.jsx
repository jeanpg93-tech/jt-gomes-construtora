import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/relatorios';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="font-semibold text-slate-800">{item.name}</p>
      <p className="text-sm text-slate-600">Total: {formatCurrency(item.value)}</p>
      <p className="text-sm text-slate-600">Pago: {formatCurrency(item.pago)}</p>
      <p className="text-sm text-slate-600">Pendente: {formatCurrency(item.pendente)}</p>
      <p className="text-sm text-slate-600">{item.percentual.toFixed(1)}% do total</p>
    </div>
  );
}

export default function GraficoGastosPizza({ dados = [] }) {
  if (!dados.length) {
    return <div className="flex h-full items-center justify-center text-gray-500">Sem dados para exibir o gráfico.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={dados} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius="78%" paddingAngle={3}>
          {dados.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconSize={10}
          formatter={(value, entry, index) => `${value} (${dados[index]?.percentual.toFixed(1)}%)`}
          wrapperStyle={{ fontSize: '12px', lineHeight: '20px', maxWidth: '220px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}