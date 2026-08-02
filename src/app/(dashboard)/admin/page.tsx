"use client";

import { useEffect, useState, useCallback } from "react";
import { FiLock, FiEye, FiEyeOff, FiLogOut, FiPackage, FiTag, FiBarChart2, FiEdit2, FiTrash2, FiPlus, FiX, FiCheck } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";
import { toast } from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Produto {
  id: number;
  descricao: string;
  valor: string | number;
  tipo: string;
  promocoes: Promocao[];
}

interface Promocao {
  id: number;
  produto_id: number;
  quantidade_minima: number;
  preco_promocional: string | number;
  produto?: Produto;
}

interface Resumo {
  total: number;
  quantidade: number;
  porPagamento: { metodo_pagamento: string; _sum: { total: string | number | null }; _count: number }[];
  porTipo: { tipo: string; _sum: { total: string | number | null }; _count: number }[];
  ultimas: { id: number; data_hora: string; total: string | number; metodo_pagamento: string; tipo: string }[];
}

type Tab = "produtos" | "promocoes" | "resumo";

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [senha, setSenha] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (res.ok) {
        onLogin();
      } else {
        setError("Senha incorreta");
      }
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-red/5 via-brand-bg to-brand-blue/5">
      <div className="w-full max-w-sm">
        <div className="card p-8 shadow-card-hover">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-brand-orange rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <GiIceCreamCone className="text-white" size={32} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-brand-red font-extrabold text-2xl">Doce</span>
              <span className="text-brand-blue font-extrabold text-2xl">Sabor</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">Painel Administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="admin-senha">Senha</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="admin-senha"
                  type={showPwd ? "text" : "password"}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError(""); }}
                  className={`input pl-10 pr-10 ${error ? "ring-2 ring-red-400 border-red-300" : ""}`}
                  placeholder="Digite a senha..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle senha"
                >
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1" id="admin-error-msg">
                  <FiX size={14} /> {error}
                </p>
              )}
            </div>
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading || !senha}
              className="btn-primary w-full py-3.5"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Produto Form ─────────────────────────────────────────────────────────────
function ProdutoForm({
  produto,
  onSave,
  onCancel,
}: {
  produto?: Produto | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [valor, setValor] = useState(produto ? String(Number(produto.valor).toFixed(2)) : "");
  const [tipo, setTipo] = useState(produto?.tipo ?? "UN");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = produto ? `/api/produtos/${produto.id}` : "/api/produtos";
      const method = produto ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao, valor: parseFloat(valor), tipo }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success(produto ? "Produto atualizado!" : "Produto criado!");
      onSave();
    } catch {
      toast.error("Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="produto-descricao">Descrição</label>
        <input
          id="produto-descricao"
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="input"
          placeholder="Ex: Sorvete Chocolate 2 bolas"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="produto-valor">Valor (R$)</label>
          <input
            id="produto-valor"
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="input"
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="produto-tipo">Tipo</label>
          <select
            id="produto-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="select"
          >
            <option value="UN">Unidade (UN)</option>
            <option value="KG">Peso (KG)</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
        <button id="produto-save-btn" type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Salvando..." : produto ? "Atualizar" : "Criar Produto"}
        </button>
      </div>
    </form>
  );
}

// ─── Promocao Form ────────────────────────────────────────────────────────────
function PromocaoForm({
  promocao,
  produtos,
  onSave,
  onCancel,
}: {
  promocao?: Promocao | null;
  produtos: Produto[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [produtoId, setProdutoId] = useState(promocao?.produto_id ?? (produtos[0]?.id ?? ""));
  const [qtdMinima, setQtdMinima] = useState(promocao?.quantidade_minima ?? 2);
  const [precoPromo, setPrecoPromo] = useState(
    promocao ? String(Number(promocao.preco_promocional).toFixed(2)) : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = promocao ? `/api/promocoes/${promocao.id}` : "/api/promocoes";
      const method = promocao ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: Number(produtoId),
          quantidade_minima: Number(qtdMinima),
          preco_promocional: parseFloat(precoPromo),
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success(promocao ? "Promoção atualizada!" : "Promoção criada!");
      onSave();
    } catch {
      toast.error("Erro ao salvar promoção");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="promo-produto">Produto</label>
        <select
          id="promo-produto"
          value={produtoId}
          onChange={(e) => setProdutoId(Number(e.target.value))}
          className="select"
          required
        >
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>{p.descricao}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="promo-qtd">Qtd. Mínima</label>
          <input
            id="promo-qtd"
            type="number"
            min="1"
            step="1"
            value={qtdMinima}
            onChange={(e) => setQtdMinima(Number(e.target.value))}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="promo-preco">Preço Promo (R$)</label>
          <input
            id="promo-preco"
            type="number"
            step="0.01"
            min="0"
            value={precoPromo}
            onChange={(e) => setPrecoPromo(e.target.value)}
            className="input"
            placeholder="0,00"
            required
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
        <button id="promo-save-btn" type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Salvando..." : promocao ? "Atualizar" : "Criar Promoção"}
        </button>
      </div>
    </form>
  );
}

// ─── Resumo Tab ───────────────────────────────────────────────────────────────
function ResumoTab() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendas/resumo")
      .then((r) => r.json())
      .then(setResumo)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!resumo) return <p className="text-gray-500 text-center py-10">Erro ao carregar resumo</p>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-brand-red">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total de Vendas</p>
          <p className="text-3xl font-extrabold text-brand-red mt-1">
            R$ {resumo.total.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-sm text-gray-400 mt-1">{resumo.quantidade} vendas realizadas</p>
        </div>
        {resumo.porPagamento.map((p) => (
          <div key={p.metodo_pagamento} className="card p-5 border-l-4 border-brand-blue">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{p.metodo_pagamento}</p>
            <p className="text-2xl font-extrabold text-brand-blue mt-1">
              R$ {Number(p._sum.total ?? 0).toFixed(2).replace(".", ",")}
            </p>
            <p className="text-sm text-gray-400 mt-1">{p._count} vendas</p>
          </div>
        ))}
      </div>

      {/* Por tipo */}
      <div className="card">
        <h3 className="font-bold text-brand-dark mb-4">Vendas por Tipo</h3>
        <div className="grid grid-cols-2 gap-4">
          {resumo.porTipo.map((t) => (
            <div key={t.tipo} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{t.tipo}</p>
              <p className="text-xl font-extrabold text-brand-dark mt-1">
                R$ {Number(t._sum.total ?? 0).toFixed(2).replace(".", ",")}
              </p>
              <p className="text-sm text-gray-400">{t._count} vendas</p>
            </div>
          ))}
        </div>
      </div>

      {/* Last 7 */}
      <div className="card">
        <h3 className="font-bold text-brand-dark mb-4">Últimas Vendas</h3>
        {resumo.ultimas.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda ainda</p>
        ) : (
          <div className="space-y-2">
            {resumo.ultimas.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-brand-dark">
                    {new Date(v.data_hora).toLocaleString("pt-BR")}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`badge-${v.metodo_pagamento === "PIX" ? "blue" : "orange"}`}>{v.metodo_pagamento}</span>
                    <span className="badge-red text-[10px]">{v.tipo}</span>
                  </div>
                </div>
                <span className="font-bold text-brand-red">R$ {Number(v.total).toFixed(2).replace(".", ",")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("produtos");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [editingProduto, setEditingProduto] = useState<Produto | null | "new">(null);
  const [editingPromocao, setEditingPromocao] = useState<Promocao | null | "new">(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "produto" | "promocao"; id: number } | null>(null);

  const fetchProdutos = useCallback(async () => {
    const res = await fetch("/api/produtos");
    if (res.ok) setProdutos(await res.json());
  }, []);

  const fetchPromocoes = useCallback(async () => {
    const res = await fetch("/api/promocoes");
    if (res.ok) setPromocoes(await res.json());
  }, []);

  // Check auth on load
  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchProdutos();
      fetchPromocoes();
    }
  }, [authenticated, fetchProdutos, fetchPromocoes]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  };

  const handleDeleteProduto = async (id: number) => {
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Produto excluído!");
      setDeleteConfirm(null);
      fetchProdutos();
      fetchPromocoes();
    } catch {
      toast.error("Erro ao excluir produto");
    }
  };

  const handleDeletePromocao = async (id: number) => {
    try {
      const res = await fetch(`/api/promocoes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Promoção excluída!");
      setDeleteConfirm(null);
      fetchPromocoes();
    } catch {
      toast.error("Erro ao excluir promoção");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: "produtos", label: "Produtos", icon: FiPackage },
    { key: "promocoes", label: "Promoções", icon: FiTag },
    { key: "resumo", label: "Total de Vendas", icon: FiBarChart2 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="section-title">Painel Admin</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gerenciamento do sistema</p>
        </div>
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="btn-ghost flex items-center gap-2 py-2.5 text-sm"
        >
          <FiLogOut size={16} /> Sair
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`tab-${key}`}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-brand-red text-brand-red"
                  : "border-transparent text-gray-500 hover:text-brand-dark"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* ── Produtos Tab ── */}
        {activeTab === "produtos" && (
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-dark">
                Produtos ({produtos.length})
              </h2>
              <button
                id="novo-produto-btn"
                onClick={() => setEditingProduto("new")}
                className="btn-primary flex items-center gap-2 py-2.5 text-sm"
              >
                <FiPlus size={16} /> Novo Produto
              </button>
            </div>

            {/* Form card */}
            {editingProduto !== null && (
              <div className="card p-5 border border-brand-red/20">
                <h3 className="font-semibold text-brand-dark mb-4">
                  {editingProduto === "new" ? "Novo Produto" : `Editar: ${editingProduto.descricao}`}
                </h3>
                <ProdutoForm
                  produto={editingProduto === "new" ? null : editingProduto}
                  onSave={() => { setEditingProduto(null); fetchProdutos(); }}
                  onCancel={() => setEditingProduto(null)}
                />
              </div>
            )}

            {/* List */}
            {produtos.length === 0 ? (
              <div className="card p-10 text-center">
                <GiIceCreamCone className="text-gray-200 mx-auto mb-3" size={48} />
                <p className="text-gray-400 font-medium">Nenhum produto cadastrado</p>
                <p className="text-gray-300 text-sm mt-1">Clique em "Novo Produto" para começar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {produtos.map((produto) => (
                  <div
                    key={produto.id}
                    className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow"
                  >
                    <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                      <GiIceCreamCone className="text-brand-red" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-brand-dark">{produto.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-brand-red font-bold">
                          R$ {Number(produto.valor).toFixed(2).replace(".", ",")}
                        </span>
                        <span className={`badge-${produto.tipo === "KG" ? "blue" : "orange"}`}>
                          {produto.tipo}
                        </span>
                        {produto.promocoes?.length > 0 && (
                          <span className="tag-promo">{produto.promocoes.length} promo</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id={`edit-produto-${produto.id}`}
                        onClick={() => setEditingProduto(produto)}
                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Editar"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        id={`delete-produto-${produto.id}`}
                        onClick={() => setDeleteConfirm({ type: "produto", id: produto.id })}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Excluir"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Promoções Tab ── */}
        {activeTab === "promocoes" && (
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-dark">
                Promoções ({promocoes.length})
              </h2>
              {produtos.length > 0 && (
                <button
                  id="nova-promocao-btn"
                  onClick={() => setEditingPromocao("new")}
                  className="btn-primary flex items-center gap-2 py-2.5 text-sm"
                >
                  <FiPlus size={16} /> Nova Promoção
                </button>
              )}
            </div>

            {produtos.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-gray-500 font-medium">Cadastre produtos primeiro para criar promoção</p>
                <button
                  onClick={() => setActiveTab("produtos")}
                  className="btn-primary mt-4 text-sm py-2.5 px-5"
                >
                  Ir para Produtos
                </button>
              </div>
            ) : (
              <>
                {/* Form card */}
                {editingPromocao !== null && (
                  <div className="card p-5 border border-brand-red/20">
                    <h3 className="font-semibold text-brand-dark mb-4">
                      {editingPromocao === "new" ? "Nova Promoção" : "Editar Promoção"}
                    </h3>
                    <PromocaoForm
                      promocao={editingPromocao === "new" ? null : editingPromocao}
                      produtos={produtos}
                      onSave={() => { setEditingPromocao(null); fetchPromocoes(); fetchProdutos(); }}
                      onCancel={() => setEditingPromocao(null)}
                    />
                  </div>
                )}

                {/* List */}
                {promocoes.length === 0 ? (
                  <div className="card p-10 text-center">
                    <FiTag className="text-gray-200 mx-auto mb-3" size={48} />
                    <p className="text-gray-400 font-medium">Nenhuma promoção cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {promocoes.map((promo) => (
                      <div
                        key={promo.id}
                        className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow"
                      >
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                          <FiTag className="text-green-600" size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-brand-dark">
                            {promo.produto?.descricao ?? "Produto"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                            <span>A partir de <strong>{promo.quantidade_minima}</strong></span>
                            <span>→</span>
                            <span className="text-green-600 font-bold">
                              R$ {Number(promo.preco_promocional).toFixed(2).replace(".", ",")} / un
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            id={`edit-promo-${promo.id}`}
                            onClick={() => setEditingPromocao(promo)}
                            className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            id={`delete-promo-${promo.id}`}
                            onClick={() => setDeleteConfirm({ type: "promocao", id: promo.id })}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Resumo Tab ── */}
        {activeTab === "resumo" && (
          <div className="max-w-3xl">
            <ResumoTab />
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiTrash2 className="text-red-500" size={28} />
            </div>
            <h3 className="font-bold text-brand-dark text-lg mb-2">Confirmar exclusão</h3>
            <p className="text-gray-500 text-sm mb-6">
              Esta ação não pode ser desfeita.
              {deleteConfirm.type === "produto" && " Promoções vinculadas também serão excluídas."}
            </p>
            <div className="flex gap-3">
              <button
                id="cancel-delete-btn"
                onClick={() => setDeleteConfirm(null)}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                id="confirm-delete-btn"
                onClick={() => {
                  if (deleteConfirm.type === "produto") handleDeleteProduto(deleteConfirm.id);
                  else handleDeletePromocao(deleteConfirm.id);
                }}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                <FiCheck size={16} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
