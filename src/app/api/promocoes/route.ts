import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const promocoes = await prisma.promocao.findMany({
      include: { produto: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(promocoes);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_id, quantidade_minima, preco_promocional } = body;

    if (!produto_id || !quantidade_minima || preco_promocional === undefined) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const promocao = await prisma.promocao.create({
      data: { produto_id, quantidade_minima, preco_promocional },
      include: { produto: true },
    });
    return NextResponse.json(promocao, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar promoção" }, { status: 500 });
  }
}
