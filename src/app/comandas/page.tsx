"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiFileText, FiTrash2, FiX, FiChevronRight } from "react-icons/fi";
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
  data_abertura: string;
  status: string;
  itens: ComandaItem[];
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
  const [metodo, setMetodo] = useState<string>("Dinheiro");
  const [loadingNew, setLoadingNew] = useState(false);
  const [valorRecebido, setValorRecebido] = useState<string>("");

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
      const res = await fetch("/api/comandas", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao criar comanda");
      const comanda = await res.json();
      await fetchComandas();
      toast.success(`Comanda #${comanda.numero} criada!`);
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

      toast.success(`Comanda #${selected.numero} fechada! R$ ${Number(data.total).toFixed(2).replace(".", ",")} via ${metodo}`, {
        icon: "🎉",
        duration: 4000,
      });
      setSelected(null);
      setShowPayment(false);
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
          onClick={handleNovaComanda}
          disabled={loadingNew}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          {loadingNew ? "Criando..." : "Nova Comanda"}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Comanda list */}
        <div className="w-72 border-r border-gray-100 bg-white overflow-y-auto p-4 space-y-2">
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
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Total: <span className="text-brand-red font-bold text-lg">R$ {totalComanda.toFixed(2).replace(".", ",")}</span>
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
                    onClick={() => setShowPayment(true)}
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
                              {Number(item.quantidade).toFixed(3).replace(/\.?0+$/, "")} × R$ {Number(item.valor_unitario).toFixed(2).replace(".", ",")}
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
              <h3 className="text-lg font-bold text-brand-dark">Adicionar produto à Comanda #{selected.numero}</h3>
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

      {/* Payment / close modal */}
      {showPayment && selected && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-brand-dark">Fechar Comanda #{selected.numero}</h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-600">{selected.itens.length} itens</p>
              <p className="text-2xl font-extrabold text-brand-red mt-1">
                R$ {totalComanda.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="mb-5">
              <label className="label">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {(["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"]).map((m) => (
                  <button
                    key={m}
                    id={`fechar-${m.toLowerCase().replace(/ /g, "-")}-btn`}
                    onClick={() => setMetodo(m)}
                    className={`
                      flex items-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all
                      ${metodo === m ? "border-brand-red bg-brand-red text-white" : "border-gray-200 bg-white text-gray-600"}
                    `}
                  >
                    {m}
                    <div
                      className={`w-4 h-4 ml-auto rounded-full border-2 flex items-center justify-center shrink-0
                        ${metodo === m ? "border-white" : "border-gray-300"}
                      `}
                    >
                      {metodo === m && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {metodo === "Dinheiro" && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="label text-gray-700">Valor Recebido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={totalComanda}
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    className="input"
                    placeholder="Ex: 50.00"
                  />
                  {Number(valorRecebido) > 0 && Number(valorRecebido) >= totalComanda && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600">Troco a devolver:</span>
                      <span className="text-lg font-extrabold text-green-600">
                        R$ {(Number(valorRecebido) - totalComanda).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPayment(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                id="confirmar-fechar-comanda-btn"
                onClick={handleFecharComanda}
                disabled={loadingClose}
                className="btn-primary flex-1"
              >
                {loadingClose ? "Fechando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
