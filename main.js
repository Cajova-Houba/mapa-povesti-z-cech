import './style.css';
import {Feature, Map, View} from 'ol';
import {Circle} from 'ol/geom.js';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Overlay from 'ol/Overlay.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import data from './source_data.json';
import {fromLonLat} from 'ol/proj';
import {Style, Fill, Stroke} from 'ol/style.js';

// source book ISBN: 978-80-7428-011-5
const SOURCE_CITATION="GROHMANN, Joseph Virgil. Pověsti z Čech. Fabula. Praha: Plot, 2009. ISBN 978-80-7428-011-5."

// used converter
// https://epsg.io/transform#s_srs=4326&t_srs=3857&x=14.5484770&y=50.1220690
// EPSG:4326: 14.5484770, 50.1220690
// EPSG:3857: 1619529.051458, 6467442.940923
const PRAGUE_COORDINATES = [1619529.051458, 6467442.940923];

const DEFAULT_FEATURE_RADIUS = 15000;

const PROJECTION = "EPSG:3857";


/**
 * Elements that make up the popup.
 */
const container = document.getElementById('popup');
const closer = document.getElementById('popup-closer');
const content = document.getElementById('popup-content');
const popupTitle = document.getElementById('popup-title');
const popupAuthor = document.getElementById('popup-author');

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

/**
 * Create an overlay to anchor the popup to the map.
 */
const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});
const overlays = [overlay];

const features = initFeatures(data.places);

/**
 * Create the map.
 */
const map = new Map({
  target: 'map',
  overlays: overlays,
  layers: [
    new TileLayer({
      source: new OSM()
    }),

    new VectorLayer({
      source: new VectorSource({
        features: features
      })
    })
  ],
  view: new View({
    center: PRAGUE_COORDINATES,
    zoom: 8,
    projection: PROJECTION
  })
});

/**
 * Add a click handler to the map to render the popup.
 * Features themselves do not have click handlers, so we listen for clicks on the 
 * map and then find the feature at the clicked location.
 */
map.on('singleclick', function (evt) {
  const clickedFeature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
  const coordinate = evt.coordinate;

  // no feature found => do nothing
  if (!clickedFeature) {
    return;
  }

  // clear popup as to not show old content
  clearPopup(); 

  const featureData = clickedFeature.get('featureData');

  popupTitle.innerHTML = featureData['name'];

  // text is an array of paragraphs
  const text = featureData['text'];
  content.innerHTML = text.map((paragraph) => `<p>${paragraph}</p>`).join('');
  
  if (featureData['author']) {
    popupAuthor.innerHTML = `${featureData['author']}`;
  }
  overlay.setPosition(coordinate);
});

function initFeatures(data) {
  const featureStyle = new Style({
    stroke: new Stroke({
      color: [255,0,0,1],
      width: 2
    }),
    fill: new Fill({color: [255,0,0,0.3]}),
  });

  const features = data.map((item) => {
    var f = new Feature({
      geometry: new Circle(fromLonLat(item.coordinates), item.radius || DEFAULT_FEATURE_RADIUS),
      featureData: item,
    });
    f.setStyle(featureStyle);
    return f;
  });

  return features;
}

function clearPopup() {
  popupTitle.innerHTML = '';
  content.innerHTML = '';
  popupAuthor.innerHTML = '';
}
