import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function ManusAPIKey() {
  return <Card><CardHeader><CardTitle>Integrações externas</CardTitle></CardHeader><CardContent className="space-y-3"><p>A integração de IA será conectada após a migração do banco de dados.</p><p className="text-slate-600">A antiga integração não é utilizada nesta versão. O novo acesso será configurado pelo administrador.</p></CardContent></Card>;
}
