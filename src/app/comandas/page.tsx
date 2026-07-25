"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiFileText, FiTrash2, FiX, FiChevronRight, FiDollarSign, FiCreditCard, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { toast } from "react-hot-toast";
import ProductGrid from "@/components/ProductGrid";
import QuantityModal from "@/components/QuantityModal";

interface Produto {
  id: number;
  descricao: string;
  valor: string | number;
  tipo: string;
  promocoes: { id: number; quantidade_minima: number; preco_promocional: string | number }[];
}

interface ComandaItem {
  id: number;
  produto_descricao: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
  teve_promocao: boolean;
}

interface Comanda {
  id: number;
  numero: number;
  nome?: string | null;
  data_abertura: string;
  status: string;
  itens: ComandaItem[];
}

const METODOS_PAGAMENTO = [
  { key: "Dinheiro", icon: FiDollarSign, color: "emerald" },
  { key: "PIX", icon: BsQrCode, color: "violet" },
  { key: "Cartão de Crédito", icon: FiCreditCard, color: "blue" },
  { key: "Cartão de Débito", icon: FiCreditCard, color: "amber" },
] as const;

function getMetodoStyle(m: string, selectedMetodo: string, color: string) {
  const isActive = selectedMetodo === m;
  const colorMap: Record<string, { active: string; ring: string; iconBg: string; iconText: string }> = {
    emerald: { active: "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/60 shadow-emerald-100", ring: "ring-emerald-500/20", iconBg: "bg-emerald-500", iconText: "text-emerald-700" },
    violet: { active: "border-violet-500 bg-gradient-to-br from-violet-50 to-violet-100/60 shadow-violet-100", ring: "ring-violet-500/20", iconBg: "bg-violet-500", iconText: "text-violet-700" },
    blue: { active: "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/60 shadow-blue-100", ring: "ring-blue-500/20", iconBg: "bg-blue-500", iconText: "text-blue-700" },
    amber: { active: "border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/60 shadow-amber-100", ring: "ring-amber-500/20", iconBg: "bg-amber-500", iconText: "text-amber-700" },
  };
  const c = colorMap[color];
  return {
    button: isActive ? `${c.active} border-2 shadow-md ring-4 ${c.ring}` : "border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
    iconContainer: isActive ? `${c.iconBg} text-white` : "bg-gray-100 text-gray-500",
    label: isActive ? `font-bold ${c.iconText}` : "font-medium text-gray-600",
  };
}

export default function ComandasPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selected, setSelected] = useState<Comanda | null>(null);
  const [showAddProducts, setShowAddProducts] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [loadingClose, setLoadingClose] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [metodo, setMetodo] = useState<string>("Dinheiro");
  const [loadingNew, setLoadingNew] = useState(false);
  const [valorRecebido, setValorRecebido] = useState<string>("");
  const [showNovaComandaModal, setShowNovaComandaModal] = useState(false);
  const [novaComandaNome, setNovaComandaNome] = useState("");

  const fetchComandas = useCallback(async () => {
    try {
      const res = await fetch("/api/comandas");
      if (res.ok) setComandas(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchProdutos = useCallback(async () => {
    try {
      const res = await fetch("/api/produtos");
      if (res.ok) setProdutos(await res.json());
    } catch { /* silent */ }
  }, []);

  const refreshSelected = useCallback(async (id: number) => {
    const res = await fetch(`/api/comandas/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelected(data);
      setComandas((prev) => prev.map((c) => (c.id === id ? data : c)));
    }
  }, []);

  useEffect(() => {
    fetchComandas();
    fetchProdutos();
  }, [fetchComandas, fetchProdutos]);

  const handleNovaComanda = async () => {
    setLoadingNew(true);
    try {
      const res = await fetch("/api/comandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novaComandaNome || undefined }),
      });
      if (!res.ok) throw new Error("Erro ao criar comanda");
      const comanda = await res.json();
      await fetchComandas();
      toast.success(`Comanda #${comanda.numero} criada!`);
      
      // Select the new comanda and open the add products modal
      setSelected({ ...comanda, itens: comanda.itens || [] });
      setShowAddProducts(true);
      setShowNovaComandaModal(false);
      setNovaComandaNome("");
    } catch {
      toast.error("Erro ao criar comanda");
    } finally {
      setLoadingNew(false);
    }
  };

  const handleSelectComanda = (comanda: Comanda) => {
    setSelected(comanda);
    setShowAddProducts(false);
  };

  const handleAddProductToComanda = async (quantidade: number) => {
    if (!selectedProduto || !selected) return;
    setLoadingCalc(true);
    try {
      const calcRes = await fetch("/api/calcular-preco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produto_id: selectedProduto.id, quantidade }),
      });
      const calc = await calcRes.json();
      if (!calcRes.ok) throw new Error(calc.error);

      const addRes = await fetch(`/api/comandas/${selected.id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: calc.produto_id,
          produto_descricao: calc.produto_descricao,
          quantidade: calc.quantidade,
          valor_unitario: calc.valor_unitario,
          valor_total: calc.valor_total,
          teve_promocao: calc.teve_promocao,
        }),
      });
      if (!addRes.ok) {
        const err = await addRes.json();
        throw new Error(err.error);
      }

      await refreshSelected(selected.id);
      setSelectedProduto(null);
      setShowAddProducts(false);
      if (calc.teve_promocao) toast.success("Promoção aplicada!", { icon: "🏷️" });
      else toast.success("Item adicionado à comanda!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar item");
    } finally {
      setLoadingCalc(false);
    }
  };

  const handleRemoveItem = async (item: ComandaItem) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/comandas/${selected.id}/itens/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover item");
      await refreshSelected(selected.id);
      toast.success("Item removido!");
    } catch {
      toast.error("Erro ao remover item");
    }
  };

  const handleFecharComanda = async () => {
    if (!selected) return;
    setLoadingClose(true);
    try {
      const res = await fetch(`/api/comandas/${selected.id}/fechar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo_pagamento: metodo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        `Comanda #${selected.numero} fechada! R$ ${Number(data.total).toFixed(2).replace(".", ",")} via ${metodo}`,
        { icon: "ðŸŽ‰", duration: 4000 }
      );
      setSelected(null);
      setShowPayment(false);
      setShowConfirmClose(false);
      setValorRecebido("");
      fetchComandas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao fechar comanda");
    } finally {
      setLoadingClose(false);
    }
  };

  const totalComanda = selected
    ? selected.itens.reduce((sum, item) => sum + Number(item.valor_total), 0)
    : 0;

  const valorRecebidoNum = Number(valorRecebido);
  const dinheiroValido =
    metodo !== "Dinheiro" || (valorRecebidoNum > 0 && valorRecebidoNum >= totalComanda);
  const troco =
    metodo === "Dinheiro" && valorRecebidoNum > 0 && valorRecebidoNum >= totalComanda
      ? valorRecebidoNum - totalComanda
      : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="section-title">Comandas</h1>
          <p className="text-xs text-gray-400 mt-0.5">Mesas e pedidos em aberto</p>
        </div>
        <button
          id="nova-comanda-btn"
          onClick={() => setShowNovaComandaModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          Nova Comanda
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Comanda list */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-100 bg-white overflow-y-auto p-4 space-y-2 shrink-0 md:h-auto max-h-[40vh] md:max-h-none">
          {comandas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FiFileText className="text-gray-300" size={28} />
              </div>
              <p className="text-gray-500 font-medium text-sm">Nenhuma comanda aberta</p>
              <p className="text-gray-400 text-xs mt-1">Clique em "Nova Comanda" para começar</p>
            </div>
          ) : (
            comandas.map((comanda) => {
              const total = comanda.itens.reduce(
                (sum, item) => sum + Number(item.valor_total),
                0
              );
              return (
                <button
                  key={comanda.id}
                  id={`comanda-${comanda.id}`}
                  onClick={() => handleSelectComanda(comanda)}
                  className={`
                    w-full text-left card card-hover p-4 flex items-center justify-between
                    border-2 transition-all duration-150
                    ${selected?.id === comanda.id ? "border-brand-red bg-red-50/30" : "border-transparent"}
                  `}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-brand-dark">
                        #{comanda.numero}
                      </span>
                      <span className="badge-green">aberta</span>
                    </div>
                    {comanda.nome && (
                      <p className="text-xs font-semibold text-brand-blue mt-0.5">{comanda.nome}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {comanda.itens.length} {comanda.itens.length === 1 ? "item" : "itens"} •{" "}
                      R$ {total.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <FiChevronRight className="text-gray-300" size={20} />
                </button>
              );
            })
          )}
        </div>

        {/* Comanda detail */}
        <div className="flex-1 overflow-y-auto bg-brand-bg">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-card mb-5">
                <FiFileText className="text-gray-200" size={40} />
              </div>
              <p className="text-gray-500 font-medium">Selecione uma comanda</p>
              <p className="text-gray-400 text-sm mt-1">ou crie uma nova</p>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-5">
              {/* Detail header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-brand-dark">
                    Comanda #{selected.numero}
                    {selected.nome && (
                      <span className="ml-2 text-lg font-semibold text-brand-blue">— {selected.nome}</span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Total:{" "}
                    <span className="text-brand-red font-bold text-lg">
                      R$ {totalComanda.toFixed(2).replace(".", ",")}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    id="add-produto-comanda-btn"
                    onClick={() => setShowAddProducts(true)}
                    className="btn-blue flex items-center gap-2"
                  >
                    <FiPlus size={18} /> Adicionar Item
                  </button>
                  <button
                    id="fechar-comanda-btn"
                    onClick={() => {
                      setValorRecebido("");
                      setMetodo("Dinheiro");
                      setShowPayment(true);
                    }}
                    disabled={selected.itens.length === 0}
                    className="btn-primary flex items-center gap-2"
                  >
                    Fechar Comanda
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="card">
                {selected.itens.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Nenhum item ainda. Adicione produtos!</p>
                ) : (
                  <div className="space-y-2">
                    {selected.itens.map((item) => (
                      <div key={item.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-brand-dark text-sm">{item.produto_descricao}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {Number(item.quantidade).toFixed(3).replace(/\.?0+$/, "")} × R${" "}
                              {Number(item.valor_unitario).toFixed(2).replace(".", ",")}
                            </span>
                            {item.teve_promocao && (
                              <span className="tag-promo text-[10px]">Promo</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-brand-dark">
                          R$ {Number(item.valor_total).toFixed(2).replace(".", ",")}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                          aria-label="Remover"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add product modal */}
      {showAddProducts && selected && (
        <div className="modal-overlay" onClick={() => setShowAddProducts(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-dark">
                Adicionar produto à Comanda #{selected.numero}
                {selected.nome && <span className="ml-1 text-brand-blue">— {selected.nome}</span>}
              </h3>
              <button onClick={() => setShowAddProducts(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProductGrid
                produtos={produtos}
                onSelectProduct={(p) => {
                  setSelectedProduto(p);
                  setShowAddProducts(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quantity modal for comanda items */}
      {selectedProduto && (
        <QuantityModal
          produto={selectedProduto}
          onConfirm={handleAddProductToComanda}
          onClose={() => setSelectedProduto(null)}
          loading={loadingCalc}
        />
      )}

      {/* â”€â”€ Confirmation dialog (2nd step) â”€â”€ */}
      {showConfirmClose && selected && (
        <div className="modal-overlay" onClick={() => setShowConfirmClose(false)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "modalIn 0.18s ease-out" }}
          >
            <div className="relative bg-gradient-to-br from-brand-red/10 via-brand-red/5 to-transparent pt-8 pb-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-red to-rose-600 flex items-center justify-center shadow-lg shadow-brand-red/25 mb-4">
                <FiAlertCircle className="text-white" size={30} />
              </div>
              <h3 className="text-lg font-bold text-brand-dark">Fechar Comanda?</h3>
              <p className="text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita</p>
            </div>

            <div className="px-6 py-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Comanda</span>
                  <span className="font-semibold text-brand-dark">
                    #{selected.numero}{selected.nome ? ` — ${selected.nome}` : ""}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Itens</span>
                  <span className="font-semibold text-brand-dark">
                    {selected.itens.length} {selected.itens.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagamento</span>
                  <span className="font-semibold text-brand-dark">{metodo}</span>
                </div>
                {troco > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Troco</span>
                    <span className="font-bold text-emerald-600">
                      R$ {troco.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="text-xl font-extrabold text-brand-red">
                    R$ {totalComanda.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="btn-ghost flex-1 py-3.5"
                id="confirm-fechar-cancel-btn"
              >
                Voltar
              </button>
              <button
                id="confirmar-fechar-comanda-btn"
                onClick={handleFecharComanda}
                disabled={loadingClose}
                className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm
                           bg-gradient-to-r from-brand-red to-rose-600
                           hover:from-brand-red hover:to-rose-700
                           active:scale-[0.97] transition-all duration-150
                           shadow-lg shadow-brand-red/25
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {loadingClose ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Fechando...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={16} />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Payment / Close Comanda modal (1st step) â”€â”€ */}
      {showPayment && selected && !showConfirmClose && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "modalIn 0.18s ease-out" }}
          >
            {/* Header gradient */}
            <div className="relative bg-gradient-to-r from-brand-red via-rose-500 to-brand-red px-6 py-5">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-60" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Fechar Comanda #{selected.numero}
                  </h2>
                  <p className="text-rose-100 text-xs mt-0.5">
                    {selected.nome ? selected.nome : `${selected.itens.length} itens`}
                  </p>
                </div>
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  id="fechar-payment-close-btn"
                >
                  <FiX size={16} />
                </button>
              </div>
              {/* Total badge */}
              <div className="absolute -bottom-5 left-6 right-6">
                <div className="bg-white rounded-2xl shadow-lg shadow-black/10 px-5 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Total a pagar</span>
                  <span className="text-2xl font-extrabold text-brand-red tracking-tight">
                    R$ {totalComanda.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pt-10 pb-6 max-h-[60vh] overflow-y-auto">
              {/* Items summary */}
              <details className="group mb-6">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors">
                  <span>Itens da comanda</span>
                  <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">â–¼</span>
                </summary>
                <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selected.itens.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1.5 px-3 rounded-lg hover:bg-gray-50">
                      <span className="text-gray-600 truncate mr-3">
                        <span className="font-semibold text-brand-dark">
                          {Number(item.quantidade).toFixed(3).replace(/\.?0+$/, "")}x
                        </span>{" "}
                        {item.produto_descricao}
                      </span>
                      <span className="font-semibold text-brand-dark shrink-0">
                        R$ {Number(item.valor_total).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Payment method */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {METODOS_PAGAMENTO.map(({ key, icon: Icon, color }) => {
                    const style = getMetodoStyle(key, metodo, color);
                    return (
                      <button
                        key={key}
                        id={`fechar-${key.toLowerCase().replace(/ /g, "-")}-btn`}
                        onClick={() => {
                          setMetodo(key);
                          if (key !== "Dinheiro") setValorRecebido("");
                        }}
                        className={`relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 ${style.button}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${style.iconContainer}`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-sm text-left leading-tight ${style.label}`}>{key}</span>
                        {metodo === key && (
                          <div className="absolute top-2 right-2">
                            <FiCheckCircle size={14} className="text-current opacity-60" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash input */}
              {metodo === "Dinheiro" && (
                <div className="animate-slide-in">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5">
                    <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FiDollarSign size={14} />
                      Valor Recebido do Cliente
                      <span className="text-red-500 text-sm">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={valorRecebido}
                        onChange={(e) => setValorRecebido(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-emerald-200 bg-white text-lg font-bold text-brand-dark
                                   focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500
                                   placeholder-gray-300 transition-all duration-200"
                        placeholder="0,00"
                        id="fechar-valor-recebido"
                        autoFocus
                      />
                    </div>

                    {valorRecebido !== "" && valorRecebidoNum < totalComanda && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-500 font-medium animate-slide-in">
                        <FiAlertCircle size={14} />
                        Valor insuficiente. Faltam R$ {(totalComanda - valorRecebidoNum).toFixed(2).replace(".", ",")}
                      </div>
                    )}

                    {troco > 0 && (
                      <div className="mt-4 bg-white rounded-xl p-4 flex items-center justify-between border border-emerald-200 animate-slide-in">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <FiDollarSign className="text-emerald-600" size={16} />
                          </div>
                          <span className="text-sm font-semibold text-gray-600">Troco</span>
                        </div>
                        <span className="text-xl font-extrabold text-emerald-600">
                          R$ {troco.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[5, 10, 20, 50, 100].filter((v) => v >= totalComanda).slice(0, 4).map((valor) => (
                        <button
                          key={valor}
                          onClick={() => setValorRecebido(String(valor))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150
                            ${valorRecebidoNum === valor
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                        >
                          R$ {valor},00
                        </button>
                      ))}
                      <button
                        onClick={() => setValorRecebido(totalComanda.toFixed(2))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150
                          ${valorRecebidoNum === totalComanda
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                      >
                        Exato
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowPayment(false)} className="btn-ghost flex-1 py-3.5">
                Cancelar
              </button>
              <button
                id="fechar-confirmar-btn"
                onClick={() => setShowConfirmClose(true)}
                disabled={!dinheiroValido}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-200
                  flex items-center justify-center gap-2
                  ${dinheiroValido
                    ? "bg-gradient-to-r from-brand-red to-rose-600 text-white shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-[0.97]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {metodo === "Dinheiro" && !dinheiroValido ? (
                  <>
                    <FiDollarSign size={16} />
                    Informe o valor
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={16} />
                    Fechar Comanda
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Nova Comanda Modal ── */}
      {showNovaComandaModal && (
        <div className="modal-overlay" onClick={() => setShowNovaComandaModal(false)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "modalIn 0.18s ease-out" }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-brand-dark">Nova Comanda</h3>
                <p className="text-sm text-gray-500">Crie uma nova mesa ou pedido</p>
              </div>
              <button onClick={() => setShowNovaComandaModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Nome do Cliente <span className="text-gray-400 font-normal normal-case">(opcional)</span>
              </label>
              <input
                type="text"
                value={novaComandaNome}
                onChange={(e) => setNovaComandaNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-brand-dark
                           focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-brand-blue
                           placeholder-gray-300 transition-all duration-200"
                placeholder='Ex: "Mesa 3", "João"'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loadingNew) {
                    handleNovaComanda();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowNovaComandaModal(false)}
                className="btn-ghost flex-1 py-3"
              >
                Cancelar
              </button>
              <button
                onClick={handleNovaComanda}
                disabled={loadingNew}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm
                           bg-brand-blue hover:bg-blue-600 active:scale-[0.97] transition-all duration-150
                           shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingNew ? "Criando..." : "Criar Comanda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
