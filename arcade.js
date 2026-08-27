(() => {
  const grid = document.querySelector("#games");
  const error = document.querySelector("#error");

  fetch("catalog.json")
    .then((response) => {
      if (!response.ok) throw new Error(`catalog request failed: ${response.status}`);
      return response.json();
    })
    .then(({ games }) => {
      games.forEach((game) => {
        const card = document.createElement("a");
        card.className = "game";
        card.href = `games/${encodeURIComponent(game.slug)}/`;

        const icon = document.createElement("img");
        icon.src = `games/${encodeURIComponent(game.slug)}/${game.icon}`;
        icon.alt = "";

        const copy = document.createElement("div");
        const category = document.createElement("small");
        category.textContent = `${game.category} · ${game.release_stage} ${game.version}`;
        const title = document.createElement("h2");
        title.textContent = game.title;
        const summary = document.createElement("p");
        summary.textContent = game.summary;
        copy.append(category, title, summary);
        card.append(icon, copy);
        grid.append(card);
      });
    })
    .catch((reason) => {
      console.error(reason);
      error.hidden = false;
    });
})();
