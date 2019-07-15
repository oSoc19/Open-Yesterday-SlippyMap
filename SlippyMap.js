/**
 * The unique identifiers given to some basic, built-in queries.
 */
const BasicQuery = {
  // Show factories
  Factories: 1,
  // Show chimneys
  Chimneys: 2,
  // Show breweries
  Breweries: 3,
}

/**
 * The Configuration of a map.
 * 
 * For the configuration to be applied, you must pass it to showMap or call updateMap manually.
 * The configuration is completely separate from the map instance.
 */
class Configuration {
  /**
   * Set to true if we should override the configuration based on attributes
   * in the map's div.
   */
  canUseDivAttributes = true;
  /**
   * The Center of the Map.
   * Default Parameter is roughly in the center of Belgium.
   */
  center = [50.605902641613284, 4.752960205078125];
  /**
   * The Zoom level of the map
   * Default parameter is 14.
   */
  zoom = 14;
  /**
   * The TileLayer to use.
   * See https://leafletjs.com/reference-1.5.0.html#tilelayer for more information.
   * Default value is the OSM default map: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   */
  tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  /**
   * The tileLayer's attribution text.
   * Default value is the attribution for the OSM default map (see above).
   */
  tileLayerAttribution = '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  /**
   * The maximum number of elements that can be shown on-screen
   * Set to undefined to remove the limit.
   */
  maxElements = 500;

  /**
   * Override this configuration object's member from a div's attribute.
   * The attributes must be named the same as the members, and they are checked
   * to see if the attribute's string is well-formed.
   * @param {*} div the div object
   */
  useDivAttributes(div) {
    // Utils
    function warnIllFormedAttr(attrName, value) {
      console.warn('Ill-formed attribute for %o: %o', attrName, value);
    }

    // Overriding center
    let hasSetcenter = false;
    if (div.hasAttribute('center')) {
      let value = div.getAttribute('center');
      // Must be a string with 2 floating-point numbers, separated by a comma
      // and between brackets. e.g [3.14, 3.14]
      if (/^\[(\d+.\d+)\s?,\s?(\d+.\d+)\]$/.test(value)) {
        this.center = JSON.parse(value);
        hasSetcenter = true;
      }
      else
        warnIllFormedAttr('center', value);
    }

    // Overriding zoom
    if (div.hasAttribute('zoom')) {
      let value = div.getAttribute('zoom');
      // Must be a number, maybe a decimal one.
      if (/^\d+(.\d+)?$/.test(value))
        this.zoom = parseInt(value);
      else
        warnIllFormedAttr('zoom', value);
    }

    // Overriding tileLayer
    if (div.hasAttribute('tileLayer'))
      this.tileLayer = div.getAttribute('tileLayer');

    // Overriding tileLayerAttribution
    if (div.hasAttribute('tileLayerAttribution'))
      this.tileLayerAttribution = div.getAttribute('tileLayerAttribution');

    // Overriding maxElements
    if(div.hasAttribute('maxElements')) {
      let value = div.getAttribute('maxElements');
      // Must be a number
      if (/^\d+?$/.test(value))
        this.maxElements = parseInt(value);
      else
        warnIllFormedAttr('maxElements', value);
    }
  }
}

/**
 * Creates and displays a map in place of the div with id mapId
 * @param {string} mapId The HTML id of the div that should become the map
 * @param {Configuration} conf the Configuration object. 
 *                        Can be undefined. If that's the case, a default-constructed object will be used.
 *                        However, if you want to reuse the configuration object later, it's better to pass one.
 *  
 * If conf.canUseDivAttributes is set to true, this will call 
 * conf.useDivAttributes to update the configuration based on the attributes
 * of the div.
 */
function showMap(mapId, conf) {
  if (conf == undefined)
    conf = new Configuration();

  let div = document.getElementById(mapId);
  if (div == null) {
    console.error("Cannot create map - div with id '%o' does not exist", mapId);
    return;
  }

  if (conf.canUseDivAttributes) {
    conf.useDivAttributes(div);
  }

  let map = L.map('mapid');
  updateMap(map, conf);

  // If the div has a "focusOn" attribute, call focusOn on the div.
  if(div.hasAttribute('focusOn'))
    focusOn(map, div.getAttribute('focusOn'));

  return map;
}

/**
 * Updates a map using a configuration object.
 * 
 * @param {Leaflet.Map} map the map
 * @param {Configuration} conf the configuration object
 * @param {boolean} removeOldLayers if set to true, the old layers of the map 
 *                                  will be removed. Default is true.
 */
function updateMap(map, conf, removeOldLayers = true) {
  if(conf === undefined) {
    console.error("updateMap - no configuration given");
    return;
  }
  if(map === undefined) {
    console.error("updateMap - no map given");
    return;
  }
  map.setView(conf.center, conf.zoom);
  if(removeOldLayers === true)
    map.layers = [];
  L.tileLayer(conf.tileLayer, { attribution: conf.tileLayerAttribution }).addTo(map);
}


  /**
   * Centers the map on something.
   * This will perform a search using Nominatim, and center the map on the first result.
   * If no result is found, the coordinates are unchanged.
   * 
   * The nominatim query will be performed using the following options:
   *    - limit=1 
   *    - viewbox=current bounds (map.getBounds().toBBoxString())
   *    - format=json 
   *    - q=query (the query string)
   * @param {Leaflet.Map} map the Leaflet map
   * @param {string} query The nominatim query. Example "Antwerpen", "Brugge", etc.
   * 
   * If the result of this function isn't satisfying, try to make a more specific query
   * e.g. "Antwerpen Belgium", or simply set the coordinates manually.
   */
function focusOn(map, query) {
  if(typeof query !== 'string') {
    console.error("Query is not a string");
    return;
  }
  // Prepare the request
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState != 4) return;
    if  (this.status == 200)
      handleQueryResult(this.responseText);
    else
      console.error("focusOn - Nominatim query failed with code %o: %o", this.status, this.responseText);
  };
  // Prepare the query
  let queryURL = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&viewbox=${map.getBounds().toBBoxString()}&limit=1`;
  // Send the request
  xhttp.open("GET", encodeURI(queryURL));
  xhttp.send();
  /**
   * Handles the result of a successful nominatim query.
   * @param {string} resultString the result string of the query. Must be JSON
   */
  function handleQueryResult(resultString) {
    let result;
    try {
      result = JSON.parse(resultString);
    }
    catch(err) {
      console.error("focusOn - an error occured while parsing the Nominatim query result: %o", err);
      return;
    }
    // Fetch the first result. If there's no result, don't do anything.
    result = result[0];
    if(result == undefined) {
      console.log("focusOn - No result found for query '%o'", query);
      return;
    }
    // Center the map on the lat/lon
    map.setView(L.latLng(result.lat, result.lon));
  }
}

/**
 * Queries the Overpass API and adds the returned points on the map.
 * This is asynchronous, and the points will be added once the query is completed.
 * @param {Leaflet.Map} map the map
 * @param {string} query the query
 * @param {Configuration} conf the configuration object. can be null.
 */
function queryAndShowFeatures(map, query, conf) {
  // Create a configuration object if we don't have one
  if (configuration == undefined)
    configuration = new Configuration();

  // Create the query URL for the OHM Overpass API.
  query = "http://overpass-api.openhistoricalmap.org/api/interpreter?data=".concat(query);
  query = encodeURI(query);
  // Create the XMLHttpRequest to send the GET request asynchronously
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", query);
  // Set the callback
  xhttp.onreadystatechange = function () {
    // Only handle the result if the request has been completed
    if (this.readyState != 4)
      return;
    // 200 = OK, anything else is considered a failure.
    if (this.status === 200)
      handleQueryResult(this.responseText, configuration);
    else
      console.error("The Request could not be completed. Status: %o", this.status);
  }
  xhttp.send();

  /**
  * Handles the result of a successful query to the Overpass API, adding the features as markers on the map.
  * @param {string} rawJSON the raw JSON string
  * @param {Configuration} configuration the configuration object. can be null.
  */
  function handleQueryResult(rawJSON, configuration) {
    // First, parse the raw json.
    let json;
    try {
      json = JSON.parse(rawJSON);
    }
    catch (err) {
      console.error("JSON Parsing Error!");
      console.log("string that we tried to parse: %o", rawJSON);
      console.log("JSON.parse() Result: %o", json);
      return;
    }

    let maxElements = conf.maxElements;
    // Once that's done, gather the list of features. They're located in the "elements" part of the
    // JSON.
    if (json.elements != undefined) {
      let elements = json.elements;
      // Cap the number of elements shown for performance reasons.
      for (let element of elements.slice(0, maxElements))
        L.marker(L.latLng(element.lat, element.lon)).addTo(map);
      if ((maxElements != undefined) && (elements.length > maxElements)) {
        let omitted = elements.length - maxElements;
        console.warn("Markers Cap Reached: %o markers were not shown."
          + " (Cap is %o and query returned %o features)", omitted, maxElements, elements.length);
      }
      else
        console.log("Added %o elements", elements.length);
    }
    else
      console.log("No elements found");
  }
}