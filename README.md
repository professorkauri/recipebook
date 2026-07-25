# Mobile Recipe Book

A dependency-free recipe project designed for:

- **Local desktop editing:** `admin/recipe-admin.html`
- **Mobile cooking view:** `index.html`, hosted with GitHub Pages
- **Shared exported data:** `data/recipes-data.js`

## Folder structure

```text
wife-recipe-book/
├── admin/
│   └── recipe-admin.html       Local single-file editor
├── assets/
│   ├── css/site.css
│   ├── js/site.js
│   └── <recipe-slug>.png       Optional recipe images
├── data/
│   └── recipes-data.js         Shared recipe data
├── index.html                  Mobile single-page recipe site
└── README.md
```

## Editing recipes

1. Open `admin/recipe-admin.html` directly in a desktop browser.
2. Select **Import data** and choose `data/recipes-data.js`.
3. Add or edit categories and recipes.
4. Add ingredients inside the method step where each ingredient is used.
5. Mark chosen recipes as favourites in the recipe details.
6. Select **Export data** or press `Ctrl+S` / `Cmd+S`.
7. Replace `data/recipes-data.js` with the exported file.

The admin does not directly overwrite local files because browsers restrict that behaviour. Exporting a replacement keeps the workflow portable and safe.

## Recipe images

Images are discovered from the recipe name automatically:

- `Chocolate Cake` → `assets/chocolate-cake.png`
- `Mum's Apple Pie` → `assets/mum-s-apple-pie.png`

The admin displays the expected filename. Images are optional; missing images are hidden automatically.

## Recipe scaling

Every ingredient uses a numeric `quantity`, so the mobile site can accurately apply:

- `½`
- `1×` (default)
- `2×`

Matching ingredients from separate steps are consolidated when their name, unit and note match.

## Keeping the phone awake

Opening a recipe attempts to request a screen wake lock. The sun icon in the header can also toggle it manually. Wake lock requires HTTPS, which GitHub Pages provides, and may need a user tap depending on browser rules. The site attempts to reacquire the lock when returning to the visible browser tab.

## Publishing with GitHub Pages

1. Create a GitHub repository and copy these files into its root.
2. Commit and push to the `main` branch.
3. Open the repository on GitHub.
4. Go to **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select `main` and `/ (root)`, then save.

The public site uses only static HTML, CSS, JavaScript and image files, so no build command is required.

## Local preview

Opening `index.html` directly usually works, but a local web server more closely matches GitHub Pages.

From VS Code, use a local server extension, or run from the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
