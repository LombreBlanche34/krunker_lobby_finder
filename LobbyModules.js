function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Fonction pour créer et afficher les jeux
function displayGames(gamesData) {
    // Vérifier que la boîte existe déjà
    let gamesContainer = document.querySelector("#customGameContainer");
    if (!gamesContainer) {
        // Créer la boîte si elle n'existe pas
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

        // Trouver l'élément sous lequel insérer la boîte
        const matchInfoHolder = document.querySelector("#matchInfoHolder");
        if (matchInfoHolder) {
            matchInfoHolder.parentNode.insertBefore(gamesContainer, matchInfoHolder.nextSibling);
        } else {
            console.error("Élement #matchInfoHolder non trouvé");
            return;
        }
    } else {
        gamesContainer.innerHTML = ''; // Clear previous content
    }

    // Ajouter un titre
    const title = document.createElement('div');
    title.style.fontSize = '18px';
    title.style.marginBottom = '15px';
    title.style.color = '#fff';
    title.style.textAlign = 'center';
    title.style.fontWeight = 'bold';
    title.textContent = 'Games disponibles (FRA)';
    gamesContainer.appendChild(title);

    let gameCount = 0;
    const gameList = document.createElement('div');
    gameList.style.display = 'flex';
    gameList.style.flexDirection = 'column';
    gameList.style.gap = '10px';

    gamesData.games.forEach((game) => {
        const [gameId, region, currentPlayers, maxPlayers, gameDetails, tempsRestant] = game;
        
        if (gameDetails &&
            gameDetails.c === 0 &&
            region.includes('fra') &&
            tempsRestant > 140 &&
            currentPlayers >= 4 &&
            currentPlayers <= 7 &&
            maxPlayers === 8 &&
            gameDetails.g === 0) {
            log(game)
            if (gameCount >= 3) return;

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

            gameBox.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #4dabf7;">🎯 Jeu FRA ${gameCount + 1}</span>
                    <span style="color: #8cc265;">${currentPlayers}/${maxPlayers}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #f7b538;">${formatTime(tempsRestant)}</span>
                    <span style="color: #a5a5a5;">${gameDetails.i}</span>
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
                // Logique pour rejoindre le jeu
                window.location.href = `https://krunker.io/?game=${gameId}`
                // Vous pouvez remplacer l'alert par la vraie logique de connexion
            });

            gameBox.appendChild(joinButton);
            gameList.appendChild(gameBox);
            gameCount++;
        }
    });

    if (gameCount === 0) {
        const noGames = document.createElement('div');
        noGames.style.padding = '20px';
        noGames.style.color = '#999';
        noGames.style.textAlign = 'center';
        noGames.textContent = 'Aucun jeu correspondant trouvé';
        gameList.appendChild(noGames);
    }

    gamesContainer.appendChild(gameList);
}

// Fonction pour récupérer les jeux
async function fetchKrunkerGames() {
    try {
        const response = await fetch('https://matchmaker.krunker.io/game-list?hostname=krunker.io');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du fetch:', error);
        throw error;
    }
}

// Gestionnaire d'événement pour la touche F2
let refreshTimeout;
document.addEventListener('keydown', async function(event) {
    if (event.key === 'F2') {
        // Annuler le timeout précédent s'il existe
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }

        // Afficher un indicateur de chargement
        const gamesContainer = document.querySelector("#customGameContainer");
        if (gamesContainer) {
            gamesContainer.innerHTML = '<div style="padding:20px;color:#4dabf7;text-align:center;">Chargement en cours...</div>';
        }

        // Récupérer et afficher les données
        try {
            const data = await fetchKrunkerGames();
            log("cest get")
            if (data && data.games) {
                log("j'ai des data")
                displayGames(data);
            }
        } catch (error) {
            console.error('Erreur:', error);
            if (gamesContainer) {
                gamesContainer.innerHTML = '<div style="padding:20px;color:#ff4444;text-align:center;">Erreur de chargement</div>';
            }
        }

        // Programmer un rafraîchissement automatique après 30 secondes
        refreshTimeout = setTimeout(() => {
            // Ne pas rafraîchir si la boîte n'est pas visible
            if (document.querySelector("#customGameContainer").style.display !== 'none') {
                document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'F2'}));
            }
        }, 10000);
    }
});

// Fonction pour masquer la boîte
function hideGameContainer() {
    const gamesContainer = document.querySelector("#customGameContainer");
    if (gamesContainer) {
        gamesContainer.style.display = 'none';
    }
}

// Fonction pour afficher la boîte
function showGameContainer() {
    const gamesContainer = document.querySelector("#customGameContainer");
    if (gamesContainer) {
        gamesContainer.style.display = 'block';
    }
}

// Écouter les événements de clic sur le bouton "Join"
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('buttonPI') && e.target.textContent === 'Join') {
        // Masquer la boîte après avoir cliqué sur Join
        hideGameContainer();
    }
});
