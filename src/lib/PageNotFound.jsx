import { Link } from 'react-router-dom';
export default function PageNotFound() {
  return <div className="p-12 text-center"><h1 className="text-2xl font-bold">Página não encontrada</h1><Link to="/" className="mt-4 inline-block text-blue-700 underline">Voltar ao início</Link></div>;
}
