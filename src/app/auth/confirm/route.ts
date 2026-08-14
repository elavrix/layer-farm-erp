import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const at = searchParams.get("at");
  const rt = searchParams.get("rt");

  if (!at || !rt) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) { pendingCookies.push(...cookiesToSet); },
      },
    }
  );

  const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });

  if (error) {
    console.error("[auth/confirm] setSession error:", error.message);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Signing in…</title>
</head>
<body>
  <script>window.location.replace('/');</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  pendingCookies.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any);
  });

  return response;
}
