# 📖 FlipBook Reader

A beautiful, fully offline PDF flipbook reader built with HTML, CSS, JavaScript, PDF.js and Turn.js.

## Features
- ✅ Upload any PDF — drag-and-drop or click to browse
- ✅ Real book flip animation (Turn.js)
- ✅ Page flip sound effect
- ✅ Zoom in / Zoom out
- ✅ First / Previous / Next / Last page controls
- ✅ Toggle sound on/off
- ✅ Keyboard shortcuts (←/→ Arrow keys, Home, End)
- ✅ Works 100% offline after first load
- ✅ Dark premium UI with glassmorphism

## Folder Structure
```
flipbook-reader/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── script.js
│   ├── turn.min.js
│   ├── pdf.min.js
│   └── pdf.worker.min.js
├── sound/
│   └── flip.wav
├── uploads/       ← place sample PDFs here
└── assets/        ← place any static assets here
```

## Running Locally

### Option 1 – Python (simplest)
```bash
python -m http.server 8000
# Then open: http://localhost:8000
```

### Option 2 – Node.js
```bash
npx serve .
```

### Option 3 – VS Code Live Server
Install the **Live Server** extension and click **"Go Live"**.

## Deployment

| Platform | Steps |
|----------|-------|
| **Netlify** | Drag the folder to app.netlify.com |
| **GitHub Pages** | Push folder to a repo, enable Pages in settings |
| **Apache/IIS** | Copy folder to wwwroot or htdocs |
| **Vercel** | `vercel --prod` in the folder |

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `→` / `↓` | Next page |
| `←` / `↑` | Previous page |
| `Home` | First page |
| `End` | Last page |
## Quick Deployment Options

Since this is a static web application, you can host it for free in seconds.

### 1. Vercel (Recommended)
1. Open your terminal in this folder.
2. Run: `npx vercel`
3. Follow the prompts (usually just press Enter).
4. You will get a permanent public URL instantly.

### 2. Netlify (Drag-and-Drop)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this entire `flipbook-reader` folder into the browser.
### 3. GitHub Pages (Permanent Hosting)
1. **Initialize Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. **Create a Repository**: Create a new repository on [GitHub](https://github.com/new).
3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```
4. **Enable GitHub Pages**:
   - Go to your repository **Settings** on GitHub.
   - Click on **Pages** in the left sidebar.
   - Under "Build and deployment", set "Branch" to `main` and "/" (root).
   - Click **Save**. Your site will be live at `https://<username>.github.io/<repo-name>/`.
