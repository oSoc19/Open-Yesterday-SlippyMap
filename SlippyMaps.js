/**
 * The Configuration object used to set the properties of the map.
 */
class Configuration {
  /**
   * Set to true if we should override the configuration based on attributes
   * in the map's div.
   */
  canOverrideFromDivAttributes = true;
  /**
   * The Center of the Map.
   * Default Parameter is roughly in the center of Belgium.
   */
  viewCenter = [50.605902641613284, 4.752960205078125];
  /**
   * The Zoom level of the map
   * Default parameter is 9, enough to see nearly every part of Belgium.
   */
  viewZoom = 9;
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
  overrideFromDivAttributes(div) {
    // Utils
    function warnIllFormedAttr(attrName, value) {
      console.warn('Ill-formed attribute for %o: %o', attrName, value);
    }

    // Overriding viewCenter
    if (div.hasAttribute('viewCenter')) {
      let value = div.getAttribute('viewCenter');
      // Must be a string with 2 floating-point numbers, separated by a comma
      // and between brackets. e.g [3.14, 3.14]
      if (/^\[(\d+.\d+)\s?,\s?(\d+.\d+)\]$/.test(value))
        this.viewCenter = JSON.parse(value);
      else
        warnIllFormedAttr('viewCenter', value);
    }

    // Overriding viewZoom
    if (div.hasAttribute('viewZoom')) {
      let value = div.getAttribute('viewZoom');
      // Must be a number, maybe a decimal one.
      if (/^\d+(.\d+)?$/.test(value))
        this.viewZoom = parseInt(value);
      else
        warnIllFormedAttr('viewZoom', value);
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
 * @param {Configuration} configuration the Configuration object. 
 *                        Can be undefined. If that's the case, a default-constructed object will be used.
 *                        However, if you want to reuse the configuration object later, it's better to pass one.
 *  
 * If configuration.canOverrideFromDivAttributes is set to true, this will call 
 * configuration.overrideFromDivAttributes to update the configuration based on the attributes
 * of the div.
 */
function showMap(mapId, configuration) {
  if (configuration == undefined)
    configuration = new Configuration();

  let div = document.getElementById('mapid');
  if (div == null) {
    console.error("Cannot create map - div with id '%o' does not exist", mapId);
    return;
  }

  if (configuration.canOverrideFromDivAttributes) {
    configuration.overrideFromDivAttributes(div);
  }

  let map = L.map('mapid').setView(configuration.viewCenter, configuration.viewZoom);
  L.tileLayer(configuration.tileLayer, { attribution: configuration.tileLayerAttribution }).addTo(map);
  return map;
}

/**
 * Queries the Overpass API and adds the returned points on the map.
 * This is asynchronous, and the points will be added once the query is completed.
 * @param {*} map the map
 * @param {string} query the query
 * @param {Configuration} configuration the configuration object. can be null.
 */
function queryFeatures(map, query, configuration) {
  if (configuration == undefined)
    configuration = new Configuration();
  // Send the query asynchronously
  let xhttp = new XMLHttpRequest();
  query = "http://overpass-api.openhistoricalmap.org/api/interpreter?data=".concat(query);
  query = encodeURI(query);
  xhttp.open("GET", query);
  // When it's ready, handle the results
  xhttp.onreadystatechange = function () {
    // Only handle the result if the request has been completed
    if (this.readyState != 4)
      return;
    // 200 = OK, Anything else is considered a failure.
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
      console.log("String that we tried to parse: %o", rawJSON);
      console.log("JSON.parse() Result: %o", json);
      return;
    }

    let maxElements = configuration.maxElements;
    // Once that's done, gather the list of features. They're located in the "elements" part of the
    // JSON.
    if (json.elements != undefined) {
      let elements = json.elements;
      // Cap the number of elements shown for performance reasons.
      for (let element of elements.slice(0, maxElements))
        L.marker(L.latLng(element.lat, element.lon)).addTo(map);
      if ((maxElements != undefined) && (elements.length > maxElements)) {
        let omitted = elements.length - maxElements;
        console.warn("Capped the number of markers shown on screen, %o markers were not shown."
          + " (Cap is %o and query returned %o features)", omitted, maxElements, elements.length);
      }
      else
        console.log("Added %o elements", elements.length);
    }
    else
      console.log("No elements found");
  }
}