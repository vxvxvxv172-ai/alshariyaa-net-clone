import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(req: NextRequest) {
  try {
    // If no customer token cookie exists, user is definitely not authenticated
    // Return early to eliminate unnecessary backend requests & active CPU
    if (!req.cookies.has("customer_token")) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const cookie = req.headers.get("cookie") || "";

    const backendRes = await fetch(`${BACKEND}/api/customers/auth/me`, {
      headers: {
        cookie,
        "x-internal-secret": process.env.INTERNAL_SECRET || "",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (backendRes.status === 401) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    if (!backendRes.ok) return NextResponse.json({ error: "تعذر التحقق من الجلسة، حاول مرة أخرى" }, { status: 503 });

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "تعذر الاتصال للتحقق من الجلسة" }, { status: 503 });
  }
}
