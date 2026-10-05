# 狩獵時間

響應式角色狩獵時間與七日班表。GitHub Pages 提供靜態網頁；Cloudflare Worker 驗證密碼，並將角色資料存放在私有 Cloudflare KV。GitHub repository 即使公開，也不會包含使用者資料。

## GitHub Desktop 初次上傳

專案已連結到 `https://github.com/Lucienwooo/AutoBattleCounter.git`。後續提交並推送到 `main` 會自動部署網站。

1. 在 GitHub Desktop 選擇 File > Add Local Repository，指定這個 `AutoBattleCounter` 資料夾。
2. 確認變更清單包含專案檔案，輸入摘要並 Commit to main。
3. 按 Push origin 上傳。之後每次 commit 並 Push 到 `main`，GitHub Actions 都會自動部署網站。
4. 第一次上傳後，到 repository 的 Settings > Pages，將 Build and deployment source 設為 GitHub Actions。

## 跨裝置雲端同步

本專案不需要 GitHub PAT。曾建立的 `AutoBattleCounter-Worker` PAT 已不再使用，請到 GitHub Settings > Developer settings > Personal access tokens 將它刪除；先前暴露的舊 token 也必須撤銷。

第一次設定 Cloudflare Worker 時，在 `worker` 資料夾建立 KV namespace，並將命令回報的 ID 填入 `wrangler.toml`：

```powershell
cd AutoBattleCounter/worker
npx wrangler login
npx wrangler kv namespace create AUTO_BATTLE_DATA
npx wrangler secret put ACCESS_PASSWORD
npx wrangler deploy
```

Windows 可直接雙擊 `worker/setup-worker.bat`；它只會要求輸入雲端密碼並部署 Worker。KV namespace 需先建立一次。

`ACCESS_PASSWORD` 設定未公開過的長密碼，只存放於 Cloudflare Worker secrets；舊密碼曾出現在前端與 Git 歷史中，請勿繼續使用。部署完成後，把 Wrangler 顯示的 `workers.dev` 網址填入 `supabase-config.js` 的 `endpoint`，確認 `enabled: true`，再推送到 GitHub 觸發 Pages 部署。

Worker 對失敗登入嘗試加上每分鐘 20 次的 Cloudflare rate limit。

初次搬移資料時，先部署仍為空白 `endpoint` 的版本。從原本有資料的瀏覽器登入並按「下載備份」；如果該瀏覽器是 `file://` 本機預覽，備份檔是必要的。設定 Worker endpoint 並重新部署後，在登入畫面選「匯入舊裝置備份」，輸入密碼並確認初始化。之後新裝置登入會載入雲端最新資料。

GitHub Pages 網址仍是公開的；前端密碼畫面只提供操作入口，資料存取權限由 Worker 驗證。不要在前端設定檔放入任何秘密。

## GitHub Pages 可見度

- GitHub Free 個人帳號需使用公開 repository 才能啟用 Pages。
- GitHub Pro 可從私人 repository 發布 Pages，但網站網址仍是公開的。
- Pages 網站本身要限制成私人存取，需要 organization 的 GitHub Enterprise Cloud。
- 網站網址會是 `https://lucienwooo.github.io/AutoBattleCounter/`。

Worker 尚未部署或 `endpoint` 留白時，網站只使用目前瀏覽器的本機資料，不會跨裝置同步，也不會以密碼保護資料。
