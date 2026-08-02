import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const metodosPagamento = searchParams.getAll("metodoPagamento");
    const tipo = searchParams.get("tipo");

    // Build dynamic where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (dataInicio || dataFim) {
      where.data_hora = {};
      if (dataInicio) {
        where.data_hora.gte = new Date(`${dataInicio}T00:00:00`);
      }
      if (dataFim) {
        where.data_hora.lte = new Date(`${dataFim}T23:59:59`);
      }
    }

    if (metodosPagamento.length > 0 && !metodosPagamento.includes("Todos")) {
      where.metodo_pagamento = { in: metodosPagamento };
    }

    if (tipo && tipo !== "Todos") {
      where.tipo = tipo;
    }

    const vendas = await prisma.venda.findMany({
      where,
      include: { itens: true },
      orderBy: { data_hora: "desc" },
    });

    return NextResponse.json(vendas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar vendas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itens, metodo_pagamento, tipo, numero_comanda } = body;

    if (!itens || itens.length === 0) {
      return NextResponse.json({ error: "Venda sem itens" }, { status: 400 });
    }

    if (!metodo_pagamento || !["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"].includes(metodo_pagamento)) {
      return NextResponse.json({ error: "Método de pagamento inválido" }, { status: 400 });
    }

    const total = itens.reduce(
      (acc: number, item: { valor_total: number }) => acc + Number(item.valor_total),
      0
    );

    const venda = await prisma.venda.create({
      data: {
        total,
        metodo_pagamento,
        tipo: tipo ?? "Venda Rápida",
        numero_comanda: numero_comanda ?? null,
        itens: {
          create: itens.map((item: {
            produto_id: number;
            produto_descricao: string;
            quantidade: number;
            valor_unitario: number;
            valor_total: number;
            teve_promocao: boolean;
          }) => ({
            produto_id: item.produto_id,
            produto_descricao: item.produto_descricao,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            teve_promocao: item.teve_promocao ?? false,
          })),
        },
      },
      include: { itens: true },
    });

    return NextResponse.json(venda, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao registrar venda" }, { status: 500 });
  }
}
