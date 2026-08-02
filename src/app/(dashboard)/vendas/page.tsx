"use client";

import { useEffect, useState, useCallback } from "react";
import { FiBarChart2, FiFilter, FiX, FiChevronRight, FiDownload } from "react-icons/fi";

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
    metodoPagamento: ["Todos"],
    tipo: "Todos",
  });

  const fetchVendas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dataInicio) params.append("dataInicio", filters.dataInicio);
      if (filters.dataFim) params.append("dataFim", filters.dataFim);
      if (!filters.metodoPagamento.includes("Todos") && filters.metodoPagamento.length > 0) {
        filters.metodoPagamento.forEach(m => params.append("metodoPagamento", m));
      } else {
        params.append("metodoPagamento", "Todos");
      }
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

  const [showPagamentoDropdown, setShowPagamentoDropdown] = useState(false);

  const exportToExcel = () => {
    if (vendas.length === 0) return;

    const periodoInicio = filters.dataInicio
      ? new Date(filters.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
      : "—";
    const periodoFim = filters.dataFim
      ? new Date(filters.dataFim + "T00:00:00").toLocaleDateString("pt-BR")
      : "—";

    // Build styled HTML table for Excel
    let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
<x:ExcelWorkbook>
<x:ExcelWorksheets>
<x:ExcelWorksheet>
<x:Name>Vendas</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet>
</x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  td, th { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  .header-title { font-size: 16pt; font-weight: bold; color: #C13B56; }
  .header-sub { font-size: 10pt; color: #666666; }
  .col-header { background-color: #C13B56; color: #FFFFFF; font-weight: bold; text-align: center; padding: 8px 12px; border: 1px solid #A0324A; }
  .row-even { background-color: #FFF5F7; }
  .row-odd { background-color: #FFFFFF; }
  .cell { padding: 6px 12px; border: 1px solid #E5E7EB; vertical-align: middle; }
  .cell-id { text-align: center; font-weight: bold; color: #C13B56; }
  .cell-money { text-align: right; font-weight: bold; }
  .total-label { font-weight: bold; font-size: 12pt; text-align: right; padding: 8px 12px; border: 2px solid #C13B56; background-color: #FFF1F3; }
  .total-value { font-weight: bold; font-size: 14pt; color: #C13B56; text-align: right; padding: 8px 12px; border: 2px solid #C13B56; background-color: #FFF1F3; }
</style>
</head>
<body>
<table>
  <!-- Report Header -->
  <tr><td colspan="5" class="header-title">🍦 Doce Sabor — Relatório de Vendas</td></tr>
  <tr><td colspan="5" class="header-sub">Período: ${periodoInicio} a ${periodoFim}</td></tr>
  <tr><td colspan="5" class="header-sub">Gerado em: ${new Date().toLocaleString("pt-BR")}</td></tr>
  <tr><td colspan="5"></td></tr>
  <!-- Column Headers -->
  <tr>
    <th class="col-header">ID</th>
    <th class="col-header">Data/Hora</th>
    <th class="col-header">Tipo</th>
    <th class="col-header">Pagamento</th>
    <th class="col-header">Total (R$)</th>
  </tr>`;

    vendas.forEach((v, i) => {
      const rowClass = i % 2 === 0 ? "row-even" : "row-odd";
      html += `
  <tr class="${rowClass}">
    <td class="cell cell-id">#${v.id}</td>
    <td class="cell">${formatDate(v.data_hora)}</td>
    <td class="cell" style="text-align:center">${v.tipo}</td>
    <td class="cell" style="text-align:center">${v.metodo_pagamento}</td>
    <td class="cell cell-money">R$ ${Number(v.total).toFixed(2).replace(".", ",")}</td>
  </tr>`;
    });

    html += `
  <!-- Totals -->
  <tr><td colspan="5"></td></tr>
  <tr>
    <td colspan="3"></td>
    <td class="total-label">${vendas.length} ${vendas.length === 1 ? "venda" : "vendas"} — Total:</td>
    <td class="total-value">R$ ${totalFiltrado.toFixed(2).replace(".", ",")}</td>
  </tr>
</table>
</body>
</html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_vendas_${filters.dataInicio}_a_${filters.dataFim}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Vendas</h1>
            <p className="text-xs text-gray-400 mt-0.5">Histórico de vendas</p>
          </div>
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
          <div className="flex flex-col gap-1 relative">
            <label className="label text-xs">Pagamento</label>
            <button
               onClick={() => setShowPagamentoDropdown(!showPagamentoDropdown)}
               className="input text-sm py-2 w-48 text-left bg-white border-2 border-gray-200 rounded-xl flex justify-between items-center"
            >
               <span className="truncate pr-2">
                 {filters.metodoPagamento.includes("Todos") || filters.metodoPagamento.length === 0 
                   ? "Todos" 
                   : filters.metodoPagamento.join(", ")}
               </span>
               <FiChevronRight className={`shrink-0 transition-transform ${showPagamentoDropdown ? 'rotate-90' : ''}`} />
            </button>
            
            {showPagamentoDropdown && (
               <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1">
                  {["Todos", "Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={filters.metodoPagamento.includes(opt)}
                        onChange={() => {
                          setFilters(f => {
                             let newArr = [...f.metodoPagamento];
                             if (opt === "Todos") {
                               newArr = ["Todos"];
                             } else {
                               newArr = newArr.filter(x => x !== "Todos");
                               if (newArr.includes(opt)) newArr = newArr.filter(x => x !== opt);
                               else newArr.push(opt);
                               if (newArr.length === 0) newArr = ["Todos"];
                             }
                             return { ...f, metodoPagamento: newArr };
                          });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <span className="font-medium text-gray-700">{opt}</span>
                    </label>
                  ))}
               </div>
            )}
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
              <option>Venda Rápida</option>
              <option>Comanda</option>
            </select>
          </div>
          <button
            id="limpar-filtros-btn"
            onClick={() => {
              setFilters({ dataInicio: today(), dataFim: today(), metodoPagamento: ["Todos"], tipo: "Todos" });
              setShowPagamentoDropdown(false);
            }}
            className="btn-ghost py-2 px-3 text-sm flex items-center gap-1"
          >
            <FiFilter size={14} /> Limpar
          </button>
        </div>

        {/* Totals + Export — positioned below filters */}
        {vendas.length > 0 && (
          <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 px-5 py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Vendas:</span>
                <span className="text-sm font-bold text-brand-dark">{vendas.length}</span>
              </div>
              <div className="w-px h-5 bg-gray-200" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Total:</span>
                <span className="text-lg font-extrabold text-brand-red">
                  R$ {totalFiltrado.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
            <button 
              onClick={exportToExcel}
              className="btn-ghost flex items-center gap-2 border border-gray-200 px-3 py-2 hover:border-brand-red/30 hover:text-brand-red transition-colors"
              title="Exportar Excel"
            >
              <FiDownload size={16} />
              <span className="text-sm font-bold">Exportar</span>
            </button>
          </div>
        )}
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
