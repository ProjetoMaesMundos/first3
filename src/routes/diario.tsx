import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export interface TimelineItem {
  id: string;
  tipo: 'sessao' | 'som' | 'marco' | 'check-in' | 'anotacao';
  titulo: string;
  detalhe?: string;
  dataIso: string;
  origem: 'registro' | 'sessao';
}

export function montarTimeline(registros: RegistroItem[], sessoes: SessaoItem[]): TimelineItem[] {
  const itemsRegistros: TimelineItem[] = registros.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    titulo: r.titulo,
    detalhe: r.descricao,
    dataIso: r.data,
    origem: 'registro',
  }));

  const itemsSessoes: TimelineItem[] = sessoes.map((s, idx) => ({
    id: s.id || String(idx),
    tipo: 'sessao',
    titulo: s.titulo || s.name || 'Sessão de áudio',
    detalhe: s.duracao ? `Duração: ${s.duracao} min` : undefined,
    dataIso: s.data || s.date || s.createdAt || new Date().toISOString(),
    origem: 'sessao',
  }));

  return [...itemsRegistros, ...itemsSessoes].sort(
    (a, b) => new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime()
  );
}

export function formatarDataExtenso(isoString: string): string {
  try {
    const data = new Date(isoString);
    if (isNaN(data.getTime())) return isoString;
    return data.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export default function Diario() {
  const navigate = useNavigate();
  const [nomeBebe, setNomeBebe] = useState<string>('');
  const [filtroAtivo, setFiltroAtivo] = useState<string>('todos');
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [tipoNovo, setTipoNovo] = useState<'som' | 'marco' | 'check-in' | 'anotacao'>('anotacao');
  const [tituloNovo, setTituloNovo] = useState('');
  const [detalheNovo, setDetalheNovo] = useState('');

  const carregarDados = () => {
    try {
      const perfilRaw = localStorage.getItem('mp3a.perfil');
      if (!perfilRaw) {
        navigate('/');
        return;
      }
      const perfil = JSON.parse(perfilRaw);
      const nome = perfil?.nome || perfil?.bebe || perfil?.name;
      if (!nome) {
        navigate('/');
        return;
      }
      setNomeBebe(nome);
    } catch {
      navigate('/');
      return;
    }

    const regs = getRegistros();
    let sess: SessaoItem[] = [];
    try {
      const rawSessoes = localStorage.getItem('mp3a.sessoes');
      if (rawSessoes) {
        const parsed = JSON.parse(rawSessoes);
        if (Array.isArray(parsed)) sess = parsed;
      }
    } catch {
      sess = [];
    }

    setTimeline(montarTimeline(regs, sess));
  };

  useEffect(() => {
    carregarDados();
  }, [navigate]);

  const handleSalvarRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNovo.trim()) return;
    saveRegistro({
      tipo: tipoNovo,
      titulo: tituloNovo.trim(),
      descricao: detalheNovo.trim() || undefined,
    });
    setTituloNovo('');
    setDetalheNovo('');
    setModalAberto(false);
    carregarDados();
  };

  const abrirOpcao = (tipo: 'som' | 'marco' | 'check-in' | 'anotacao') => {
    setTipoNovo(tipo);
    setModalAberto(true);
  };

  const itensFiltrados = timeline.filter((item) => {
    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'sessoes') return item.tipo === 'sessao';
    if (filtroAtivo === 'sons') return item.tipo === 'som';
    if (filtroAtivo === 'marcos') return item.tipo === 'marco';
    if (filtroAtivo === 'check-ins') return item.tipo === 'check-in';
    if (filtroAtivo === 'anotacoes') return item.tipo === 'anotacao';
    return true;
  });

  const getCorMarcador = (tipo: string) => {
    switch (tipo) {
      case 'sessao':
        return 'bg-purple-600';
      case 'som':
        return 'bg-amber-600';
      case 'marco':
        return 'bg-emerald-600';
      case 'check-in':
        return 'bg-sky-600';
      case 'anotacao':
      default:
        return 'bg-slate-600';
    }
  };

  const getLabelTipo = (tipo: string) => {
    switch (tipo) {
      case 'sessao':
        return 'Sessão';
      case 'som':
        return 'Som';
      case 'marco':
        return 'Marco';
      case 'check-in':
        return 'Check-in';
      case 'anotacao':
        return 'Anotação';
      default:
        return tipo;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* 1. Cabeçalho discreto */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="text-sm text-slate-600 hover:text-slate-900 transition font-medium"
          >
            &larr; Voltar
          </Link>
          <div className="h-4 w-px bg-slate-300" />
          <h1 className="text-base font-semibold text-slate-900">
            Diário de {nomeBebe}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 2. Filtros em faixa horizontal */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'sessoes', label: 'Sessões' },
            { id: 'sons', label: 'Sons' },
            { id: 'marcos', label: 'Marcos' },
            { id: 'check-ins', label: 'Check-ins' },
            { id: 'anotacoes', label: 'Anotações' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroAtivo(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filtroAtivo === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. Linha do tempo vertical */}
        {itensFiltrados.length === 0 ? (
          /* 4. Estado vazio */
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm">Nenhum registro encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
            {itensFiltrados.map((item) => (
              <div key={item.id + item.origem} className="relative pl-6">
                {/* Marcador visual discreto */}
                <div
                  className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${getCorMarcador(
                    item.tipo
                  )}`}
                />

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium uppercase tracking-wide text-slate-600">
                      {getLabelTipo(item.tipo)}
                    </span>
                    <span>{formatarDataExtenso(item.dataIso)}</span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {item.titulo}
                  </h2>
                  {item.detalhe && (
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                      {item.detalhe}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 5. Botão flutuante de registro rápido e menu de opções */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end">
        {modalAberto && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 mb-4 w-80 max-w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 capitalize">
                Novo {getLabelTipo(tipoNovo)}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarRegistro} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={tituloNovo}
                  onChange={(e) => setTituloNovo(e.target.value)}
                  placeholder="Título do registro..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Detalhe (opcional)
                </label>
                <textarea
                  value={detalheNovo}
                  onChange={(e) => setDetalheNovo(e.target.value)}
                  placeholder="Informações adicionais..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col items-end space-y-2 mb-3">
          {!modalAberto && (
            <div className="flex flex-col space-y-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
              <button
                onClick={() => abrirOpcao('som')}
                className="px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Som
              </button>
              <button
                onClick={() => abrirOpcao('marco')}
                className="px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Marco
              </button>
              <button
                onClick={() => abrirOpcao('check-in')}
                className="px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Check-in
              </button>
              <button
                onClick={() => abrirOpcao('anotacao')}
                className="px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Anotação
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setModalAberto(!modalAberto)}
          className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 transition text-2xl font-light"
          title="Registrar"
        >
          +
        </button>
      </div>
    </div>
  );
}
