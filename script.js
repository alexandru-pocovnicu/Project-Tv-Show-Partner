const API_URL = "https://api.tvmaze.com/shows/82/episodes";
const BROKEN_API_URL = "https://api.tvmaze.com/shows/82/episodes-broken";
const listOfShows = "https://api.tvmaze.com/shows";
let episodesRequestPromise = null;
let episodesCache = {};
let showsCache = null;

async function fetchShows() {
  // Return cached shows if already fetched
  if (showsCache) {
    return showsCache;
  }

  try {
    const response = await fetch(listOfShows);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const shows = await response.json();
    showsCache = shows;
    return shows;
  } catch (error) {
    console.error("Error fetching shows:", error);
    throw error;
  }
}

function createShowCard(show) {
  const card = document.createElement("article");
  card.className = "show-card";

  const image = document.createElement("img");
  image.src = show.image?.medium || show.image?.original || "";
  image.alt = show.name;

  const title = document.createElement("h2");
  title.textContent = show.name;

  const meta = document.createElement("div");
  meta.className = "show-meta";
  const status = show.status ? `Status: ${show.status}` : "";
  const rating = show.rating?.average
    ? `Rating: ${show.rating.average}/10`
    : "";
  const runtime = show.runtime ? `Runtime: ${show.runtime} min` : "";
  const genres = show.genres?.length ? `Genres: ${show.genres.join(", ")}` : "";
  meta.textContent = [status, rating, runtime, genres]
    .filter(Boolean)
    .join(" • ");

  const summary = document.createElement("div");
  summary.className = "show-summary";
  summary.innerHTML = show.summary || "No summary available";

  card.appendChild(image);
  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(summary);

  return card;
}

async function displayShowsListing(showsToDisplay = null) {
  const showsContent = document.getElementById("shows-content");
  const showsListingView = document.getElementById("shows-listing-view");

  if (!showsContent) return;

  // Fetch shows if not provided
  let shows = showsToDisplay;
  if (!shows) {
    try {
      shows = await fetchShows();
    } catch (error) {
      showsContent.innerHTML =
        "<p>Sorry, shows could not be loaded. Please refresh and try again.</p>";
      return;
    }
  }

  // Sort shows alphabetically by name (case-insensitive)
  const sortedShows = shows.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );

  // Clear and populate shows grid
  showsContent.innerHTML = "";
  sortedShows.forEach((show) => {
    const showCard = createShowCard(show);
    showCard.addEventListener("click", () => showEpisodes(show.id));
    showsContent.appendChild(showCard);
  });

  // Ensure shows listing view is visible
  if (showsListingView) {
    showsListingView.style.display = "block";
  }
}

async function showEpisodes(showId) {
  const showsListingView = document.getElementById("shows-listing-view");
  const episodesView = document.getElementById("episodes-view");
  const episodesContentId = "episodes-content";
  let contentDiv = document.getElementById(episodesContentId);

  // Hide shows listing, show episodes view
  if (showsListingView) {
    showsListingView.style.display = "none";
  }
  if (episodesView) {
    episodesView.style.display = "block";
  }

  // Create episodes content div if it doesn't exist
  if (!contentDiv) {
    contentDiv = document.createElement("div");
    contentDiv.id = episodesContentId;
    episodesView.appendChild(contentDiv);
  }

  // Show loading message
  renderStatus(contentDiv, "Loading episodes, please wait...");

  // Check cache first
  if (episodesCache[showId]) {
    const episodes = episodesCache[showId];
    makePageForEpisodes(episodes);
    liveSearch(episodes);
    selectEpisode(episodes);
    return;
  }

  // Fetch episodes
  try {
    const response = await fetch(
      `https://api.tvmaze.com/shows/${showId}/episodes`,
    );
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const episodes = await response.json();
    episodesCache[showId] = episodes;
    makePageForEpisodes(episodes);
    liveSearch(episodes);
    selectEpisode(episodes);
  } catch (error) {
    renderStatus(
      contentDiv,
      "Sorry, episodes could not be loaded right now. Please refresh and try again.",
    );
  }
}

function setupBackButton() {
  const backButton = document.getElementById("back-to-shows");
  if (backButton) {
    backButton.addEventListener("click", () => {
      const episodesView = document.getElementById("episodes-view");
      const showsListingView = document.getElementById("shows-listing-view");

      // Hide episodes view, show shows listing
      if (episodesView) {
        episodesView.style.display = "none";
      }
      if (showsListingView) {
        showsListingView.style.display = "block";
      }
    });
  }
}

async function setup() {
  setupBackButton();

  const episodesContentId = "episodes-content";
  let contentDiv = document.getElementById(episodesContentId);
  await selectShow();
  if (!contentDiv) {
    contentDiv = document.createElement("div");
    contentDiv.id = episodesContentId;
    document.getElementById("root").appendChild(contentDiv);
  }
  renderStatus(contentDiv, "Select a show to view episodes.");

  const showSelect = document.getElementById("select-show");
  if (showSelect) {
    showSelect.addEventListener("change", handleShowChange);

    if (showSelect.options.length > 1) {
      showSelect.selectedIndex = 1;
      await handleShowChange();
    }
  }
}

async function handleShowChange() {
  const showSelect = document.getElementById("select-show");
  const showId = showSelect.value;
  const episodesContentId = "episodes-content";
  let contentDiv = document.getElementById(episodesContentId);
  if (!showId) return;
  renderStatus(contentDiv, "Loading episodes, please wait...");

  // Check cache first
  if (episodesCache[showId]) {
    const episodes = episodesCache[showId];
    makePageForEpisodes(episodes);
    liveSearch(episodes);
    selectEpisode(episodes);
    const episodeSelector = document.getElementById("select-episode");
    if (episodeSelector) episodeSelector.value = "all-episodes";
    return;
  }

  try {
    const response = await fetch(
      `https://api.tvmaze.com/shows/${showId}/episodes`,
    );
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const episodes = await response.json();
    episodesCache[showId] = episodes;
    makePageForEpisodes(episodes);
    liveSearch(episodes);
    selectEpisode(episodes);

    const episodeSelector = document.getElementById("select-episode");
    if (episodeSelector) episodeSelector.value = "all-episodes";
  } catch (error) {
    renderStatus(
      contentDiv,
      "Sorry, episodes could not be loaded right now. Please refresh and try again.",
    );
  }
}

function loadEpisodesOnce() {
  if (!episodesRequestPromise) {
    episodesRequestPromise = fetch(getApiUrlForRequest()).then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    });
  }
  return episodesRequestPromise;
}

function getApiUrlForRequest() {
  const params = new URLSearchParams(window.location.search);
  const shouldSimulateError = params.get("simulateError") === "true";
  return shouldSimulateError ? BROKEN_API_URL : API_URL;
}

function renderStatus(contentDiv, message) {
  contentDiv.innerHTML = "";
  const status = document.createElement("p");
  status.textContent = message;
  contentDiv.appendChild(status);
}

function makePageForEpisodes(episodeList) {
  let contentDiv = document.getElementById("episodes-content");
  if (!contentDiv) {
    contentDiv = document.createElement("div");
    contentDiv.id = "episodes-content";
    document.getElementById("root").appendChild(contentDiv);
  }
  contentDiv.innerHTML = "";

  const episodeSelector = document.getElementById("select-episode");
  if (episodeSelector) {
    populateSelect(
      episodeSelector,
      episodeList,
      (ep) => `${formatEpisodeCode(ep.season, ep.number)} - ${ep.name}`,
      (ep) => ep.id,
      "Choose an episode",
    );

    const allOption = document.createElement("option");
    allOption.value = "all-episodes";
    allOption.textContent = "All episodes";
    episodeSelector.insertBefore(allOption, episodeSelector.children[1]);
  }

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

function populateSelect(
  selectElement,
  options,
  getOptionText,
  getOptionValue,
  defaultOptionText = "Choose an option",
) {
  selectElement.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultOptionText;
  defaultOption.selected = true;
  defaultOption.disabled = true;
  selectElement.appendChild(defaultOption);
  options.forEach((optionData) => {
    const option = document.createElement("option");
    option.value = getOptionValue(optionData);
    option.textContent = getOptionText(optionData);
    selectElement.appendChild(option);
  });
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

async function selectShow() {
  const showSelect = document.getElementById("select-show");
  try {
    const response = await fetch(listOfShows);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    let shows = await response.json();

    shows.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    populateSelect(
      showSelect,
      shows,
      (show) => show.name,
      (show) => show.id,
      "Choose a show",
    );
  } catch (error) {
    showSelect.innerHTML = "<option>Error loading shows</option>";
  }
}
window.onload = setup;
