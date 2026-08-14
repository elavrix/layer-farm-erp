"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SSOHandler() {
  const params = useSearchParams();

  useEffect(() => {
    async function go() {
      const at = params.get("access_token");
      const rt = params.get("refresh_token");

      if (!at || !rt) {
        window.location.replace("/login");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: at,
        refresh_token: rt,
      });

      // Hard navigation — forces a full HTTP request so the server middleware
      // picks up the cookies that setSession just wrote to document.cookie
      window.location.replace(error ? "/login" : "/");
    }

    go();
  }, [params]);

  return null;
}

export default function SSOPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "sans-serif", color: "#64748b" }}>
      Signing you in…
      <Suspense>
        <SSOHandler />
      </Suspense>
    </div>
  );
}
