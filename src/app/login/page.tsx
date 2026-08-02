"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });

      if (res.ok) {
        toast.success("Login realizado com sucesso!");
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao fazer login");
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-red rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-red-200">
            <span className="text-3xl">🍦</span>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-dark">DoceSabor</h1>
          <p className="text-gray-400 text-sm mt-1">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-brand-dark focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-brand-red transition-all duration-200"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-brand-dark focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-brand-red transition-all duration-200"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-xl font-bold text-white text-sm bg-brand-red hover:bg-red-600 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-red-500/25 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
