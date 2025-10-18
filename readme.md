# matchmaker.js

This script adds a small interface to display and join **Krunker.io** lobbies.

## Features
- Shows a list of available public lobbies in your selected region.  
- Displays player count, remaining time, and lobby info.  
- Allows you to join a lobby with one click.  
- Press **F2** to refresh and show the current lobbies.  

## How to Use
1. Copy `matchmaker.js` in your userscripts folder.  
2. Press **F2** while on the Krunker main page to load available games.  
3. Click **Join** to enter a game lobby.  

## Notes
- The script automatically filters and shows up to 3 suitable games.  
- It uses your saved default region (`kro_setngss_defaultRegion`) from local storage.  
* The **Krunker matchmaker API** updates every **10 seconds**.


# precise_matchmaker.js

This script adds a small interface to display and join **Krunker.io** lobbies.
`precise_matchmaker.js` provides more accurate lobby matching using real-time data, unlike `matchmaker.js` which updates every 10 seconds. The trade-off is that `precise_matchmaker.js` requires more time to find matching lobbies.

## Features
- Shows a list of available public lobbies in your selected region.  
- Displays player count, remaining time, and lobby info.  
- Allows you to join a lobby with one click.  
- Press **F2** to refresh and show the current lobbies.  

## How to Use
1. Copy `precise_matchmaker.js` in your userscripts folder.  
2. Press **F2** while on the Krunker main page to load available games.  
3. Click **Join** to enter a game lobby.  

## Notes
- The script automatically filters and shows up to 3 suitable games.  
- It uses your saved default region (`kro_setngss_defaultRegion`) from local storage.  
* Realtime data
