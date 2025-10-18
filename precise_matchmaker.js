const default_region = localStorage.getItem("kro_setngss_defaultRegion")

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to fetch detailed game info
async function fetchGameInfo(gameId) {
    try {
        const response = await fetch(`https://matchmaker.krunker.io/game-info?game=${gameId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        log('Error fetching game info:', error);
        return null;
    }
}

// Function to create and display available games
async function displayGames(gamesData) {
    // Check if the container already exists
    let gamesContainer = document.querySelector("#customGameContainer");
    if (!gamesContainer) {
        // Create the container if it doesn't exist
        gamesContainer = document.createElement('div');
        gamesContainer.id = 'customGameContainer';
        gamesContainer.style.position = 'absolute';
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

        // Insert the container below the match info element
        const matchInfoHolder = document.querySelector("#matchInfoHolder");
        if (matchInfoHolder) {
            matchInfoHolder.parentNode.insertBefore(gamesContainer, matchInfoHolder.nextSibling);
        } else {
            log("Element #matchInfoHolder not found");
            return;
        }
    } else {
        gamesContainer.innerHTML = ''; // Clear previous content
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

    // STEP 1: Filter with game-list (region, c === 0, g === 0)
    const candidateGames = [];
    for (const game of gamesData.games) {
        const [gameId, region, currentPlayers, maxPlayers, gameDetails, timeLeft] = game;

        if (gameDetails &&
            region === default_region &&
            gameDetails.c === 0 &&
            gameDetails.g === 0 &&
            timeLeft > 140
            ) {

            candidateGames.push(gameId);
        }
    }

    log(`Found ${candidateGames.length} candidate games from game-list`);

    // STEP 2: Verify each lobby with game-info and apply filters
    const matchingGames = [];
    for (const gameId of candidateGames) {
        if (matchingGames.length >= 3) break; // Limit to 3 results

        const detailedInfo = await fetchGameInfo(gameId);

        if (detailedInfo) {
            // Structure: ["BHN:cuyv4","me-bhn",0,50,{...},0]
            const [detailedGameId, detailedRegion, detailedCurrentPlayers, detailedMaxPlayers, detailedGameDetails, detailedTempsRestant] = detailedInfo;

            // FILTERS with the data from game-info
            if (detailedTempsRestant > 140 &&
                detailedCurrentPlayers >= 4 &&
                detailedCurrentPlayers <= 7) {

                log(`✅ Match found: ${detailedGameId} - Players: ${detailedCurrentPlayers}/${detailedMaxPlayers} - Time: ${detailedTempsRestant}s`);

                matchingGames.push({
                    gameId: detailedGameId,
                    region: detailedRegion,
                    currentPlayers: detailedCurrentPlayers,
                    maxPlayers: detailedMaxPlayers,
                    gameDetails: detailedGameDetails,
                    tempsRestant: detailedTempsRestant
                });
            }
        }
    }

    // STEP 3: Display the lobbies that match
    matchingGames.forEach((gameData, index) => {
        const { gameId, region, currentPlayers, maxPlayers, gameDetails, tempsRestant } = gameData;

        const gameBox = document.createElement('div');
        gameBox.style.padding = '12px';
        gameBox.style.border = '1px solid #333';
        gameBox.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
        gameBox.style.borderRadius = '5px';
        gameBox.style.cursor = 'pointer';
        gameBox.style.transition = 'all 0.2s';

        gameBox.addEventListener('mouseover', () => {
            gameBox.style.transform = 'scale(1.02)';
            gameBox.style.boxShadow = '0 0 10px rgba(77, 171, 247, 0.5)';
        });
        gameBox.addEventListener('mouseout', () => {
            gameBox.style.transform = 'scale(1)';
            gameBox.style.boxShadow = 'none';
        });

        const mapName = gameDetails.i || 'Unknown';
        const hostName = gameDetails.h || mapName;

        gameBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #4dabf7;">🎯 ${hostName}</span>
                <span style="color: #8cc265;">${currentPlayers}/${maxPlayers}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #f7b538;">⏱️ ${formatTime(tempsRestant)}</span>
                <span style="color: #a5a5a5;">${mapName}</span>
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
        });

        gameBox.appendChild(joinButton);
        gameList.appendChild(gameBox);
    });

    if (matchingGames.length === 0) {
        const noGames = document.createElement('div');
        noGames.style.padding = '20px';
        noGames.style.color = '#999';
        noGames.style.textAlign = 'center';
        noGames.textContent = 'No matching games found';
        gameList.appendChild(noGames);
    }

    gamesContainer.appendChild(gameList);
}

// Function to fetch game data
async function fetchKrunkerGames() {
    try {
        const response = await fetch('https://matchmaker.krunker.io/game-list?hostname=krunker.io');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        log('Error during fetch:', error);
        throw error;
    }
}

document.addEventListener('keydown', async function (event) {
    if (event.key === 'F2') {
        // Show loading indicator
        let gamesContainer = document.querySelector("#customGameContainer");
        if (!gamesContainer) {
            gamesContainer = document.createElement('div');
            gamesContainer.id = 'customGameContainer';
            gamesContainer.style.position = 'absolute';
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

            const matchInfoHolder = document.querySelector("#matchInfoHolder");
            if (matchInfoHolder) {
                matchInfoHolder.parentNode.insertBefore(gamesContainer, matchInfoHolder.nextSibling);
            }
        }

        if (gamesContainer) {
            gamesContainer.innerHTML = '<div style="padding:20px;color:#4dabf7;text-align:center;">Loading...</div>';
        }

        // Fetch and display data
        try {
            const data = await fetchKrunkerGames();
            if (data && data.games) {
                await displayGames(data);
            }
        } catch (error) {
            log('Error:', error);
            if (gamesContainer) {
                gamesContainer.innerHTML = '<div style="padding:20px;color:#ff4444;text-align:center;">Loading error</div>';
            }
        }
    }
});

// Function to hide the game container
function hideGameContainer() {
    const gamesContainer = document.querySelector("#customGameContainer");
    if (gamesContainer) {
        gamesContainer.style.display = 'none';
    }
}

// Function to show the game container
function showGameContainer() {
    const gamesContainer = document.querySelector("#customGameContainer");
    if (gamesContainer) {
        gamesContainer.style.display = 'block';
    }
}

// Hide the container after clicking "Join"
document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('buttonPI') && e.target.textContent === 'Join') {
        hideGameContainer();
    }
});
