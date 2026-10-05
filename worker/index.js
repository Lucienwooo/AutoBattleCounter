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

function githubUrl(env) {
  const path = env.DATA_PATH.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`);
  url.searchParams.set("ref", env.GITHUB_BRANCH);
  return url;
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "AutoBattleCounter-Sync"
  };
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return btoa(binary);
}

async function readGitHubState(env) {
  const response = await fetch(githubUrl(env), { headers: githubHeaders(env) });
  if (response.status === 404) return { missing: true };
  if (!response.ok) throw new Error(`GitHub 讀取失敗 (${response.status})`);
  const file = await response.json();
  const binary = atob((file.content || "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return { state: JSON.parse(new TextDecoder().decode(bytes)), sha: file.sha };
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
    if (!env.GITHUB_TOKEN || !env.ACCESS_PASSWORD) {
      return jsonResponse({ error: "Worker secrets 尚未設定。" }, 503, headers);
    }

    try {
      if (request.method === "GET") {
        const result = await readGitHubState(env);
        if (result.missing) return jsonResponse({ error: "雲端資料尚未初始化。", code: "DATA_NOT_FOUND" }, 404, headers);
        return jsonResponse(result.state, 200, headers);
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

      const current = await readGitHubState(env);
      if (body.initialize === true && current.sha) {
        return jsonResponse({ error: "雲端資料已由其他裝置初始化，請重新登入載入最新資料。" }, 409, headers);
      }
      const payload = {
        message: `Update AutoBattleCounter data ${new Date().toISOString()}`,
        branch: env.GITHUB_BRANCH,
        content: encodeBase64Utf8(content),
        ...(current.sha ? { sha: current.sha } : {})
      };
      const response = await fetch(githubUrl(env), {
        method: "PUT",
        headers: { ...githubHeaders(env), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return jsonResponse({ error: `GitHub 儲存失敗 (${response.status})。` }, response.status, headers);
      return jsonResponse({ saved: true }, 200, headers);
    } catch (error) {
      return jsonResponse({ error: error.message || "同步失敗。" }, 502, headers);
    }
  }
};
