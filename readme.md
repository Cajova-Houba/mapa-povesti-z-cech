# About

A simple web page which displays a selection of fairytales and myths from the book "Pověsti z Čech" by Joseph Virgril Grohmann. Proper citation:

> GROHMANN, Joseph Virgil. Pověsti z Čech. Fabula. Praha: Plot, 2009. ISBN 978-80-7428-011-5.

All myths are in Czech.

The map is based on [OpenLayers](https://openlayers.org).

# Dev info

- start dev server: `npm start`
- create a build: `npm run build`
- serve the build: `npm run serve`

## Source data format

The source data are placed in the file `source_data.json`. One myth is one item. The structure of the item is:

```json
{
    "coordinates": [16.1907103, 49.9309694],
    "name": "Nebeští vojáci u Vysokého Mýta",
    "text": [
        "Čtvrt hodiny cesty od Vysokého Mýta východním směrem leží půvabný lesík Dráby. Uprostřed je údolí, kde se prý o štědrovečerní půlnoci zjevují „nebeští vojáci“. Jsou to ohnivé postavy, které tančí za pronikavých zvuků trubek a po několika minutách zmizí."
    ],
    "author": "J. Toman z Vysokého Mýta",
    "number": 1,
    "notes": [
        "The first note",
        "The second note"
    ],
    "radius": 5000
}
```

- `coordinates`: Where the myth is taking place, mandatory
- `text`: An array of paragraphs, mandatory
- `author`: Author of the myth, optional
- `number`: Number of the myth (according to the source book), optional, not used yet
- `notes`: An array of notes (e.g. additional info for given myth), optional, not used yet
- `radius`: A radius of the circle representing the myth on the map, optional, defaults to 15000

