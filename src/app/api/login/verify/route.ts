import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get("auth_token");

  if (authCookie && authCookie.value === "authenticated") {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
