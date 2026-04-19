const API_URL = "https://api.tvmaze.com/shows/82/episodes";

//You can edit ALL of the code here
async function setup() {
  const rootElem = document.getElementById("root");

  renderStatus(rootElem, "Loading episodes, please wait...");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const allEpisodes = await response.json();
    makePageForEpisodes(allEpisodes);
    liveSearch(allEpisodes);
    selectEpisode(allEpisodes);
  } catch (error) {
    renderStatus(
      rootElem,
      "Sorry, episodes could not be loaded right now. Please refresh and try again.",
    );
  }
}

function renderStatus(rootElem, message) {
  rootElem.innerHTML = "";
  const status = document.createElement("p");
  status.textContent = message;
  rootElem.appendChild(status);
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  let contentDiv = document.getElementById("episodes-content");
  if (!contentDiv) {
    contentDiv = document.createElement("div");
    contentDiv.id = "episodes-content";
    rootElem.appendChild(contentDiv);
  }
  contentDiv.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = `All Episodes (${episodeList.length})`;
  contentDiv.appendChild(heading);

  const episodeGrid = document.createElement("section");
  episodeGrid.className = "episode-grid";

  let episodeCards = createEpisodeCard(episodeList);

  episodeCards.forEach((card) => episodeGrid.appendChild(card));
  contentDiv.appendChild(episodeGrid);

  const attribution = document.createElement("footer");
  attribution.id = "attribution";
  attribution.innerHTML =
    'Episode data originally comes from <a href="https://tvmaze.com/" target="_blank" rel="noopener noreferrer">TVMaze.com</a>.';
  contentDiv.appendChild(attribution);
}

function createEpisodeCard(episodeList) {
  const cards = [];
  episodeList.forEach((episode) => {
    const card = document.createElement("article");
    card.className = "episode-card";

    const title = document.createElement("h2");
    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    title.textContent = `${episode.name} - ${episodeCode}`;

    const image = document.createElement("img");
    image.src = episode.image?.medium || "";
    image.alt = `${episode.name} (${episodeCode})`;

    const episodeMeta = document.createElement("p");
    episodeMeta.className = "episode-meta";
    episodeMeta.textContent = `Season ${episode.season}, Episode ${episode.number}`;

    const summary = document.createElement("div");
    summary.className = "episode-summary";
    summary.innerHTML = episode.summary || "";

    card.appendChild(title);
    card.appendChild(image);
    card.appendChild(episodeMeta);
    card.appendChild(summary);
    cards.push(card);
  });
  return cards;
}

function formatEpisodeCode(season, episodeNumber) {
  const formattedSeason = String(season).padStart(2, "0");
  const formattedEpisode = String(episodeNumber).padStart(2, "0");
  return `S${formattedSeason}E${formattedEpisode}`;
}

function liveSearch(allEpisodes) {
  const numberOfEpisodes = allEpisodes.length;
  const searchLabel = document.getElementById("search-label");
  if (searchLabel) {
    searchLabel.textContent = `Displaying ${numberOfEpisodes}/${numberOfEpisodes} episodes`;
  }

  const searchInput = document.getElementById("search-input");
  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("input", function () {
    const searchInputValue = searchInput.value.toLowerCase().trim();
    const searchResult = [];

    for (let i = 0; i < allEpisodes.length; i++) {
      const episodeName = (allEpisodes[i].name || "").toLowerCase();
      const episodeSummary = (allEpisodes[i].summary || "").toLowerCase();

      if (
        episodeName.includes(searchInputValue) ||
        episodeSummary.includes(searchInputValue)
      ) {
        searchResult.push(allEpisodes[i]);
      }
    }

    if (searchLabel) {
      searchLabel.textContent = `Displaying ${searchResult.length}/${numberOfEpisodes} episodes`;
    }

    makePageForEpisodes(searchResult);
  });
}

function selectEpisode(allEpisodes) {
  const episodeSelector = document.getElementById("select-episode");

  for (let i = 0; i < allEpisodes.length; i++) {
    let displayEpisode = document.createElement("option");
    let season = allEpisodes[i].season;
    let episodeNumber = allEpisodes[i].number;
    let title = allEpisodes[i].name;
    let episode = `${formatEpisodeCode(season, episodeNumber)} - ${title}`;
    displayEpisode.textContent = episode;
    displayEpisode.value = allEpisodes[i].id;
    episodeSelector.appendChild(displayEpisode);
  }

  episodeSelector.addEventListener("change", function () {
    const selectedValue = episodeSelector.value;
    if (selectedValue === "all-episodes") {
      const searchInput = document.getElementById("search-input");
      searchInput.value = "";
      makePageForEpisodes(allEpisodes);
      return;
    }
    for (let episode of allEpisodes) {
      if (+selectedValue === episode.id) {
        makePageForEpisodes([episode]);
      }
    }
  });
}

window.onload = setup;
