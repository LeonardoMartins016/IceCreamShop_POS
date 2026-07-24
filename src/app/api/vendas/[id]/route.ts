import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const venda = await prisma.venda.findUnique({
      where: { id: Number(id) },
      include: {
        itens: {
          include: { produto: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!venda) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });
    }

    return NextResponse.json(venda);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar venda" }, { status: 500 });
  }
}
