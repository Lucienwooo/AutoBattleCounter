window.AUTO_BATTLE_SUPABASE = {
  // 若你不需要 Supabase，可保留空白；目前密碼保護模式不依賴它。
  url: "",
  anonKey: ""
};

window.AUTO_BATTLE_GITHUB_SYNC = {
  enabled: false,
  owner: "Lucienwooo",
  repo: "AutoBattleCounter",
  branch: "main",
  path: "data/auto-battle.json",
  // GitHub PAT：在 GitHub → Settings → Developer settings → Personal access tokens
  // 建立一個可寫入此 repo 的 token，並勾選 repo / contents 權限。
  token: "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"
};