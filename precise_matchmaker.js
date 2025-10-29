const default_region = localStorage.getItem("kro_setngss_defaultRegion");
const favMap = ["Sandstorm", "Evacuation", "Industry", "Undergrowth", "site"];

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
        console.log('Error fetching game info:', error);
        return null;
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

        // Add to body directly
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
    title.textContent = `Available Games (${default_region})`;
    gamesContainer.appendChild(title);

    const gameList = document.createElement('div');
    gameList.style.display = 'flex';
    gameList.style.flexDirection = 'column';
    gameList.style.gap = '10px';

    // Filter games
    const candidateGames = gamesData.games.filter(game => {
        const [, region, , , gameDetails, timeLeft] = game;
        return gameDetails &&
               region === default_region &&
               gameDetails.c === 0 &&
               gameDetails.g === 0 &&
               timeLeft > 140;
    }).map(game => game[0]);

    console.log(`Found ${candidateGames.length} candidate games from game-list`);

    // Verify each lobby
    const matchingGames = [];
    for (let i = 0; i < candidateGames.length && matchingGames.length < 3; i++) {
        const gameId = candidateGames[i];
        const statusDiv = gamesContainer.querySelector('div');
        if (statusDiv) {
            statusDiv.textContent = `Checking game ${i+1}/${candidateGames.length}`;
        }

        const detailedInfo = await fetchGameInfo(gameId);
        if (detailedInfo) {
            const [, , currentPlayers, , , tempsRestant] = detailedInfo;
            if (tempsRestant > 140 && currentPlayers >= 4 && currentPlayers <= 7) {
                console.log(`✅ Match found: ${detailedInfo[0]} - Players: ${currentPlayers}/${detailedInfo[3]} - Time: ${tempsRestant}s`);
                matchingGames.push(detailedInfo);
            }
        }
    }

    // Display results
    if (matchingGames.length > 0) {
        matchingGames.forEach(gameData => {
            const [gameId, , currentPlayers, maxPlayers, gameDetails, tempsRestant] = gameData;
            const mapName = gameDetails.i || 'Unknown';
            const hostName = gameDetails.h || mapName;
            const mapNameColor = favMap.includes(mapName) ? "#6aff00ff" : "#a5a5a5";

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

async function fetchKrunkerGames() {
    try {
        const response = await fetch('https://matchmaker.krunker.io/game-list?hostname=krunker.io');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.log('Error during fetch:', error);
        throw error;
    }
}

document.addEventListener('keydown', async function (event) {
    if (event.key === 'F2') {
        let gamesContainer = document.querySelector("#customGameContainer");
        
        // If the container exists and is visible, hide it
        if (gamesContainer && gamesContainer.style.display !== 'none') {
            hideGameContainer();
            return;
        }
        
        // Otherwise, create or display and load the data
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
            console.log('Error:', error);
            gamesContainer.innerHTML = '<div style="padding:20px;color:#ff4444;text-align:center;">Loading error</div>';
        }
    }
});

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

// Hide when clicking join button
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('buttonPI') && e.target.textContent === 'Join') {
        hideGameContainer();
    }
});

// Hide when clicking outside the container
document.addEventListener('click', function(e) {
    const gamesContainer = document.querySelector("#customGameContainer");
    
    if (gamesContainer && gamesContainer.style.display !== 'none') {
        // Check if the click is outside the container
        if (!gamesContainer.contains(e.target)) {
            hideGameContainer();
        }
    }
});

// Variable to store the last known class
let lastKnownClass = '';

// Function to check uiBase state
function checkUiBaseState() {
    const uiBase = document.querySelector("#uiBase");
    const gamesContainer = document.querySelector("#customGameContainer");
    
    if (uiBase && gamesContainer) {
        const currentClass = uiBase.className;
        
        // Check if the class has changed
        if (currentClass !== lastKnownClass) {
            lastKnownClass = currentClass;
            
            if (currentClass.includes("onMenu")) {
                // Don't automatically show, just allow display
            } else if (currentClass.includes("onGame")) {
                gamesContainer.style.display = 'none';
            } else {
                gamesContainer.style.display = 'none';
            }
        }
    }
}

// Start periodic checking (every 100ms)
setInterval(checkUiBaseState, 100);

// Initial log to confirm script is loaded
console.log("[Matchmaker] Script loaded - UI state verification enabled");
