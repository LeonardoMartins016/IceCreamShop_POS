import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalGeral, porPagamento, porTipo, vendas] = await Promise.all([
      // Total geral de vendas
      prisma.venda.aggregate({ _sum: { total: true }, _count: true }),

      // Agrupado por método de pagamento
      prisma.venda.groupBy({
        by: ["metodo_pagamento"],
        _sum: { total: true },
        _count: true,
      }),

      // Agrupado por tipo
      prisma.venda.groupBy({
        by: ["tipo"],
        _sum: { total: true },
        _count: true,
      }),

      // Últimas 7 vendas
      prisma.venda.findMany({
        orderBy: { data_hora: "desc" },
        take: 7,
        select: { id: true, data_hora: true, total: true, metodo_pagamento: true, tipo: true },
      }),
    ]);

    return NextResponse.json({
      total: Number(totalGeral._sum.total ?? 0),
      quantidade: totalGeral._count,
      porPagamento,
      porTipo,
      ultimas: vendas,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar resumo" }, { status: 500 });
  }
}
