import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { requireSupabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
export default function Login() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const rawNext = params.get('next') || '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\') && !rawNext.startsWith('/login') ? rawNext : '/';
  if (auth.user) return <Navigate to={next} replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const client = requireSupabase();
      const { error } = creating
        ? await client.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/login` } })
        : await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (creating) setMessage('Conta criada. Confira seu email para confirmar o cadastro. O acesso ao sistema depende de aprovação.');
      else await auth.checkAppState();
    } catch { setMessage(creating ? 'Não foi possível criar a conta. Confira os dados e tente novamente.' : 'Não foi possível entrar. Confira seu email e senha.'); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen grid place-items-center bg-slate-50 p-6"><form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow">
    <div><h1 className="text-2xl font-bold text-slate-800">J&T Gomes Construtora</h1><p className="mt-2 text-slate-600">{creating ? 'Criar conta' : 'Entre para acessar a gestão de obras'}</p></div>
    {!auth.isConfigured && <p role="alert" className="text-amber-800">O acesso está em configuração. Aguarde a liberação pelo administrador.</p>}
    {creating && <div><label className="text-sm font-medium" htmlFor="full-name">Nome completo</label><input className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm" id="full-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required /></div>}
    <div><label className="text-sm font-medium" htmlFor="email">Email</label><input className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm" id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
    <div><label className="text-sm font-medium" htmlFor="password">Senha</label><input className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm" id="password" type="password" autoComplete={creating ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></div>
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    <button type="submit" disabled={busy || !auth.isConfigured} className="w-full rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Aguarde…' : creating ? 'Criar conta' : 'Entrar'}</button>
    <button type="button" onClick={() => { setCreating(!creating); setMessage(''); }} className="text-sm text-blue-700 underline">{creating ? 'Já tenho conta' : 'Criar uma conta'}</button>
    <Link to="/SolicitarAcesso" className="ml-4 text-sm text-blue-700 underline">Solicitar acesso</Link>
  </form></div>;
}
