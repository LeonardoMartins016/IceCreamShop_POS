"use client";

import { useEffect, useState, useCallback } from "react";
import { FiBarChart2, FiFilter, FiX, FiChevronRight } from "react-icons/fi";

interface VendaItem {
  id: number;
  produto_descricao: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
  teve_promocao: boolean;
}

interface Venda {
  id: number;
  data_hora: string;
  total: string | number;
  metodo_pagamento: string;
  tipo: string;
  numero_comanda: number | null;
  itens: VendaItem[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const today = () => new Date().toISOString().split("T")[0];

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Venda | null>(null);
  const [filters, setFilters] = useState({
    dataInicio: today(),
    dataFim: today(),
    metodoPagamento: "Todos",
    tipo: "Todos",
  });

  const fetchVendas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dataInicio) params.append("dataInicio", filters.dataInicio);
      if (filters.dataFim) params.append("dataFim", filters.dataFim);
      if (filters.metodoPagamento !== "Todos") params.append("metodoPagamento", filters.metodoPagamento);
      if (filters.tipo !== "Todos") params.append("tipo", filters.tipo);

      const res = await fetch(`/api/vendas?${params.toString()}`);
      if (res.ok) setVendas(await res.json());
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  const totalFiltrado = vendas.reduce((sum, v) => sum + Number(v.total), 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Vendas</h1>
            <p className="text-xs text-gray-400 mt-0.5">Histórico de vendas</p>
          </div>
          {vendas.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">{vendas.length} vendas</p>
              <p className="text-xl font-extrabold text-brand-red">
                R$ {totalFiltrado.toFixed(2).replace(".", ",")}
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="label text-xs">De</label>
            <input
              id="filtro-data-inicio"
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters((f) => ({ ...f, dataInicio: e.target.value }))}
              className="input text-sm py-2 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label text-xs">Até</label>
            <input
              id="filtro-data-fim"
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters((f) => ({ ...f, dataFim: e.target.value }))}
              className="input text-sm py-2 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label text-xs">Pagamento</label>
            <select
              id="filtro-pagamento"
              value={filters.metodoPagamento}
              onChange={(e) => setFilters((f) => ({ ...f, metodoPagamento: e.target.value }))}
              className="select text-sm py-2 w-36"
            >
              <option>Todos</option>
              <option>Dinheiro</option>
              <option>PIX</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="label text-xs">Tipo</label>
            <select
              id="filtro-tipo"
              value={filters.tipo}
              onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
              className="select text-sm py-2 w-32"
            >
              <option>Todos</option>
              <option>Direta</option>
              <option>Comanda</option>
            </select>
          </div>
          <button
            id="limpar-filtros-btn"
            onClick={() => setFilters({ dataInicio: today(), dataFim: today(), metodoPagamento: "Todos", tipo: "Todos" })}
            className="btn-ghost py-2 px-3 text-sm flex items-center gap-1"
          >
            <FiFilter size={14} /> Limpar
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-card mb-5">
                <FiBarChart2 className="text-gray-200" size={40} />
              </div>
              <p className="text-gray-500 font-semibold">Nenhuma venda encontrada</p>
              <p className="text-gray-400 text-sm mt-1">Ajuste os filtros ou realize novas vendas</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl">
              {vendas.map((venda) => (
                <button
                  key={venda.id}
                  id={`venda-${venda.id}`}
                  onClick={() => setSelected(venda)}
                  className="w-full card card-hover p-4 text-left flex items-center gap-4 border-2 border-transparent hover:border-brand-red/20 transition-all"
                >
                  <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-brand-red text-xs font-bold">#{venda.id}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-dark text-sm">
                        {formatDate(venda.data_hora)}
                      </span>
                      {venda.tipo === "Comanda" && (
                        <span className="badge-blue">Comanda #{venda.numero_comanda}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge-${venda.metodo_pagamento === "PIX" ? "blue" : "orange"}`}>
                        {venda.metodo_pagamento}
                      </span>
                      <span className="text-xs text-gray-400">
                        {venda.itens.length} {venda.itens.length === 1 ? "item" : "itens"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-brand-red">
                      R$ {Number(venda.total).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <FiChevronRight className="text-gray-300 shrink-0" size={18} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Venda detail panel */}
        {selected && (
          <div className="w-80 xl:w-96 border-l border-gray-100 bg-white overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-brand-dark">Venda #{selected.id}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
                id="close-venda-detail"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 flex-1">
              <div className="space-y-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Data/Hora</p>
                  <p className="font-semibold text-sm">{formatDate(selected.data_hora)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Pagamento</p>
                    <p className="font-semibold text-sm">{selected.metodo_pagamento}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="font-semibold text-sm">{selected.tipo}</p>
                  </div>
                </div>
                {selected.numero_comanda && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Comanda</p>
                    <p className="font-semibold text-sm">#{selected.numero_comanda}</p>
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Itens</p>
              <div className="space-y-2 mb-5">
                {selected.itens.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-brand-dark">{item.produto_descricao}</p>
                      <p className="text-xs text-gray-500">
                        {Number(item.quantidade).toFixed(3).replace(/\.?0+$/, "")} × R$ {Number(item.valor_unitario).toFixed(2).replace(".", ",")}
                        {item.teve_promocao && " 🏷️"}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-brand-dark">
                      R$ {Number(item.valor_total).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="text-2xl font-extrabold text-brand-red">
                  R$ {Number(selected.total).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
