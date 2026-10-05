# 狩獵時間

響應式角色狩獵時間與七日班表。網站網址是公開的；角色資料由 Supabase Auth 與 Row Level Security 保護，只能由登入帳號讀寫。

## GitHub Desktop 初次上傳

本機專案已初始化為 `main` branch，並連結到 `https://github.com/Lucienwooo/AutoBattleCounter.git`，尚未建立 commit。

1. 在 GitHub Desktop 選擇 File > Add Local Repository，指定這個 `AutoBattleCounter` 資料夾。
2. 確認變更清單包含專案檔案，輸入摘要並 Commit to main。
3. 按 Push origin 上傳。之後每次 commit 並 Push 到 `main`，GitHub Actions 都會自動部署網站。
4. 第一次上傳後，到 repository 的 Settings > Pages，將 Build and deployment source 設為 GitHub Actions。

## Supabase 設定

1. 建立 Supabase project。
2. 在 SQL Editor 執行 `supabase-schema.sql`。
3. 到 Authentication > Users 手動建立自己的 email/password 使用者，並關閉公開註冊。
4. 到 Project Settings > API 複製 Project URL 與 publishable/anon key，填入 `supabase-config.js` 的 `url` 與 `anonKey`。
5. 不要把 `service_role` key 放進網站檔案。

`supabase-config.js` 的 URL 與 anon key 會隨公開網站提供給瀏覽器，安全性依賴資料表的 RLS policy；不可移除 `supabase-schema.sql` 中的使用者範圍限制。

## GitHub Pages 可見度

- GitHub Free 個人帳號需使用公開 repository 才能啟用 Pages。
- GitHub Pro 可從私人 repository 發布 Pages，但網站網址仍是公開的。
- Pages 網站本身要限制成私人存取，需要 organization 的 GitHub Enterprise Cloud。
- 網站網址會是 `https://lucienwooo.github.io/AutoBattleCounter/`。

網站登入後，角色、頭像、時間與七日班表會立即儲存在本機，並合併同步到 Supabase；只有登入帳號本人能讀取雲端資料。
