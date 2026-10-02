import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { pagesConfig } from './pages.config';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import SolicitarAcesso from '@/pages/SolicitarAcesso';
import ManusAPIKey from '@/pages/ManusAPIKey';
function ProtectedApp() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isLoadingAuth) return <div role="status" className="p-10 text-center">Carregando…</div>;
  if (!auth.isConfigured) return <div className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="max-w-md rounded-xl bg-white p-8 shadow"><h1 className="text-xl font-bold">Sistema em configuração</h1><p className="mt-3 text-slate-600">A conexão com o banco de dados está sendo preparada. O acesso será liberado assim que a configuração for concluída.</p></div></div>;
  if (auth.authError) return <div className="p-10 text-center"><h1 className="text-xl font-bold">{auth.authError.type === 'pending_approval' ? 'Acesso aguardando aprovação' : 'Não foi possível conectar'}</h1><p className="my-4">{auth.authError.type === 'pending_approval' ? auth.authError.message : 'Tente novamente em instantes. Se o problema continuar, procure o administrador.'}</p><button onClick={auth.checkAppState} className="mr-4 underline">Tentar novamente</button><button onClick={() => auth.logout()} className="underline">Sair</button>{auth.authError.type === 'pending_approval' && <a href="/SolicitarAcesso" className="ml-4 underline">Solicitar acesso</a>}</div>;
  if (!auth.isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  const { Pages, Layout, mainPage } = pagesConfig;
  const MainPage = Pages[mainPage];
  const wrap = Page => <Layout><Page /></Layout>;
  return <Routes>
    <Route path="/" element={wrap(MainPage)} />
    {Object.entries(Pages).filter(([path]) => path !== 'SolicitarAcesso').map(([path, Page]) => <Route key={path} path={`/${path}`} element={path === 'GerenciamentoUsuarios' && auth.user.role !== 'admin' ? <Navigate to="/" replace /> : wrap(Page)} />)}
    <Route path="/ManusAPIKey" element={auth.user.role === 'admin' ? wrap(ManusAPIKey) : <Navigate to="/" replace />} />
    <Route path="*" element={<PageNotFound />} />
  </Routes>;
}
export default function App() {
  return <AuthProvider><QueryClientProvider client={queryClientInstance}><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/SolicitarAcesso" element={<SolicitarAcesso />} />
    <Route path="*" element={<ProtectedApp />} />
  </Routes></BrowserRouter><Toaster /></QueryClientProvider></AuthProvider>;
}
