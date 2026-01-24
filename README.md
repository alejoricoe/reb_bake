# reb_bake

# Home Bakery (GitHub Pages)

## Run locally
Just open `index.html` in your browser.

> If your browser blocks fetch() for local files,
use a tiny local server:
- VS Code: install “Live Server” extension and click “Go Live”
- or Python:
  python -m http.server 8000
  then open http://localhost:8000

## Deploy to GitHub Pages
1. Create a GitHub repo (public is easiest).
2. Upload these files to the repo root.
3. Go to: Settings → Pages
4. "Build and deployment" → Source: Deploy from a branch
5. Branch: main, folder: /(root)
6. Save.

Your site will be live at:
https://YOUR-USERNAME.github.io/YOUR-REPO/

## Edit products
Modify `products.json`:
- name
- price
- image
- description
