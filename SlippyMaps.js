/**
 * The unique identifiers given to cities for the
 * Configuration.centerOnCity function
 */
const City = {
  Gent: 1,
  Brugge: 2,
  Kortrijk: 3,
  Antwerpen: 4,
  Brussel: 5,
  Bruxelles: 5,
}

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
    let hasSetViewCenter = false;
    if (div.hasAttribute('viewCenter')) {
      let value = div.getAttribute('viewCenter');
      // Must be a string with 2 floating-point numbers, separated by a comma
      // and between brackets. e.g [3.14, 3.14]
      if (/^\[(\d+.\d+)\s?,\s?(\d+.\d+)\]$/.test(value)) {
        this.viewCenter = JSON.parse(value);
        hasSetViewCenter = true;
      }
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

    // Also accept a 'city' attribute (which should be a value in the 'City' constant)
    // to focus on a given city.
    // If the user has both a viewCenter and city attribute, warn it.
    if(div.hasAttribute('city')) {
      let city = City[div.getAttribute('city')];
      if(city == undefined)
        warnIllFormedAttr('city', 'unknown city (undefined)');
      else {
        this.focusOnCity(city);
        if(hasSetViewCenter)
          console.warn("viewCenter attribute was overriden by city attribute");
      }
    }
  }

  /**
   * Centers the map on a given city
   * @param {*} city A value in the 'City' variable.
   * @param {bool} shouldZoom If set to true, the zoom level will be adjusted as well to
   *                          make the whole city visible. Default is true.
   */
  focusOnCity(city, shouldZoom = true) {
    /**
     * Helper setter.
     * @param {Configuration} instance current instance of the Configuration class (this). 
     *                        It has to be passed as parameter because 'this' isn't available 
     *                        inside the body of this function. (Or more precisely, it's not
     *                        the 'this' we're looking for)
     * @param {number} lat latitude of the view center
     * @param {number} lng longitude of the view center
     * @param {number} zoom zoom of the view (will only be set if shouldZoom === true)
     */
    function set(instance, lat, lng, zoom) {
      instance.viewCenter = [lat, lng];
      if(shouldZoom === true) 
      instance.viewZoom = zoom;
    }
    // Switch to the correct city.
    switch(city) {
      default:
        console.error("Can't center on city - unknown city");
      case undefined:
        console.error("Can't center on city - no city given (undefined)");
        break;
      case City.Gent:
        set(this, 51.05364274168696, 3.7278842926025395, 14);
        break;
      case City.Brugge:
        set(this, 51.20962577701306, 3.2314395904541016, 14);
        break;
      case City.Kortrijk:
        set(this, 50.829360798981426, 3.2680034637451176, 14);
        break;
      case City.Antwerpen:
        set(this, 51.2187121115024, 4.407062530517579, 13);
        break;
      case City.Brussel:
        set(this, 50.84692264194612, 4.355821609497071, 14);
        break;
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

  let map = L.map('mapid');
  updateMap(map, configuration);
  return map;
}


/**
 * Updates a map using a configuration object.
 * This will remove all map layers as well if "removeOldLayers" is set to true.
 * @param {*} map the map
 * @param {Configuration} configuration the configuration object
 * @param {bool} removeOldLayers if set to true, old layers will be removed. Default is true.
 */
function updateMap(map, configuration, removeOldLayers = true) {
  if(configuration === undefined) {
    console.error("updateMap - no configuration given");
    return;
  }
  if(map === undefined) {
    console.error("updateMap - no map given");
    return;
  }
  map.setView(configuration.viewCenter, configuration.viewZoom);
  if(removeOldLayers === true)
    map.layers = [];
  L.tileLayer(configuration.tileLayer, { attribution: configuration.tileLayerAttribution }).addTo(map);
}

/**
 * Queries the Overpass API and adds the returned points on the map.
 * This is asynchronous, and the points will be added once the query is completed.
 * @param {*} map the map
 * @param {string} query the query
 * @param {Configuration} configuration the configuration object. can be null.
 */
function queryAndShowFeatures(map, query, configuration) {
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