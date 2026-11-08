import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRegistros, saveRegistro, deleteRegistro, RegistroItem } from '../lib/registros';

interface SessaoItem {
  id?: string;
  titulo?: string;
  name?: string;
  data?: string;
  date?: string;
  createdAt?: string;
  duracao?: number;
}

export default function Diario() {
  const [registros, setRegistros] = useState<RegistroItem[]>([]);
  const [sessoes, setSessoes] = useState<SessaoItem[]>([]);
  const [tipo, setTipo] = useState<RegistroItem['tipo']>('anotacao');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const carregarDados = () => {
    setRegistros(getRegistros());
    try {
      const rawSessoes = localStorage.getItem('mp3a.sessoes');
      if (rawSessoes) {
        const parsed = JSON.parse(rawSessoes);
        if (Array.isArray(parsed)) {
          setSessoes(parsed);
        }
      }
    } catch {
      setSessoes([]);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    saveRegistro({
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined
    });
    setTitulo('');
    setDescricao('');
    carregarDados();
  };

  const handleDelete = (id: string) => {
    deleteRegistro(id);
    carregarDados();
  };

  // Juntar sessões e registros em formato unificado ordenado por data descendente
  const itensUnificados = [
    ...registros.map(r => ({
      id: r.id,
      origem: 'registro' as const,
      tipo: r.tipo,
      titulo: r.titulo,
      descricao: r.descricao,
      dataIso: r.data,
    })),
    ...sessoes.map((s, idx) => ({
      id: s.id || String(idx),
      origem: 'sessao' as const,
      tipo: 'sessao' as const,
      titulo: s.titulo || s.name || 'Sessão MP3A',
      descricao: s.duracao ? `Duração: ${s.duracao} min` : undefined,
      dataIso: s.data || s.date || s.createdAt || new Date().toISOString(),
    }))
  ].sort((a, b) => new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime());

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-blue-600 hover:underline text-sm mb-1 inline-block">&larr; Voltar ao Início</Link>
          <h1 className="text-3xl font-bold">Diário Geral</h1>
          <p className="text-gray-600">Acompanhe suas sessões de áudio, marcos, check-ins e anotações.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold mb-3">Novo Registro</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as RegistroItem['tipo'])}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="anotacao">Anotação</option>
              <option value="som">Som</option>
              <option value="marco">Marco</option>
              <option value="check-in">Check-in</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Meditação profunda"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              required
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes adicionais..."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            rows={2}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Adicionar Registro
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">Histórico Unificado</h2>
        {itensUnificados.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum item registrado ainda.</p>
        ) : (
          itensUnificados.map((item) => (
            <div
              key={item.id + item.origem}
              className={`p-4 rounded-xl border ${item.origem === 'sessao' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'} shadow-sm flex items-start justify-between`}
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded uppercase font-semibold ${item.origem === 'sessao' ? 'bg-purple-200 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {item.tipo}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.dataIso).toLocaleString()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{item.titulo}</h3>
                {item.descricao && <p className="text-gray-600 text-sm mt-1">{item.descricao}</p>}
              </div>
              {item.origem === 'registro' && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium ml-4"
                >
                  Excluir
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
