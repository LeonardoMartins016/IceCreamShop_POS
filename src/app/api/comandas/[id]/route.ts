import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comanda = await prisma.comanda.findUnique({
      where: { id: Number(id) },
      include: {
        itens: {
          include: { produto: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!comanda) {
      return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    }

    return NextResponse.json(comanda);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar comanda" }, { status: 500 });
  }
}
