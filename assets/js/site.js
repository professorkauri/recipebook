(() => {
  "use strict";

  const data = window.RECIPE_BOOK_DATA || { settings: {}, categories: [], recipes: [] };
  const app = document.getElementById("app");
  const backButton = document.getElementById("backButton");
  const homeButton = document.getElementById("homeButton");
  const wakeButton = document.getElementById("wakeButton");
  const titleElement = document.getElementById("siteTitle");
  const recipeCardTemplate = document.getElementById("recipeCardTemplate");
  const menuButton = document.getElementById("menuButton");
  const closeMenuButton = document.getElementById("closeMenuButton");
  const categoryMenu = document.getElementById("categoryMenu");
  const categoryMenuLinks = document.getElementById("categoryMenuLinks");
  const menuBackdrop = document.getElementById("menuBackdrop");
  const NEW_RECIPES_CATEGORY_ID = "new-recipes";

  let wakeLock = null;
  let wakeRequested = false;
  let currentView = { name: "home" };

  titleElement.textContent = data.settings.siteTitle || "Our Recipe Book";
  document.title = data.settings.siteTitle || "Our Recipe Book";

  function slugify(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getCategory(categoryId) {
    return data.categories.find(category => category.id === categoryId) || null;
  }

  function recipeImage(recipe) {
    const imageType = recipe.imageType || "png";
    return `assets/${slugify(recipe.name)}.${imageType}`;
  }

  function setImageFallback(image) {
    image.addEventListener("error", () => image.classList.add("is-missing"), { once: true });
  }

  function makeRecipeCard(recipe) {
    const card = recipeCardTemplate.content.firstElementChild.cloneNode(true);
    const category = getCategory(recipe.categoryId);
    const image = card.querySelector(".recipe-image");
    image.src = recipeImage(recipe);
    image.alt = recipe.name;
    setImageFallback(image);
    if (recipe.favourite) {
      const badge = document.createElement("span");
      badge.className = "favourite-badge";
      badge.textContent = "\u2605";
      card.querySelector(".recipe-image-wrap").appendChild(badge);
    }
    card.querySelector(".eyebrow").textContent = category?.name || "Recipe";
    card.querySelector(".recipe-name").textContent = recipe.name;
    card.querySelector(".recipe-description").textContent = recipe.description || recipe.baseYield || "";
    card.addEventListener("click", () => showRecipe(recipe.id));
    return card;
  }

  function recipeList(recipes) {
    const list = document.createElement("div");
    list.className = "recipe-list";
    if (!recipes.length) {
      list.innerHTML = '<p class="empty-state">No recipes have been added here yet.</p>';
      return list;
    }
    recipes.forEach(recipe => list.appendChild(makeRecipeCard(recipe)));
    return list;
  }

  function recipeGrid(recipes) {
    const grid = document.createElement("div");
    grid.className = "recipe-grid";
    if (!recipes.length) {
      grid.innerHTML = '<p class="empty-state">No recipes have been added here yet.</p>';
      return grid;
    }
    recipes.slice(0, 5).forEach(recipe => grid.appendChild(makeRecipeCard(recipe)));
    return grid;
  }

  function renderCategoryMenu() {
    categoryMenuLinks.innerHTML = "";
    data.categories.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = category.name;
      button.addEventListener("click", () => {
        closeCategoryMenu();
        showCategory(category.id);
      });
      categoryMenuLinks.appendChild(button);
    });
  }

  function openCategoryMenu() {
    categoryMenu.hidden = false;
    menuBackdrop.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  function closeCategoryMenu() {
    categoryMenu.hidden = true;
    menuBackdrop.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function updateHeader() {
    backButton.hidden = currentView.name !== "recipe";
  }

  function showHome() {
    currentView = { name: "home" };
    history.replaceState(currentView, "", "#home");
    updateHeader();
    app.innerHTML = "";

    const hero = document.createElement("section");
    hero.className = "hero";
    hero.innerHTML = `<span class="eyebrow">Kitchen collection</span><h1>${escapeHtml(data.settings.siteTitle || "Our Recipe Book")}</h1><p>${escapeHtml(data.settings.subtitle || "Recipes worth making again.")}</p>`;
    app.appendChild(hero);

    const favourites = data.recipes.filter(recipe => recipe.favourite).slice(0, 5);
    const favouriteSection = document.createElement("section");
    favouriteSection.className = "section white";
    favouriteSection.innerHTML = `<div class="section-heading"><h2>Favourites</h2><span class="count">${favourites.length}</span></div>`;
    favouriteSection.appendChild(recipeGrid(favourites));
    app.appendChild(favouriteSection);

    const recent = [...data.recipes].slice(-5).reverse();
    const recentSection = document.createElement("section");
    recentSection.className = "section";
    recentSection.innerHTML = `<div class="section-heading"><h2>Recent</h2><span class="count">${recent.length}</span></div>`;
    recentSection.appendChild(recipeGrid(recent));
    app.appendChild(recentSection);

    const newRecipesCategory = data.categories.find(category => category.id === NEW_RECIPES_CATEGORY_ID)
      || data.categories.find(category => category.name.trim().toLowerCase() === "new recipes");
    if (newRecipesCategory) {
      const newRecipes = data.recipes.filter(recipe => recipe.categoryId === newRecipesCategory.id);
      const newRecipesSection = document.createElement("section");
      newRecipesSection.className = "section dark";
      newRecipesSection.innerHTML = `<div class="section-heading"><h2>New Recipes</h2><span class="count">${newRecipes.length}</span></div>`;
      newRecipesSection.appendChild(recipeGrid(newRecipes));
      app.appendChild(newRecipesSection);
    }

    const categorySection = document.createElement("section");
    categorySection.className = "section";
    categorySection.innerHTML = '<div class="section-heading"><h2>Categories</h2></div>';
    const grid = document.createElement("div");
    grid.className = "category-grid";
    data.categories.forEach(category => {
      const count = data.recipes.filter(recipe => recipe.categoryId === category.id).length;
      const button = document.createElement("button");
      button.className = "category-button";
      button.type = "button";
      button.innerHTML = `<strong>${escapeHtml(category.name)}</strong><span>${count} recipe${count === 1 ? "" : "s"}</span>`;
      button.addEventListener("click", () => showCategory(category.id));
      grid.appendChild(button);
    });
    categorySection.appendChild(grid);
    app.appendChild(categorySection);
    app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function showCategory(categoryId, push = true) {
    const category = getCategory(categoryId);
    if (!category) return showHome();
    currentView = { name: "category", categoryId };
    if (push) history.pushState(currentView, "", `#category/${categoryId}`);
    updateHeader();
    app.innerHTML = `<section class="hero"><span class="eyebrow">Category</span><h1>${escapeHtml(category.name)}</h1><p>${data.recipes.filter(recipe => recipe.categoryId === categoryId).length} saved recipes.</p></section>`;
    app.appendChild(recipeList(data.recipes.filter(recipe => recipe.categoryId === categoryId)));
    app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function singularIngredientName(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\b([^aeiou\s])ies\b$/i, "$1y")
      .replace(/\b(tomato|potato|hero)es\b$/i, "$1")
      .replace(/\b([a-z]+(?:ch|sh|x|z))es\b$/i, "$1")
      .replace(/\b([a-z]*[^sui])s\b$/i, "$1");
  }

  function pluralScore(name) {
    const trimmed = String(name || "").trim().toLowerCase();
    return singularIngredientName(trimmed) === trimmed ? 0 : 1;
  }

  function collectIngredients(recipe) {
    const merged = new Map();
    recipe.steps.forEach(step => (step.ingredients || []).forEach(ingredient => {
      const key = [singularIngredientName(ingredient.name), ingredient.unit.trim().toLowerCase(), (ingredient.note || "").trim().toLowerCase()].join("|");
      if (!merged.has(key)) merged.set(key, { ...ingredient, quantity: Number(ingredient.quantity) || 0 });
      else {
        const match = merged.get(key);
        match.quantity += Number(ingredient.quantity) || 0;
        if (pluralScore(ingredient.name) > pluralScore(match.name)) match.name = ingredient.name;
      }
    }));
    return [...merged.values()];
  }

  function formatQuantity(value) {
    const rounded = Math.round(value * 1000) / 1000;
    const fractions = new Map([[0.125,"\u215b"],[0.25,"\u00bc"],[0.33,"\u2153"],[0.333,"\u2153"],[0.5,"\u00bd"],[0.66,"\u2154"],[0.667,"\u2154"],[0.75,"\u00be"]]);
    const whole = Math.floor(rounded);
    const remainder = Math.round((rounded - whole) * 1000) / 1000;
    if (fractions.has(remainder)) return `${whole || ""}${fractions.get(remainder)}`;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, "").replace(/\.$/, "");
  }

  function showRecipe(recipeId, push = true) {
    const recipe = data.recipes.find(item => item.id === recipeId);
    if (!recipe) return showHome();
    currentView = { name: "recipe", recipeId };
    if (push) history.pushState(currentView, "", `#recipe/${recipeId}`);
    updateHeader();
    app.innerHTML = "";

    const imageWrap = document.createElement("div");
    imageWrap.className = "recipe-hero-image-wrap";
    const image = document.createElement("img");
    image.className = "recipe-hero-image";
    image.src = recipeImage(recipe);
    image.alt = recipe.name;
    setImageFallback(image);
    imageWrap.appendChild(image);
    if (recipe.favourite) {
      const badge = document.createElement("span");
      badge.className = "favourite-badge";
      badge.textContent = "\u2605";
      imageWrap.appendChild(badge);
    }
    app.appendChild(imageWrap);

    const header = document.createElement("section");
    const category = getCategory(recipe.categoryId);
    header.innerHTML = `<span class="eyebrow">${escapeHtml(category?.name || "Recipe")}</span><h1 class="recipe-title">${escapeHtml(recipe.name)}</h1><p class="recipe-summary">${escapeHtml(recipe.description || "")}</p>`;
    const meta = document.createElement("div");
    meta.className = "meta-row";
    [recipe.baseYield, recipe.prepTime && `Preheat ${recipe.prepTime}`, recipe.cookTime && `Cook ${recipe.cookTime}`].filter(Boolean).forEach(value => {
      const pill = document.createElement("span"); pill.className = "meta-pill"; pill.textContent = value; meta.appendChild(pill);
    });
    header.appendChild(meta);
    app.appendChild(header);

    const scaleWrap = document.createElement("div");
    scaleWrap.className = "scale-wrap";
    scaleWrap.innerHTML = '<strong>Recipe size</strong><div class="segmented" role="group" aria-label="Recipe size"><button data-scale="0.5">½</button><button class="active" data-scale="1">1×</button><button data-scale="2">2×</button></div>';
    app.appendChild(scaleWrap);

    const ingredientsSection = document.createElement("section");
    ingredientsSection.className = "section";
    ingredientsSection.innerHTML = '<div class="section-heading"><h2>Ingredients</h2></div><ul class="ingredients"></ul>';
    app.appendChild(ingredientsSection);

    const stepsSection = document.createElement("section");
    stepsSection.className = "section white";
    stepsSection.innerHTML = '<div class="section-heading"><h2>Method</h2></div><div class="steps"></div>';
    const stepsContainer = stepsSection.querySelector(".steps");
    recipe.steps.forEach(step => {
      const stepElement = document.createElement("article");
      stepElement.className = "step";
      stepElement.innerHTML = `<p>${escapeHtml(step.instruction)}</p>`;
      if (step.ingredients?.length) {
        const used = document.createElement("ul"); used.className = "step-ingredients";
        step.ingredients.forEach(item => { const li = document.createElement("li"); li.dataset.ingredientId = item.id; used.appendChild(li); });
        stepElement.appendChild(used);
      }
      stepsContainer.appendChild(stepElement);
    });
    app.appendChild(stepsSection);

    if (recipe.notes) {
      const notes = document.createElement("section"); notes.className = "section";
      notes.innerHTML = `<div class="section-heading"><h2>Notes</h2></div><div class="notes">${escapeHtml(recipe.notes)}</div>`;
      app.appendChild(notes);
    }

    function applyScale(scale) {
      scaleWrap.querySelectorAll("button").forEach(button => button.classList.toggle("active", Number(button.dataset.scale) === scale));
      const list = ingredientsSection.querySelector(".ingredients");
      list.innerHTML = "";
      collectIngredients(recipe).forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="amount">${formatQuantity(item.quantity * scale)}${item.unit ? ` ${escapeHtml(item.unit)}` : ""}</span><span>${escapeHtml(item.name)}${item.note ? `<br><span class="ingredient-note">${escapeHtml(item.note)}</span>` : ""}</span>`;
        list.appendChild(li);
      });
      recipe.steps.forEach(step => (step.ingredients || []).forEach(item => {
        const line = stepsContainer.querySelector(`[data-ingredient-id="${CSS.escape(item.id)}"]`);
        if (line) line.textContent = `${formatQuantity((Number(item.quantity) || 0) * scale)}${item.unit ? ` ${item.unit}` : ""} ${item.name}${item.note ? `, ${item.note}` : ""}`;
      }));
    }
    scaleWrap.querySelectorAll("button").forEach(button => button.addEventListener("click", () => applyScale(Number(button.dataset.scale))));
    applyScale(1);
    requestWakeLock(true);
    app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  async function requestWakeLock(silent = false) {
    wakeRequested = true;
    if (!("wakeLock" in navigator)) {
      wakeButton.disabled = true;
      wakeButton.title = "Wake lock is not supported by this browser";
      if (!silent) showMessage("Your browser does not support keeping the screen awake.");
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeButton.setAttribute("aria-pressed", "true");
      wakeButton.title = "Allow screen to sleep";
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
        wakeButton.setAttribute("aria-pressed", "false");
      });
      if (!silent) showMessage("Screen will stay awake while this page is visible.");
    } catch (error) {
      wakeRequested = false;
      if (!silent) showMessage("Screen wake could not be enabled. Tap the sun icon to try again.");
    }
  }

  async function releaseWakeLock() {
    wakeRequested = false;
    if (wakeLock) await wakeLock.release();
    wakeLock = null;
    wakeButton.setAttribute("aria-pressed", "false");
    wakeButton.title = "Keep screen awake";
    showMessage("Normal screen sleep restored.");
  }

  function showMessage(text) {
    document.querySelector(".wake-message")?.remove();
    const message = document.createElement("div");
    message.className = "wake-message";
    message.textContent = text;
    document.body.appendChild(message);
    window.setTimeout(() => message.remove(), 3200);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
  }

  wakeButton.addEventListener("click", () => wakeLock ? releaseWakeLock() : requestWakeLock(false));
  homeButton.addEventListener("click", () => { closeCategoryMenu(); showHome(); });
  backButton.addEventListener("click", () => history.back());
  menuButton.addEventListener("click", () => categoryMenu.hidden ? openCategoryMenu() : closeCategoryMenu());
  closeMenuButton.addEventListener("click", closeCategoryMenu);
  menuBackdrop.addEventListener("click", closeCategoryMenu);
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeCategoryMenu(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wakeRequested && !wakeLock) requestWakeLock(true);
  });
  window.addEventListener("popstate", event => renderRoute(event.state));

  function renderRoute(state) {
    if (state?.name === "recipe") showRecipe(state.recipeId, false);
    else if (state?.name === "category") showCategory(state.categoryId, false);
    else showHome();
  }

  function initialRoute() {
    const [type, id] = location.hash.replace(/^#/, "").split("/");
    if (type === "recipe" && id) showRecipe(id, false);
    else if (type === "category" && id) showCategory(id, false);
    else showHome();
  }

  renderCategoryMenu();
  initialRoute();
})();
