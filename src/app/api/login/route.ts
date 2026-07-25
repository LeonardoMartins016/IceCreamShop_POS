import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario, senha } = body;

    if (usuario === "Sorveteria" && senha === "Docesabor123") {
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: "auth_token",
        value: "authenticated",
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.json({ error: "Usuário ou senha inválidos" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
