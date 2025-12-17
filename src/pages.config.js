import ConectarWhatsApp from './pages/ConectarWhatsApp';
import Configuracoes from './pages/Configuracoes';
import Contratos from './pages/Contratos';
import Dashboard from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Gastos from './pages/Gastos';
import GastosAdministrativos from './pages/GastosAdministrativos';
import GerenciamentoUsuarios from './pages/GerenciamentoUsuarios';
import Home from './pages/Home';
import Inicio from './pages/Inicio';
import Obras from './pages/Obras';
import Orcamento from './pages/Orcamento';
import Receitas from './pages/Receitas';
import Recibos from './pages/Recibos';
import Relatorios from './pages/Relatorios';
import SolicitarAcesso from './pages/SolicitarAcesso';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ConectarWhatsApp": ConectarWhatsApp,
    "Configuracoes": Configuracoes,
    "Contratos": Contratos,
    "Dashboard": Dashboard,
    "Fornecedores": Fornecedores,
    "Gastos": Gastos,
    "GastosAdministrativos": GastosAdministrativos,
    "GerenciamentoUsuarios": GerenciamentoUsuarios,
    "Home": Home,
    "Inicio": Inicio,
    "Obras": Obras,
    "Orcamento": Orcamento,
    "Receitas": Receitas,
    "Recibos": Recibos,
    "Relatorios": Relatorios,
    "SolicitarAcesso": SolicitarAcesso,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};