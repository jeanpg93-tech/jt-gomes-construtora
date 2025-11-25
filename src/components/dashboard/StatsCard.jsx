import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StatsCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      ring: 'ring-blue-100',
      text: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      ring: 'ring-green-100',
      text: 'text-green-600',
      iconBg: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      ring: 'ring-red-100',
      text: 'text-red-600',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600'
    },
    yellow: {
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-50',
      ring: 'ring-yellow-100',
      text: 'text-yellow-600',
      iconBg: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      ring: 'ring-purple-100',
      text: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:-translate-y-1 bg-white ring-1 ring-slate-100">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
      
      {/* Padrão de fundo decorativo */}
      <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-12 -translate-y-12 opacity-[0.07] pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <pattern id={`grid-${color}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="currentColor" className={colors.text}/>
          </pattern>
          <rect width="200" height="200" fill={`url(#grid-${color})`} />
        </svg>
      </div>
      
      {/* Gradiente superior animado */}
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-br ${colors.gradient} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ease-out`} />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-xl lg:text-2xl font-bold text-slate-800 mb-3 group-hover:scale-105 transition-transform duration-300">
              {value}
            </p>
            {subtitle && (
              <div className="space-y-1">
                {typeof subtitle === 'string' ? (
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors duration-300 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 font-medium break-words">{subtitle}</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs text-slate-600">
                    {subtitle}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${colors.iconBg} shadow-lg group-hover:shadow-xl float-animation group-hover:rotate-12 transition-all duration-500 flex-shrink-0`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
        
        {/* Barra de progresso decorativa */}
        <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-out`}></div>
        </div>
      </CardContent>
    </Card>
  );
}