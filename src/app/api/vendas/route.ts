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
        // Use São Paulo offset (UTC-3) so that date boundaries are interpreted
        // in Brazilian local time — preventing sales made after 21h SP from
        // leaking into the next day's report.
        where.data_hora.gte = new Date(`${dataInicio}T00:00:00.000-03:00`);
      }
      if (dataFim) {
        where.data_hora.lte = new Date(`${dataFim}T23:59:59.999-03:00`);
      }
    }

    if (metodosPagamento.length > 0 && !metodosPagamento.includes("Todos")) {
      where.OR = [
        { metodo_pagamento: { in: metodosPagamento } },
        { pagamentos: { some: { metodo_pagamento: { in: metodosPagamento } } } }
      ];
    }

    if (tipo && tipo !== "Todos") {
      where.tipo = tipo;
    }

    const vendas = await prisma.venda.findMany({
      where,
      include: { itens: true, pagamentos: true },
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
    const { itens, pagamentos, tipo, numero_comanda } = body;

    if (!itens || itens.length === 0) {
      return NextResponse.json({ error: "Venda sem itens" }, { status: 400 });
    }

    if (!pagamentos || pagamentos.length === 0) {
      return NextResponse.json({ error: "Pagamento não informado" }, { status: 400 });
    }

    const total = itens.reduce(
      (acc: number, item: { valor_total: number }) => acc + Number(item.valor_total),
      0
    );

    const totalPago = pagamentos.reduce((acc: number, p: { valor: number }) => acc + Number(p.valor), 0);
    // Usar comparação em centavos para evitar imprecisão de ponto flutuante
    if (Math.round(totalPago * 100) < Math.round(total * 100)) {
      return NextResponse.json({ error: "Valor pago menor que o total" }, { status: 400 });
    }

    const troco = Math.max(0, Number((totalPago - total).toFixed(2)));

    // Criar resumo textual (ex: "R$ 25,00 Dinheiro + R$ 25,00 Cartão de Crédito")
    let metodo_pagamento_resumo = pagamentos
      .map((p: { metodo: string; valor: number }) => `R$ ${Number(p.valor).toFixed(2).replace(".", ",")} ${p.metodo}`)
      .join(" + ");

    if (troco > 0) {
      metodo_pagamento_resumo += ` (Troco: R$ ${troco.toFixed(2).replace(".", ",")})`;
    }

    // Buscar produtos existentes para garantir que produto_id é válido e evitar violação de FK
    const existingProducts = await prisma.produto.findMany({ select: { id: true, descricao: true } });
    const productMapById = new Map(existingProducts.map((p) => [p.id, p]));
    const productMapByName = new Map(existingProducts.map((p) => [p.descricao.toLowerCase().trim(), p.id]));
    const fallbackId = existingProducts[0]?.id;

    const sanitizedItens = itens.map((item: {
      produto_id: number;
      produto_descricao: string;
      quantidade: number;
      valor_unitario: number;
      valor_total: number;
      teve_promocao: boolean;
    }) => {
      let pId = Number(item.produto_id);
      if (!productMapById.has(pId)) {
        const matched = productMapByName.get((item.produto_descricao || "").toLowerCase().trim());
        pId = matched || fallbackId || 1;
      }
      return {
        produto_id: pId,
        produto_descricao: item.produto_descricao,
        quantidade: Number(item.quantidade),
        valor_unitario: Number(item.valor_unitario),
        valor_total: Number(item.valor_total),
        teve_promocao: item.teve_promocao ?? false,
      };
    });

    const venda = await prisma.venda.create({
      data: {
        total,
        metodo_pagamento: metodo_pagamento_resumo,
        tipo: tipo ?? "Venda Rápida",
        numero_comanda: numero_comanda ?? null,
        itens: {
          create: sanitizedItens,
        },
        pagamentos: {
          create: pagamentos.map((p: { metodo: string; valor: number }) => ({
            metodo_pagamento: p.metodo,
            valor: Number(p.valor),
          })),
        },
      },
      include: { itens: true, pagamentos: true },
    });

    return NextResponse.json(venda, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao registrar venda:", error);
    return NextResponse.json({ error: error?.message || "Erro ao registrar venda" }, { status: 500 });
  }
}


