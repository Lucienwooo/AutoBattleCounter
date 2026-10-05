@echo off
setlocal
cd /d "%~dp0"

echo.
echo This will save the GitHub token and app password as Cloudflare secrets.
echo Secret values are not written to this file.
echo.

call npx --yes wrangler secret put GITHUB_TOKEN
if errorlevel 1 goto failed

call npx --yes wrangler secret put ACCESS_PASSWORD
if errorlevel 1 goto failed

call npx --yes wrangler deploy
if errorlevel 1 goto failed

echo.
echo Deployment complete. Copy the workers.dev URL shown above.
goto done

:failed
echo.
echo Setup stopped. Read the Wrangler error above and try again.

:done
echo.
pause