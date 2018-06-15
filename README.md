# Dungeons and Dragons

Game board for D&D.
live server at http://47.152.38.4:8080/static/index.html

## How to run locally:

1. First install the requirements using pip
`pip install -r requirements.txt`

2. Run maap.py
`python3 maap.py`

3. http://localhost:8080 (Or whichever port maap.py guides to) should let you create a new map.

## Interface
To the left, there is the layer selection bar. The brown square is the background layer, the white circle is the entity layer, and the purple square is the effects layer.
The background layer has the map layout, and is created by the DM. The entity layer has players, enemies, NPCs, and interactive objects such as chests. The effects layer can be used to track status effects and area-of-effect spells.

In the top-left corner, there is the tool selection bar. The brush allows the DM to place tiles on the currently selected layer, by moving the mouse while holding down the mouse button. Right-clicking can be used to erase. The move tool allows users to move given tiles from one location to another: this is the only tool that players can use, and it allows them to move tiles on the entity layer. The trash tool allows the DM to delete a whole layer, by selecting the tool and layer to delete, and clicking on the map anywhere.

Along the top is the tile selection bar, which is like a palette. Whatever tile is selected here will be laid down by the brush.

## Technology
The frontend uses Javascript, and the libraries jquery and lodash. The interface uses styled `div` elements to display the map.
The backend uses Python, specifically the new asyncio standard library module and the library aiohttp.
The frontend and backend communicate using WebSockets, which are a newer browser feature that allows for real-time communication between clients and servers.
The backend is very simple right now. It simply sets up WebSocket handlers and tracks what clients are currently connected. Whenever it is sent updated map data, it just sends this to all clients (other than the one who sent the new data.)

---

## Suggested features for expansion

- Proper touch support, for phones and tablets
- Merging when two conflicting changes come in at about the same time (currently the last one to arrive overwrites the others)
- Undo action for DM
- Character specification sheet (work in progress)
- Character marker
- Status marker (buff/debuff, unconscious, stabilized, hidden, etc)
