"use client";

import { useEffect, useState, useCallback } from "react";
import { FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import ProductGrid from "@/components/ProductGrid";
import Cart, { CartItem } from "@/components/Cart";
import QuantityModal from "@/components/QuantityModal";
import PaymentModal from "@/components/PaymentModal";

interface Produto {
  id: number;
  descricao: string;
  valor: string | number;
  tipo: string;
  promocoes: { id: number; quantidade_minima: number; preco_promocional: string | number }[];
}

interface Comanda {
  id: number;
  numero: number;
}

export default function CaixaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [loadingVenda, setLoadingVenda] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  const total = carrinho.reduce((sum, item) => sum + item.valor_total, 0);

  const fetchProdutos = useCallback(async () => {
    try {
      const res = await fetch("/api/produtos");
      if (res.ok) setProdutos(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchComandas = useCallback(async () => {
    try {
      const res = await fetch("/api/comandas");
      if (res.ok) setComandas(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProdutos();
    fetchComandas();
  }, [fetchProdutos, fetchComandas]);

  useEffect(() => {
    const saved = localStorage.getItem("pdv_carrinho");
    if (saved) {
      try {
        setCarrinho(JSON.parse(saved));
      } catch { /* silent */ }
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("pdv_carrinho", JSON.stringify(carrinho));
    }
  }, [carrinho, isCartLoaded]);

  const handleSelectProduct = (produto: Produto) => {
    setSelectedProduto(produto);
  };

  const handleQuantityConfirm = async (quantidade: number) => {
    if (!selectedProduto) return;
    setLoadingCalc(true);
    try {
      const res = await fetch("/api/calcular-preco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produto_id: selectedProduto.id, quantidade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const key = `${selectedProduto.id}-${Date.now()}`;
      setCarrinho((prev) => [
        ...prev,
        {
          key,
          produto_id: data.produto_id,
          produto_descricao: data.produto_descricao,
          tipo: data.tipo,
          quantidade: data.quantidade,
          valor_unitario: data.valor_unitario,
          valor_total: data.valor_total,
          teve_promocao: data.teve_promocao,
        },
      ]);

      if (data.teve_promocao) {
        toast.success(`Promoção aplicada! R$ ${data.valor_unitario.toFixed(2).replace(".", ",")} por unidade`, {
          icon: "🏷️",
        });
      }

      setSelectedProduto(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao calcular preço");
    } finally {
      setLoadingCalc(false);
    }
  };

  const handleRemoveItem = (key: string) => {
    setCarrinho((prev) => prev.filter((item) => item.key !== key));
  };

  const handleClearCart = () => {
    setCarrinho([]);
  };

  const handleFinalizarVenda = async (data: {
    metodo_pagamento: string;
    tipo: "Direta" | "Comanda";
    comanda_id?: number | "nova";
  }) => {
    setLoadingVenda(true);
    try {
      let targetComandaId = data.comanda_id;
      
      if (data.tipo === "Comanda" && data.comanda_id === "nova") {
        const createRes = await fetch("/api/comandas", { method: "POST" });
        if (!createRes.ok) throw new Error("Erro ao criar nova comanda");
        const novaComanda = await createRes.json();
        targetComandaId = novaComanda.id;
        toast.success(`Comanda #${novaComanda.numero} criada!`, { icon: "📝" });
      }

      if (data.tipo === "Comanda" && targetComandaId && targetComandaId !== "nova") {
        // Add items to the selected comanda
        for (const item of carrinho) {
          const res = await fetch(`/api/comandas/${targetComandaId}/itens`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error);
          }
        }
        toast.success("Itens adicionados à comanda!");
      } else {
        // Direct sale
        const res = await fetch("/api/vendas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itens: carrinho,
            metodo_pagamento: data.metodo_pagamento,
            tipo: "Direta",
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        toast.success(`Venda finalizada! R$ ${total.toFixed(2).replace(".", ",")} via ${data.metodo_pagamento}`, {
          icon: "✅",
        });
      }

      setCarrinho([]);
      setShowPayment(false);
      fetchComandas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao finalizar venda");
    } finally {
      setLoadingVenda(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Page header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="section-title">Caixa</h1>
          <p className="text-xs text-gray-400 mt-0.5">Nova venda</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-brand-red font-extrabold text-2xl leading-none">Doce</span>
            <span className="text-brand-blue font-extrabold text-2xl leading-none">Sabor</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products section */}
        <div className="flex-1 overflow-y-auto p-6">
          <ProductGrid
            produtos={produtos}
            onSelectProduct={handleSelectProduct}
          />
        </div>

        {/* Cart sidebar */}
        <aside className="w-80 xl:w-96 border-l border-gray-100 bg-white flex flex-col shrink-0">
          {/* Cart header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiShoppingBag className="text-brand-dark" size={18} />
              <span className="font-bold text-brand-dark">Carrinho</span>
              {carrinho.length > 0 && (
                <span className="w-5 h-5 bg-brand-red rounded-full text-white text-[11px] font-bold flex items-center justify-center">
                  {carrinho.length}
                </span>
              )}
            </div>
            {carrinho.length > 0 && (
              <button
                onClick={handleClearCart}
                id="clear-cart-btn"
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs"
              >
                <FiTrash2 size={12} /> Limpar
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-5">
            <Cart
              itens={carrinho}
              onRemove={handleRemoveItem}
              total={total}
            />
          </div>

          {/* Cart footer — Finalizar */}
          {carrinho.length > 0 && (
            <div className="p-5 border-t border-gray-100">
              <button
                id="finalizar-venda-btn"
                onClick={() => setShowPayment(true)}
                className="btn-primary w-full text-base py-4"
              >
                Finalizar Venda • R$ {total.toFixed(2).replace(".", ",")}
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      {selectedProduto && (
        <QuantityModal
          produto={selectedProduto}
          onConfirm={handleQuantityConfirm}
          onClose={() => setSelectedProduto(null)}
          loading={loadingCalc}
        />
      )}

      {showPayment && (
        <PaymentModal
          total={total}
          itens={carrinho}
          comandas={comandas}
          onConfirm={handleFinalizarVenda}
          onClose={() => setShowPayment(false)}
          loading={loadingVenda}
        />
      )}
    </div>
  );
}
