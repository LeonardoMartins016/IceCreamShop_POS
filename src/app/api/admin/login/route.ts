import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senha } = body;

    const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin";

    if (senha !== adminPassword) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
