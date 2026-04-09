//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = `All Episodes (${episodeList.length})`;
  rootElem.appendChild(heading);

  const episodeGrid = document.createElement("section");
  episodeGrid.className = "episode-grid";

  episodeList.forEach((episode) => {
    const card = document.createElement("article");
    card.className = "episode-card";

    const title = document.createElement("h2");
    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    title.textContent = `${episode.name} - ${episodeCode}`;

    const image = document.createElement("img");
    image.src = episode.image.medium;
    image.alt = `${episode.name} (${episodeCode})`;

    const episodeMeta = document.createElement("p");
    episodeMeta.className = "episode-meta";
    episodeMeta.textContent = `Season ${episode.season}, Episode ${episode.number}`;

    const summary = document.createElement("div");
    summary.className = "episode-summary";
    summary.innerHTML = episode.summary;

    card.appendChild(title);
    card.appendChild(image);
    card.appendChild(episodeMeta);
    card.appendChild(summary);
    episodeGrid.appendChild(card);
  });

  rootElem.appendChild(episodeGrid);

  const attribution = document.createElement("p");
  attribution.className = "attribution";
  attribution.innerHTML =
    'Episode data originally comes from <a href="https://tvmaze.com/" target="_blank" rel="noopener noreferrer">TVMaze.com</a>.';
  rootElem.appendChild(attribution);
}

function formatEpisodeCode(season, episodeNumber) {
  const formattedSeason = String(season).padStart(2, "0");
  const formattedEpisode = String(episodeNumber).padStart(2, "0");
  return `S${formattedSeason}E${formattedEpisode}`;
}

window.onload = setup;
