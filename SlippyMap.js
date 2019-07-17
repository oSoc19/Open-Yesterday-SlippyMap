/**
 * The Configuration of a map.
 * <br>
 * This is only used before calling "showMap". Any changes made to the configuration
 * after the initial "showMap" will be ignored.
 */
class Configuration {
  /**
   * Set to true if the HTML attributes of the map's div can be used to override
   * the configuration.
   * 
   * @type {boolean}
   */
  canUseDivAttributes = true;
  /**
   * The Center of the Map. This should be an array containing 2 numbers.
   * <br>
   * Default value is roughly in the center of Belgium.
   * 
   * @type {number[]}
   */
  center = [50.605902641613284, 4.752960205078125];
  /**
   * The Zoom level of the map.
   * <br>
   * Default value is 14.
   * 
   * @type {number}
   */
  zoom = 14;
  /**
   * The TileLayer to use.
   * <br>
   * See https://leafletjs.com/reference-1.5.0.html#tilelayer for more information.
   * <br>
   * Default value is the OSM default map: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   * 
   * @type {string}
   */
  tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  /**
   * The tileLayer's attribution text.
   * <br>
   * Default value is the attribution for the OSM default map (see above).
   * 
   * @type {string}
   */
  tileLayerAttribution = '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  /**
   * The maximum number of elements that can be shown on-screen
   * Set to undefined, or a number less or equal to zero to remove the limit.
   * <br>
   * Default value is 500
   * 
   * @type {number|undefined}
   */
  maxElements = 500;
  /**
   * The "padding" we should use for the bounds when showing the markers.
   * This value is a percentage, where 1 = 100%, 0 = 0%, and -1 = -100%.
   * <br>
   * This value shouldn't be too large, and should be positive.
   * A value between 0.2 and 0.5 is probably ideal for performance.
   * Larger values will reduce performance in the common case, and values
   * too small (<0.2) will reduce performance for users that move the map
   * around a lot.
   * <br>
   * Default value is 0.25
   * 
   * @type {number}
   */
  boundsPadding = 0.25;
  /**
   * @name PopupTextProvider
   * @function
   * @param {object} element The element returned by the Overpass API.
   * @param {object} element.tags The tags of the element. Look for tags by checking if
   *                 element.tags['yourTag'] is undefined or not.
   * @returns {string|undefined}
   */
  /**
   * The function that is called whenever we want to fetch the marker popup text
   * for a given element.
   * <br>
   * This function is always called with the element object, which has an array
   * of tags (element.tags) that you can use.
   * <br>
   * Return undefined if you don't want a popup
   * <br>
   * Popups support HTML.
   * 
   * @type {PopupTextProviderType}
   */
  popupTextProvider = defaultPopupTextProvider;
  /**
   * Overrides this configuration based on a div's attributes.
   * <br>
   * The attributes must have the same name as the members.
   * <br>
   * Attributes will be checked against a RegEx to see if they're well formed.
   * If they aren't, they'll be ignored an a warning will be printed to the console.
   * 
   * @param {object} div the div object
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
 *
 * Creates and displays a map in place of the div with id mapId. 
 * <br>
 * If conf.canUseDivAttributes is set to true, this will call conf.useDivAttributes to update the configuration 
 * based on the attributes of the div (when present)
 * 
 * @param {string} mapId The HTML id of the div that should become the map
 * @param {Configuration} conf the Configuration object. 
 *                        Can be undefined. If that's the case, a default-constructed object will be used.
 *                        However, if you want to reuse the configuration object later, it's better to pass one.
 * @param {string|undefined} focusQuery If defined, calls focusOn to initialize the map using the focusQuery.
 *                           Note that if this parameter is used, the focusOn attribute of the div will be ignored.
 * @returns {Leaflet.Map} The created Leaflet Map.
 */
function showMap(mapId, conf, focusQuery) {
  if (conf == undefined)
    conf = new Configuration();

  let div = document.getElementById(mapId);
  if (div == null) {
    console.error("Cannot create map - div with id '%o' does not exist", mapId);
    return;
  }

  if (conf.canUseDivAttributes)
    conf.useDivAttributes(div);

  // Create the map and give it a tile layer.
  let map = L.map(mapId);
  L.tileLayer(conf.tileLayer, { attribution: conf.tileLayerAttribution }).addTo(map);

  // Set the zoom level
  map.setZoom(conf.zoom);

  // Handle the focusOn attribute.
  if(div.hasAttribute('focusOn')) {
    if(focusQuery == undefined)
      focusQuery = div.getAttribute('focusOn');
    else
      console.warn("showMap - focusOn attribute of the map div overriden by the focusQuery parameter");
  }

  // If we got a focusQuery, use focusOn to initialize the map's position.
  // Else, center the view using the configuration parameters.
  if(focusQuery != undefined)
    focusOn(map, focusQuery, L.latLng(conf.center));
  else
    map.setCenter(conf.center);

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
 * Centers the map on something.
 * <br>
 * This will perform a search using Nominatim, and center the map on the first result.
 * If no result is found, the coordinates are unchanged.
 * <br>
 * If the result of this function isn't satisfying, try to make a more specific query
 * e.g. "Antwerpen Belgium", or simply set the coordinates manually.
 * <br>
 * The nominatim query will be performed using the following options:
 * <ul>
 *    <li> limit=1 
 *    <li> viewbox=current bounds (map.getBounds().toBBoxString())
 *    <li> format=json 
 *    <li> q=query (the query string)
 * </ul>
 * <br>
 * This function can be used even if the map has not been initialized yet.
 * If that's the case, the parameter 'center' must be provided.
 * <br>
 * If you use this on the map returned by showMap, it has already be initialized
 * so the center parameter is useless and can be omitted.
 * 
 * @param {Leaflet.Map} map the Leaflet map
 * @param {string} query The nominatim query. Example "Antwerpen", "Brugge", etc.
 * @param {Leaflet.LatLng|undefined} center The center of the search. Must be provided if 
 * the map has not been initialized yet. If the map has been initialized, the bounds of
 * its view will be used instead.
 */
function focusOn(map, query, center) {
  map.stop();
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

  function getBounds() {
    // Try to use the map bounds
    try {
      return map.getBounds().toBBoxString()
    }
    catch(err) {
      if(center == undefined)
        throw "focusOn - Map has not been initialized map and there's no center for the search";
      // Create a 1Km bound box from the point.
      return center.toBounds(1000).toBBoxString();
    }
  }

  // Prepare the query
  let queryURL = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&viewbox=${getBounds()}&limit=1`;
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
 * Returns a simple overpass query string that returns all nodes, ways and relations
 * in the bbox that have a given key/value pair.
 * <br>
 * If key is undefined, all points will be returned. 
 * (Please be careful with the latter, if it's a large bbox, performance will be terrible, especially
 * if you don't cap the number of features shown on screen)
 * 
 * @param {string|undefined} key The key we're looking for
 * @param {string|undefined} value The value of the key we're looking for.
 * @returns {string} the query string
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
    node${getParam()}({{bbox}});
  );
  // print results
  out body;
  >;
  out skel qt;`;
  return query;
}

/**
 * Queries the Overpass API and adds the resulting features to the map.
 * This is asynchronous, the points will be added as soon as the API gives us a response.
 * <br>
 * Errors will be printed to the console if the query fails. 
 * <br>
 * A warning will be printed to the console if some points are ignored due to the cap.
 * (see Configuration.maxElements)
 * 
 * @param {Leaflet.Map} map the map
 * @param {string} query the query. For generating simple queries, @see getSimpleQuery
 *                 Note: occurences of {{bbox}} inside the query will be replaced with the bounds
 *                 of the map.
 * @param {Configuration|undefined} conf the configuration object. Can be undefined to use the default configuration.
 */
function queryAndShowFeatures(map, query, conf) {
  // Create a configuration object if we don't have one
  if (conf == undefined)
    conf = new Configuration();

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
  */
  function handleQueryResult(rawJSON) {
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
    if(maxElements <= 0)
      maxElements = undefined;
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

/**
 * The default popup text provider, which tries its best to provide a description
 * (in English) based on the tags of the element.
 * 
 * @param {object} element The element returned by the Overpass API.
 * @param {object} element.tags The tags of the element
 * @returns {string|undefined}
 */
function defaultPopupTextProvider(element) {
  let tags = element.tags;
  // Can't do anything without tags.
  if(tags == undefined || tags.length == 0)
    return undefined;

  let text = "";

  // Print name
  if(tags.name != undefined)
    text += `<h2>${tags.name}</h2>`

  // Print description
  if(tags.description != undefined)
    text += `<p>${tags.description}</p>`
  
  // Try to parse a start_date and end_date if we got one
  function getDateLine() {
    let dateLine = "";
    let start_date = tags["start_date"];
    let end_date = tags["end_date"];
    if((start_date != undefined) && (end_date != undefined))
      dateLine += `<p><b>From</b> ${start_date} <b>to</b> ${end_date}</p>`;
    return dateLine;
  }

  text += getDateLine();

  // Try to parse an address if we got one
  function getAddressLine() {
    let city = tags["addr:city"];
    let postcode = tags["addr:postcode"];
    let housenumber = tags["addr:housenumber"];
    let street = tags["addr:street"];

    // Only display this if we got both a streetname and
    // a housenumber.
    if((housenumber != undefined) && (street != undefined)) {
      let addressLine = "<p>";
      addressLine += housenumber + ' ' + street + '<br>';
      // If we got a city + postcode, display that as well.
      if((postcode != undefined) && (city != undefined)) {
        addressLine += postcode + ' ' + city;
      }
      addressLine += '</p>';
      return addressLine;
    }
    return "";
  }

  text += getAddressLine();

  return text;
}