import './style.css';
import {Feature, Map, View} from 'ol';
import {Circle, Point} from 'ol/geom.js';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Overlay from 'ol/Overlay.js';
import {Cluster, OSM, Vector as VectorSource} from 'ol/source.js';
import data from './source_data.json';
import {fromLonLat} from 'ol/proj';
import {Style, Fill, Stroke, Circle as CircleStyle, Text as TextStyle} from 'ol/style.js';
import {boundingExtent} from 'ol/extent.js';

// source book ISBN: 978-80-7428-011-5
const SOURCE_CITATION="GROHMANN, Joseph Virgil. Pověsti z Čech. Fabula. Praha: Plot, 2009. ISBN 978-80-7428-011-5."

// used converter
// https://epsg.io/transform#s_srs=4326&t_srs=3857&x=14.5484770&y=50.1220690
// EPSG:4326: 14.5484770, 50.1220690
// EPSG:3857: 1619529.051458, 6467442.940923
const PRAGUE_COORDINATES = [1619529.051458, 6467442.940923];

const DEFAULT_FEATURE_RADIUS = 15000;

const PROJECTION = "EPSG:3857";

const CLUSTER_DISTANCE = 30;

const CLUSTER_MIN_DISTANCE = 0;

/**
 * Zoom level at which we switch from cluster to single feature view.
 */
const ZOOM_LAYER_SWITCH_THRESHOLD = 14;

const CLUSTER_FEATURE_RADIUS = 12;

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

const STYLES = {
  stroke:  new Stroke({
    color: [0,255,0,1],
    width: 2
  }),
  opaqueFill: new Fill({color: [255,255,255,1]}),
  textFill: new Fill({color: '#000'}),
  singleFeature: new Style({
      image: new CircleStyle({
        radius: CLUSTER_FEATURE_RADIUS,
        stroke: new Stroke({
          color: [0,255,0,1],
          width: 2
        }),
        fill: new Fill({color: [255,255,255,1]}),
      }),
      text: new TextStyle({
        text: '',
        fill: new Fill({color: '#000'})
      }),
    })
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

const styleCache = {};

/**
 * Function to determine a style of a clustered features.
 */
function clusterFeatureStyle(feature) {
  const size = feature.get('features').length;

  // multiple pips => show as cluster
  if (size > 1) {
    return new Style({
      image: new CircleStyle({
        radius: CLUSTER_FEATURE_RADIUS,
        stroke: STYLES.stroke,
        fill: STYLES.opaqueFill,
      }),
      text: new TextStyle({
        text: size.toString(),
        fill: STYLES.textFill
      }),
    });
  } else {
    return STYLES.singleFeature;
  }
}

const features = initFeatures(data.places);

const featureSource = new VectorSource({features: features});

// const clusterSource = new Cluster({source: featureSource, minDistance: CLUSTER_MIN_DISTANCE, distance: CLUSTER_DISTANCE, geometryFunction: feature => new Point(feature.getGeometry().getCenter())});
const clusterSource = new Cluster({source: featureSource, minDistance: CLUSTER_MIN_DISTANCE, distance: CLUSTER_DISTANCE});

const mapLayer = new TileLayer({ source: new OSM() });

// this layer will be used on most zoom levels
const clusterLayer = new VectorLayer({
  source: clusterSource,
  style: clusterFeatureStyle,
  maxZoom: ZOOM_LAYER_SWITCH_THRESHOLD,
});

// this layer will be used on the highest zoom level
const featureLayer = new VectorLayer({
    source: featureSource, 
    style: STYLES.singleFeature,
    minZoom: ZOOM_LAYER_SWITCH_THRESHOLD
});

/**
 * Create the map.
 */
const map = new Map({
  target: 'map',
  overlays: overlays,
  layers: [
    mapLayer,
    clusterLayer,
    featureLayer
  ],
  view: new View({
    center: PRAGUE_COORDINATES,
    zoom: 8,
    projection: PROJECTION
  })
});

map.on('moveend', function(e) {
  var newZoom = map.getView().getZoom();
  console.log('zoom end, new zoom: ' + newZoom);
});

/**
 * Add a click handler to the map to render the popup.
 * Features themselves do not have click handlers, so we listen for clicks on the 
 * map and then find the feature at the clicked location.
 */
map.on('singleclick', function (evt) {
  const clickedFeature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
  const coordinate = evt.coordinate;

  console.log(`clickedFeature: ${clickedFeature}, coordinate: ${coordinate}`);
  console.log(clickedFeature);

  // no feature found => do nothing
  // or feature is not a cluster => do nothing
  if (!clickedFeature) {
    return;
  }

  // clear popup as to not show old content
  clearPopup(); 

  // three possible cases
  // 1. a feature symbolizing a cluster of multiple features clicked
  // 2. a feature symbolizing a cluster of one feature clicked
  // 3. a single feature clicked

  // cases 1 and 2
  if (clickedFeature.get('features')) {
    console.log('Cluster clicked');

    // we use cluester as features
    const featuresInCluster = clickedFeature.get('features');

    // more than one feature in cluster => zoom in
    if (featuresInCluster.length > 1) {
      console.log(`Zooming in to cluster with ${featuresInCluster.length} features`);
      const coordinates = featuresInCluster.map((r) => {
        console.log(r);
        console.log(r.getGeometry().getCoordinates());
        return r.getGeometry().getCoordinates();
      });
      console.log(`coordinates: ${coordinates}`);
      const extent = boundingExtent(coordinates);
      map.getView().fit(extent, {duration: 1000, padding: [50, 50, 50, 50]});

    // only one feature in cluster => show popup with myth
    } else {
      showPopup(featuresInCluster[0].get('featureData'), coordinate);
    }
  } 
  
  // case 3
  else if (clickedFeature.get('featureData')) {
    console.log('Single feature clicked');
    showPopup(clickedFeature.get('featureData'), coordinate);
  }

  
});

/**
 * Show popup with given feature data on given coordinates.
 * 
 * @param {*} featureData Feature data. See source_data for structure.
 * @param {*} popupCoordinate Coordinates where to show the popup.
 */
function showPopup(featureData, popupCoordinate) {
  popupTitle.innerHTML = featureData['name'];

  // text is an array of paragraphs
  const text = featureData['text'];
  content.innerHTML = text.map((paragraph) => `<p>${paragraph}</p>`).join('');
  
  if (featureData['author']) {
    popupAuthor.innerHTML = `${featureData['author']}`;
  }
  overlay.setPosition(popupCoordinate);
}


function createPipFeature(dataItem) {
  const feature = new Feature({
    geometry: new Point(fromLonLat(dataItem.coordinates)),
    featureData: dataItem,
  });
  return feature;
}

function initFeatures(data) {
  return data.map((item) => createPipFeature(item));
}

function clearPopup() {
  popupTitle.innerHTML = '';
  content.innerHTML = '';
  popupAuthor.innerHTML = '';
}
