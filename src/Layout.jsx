import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Home, 
  Building2, 
  TrendingDown, 
  TrendingUp, 
  BarChart3,
  Settings,
  Menu,
  X,
  Briefcase,
  FileText,
  FileSignature,
  User,
  Users,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigationItems = [
  {
    title: "Início",
    url: createPageUrl("Inicio"), // Changed from "Dashboard" to "Inicio"
    icon: Home,
  },
  {
    title: "Obras",
    url: createPageUrl("Obras"),
    icon: Building2,
  },
  {
    title: "Gastos",
    url: createPageUrl("Gastos"),
    icon: TrendingDown,
  },
  {
    title: "Gastos Administrativos",
    url: createPageUrl("GastosAdministrativos"),
    icon: Briefcase,
  },
  {
    title: "Orçamento",
    url: createPageUrl("Orcamento"),
    icon: BarChart3,
  },
  {
    title: "Receitas",
    url: createPageUrl("Receitas"),
    icon: TrendingUp,
  },
  {
    title: "Relatórios",
    url: createPageUrl("Relatorios"),
    icon: BarChart3,
  },
  {
    title: "Fornecedores",
    url: createPageUrl("Fornecedores"),
    icon: User,
  },
  {
    title: "Contratos",
    url: createPageUrl("Contratos"),
    icon: FileSignature,
  },
  {
    title: "Recibos",
    url: createPageUrl("Recibos"),
    icon: FileText,
  },
  {
    title: "Usuários",
    url: createPageUrl("GerenciamentoUsuarios"),
    icon: Users,
    adminOnly: true, // Only visible to admins
  },
  {
    title: "API",
    url: createPageUrl("ManusAPIKey"),
    icon: Bot,
    adminOnly: true,
  },
  {
    title: "Configurações",
    url: createPageUrl("Configuracoes"),
    icon: Settings,
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [workspaceInfo, setWorkspaceInfo] = useState({ name: 'ConstrutoraPro', logoUrl: null });
  const [userInfo, setUserInfo] = useState({ name: 'Usuário', role: 'Carregando...', initial: 'U' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          setUserInfo({
            name: user.full_name,
            role: user.role, // role will be 'admin' or 'user'
            initial: user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
          });

          setWorkspaceInfo({
            name: user.workspace_name || 'ConstrutoraPro',
            logoUrl: user.workspace_logo || null
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário/workspace:", error);
        // If there's an error (e.g., token expired, not logged in), default to 'user' role
        setUserInfo(prev => ({ ...prev, role: 'user' }));
      }
    };
    fetchUserData();
  }, []);

  const NavigationContent = ({ isCollapsed, isMobile }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {workspaceInfo.logoUrl ? (
              <img src={workspaceInfo.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            {!isCollapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                <h2 className="text-sm font-bold text-slate-800 leading-tight truncate">{workspaceInfo.name}</h2>
                <p className="text-[10px] text-slate-500 font-medium">Gestão de Obras</p>
              </div>
            )}
          </div>
          {!isCollapsed && !isMobile && (
            <Button 
              onClick={() => setIsSidebarCollapsed(true)} 
              variant="ghost" 
              size="icon"
              className="text-slate-400 hover:text-slate-600 flex-shrink-0 hidden lg:flex"
              aria-label="Recolher menu"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems
            .filter(item => !item.adminOnly || userInfo.role === 'admin') // Filter items based on adminOnly property
            .map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => isCollapsed ? null : setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0 ${
                    isActive ? 'text-blue-600' : ''
                  }`} />
                  {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>}
                </Link>
              );
            })}
        </div>
      </nav>

      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{userInfo.initial}</span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="font-semibold text-xs text-slate-800 truncate">{userInfo.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{userInfo.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <style>
        {`
          :root {
            --primary-blue: #1e40af;
            --primary-gold: #f59e0b;
            --surface-white: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border-light: #e2e8f0;
          }
          
          .print-hide {
            display: block;
          }
          
          .print-show {
            display: none;
          }
          
          /* Prevent body scroll when mobile menu is open */
          body:has(.mobile-menu-open) {
            overflow: hidden;
          }
          
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
            }
            
            .print-hide {
              display: none !important;
            }
            
            .print-show {
              display: block !important;
            }
            
            .print-content {
              width: 100%;
              max-width: none;
            }
            
            .print-header {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            
            .print-header h1 {
              font-size: 18px;
              font-weight: bold;
              margin: 0 0 10px 0;
              color: #000;
            }
            
            .print-chart-container {
              width: 100%;
              height: 350px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }

            .print-info {
              font-size: 11px;
              color: #333;
            }
            
            .print-info p {
              margin: 2px 0;
            }
            
            .print-section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            
            .print-section h2 {
              font-size: 14px;
              font-weight: bold;
              margin: 0 0 10px 0;
              color: #000;
              border-bottom: 1px solid #ccc;
              padding-bottom: 3px;
            }
            
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 11px;
            }
            
            .print-table th,
            .print-table td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
              vertical-align: top;
            }
            
            .print-table th {
              background-color: #f5f5f5;
              font-weight: bold;
              color: #000;
            }
            
            .print-table .text-right {
              text-align: right;
            }
            
            .print-table .text-center {
              text-align: center;
            }
            
            .print-table .total-row {
              border-top: 2px solid #000;
              font-weight: bold;
            }
            
            .print-table .total-row td {
              background-color: #f9f9f9;
            }
            
            .text-green {
              color: #059669 !important;
            }
            
            .text-red {
              color: #dc2626 !important;
            }
            
            .status-pago {
              color: #059669;
            }
            
            .status-programado {
              color: #0ea5e9;
            }
            
            .status-atrasado {
              color: #dc2626;
            }
            
            .status-pendente {
              color: #f59e0b;
            }
            
            .print-section:nth-child(n+3) {
              page-break-before: auto;
            }
            
            .print-table tr {
              page-break-inside: avoid;
            }
            
            .print-table thead {
              display: table-header-group;
            }
          }
        `}
      </style>
      
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 fixed top-0 left-0 right-0 z-50 print-hide shadow-sm">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3">
            {workspaceInfo.logoUrl ? (
              <img src={workspaceInfo.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-sm">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            )}
            <h1 className="text-lg lg:text-xl font-bold text-slate-800 truncate">{workspaceInfo.name}</h1>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]" onOpenAutoFocus={(e) => e.preventDefault()}>
              <NavigationContent isCollapsed={false} isMobile={true} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="min-h-screen pt-[73px]">
        <div className="p-4 lg:p-8 max-w-[1920px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}