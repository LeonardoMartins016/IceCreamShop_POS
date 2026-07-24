import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      produto_id,
      produto_descricao,
      quantidade,
      valor_unitario,
      valor_total,
      teve_promocao,
    } = body;

    // Verify comanda exists and is open
    const comanda = await prisma.comanda.findUnique({ where: { id: Number(id) } });
    if (!comanda) {
      return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    }
    if (comanda.status !== "aberta") {
      return NextResponse.json({ error: "Comanda já está fechada" }, { status: 400 });
    }

    const item = await prisma.comandaItem.create({
      data: {
        comanda_id: Number(id),
        produto_id,
        produto_descricao,
        quantidade,
        valor_unitario,
        valor_total,
        teve_promocao: teve_promocao ?? false,
      },
      include: { produto: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao adicionar item à comanda" }, { status: 500 });
  }
}
