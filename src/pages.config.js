import Dashboard from './pages/Dashboard';
import Gastos from './pages/Gastos';
import Receitas from './pages/Receitas';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Obras from './pages/Obras';
import Orcamento from './pages/Orcamento';
import ConectarWhatsApp from './pages/ConectarWhatsApp';
import GastosAdministrativos from './pages/GastosAdministrativos';
import Recibos from './pages/Recibos';
import Contratos from './pages/Contratos';
import Fornecedores from './pages/Fornecedores';
import Inicio from './pages/Inicio';
import GerenciamentoUsuarios from './pages/GerenciamentoUsuarios';
import SolicitarAcesso from './pages/SolicitarAcesso';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Gastos": Gastos,
    "Receitas": Receitas,
    "Relatorios": Relatorios,
    "Configuracoes": Configuracoes,
    "Obras": Obras,
    "Orcamento": Orcamento,
    "ConectarWhatsApp": ConectarWhatsApp,
    "GastosAdministrativos": GastosAdministrativos,
    "Recibos": Recibos,
    "Contratos": Contratos,
    "Fornecedores": Fornecedores,
    "Inicio": Inicio,
    "GerenciamentoUsuarios": GerenciamentoUsuarios,
    "SolicitarAcesso": SolicitarAcesso,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};