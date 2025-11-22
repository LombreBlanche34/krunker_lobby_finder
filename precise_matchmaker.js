// Configuration par défaut
const defaults = {
    lombre_precise_matchmaker_status: true,
    lombre_precise_matchmaker_region: "de-fra",
    lombre_precise_matchmaker_min_players: 4,
    lombre_precise_matchmaker_max_players: 7,
    lombre_precise_matchmaker_min_time: 140,
    lombre_precise_matchmaker_max_results: 3,
    lombre_precise_matchmaker_fav_maps: JSON.stringify(["Sandstorm", "Evacuation", "Industry", "Undergrowth", "site"]),
    lombre_precise_matchmaker_auto_join_fav: true
};

// Initialize localStorage if values don't exist
Object.keys(defaults).forEach(key => {
    if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, defaults[key]);
        console.log(`[LombreScripts] [matchmaker.js] ${key} created with default value: ${defaults[key]}`);
    }
});

// Check if script is enabled
const scriptStatus = localStorage.getItem('lombre_precise_matchmaker_status');
const isEnabled = scriptStatus === 'true' || scriptStatus === true;

if (!isEnabled) {
    console.log("[LombreScripts] [matchmaker.js] Script is disabled (lombre_precise_matchmaker_status = false)");
    return; // Exit script
}

console.log("[LombreScripts] [matchmaker.js] Script is enabled");

// Load configuration
const config = {
    REGION: localStorage.getItem('lombre_precise_matchmaker_region') || defaults.lombre_precise_matchmaker_region,
    MIN_PLAYERS: parseInt(localStorage.getItem('lombre_precise_matchmaker_min_players')),
    MAX_PLAYERS: parseInt(localStorage.getItem('lombre_precise_matchmaker_max_players')),
    MIN_TIME: parseInt(localStorage.getItem('lombre_precise_matchmaker_min_time')),
    MAX_RESULTS: parseInt(localStorage.getItem('lombre_precise_matchmaker_max_results')),
    FAV_MAPS: JSON.parse(localStorage.getItem('lombre_precise_matchmaker_fav_maps')),
    AUTO_JOIN_FAV: localStorage.getItem('lombre_precise_matchmaker_auto_join_fav') === 'true'
};

console.log(`[LombreScripts] [matchmaker.js] Configuration loaded`, config);

// Utility functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function fetchGameInfo(gameId) {
    try {
        const response = await fetch(`https://matchmaker.krunker.io/game-info?game=${gameId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.log('[LombreScripts] [matchmaker.js] Error fetching game info:', error);
        return null;
    }
}

async function fetchKrunkerGames() {
    try {
        const response = await fetch('https://matchmaker.krunker.io/game-list?hostname=krunker.io');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.log('[LombreScripts] [matchmaker.js] Error during fetch:', error);
        throw error;
    }
}

function hideGameContainer() {
    const gamesContainer = document.querySelector("#customGameContainer");
    if (gamesContainer) {
        gamesContainer.style.display = 'none';
    }
}

function showGameContainer() {
    const gamesContainer = document.querySelector("#customGameContainer");
    if (gamesContainer) {
        gamesContainer.style.display = 'block';
    }
}

async function displayGames(gamesData) {
    // Create or get the container
    let gamesContainer = document.querySelector("#customGameContainer");
    if (!gamesContainer) {
        gamesContainer = document.createElement('div');
        gamesContainer.id = 'customGameContainer';
        gamesContainer.style.position = 'fixed';
        gamesContainer.style.top = '50%';
        gamesContainer.style.left = '50%';
        gamesContainer.style.transform = 'translate(-50%, -50%)';
        gamesContainer.style.width = '80%';
        gamesContainer.style.maxWidth = '600px';
        gamesContainer.style.padding = '15px';
        gamesContainer.style.backgroundColor = 'rgba(26, 26, 26, 0.9)';
        gamesContainer.style.borderRadius = '8px';
        gamesContainer.style.border = '2px solid #4dabf7';
        gamesContainer.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.5)';
        gamesContainer.style.zIndex = '1000';
        gamesContainer.style.display = 'block';
        document.body.appendChild(gamesContainer);
    } else {
        gamesContainer.innerHTML = '';
        gamesContainer.style.display = 'block';
    }

    // Add title
    const title = document.createElement('div');
    title.style.fontSize = '18px';
    title.style.marginBottom = '15px';
    title.style.color = '#fff';
    title.style.textAlign = 'center';
    title.style.fontWeight = 'bold';
    title.textContent = `Available Games (${config.REGION})`;
    gamesContainer.appendChild(title);

    const gameList = document.createElement('div');
    gameList.style.display = 'flex';
    gameList.style.flexDirection = 'column';
    gameList.style.gap = '10px';

    // Filter games
    const candidateGames = gamesData.games.filter(game => {
        const [, region, , , gameDetails, timeLeft] = game;
        return gameDetails &&
               region === config.REGION &&
               gameDetails.c === 0 &&
               gameDetails.g === 0 &&
               timeLeft > config.MIN_TIME;
    }).map(game => game[0]);

    console.log(`[LombreScripts] [matchmaker.js] Found ${candidateGames.length} candidate games from game-list`);

    // Status div for checking progress
    const statusDiv = document.createElement('div');
    statusDiv.style.padding = '20px';
    statusDiv.style.color = '#4dabf7';
    statusDiv.style.textAlign = 'center';
    statusDiv.textContent = 'Checking games...';
    gamesContainer.appendChild(statusDiv);

    // Verify each lobby
    const matchingGames = [];
    for (let i = 0; i < candidateGames.length && matchingGames.length < config.MAX_RESULTS; i++) {
        const gameId = candidateGames[i];
        statusDiv.textContent = `Checking game ${i+1}/${candidateGames.length}`;

        const detailedInfo = await fetchGameInfo(gameId);
        if (detailedInfo) {
            const [, , currentPlayers, , , tempsRestant] = detailedInfo;
            const actualGame = window.location.href;
            const currentGameId = actualGame.includes('?game=') ? actualGame.split('=')[1].split('&')[0] : null;
            
            if (tempsRestant > config.MIN_TIME && 
                currentPlayers >= config.MIN_PLAYERS && 
                currentPlayers <= config.MAX_PLAYERS && 
                gameId !== currentGameId) {
                console.log(`[LombreScripts] [matchmaker.js] ✅ Match found: ${detailedInfo[0]} - Players: ${currentPlayers}/${detailedInfo[3]} - Time: ${tempsRestant}s`);
                matchingGames.push(detailedInfo);
            }
        }
    }

    // Remove status div
    statusDiv.remove();

    // Display results
    if (matchingGames.length > 0) {
        matchingGames.forEach(gameData => {
            const [gameId, , currentPlayers, maxPlayers, gameDetails, tempsRestant] = gameData;
            const mapName = gameDetails.i || 'Unknown';
            const hostName = gameDetails.h || mapName;
            const isFavMap = config.FAV_MAPS.includes(mapName);
            const mapNameColor = isFavMap ? "#6aff00ff" : "#a5a5a5";
            
            // Auto-join favorite maps if enabled
            if (isFavMap && config.AUTO_JOIN_FAV) {
                console.log(`[LombreScripts] [matchmaker.js] Auto-joining favorite map: ${mapName}`);
                window.location.href = `https://krunker.io/?game=${gameId}`;
                return;
            }

            const gameBox = document.createElement('div');
            gameBox.style.padding = '12px';
            gameBox.style.border = '1px solid #333';
            gameBox.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
            gameBox.style.borderRadius = '5px';
            gameBox.style.cursor = 'pointer';
            gameBox.style.transition = 'all 0.2s';

            gameBox.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #4dabf7;">🎯 ${hostName}</span>
                    <span style="color: #8cc265;">${currentPlayers}/${maxPlayers}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #f7b538;">⏱️ ${formatTime(tempsRestant)}</span>
                    <span style="color: ${mapNameColor};">${mapName}</span>
                </div>
            `;

            const joinButton = document.createElement('button');
            joinButton.textContent = 'Join';
            joinButton.className = 'button small buttonPI';
            joinButton.style.width = '100%';
            joinButton.style.padding = '8px';
            joinButton.style.backgroundColor = '#4dabf7';
            joinButton.style.border = 'none';
            joinButton.style.borderRadius = '3px';
            joinButton.style.color = 'white';
            joinButton.style.cursor = 'pointer';
            joinButton.style.transition = 'all 0.2s';

            joinButton.addEventListener('mouseover', () => {
                joinButton.style.backgroundColor = '#3a8bd5';
            });
            joinButton.addEventListener('mouseout', () => {
                joinButton.style.backgroundColor = '#4dabf7';
            });

            joinButton.addEventListener('click', () => {
                console.log(`[LombreScripts] [matchmaker.js] Joining game: ${gameId}`);
                window.location.href = `https://krunker.io/?game=${gameId}`;
                hideGameContainer();
            });

            gameBox.appendChild(joinButton);
            gameList.appendChild(gameBox);
        });
    } else {
        const noGames = document.createElement('div');
        noGames.style.padding = '20px';
        noGames.style.color = '#999';
        noGames.style.textAlign = 'center';
        noGames.textContent = 'No matching games found';
        gameList.appendChild(noGames);
    }

    gamesContainer.appendChild(gameList);
}

// Event listeners
document.addEventListener('keydown', async function (event) {
    if (event.key === 'F2') {
        let gamesContainer = document.querySelector("#customGameContainer");

        // Toggle visibility if container exists and is visible
        if (gamesContainer && gamesContainer.style.display !== 'none') {
            hideGameContainer();
            return;
        }

        // Create container if it doesn't exist
        if (!gamesContainer) {
            gamesContainer = document.createElement('div');
            gamesContainer.id = 'customGameContainer';
            gamesContainer.style.position = 'fixed';
            gamesContainer.style.top = '50%';
            gamesContainer.style.left = '50%';
            gamesContainer.style.transform = 'translate(-50%, -50%)';
            gamesContainer.style.width = '80%';
            gamesContainer.style.maxWidth = '600px';
            gamesContainer.style.padding = '15px';
            gamesContainer.style.backgroundColor = 'rgba(26, 26, 26, 0.9)';
            gamesContainer.style.borderRadius = '8px';
            gamesContainer.style.border = '2px solid #4dabf7';
            gamesContainer.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.5)';
            gamesContainer.style.zIndex = '1000';
            gamesContainer.style.display = 'block';
            document.body.appendChild(gamesContainer);
        } else {
            gamesContainer.style.display = 'block';
        }

        gamesContainer.innerHTML = '<div style="padding:20px;color:#4dabf7;text-align:center;">Fetching games...</div>';

        try {
            const data = await fetchKrunkerGames();
            if (data && data.games) {
                await displayGames(data);
            }
        } catch (error) {
            console.log('[LombreScripts] [matchmaker.js] Error:', error);
            gamesContainer.innerHTML = '<div style="padding:20px;color:#ff4444;text-align:center;">Loading error</div>';
        }
    }
});

// Hide when clicking outside the container
document.addEventListener('click', function(e) {
    const gamesContainer = document.querySelector("#customGameContainer");
    if (gamesContainer && gamesContainer.style.display !== 'none') {
        if (!gamesContainer.contains(e.target)) {
            hideGameContainer();
        }
    }
});

// Monitor UI state
let lastKnownClass = '';

function checkUiBaseState() {
    const uiBase = document.querySelector("#uiBase");
    const gamesContainer = document.querySelector("#customGameContainer");

    if (uiBase && gamesContainer) {
        const currentClass = uiBase.className;

        if (currentClass !== lastKnownClass) {
            lastKnownClass = currentClass;

            if (currentClass.includes("onGame")) {
                gamesContainer.style.display = 'none';
            } else if (!currentClass.includes("onMenu")) {
                gamesContainer.style.display = 'none';
            }
        }
    }
}

setInterval(checkUiBaseState, 100);

console.log("[LombreScripts] [matchmaker.js] Script loaded - UI state verification enabled");
