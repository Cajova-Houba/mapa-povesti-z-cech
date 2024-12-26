import '../css/style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import {OSM} from 'ol/source.js';
import {toLonLat} from 'ol/proj';

// used converter
// https://epsg.io/transform#s_srs=4326&t_srs=3857&x=14.5484770&y=50.1220690
// EPSG:4326: 14.5484770, 50.1220690
// EPSG:3857: 1619529.051458, 6467442.940923
const PRAGUE_COORDINATES = [1619529.051458, 6467442.940923];
const PROJECTION = "EPSG:3857";

const jsonDataTemplate = "{\n" +
            "\t\"coordinates\": [{{coordinates}}],\n" +
            "\t\"name\": \"{{name}}\",\n" +
            "\t\"text\": [ \n"+
            "\t\t\"{{textLines}}\"\n" +
            "\t],\n" +
            "\t\"author\": \"{{author}}\",\n" +
            "\t\"number\": {{number}},\n" +
            "\t\"adius\": 5000\n" +
        "}\n";

const mapLayer = new TileLayer({ source: new OSM() });
/**
 * Create the map.
 */
const map = new Map({
    target: 'map',
    layers: [
      mapLayer
    ],
    view: new View({
      center: PRAGUE_COORDINATES,
      zoom: 8,
      projection: PROJECTION
    })
});

// update coordinate in the input field
map.on('singleclick', function (evt) {
    const coordinate = evt.coordinate;

    console.log(`Clicked coordinate: ${coordinate}`);

    document.getElementById('legend-coordinates').value = toLonLat(coordinate);
});

function generateJsonData() {
    console.log('Generating data...');

    const textLines = document.getElementById('legend-text').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join('",\n\t\t"');

    const jsonData = jsonDataTemplate
        .replace('{{coordinates}}', document.getElementById('legend-coordinates').value.replace(",", ", "))
        .replace('{{name}}', document.getElementById('legend-name').value)
        .replace('{{textLines}}', textLines)
        .replace('{{author}}', document.getElementById('legend-author').value)
        .replace('{{number}}', document.getElementById('legend-number').value)
    ;

    document.getElementById('legend-json').value = jsonData;
}

document.getElementById('generate-json-data-btn').addEventListener('click', generateJsonData);