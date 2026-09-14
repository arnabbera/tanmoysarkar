@echo off
echo ========================================================
echo   Publishing Tanmoy Sarkar Portfolio to GitHub Pages
echo ========================================================
echo.
git add -A
git commit -m "update: sync content from local site"
git push origin main
echo.
echo ========================================================
echo   Done! Your website will update on mobile within ~1 min.
echo ========================================================
pause
