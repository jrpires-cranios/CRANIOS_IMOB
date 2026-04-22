import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../client';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus =
  | 'Novo Lead'
  | 'Qualificado'
  | 'Visita Agendada'
  | 'Proposta'
  | 'Em Análise'
  | 'Ganho'
  | 'Perdido';

interface Lead {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  imovel_interesse?: string;
  match_score?: number;
  agente?: string;
  corretor_id?: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: LeadStatus[] = [
  'Novo Lead',
  'Qualificado',
  'Visita Agendada',
  'Proposta',
  'Em Análise',
  'Ganho',
  'Perdido',
];

const COLUMN_COLORS: Record<LeadStatus, string> = {
  'Novo Lead': 'border-t-blue-400',
  'Qualificado': 'border-t-cyan-400',
  'Visita Agendada': 'border-t-purple-400',
  'Proposta': 'border-t-yellow-400',
  'Em Análise': 'border-t-orange-400',
  'Ganho': 'border-t-green-400',
  'Perdido': 'border-t-red-400',
};

const COLUMN_HEADER_COLORS: Record<LeadStatus, string> = {
  'Novo Lead': 'bg-blue-50 text-blue-700',
  'Qualificado': 'bg-cyan-50 text-cyan-700',
  'Visita Agendada': 'bg-purple-50 text-purple-700',
  'Proposta': 'bg-yellow-50 text-yellow-700',
  'Em Análise': 'bg-orange-50 text-orange-700',
  'Ganho': 'bg-green-50 text-green-700',
  'Perdido': 'bg-red-50 text-red-700',
};

const SLA_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48h

// ─── Mock data (usado quando backend não responde) ────────────────────────────

const MOCK_LEADS: Lead[] = [
  {
    id: 'mock-1',
    nome: 'Ana Lima',
    telefone: '(79) 99111-2233',
    email: 'ana@exemplo.com',
    imovel_interesse: 'Apartamento 3 quartos em Atalaia',
    match_score: 87,
    agente: 'Carlos Silva',
    corretor_id: 'c1',
    status: 'Novo Lead',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    nome: 'Bruno Santos',
    telefone: '(79) 98222-3344',
    email: 'bruno@exemplo.com',
    imovel_interesse: 'Casa com piscina em Jardins',
    match_score: 65,
    agente: 'Maria Costa',
    corretor_id: 'c2',
    status: 'Qualificado',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // SLA violado
  },
  {
    id: 'mock-3',
    nome: 'Carla Menezes',
    telefone: '(79) 97333-4455',
    imovel_interesse: 'Cobertura duplex no Centro',
    match_score: 42,
    agente: 'Carlos Silva',
    corretor_id: 'c1',
    status: 'Visita Agendada',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-4',
    nome: 'Diego Ferreira',
    telefone: '(79) 96444-5566',
    imovel_interesse: 'Terreno comercial na BR-101',
    match_score: 91,
    agente: 'Ana Rocha',
    corretor_id: 'c3',
    status: 'Proposta',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-5',
    nome: 'Elisa Prado',
    telefone: '(79) 95555-6677',
    imovel_interesse: 'Sala comercial no Centro',
    match_score: 73,
    agente: 'Maria Costa',
    corretor_id: 'c2',
    status: 'Em Análise',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // SLA violado
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function getScoreColor(score?: number): string {
  if (score === undefined || score === null) return 'bg-gray-100 text-gray-500';
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function isSlaViolated(lead: Lead): boolean {
  const updated = new Date(lead.updated_at).getTime();
  return Date.now() - updated > SLA_THRESHOLD_MS;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function getUniqueAgentes(leads: Lead[]): string[] {
  const set = new Set(leads.map((l) => l.agente).filter(Boolean) as string[]);
  return Array.from(set).sort();
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 animate-pulse space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

function LeadCard({ lead, onClick, onDragStart }: LeadCardProps) {
  const sla = isSlaViolated(lead);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none"
    >
      {/* Name + SLA badge */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="text-sm font-semibold text-gray-800 leading-tight">{lead.nome}</span>
        {sla && (
          <span className="relative flex-shrink-0 mt-0.5" title="SLA excedido: +48h sem atualização">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </div>

      {/* Phone */}
      {lead.telefone && (
        <p className="text-xs text-gray-500 mb-1">{lead.telefone}</p>
      )}

      {/* Imóvel interesse */}
      {lead.imovel_interesse && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{lead.imovel_interesse}</p>
      )}

      {/* Score + agent */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold px-1.5 py-0.5 rounded ${getScoreColor(lead.match_score)}`}
        >
          {lead.match_score !== undefined ? `${lead.match_score}%` : '—'}
        </span>
        <span className="text-xs text-gray-400 truncate ml-2">{lead.agente || '—'}</span>
      </div>

      {/* Date */}
      <p className="text-xs text-gray-400 mt-1">{formatDate(lead.created_at)}</p>
    </div>
  );
}

// ─── Lead Modal ───────────────────────────────────────────────────────────────

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (lead: Lead, newStatus: LeadStatus) => void;
}

function LeadModal({ lead, onClose, onStatusChange }: LeadModalProps) {
  const [briefing, setBriefing] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  async function fetchBriefing() {
    setLoadingBriefing(true);
    setBriefingError(null);
    try {
      const res = await apiClient.getLeadBriefing(lead.id);
      if (res.success && res.data) {
        setBriefing(res.data.briefing);
      } else {
        setBriefingError('Briefing não disponível');
      }
    } catch {
      setBriefingError('Erro ao carregar briefing');
    } finally {
      setLoadingBriefing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{lead.nome}</h2>
            <span
              className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${COLUMN_HEADER_COLORS[lead.status]}`}
            >
              {lead.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Contacts */}
          <div className="grid grid-cols-2 gap-3">
            {lead.telefone && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Telefone</p>
                <p className="text-sm font-medium text-gray-800">{lead.telefone}</p>
              </div>
            )}
            {lead.email && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">E-mail</p>
                <p className="text-sm font-medium text-gray-800 truncate">{lead.email}</p>
              </div>
            )}
            {lead.agente && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Agente</p>
                <p className="text-sm font-medium text-gray-800">{lead.agente}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Match Score</p>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${getScoreColor(lead.match_score)}`}>
                {lead.match_score !== undefined ? `${lead.match_score}%` : '—'}
              </span>
            </div>
          </div>

          {/* Imóvel */}
          {lead.imovel_interesse && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Imóvel de Interesse</p>
              <p className="text-sm text-gray-800">{lead.imovel_interesse}</p>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Entrada</p>
              <p className="text-gray-800">{formatDate(lead.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Última Atualização</p>
              <p className={isSlaViolated(lead) ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                {formatDate(lead.updated_at)}
                {isSlaViolated(lead) && ' ⚠ SLA'}
              </p>
            </div>
          </div>

          {/* Briefing */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Briefing</p>
              {!briefing && (
                <button
                  onClick={fetchBriefing}
                  disabled={loadingBriefing}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {loadingBriefing ? 'Carregando...' : 'Ver Briefing'}
                </button>
              )}
            </div>
            {briefing ? (
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                {typeof briefing === 'string' ? briefing : JSON.stringify(briefing, null, 2)}
              </pre>
            ) : briefingError ? (
              <p className="text-xs text-red-500">{briefingError}</p>
            ) : (
              <p className="text-xs text-gray-400">Clique em "Ver Briefing" para carregar.</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-200 flex flex-wrap gap-2">
          <button
            onClick={() => { onStatusChange(lead, 'Visita Agendada'); onClose(); }}
            className="flex-1 min-w-[120px] bg-purple-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Agendar Visita
          </button>
          <button
            onClick={() => { onStatusChange(lead, 'Novo Lead'); onClose(); }}
            className="flex-1 min-w-[120px] bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Reativar Lead
          </button>
          <button
            onClick={onClose}
            className="flex-1 min-w-[80px] bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface ColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: LeadStatus) => void;
  isLoading: boolean;
}

function KanbanColumn({
  status,
  leads,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop,
  isLoading,
}: ColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex-shrink-0 w-64 flex flex-col rounded-xl border-t-4 bg-gray-50 border border-gray-200 ${COLUMN_COLORS[status]} transition-all`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, status); }}
      style={{ outline: isDragOver ? '2px dashed #3b82f6' : undefined, outlineOffset: '-2px' }}
    >
      {/* Column Header */}
      <div className={`px-3 py-2.5 rounded-t-lg flex items-center justify-between ${COLUMN_HEADER_COLORS[status]}`}>
        <span className="text-xs font-bold uppercase tracking-wide truncate">{status}</span>
        <span className="ml-2 flex-shrink-0 text-xs font-bold bg-white/60 rounded-full px-1.5 py-0.5">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : leads.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400">
            Nenhum lead
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onCardClick(lead)}
              onDragStart={(e) => onDragStart(e, lead)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CRMKanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggingLead, setDraggingLead] = useState<Lead | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgente, setFilterAgente] = useState('');
  const [minScore, setMinScore] = useState(0);

  const dragLeadRef = useRef<Lead | null>(null);

  // ── Load leads ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await apiClient.getLeads({ status: 'all', tenant_id: 'demo' });
      if (res.success && res.data?.leads && res.data.leads.length > 0) {
        setLeads(res.data.leads as Lead[]);
      } else {
        // Backend sem dados: usar mock para demonstração visual
        setLeads(MOCK_LEADS);
      }
    } catch {
      setLeads(MOCK_LEADS);
    } finally {
      setLoading(false);
    }
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, lead: Lead) {
    dragLeadRef.current = lead;
    setDraggingLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, newStatus: LeadStatus) {
    e.preventDefault();
    const lead = dragLeadRef.current;
    if (!lead || lead.status === newStatus) {
      setDraggingLead(null);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, status: newStatus, updated_at: new Date().toISOString() }
          : l
      )
    );
    setDraggingLead(null);
    dragLeadRef.current = null;

    // Persist via API (fire-and-forget with rollback on error)
    try {
      await apiClient.updateLeadStatus(lead.id, newStatus);
    } catch {
      // Rollback on network error
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? lead : l))
      );
    }
  }

  // ── Status change from modal ─────────────────────────────────────────────────
  async function handleStatusChange(lead: Lead, newStatus: LeadStatus) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, status: newStatus, updated_at: new Date().toISOString() }
          : l
      )
    );
    try {
      await apiClient.updateLeadStatus(lead.id, newStatus);
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────────
  const agentes = getUniqueAgentes(leads);

  const filteredLeads = leads.filter((lead) => {
    if (searchQuery && !lead.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterAgente && lead.agente !== filterAgente) return false;
    if (minScore > 0 && (lead.match_score ?? 0) < minScore) return false;
    return true;
  });

  function getColumnLeads(status: LeadStatus) {
    return filteredLeads.filter((l) => l.status === status);
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM Kanban</h1>
              <p className="text-sm text-gray-500">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={fetchLeads}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Corretor filter */}
            <select
              value={filterAgente}
              onChange={(e) => setFilterAgente(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os corretores</option>
              {agentes.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Score range */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">
                Score min: <strong>{minScore}%</strong>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-blue-600"
              />
            </div>

            {/* SLA legend */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              SLA +48h
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-3 p-4 min-w-max">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={getColumnLeads(status)}
              onCardClick={setSelectedLead}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isLoading={loading}
            />
          ))}
        </div>
      </div>

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
