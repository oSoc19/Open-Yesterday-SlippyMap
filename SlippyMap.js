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
   * The "padding" we should use for the bounds when showing the markers.
   * This value is like a percentage, where 1 = 100% (and -1 = -100%).
   * 
   * This value shouldn't be too large, and, if possible, not negative.
   * A value between 0.1 and 0.5 should be ideal for performance.
   * 
   * Ideally, don't change this value unless you know how it works.
   */
  boundsPadding = 0.2;
  /**
   * The function that is called whenever we want to fetch the marker popup text
   * for a given element.
   * 
   * This function is always called with the element object, which has an array
   * of tags (element.tags) that you can use.
   * 
   * Return undefined if you don't want a popup
   * 
   * Popups support HTML.
   */
  popupTextProvider = defaultPopupTextProvider;
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

  let map = L.map(mapId);
  updateMap(map, conf);

  // If the div has a "focusOn" attribute, call focusOn on the div.
  if(div.hasAttribute('focusOn'))
    focusOn(map, div.getAttribute('focusOn'));

  map.addEventListener('moveend', onMoveEnd);

  // This is the function called whenever the user (or a programmer) is done moving the view.
  // It performs some checks and may fire an additional "drawmarkers" event.
  // the "drawmarkers" event is only called if:
  //    - this is the first time moving the view
  //    - the view has been moved outside the bounds of the "largest" previous view
  function onMoveEnd() {
    function fire(bounds) {
      onMoveEnd.bounds = bounds;
      map.fireEvent('drawmarkers'); 
    };
    
    let curBounds = map.getBounds();

    // If this is the first time calling the function, fire the event and save the bounds.
    // If this isn't the first time and the new bounds are outside the old ones, 
    // set them as the current bounds and fire the event.
    // If both conditions are false, don't do anything.
    if((onMoveEnd.bounds == undefined) || !onMoveEnd.bounds.contains(curBounds))
        return fire(curBounds.pad(conf.boundsPadding));
    return;
  }

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
 * Returns a simple overpass query that returns all node, ways and relations
 * in the bbox that have a key/value.
 * If key is undefined, all points will be returned.
 * @param {*} key 
 * @param {*} value 
 */
function getSimpleQuery(key, value) {
  function getParam() {
    if(key == undefined)
      return "";
    return `["${key}"="${value}"]`;
  }

  var query = `
  [out:json][timeout:25];
  // gather results
  (
    nwr${getParam()}({{bbox}});
   );
  // print results
  out body;
  >;
  out skel qt;`;
  return query;
}

/**
 * Queries the Overpass API and adds the returned points on the map.
 * This is asynchronous, and the points will be added once the query is completed.
 * @param {Leaflet.Map} map the map
 * @param {string} query the query. For generating simple queries, @see getSimpleQuery
 *                 Note: occurences of {{bbox}} inside the query will be replaced with the bounds
 *                 of the map.
 * @param {Configuration} conf the configuration object. can be null.
 */
function queryAndShowFeatures(map, query, conf) {
  // Create a configuration object if we don't have one
  if (configuration == undefined)
    configuration = new Configuration();

  // Note: We cannot use map.getBounds().toBBoxString() because
  // for some reason overpass wants another format which is 
  //    southwest_lat,southwest_lng,northeast_lat,northeast_lng
  // instead of
  //    southwest_lng,southwest_lat,northeast_lng,northeast_lat

  // Create the bbox string
  let bounds = map.getBounds().pad(conf.boundsPadding);
  let sw = bounds.getSouthWest();
  let ne = bounds.getNorthEast();
  let bboxString = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;

  // Replace all occurences of {{bbox}} inside the query with 
  // the bbox string
  query = query.replace("{{bbox}}", bboxString);

  // Create the query URL for the OHM Overpass API & encode it
  let queryURL = "http://overpass-api.openhistoricalmap.org/api/interpreter?data=".concat(query);
  queryURL = encodeURI(queryURL);

  // Create the XMLHttpRequest to send the GET request asynchronously
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", queryURL);
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
   * Creates a single marker
   * @param {*} element an element returned by the overpass query (object with a .lat and .lon field)
   */
  function createMarker(layerGroup, element) {
    console.log('adding %o', element);
    let marker = L.marker(L.latLng(element.lat, element.lon)).addTo(layerGroup);
    // Fetch the popup text using the provider
    let popupText = conf.popupTextProvider(element);
    if(popupText == undefined)
      return;
    // If the provider has given us some text, create the popup.
    marker.bindPopup(conf.popupTextProvider(element));
    marker.on("mouseover", function() {
      this.openPopup();
    })
    marker.on("mouseout", function() {
      this.closePopup();
    })
  }

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
      // Create a layer group for the markers if that's not done yet.
      let layerGroup = queryAndShowFeatures.layerGroup;
      if(layerGroup == undefined)
        queryAndShowFeatures.layerGroup = layerGroup = L.layerGroup().addTo(map);
      // If we already have a layergroup, clear it.
      else 
        layerGroup.clearLayers();
      // Fetch the elements
      let elements = json.elements;
      // Add the markers to the layerGroup
      for (let element of elements.slice(0, maxElements))
        createMarker(layerGroup, element);
      // Show some debug info, including a omitted markers count if we have omitted some
      // markers.
      if ((maxElements != undefined) && (elements.length > maxElements)) {
        let omitted = elements.length - maxElements;
        console.warn("queryAndShowFeatures - Markers Cap Reached: %o markers were not shown."
          + " (Cap is %o and query returned %o features)", omitted, maxElements, elements.length);
      }
      else
        console.log("queryAndShowFeatures - Added %o elements", elements.length);
    }
    else
      console.log("queryAndShowFeatures - No elements found");
  }
}

function defaultPopupTextProvider(element) {
  let tags = element.tags;
  // Can't do anything without tags.
  if(tags == undefined || tags.length == 0)
    return;

  let text = "";

  if(tags.description != undefined)
    text += tags.description + '<br>'
  
  // Try to parse an address if we got one
  function getAddressLine() {
    let city = tags["addr:city"];
    let postcode = tags["addr:postcode"];
    let housenumber = tags["addr:housenumber"];
    let street = tags["addr:street"];

    // Only display this if we got both a streetname and
    // a housenumber.
    if((housenumber != undefined) && (street != undefined)) {
      let addressLine = "<br>";
      addressLine += housenumber + ' ' + street + '<br>';
      // If we got a city + postcode, display that as well.
      if((postcode != undefined) && (city != undefined)) {
        addressLine += postcode + ' ' + city;
      }
      return addressLine;
    }
    return "";
  }

  text += getAddressLine();

  return text;
}