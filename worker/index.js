const jsonResponse = (body, status, headers) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" }
});

function corsHeaders(origin, env) {
  if (!origin || origin !== env.ALLOWED_ORIGIN) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const headers = corsHeaders(origin, env);
    if (!headers) return jsonResponse({ error: "Origin 不允許。" }, 403, {});
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (url.pathname !== "/api/state" || !["GET", "PUT"].includes(request.method)) {
      return jsonResponse({ error: "找不到 API。" }, 404, headers);
    }
    if (request.headers.get("Authorization") !== `Bearer ${env.ACCESS_PASSWORD}`) {
      const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.LOGIN_RATE_LIMITER.limit({ key: clientIp });
      if (!success) return jsonResponse({ error: "嘗試次數過多，請稍後再試。" }, 429, headers);
      return jsonResponse({ error: "密碼錯誤。" }, 401, headers);
    }
    if (!env.ACCESS_PASSWORD || !env.AUTO_BATTLE_DATA) {
      return jsonResponse({ error: "Worker 設定尚未完成。" }, 503, headers);
    }

    try {
      if (request.method === "GET") {
        const content = await env.AUTO_BATTLE_DATA.get("state");
        if (content === null) return jsonResponse({ error: "雲端資料尚未初始化。", code: "DATA_NOT_FOUND" }, 404, headers);
        return jsonResponse(JSON.parse(content), 200, headers);
      }

      const body = await request.json();
      const state = body.state || body;
      if (!state || !Array.isArray(state.characters)) {
        return jsonResponse({ error: "資料格式不正確。" }, 400, headers);
      }
      const content = JSON.stringify(state, null, 2);
      if (new TextEncoder().encode(content).byteLength > 900_000) {
        return jsonResponse({ error: "資料太大，請移除部分頭像後再儲存。" }, 413, headers);
      }

      const current = await env.AUTO_BATTLE_DATA.get("state");
      if (body.initialize === true && current !== null) {
        return jsonResponse({ error: "雲端資料已由其他裝置初始化，請重新登入載入最新資料。" }, 409, headers);
      }
      await env.AUTO_BATTLE_DATA.put("state", content);
      return jsonResponse({ saved: true }, 200, headers);
    } catch (error) {
      return jsonResponse({ error: error.message || "同步失敗。" }, 502, headers);
    }
  }
};
