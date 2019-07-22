# Open Historical Map Slippy Maps Library

This is a small slippy maps library for Open Historical Map made for the Open Heritage Map project during #oSoc19.

## CDN

To use the library, insert the following lines in your `<head></head>` tags.
Order matters, so don't change it.
```
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css" integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
  crossorigin="" />
<script src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js" integrity="sha512-GffPMF3RvMeYyc1LWMHtK8EbPv0iNZ8/oTtHPx9/cc2ILxQ+u905qIwdpULaqDkyBKgOaB57QTMg7ztg8Jm2Og=="
  crossorigin=""></script>
<script src="https://osoc19.github.io/Open-Yesterday-SlippyMap/SlippyMap.js"></script>
```

## Adding a map

To display a map, create a new div and give it a unique `id`, like `id="slippy-map"`.
The map's height and width will depend on the div's, so style the div with the desired `height` and `width`.

`<div id="slippy-map" style="height:800px" ></div>`

The last step is to call `showMap` to display the map.
`showMap` takes 2 argument, the first one is mandatory and the second one is optional.
  1. The ID of the div that should become the map. e.g. `slippy-map` like above.
  2. A configuration object. If none is provided, `showMap` will use the default configuration.

```
<script>
  showMap("slippy-map");
  // let someConfiguration = new Configuration();
  /* customize the configuration */
  // showMap("slippy-map", someConfiguration);
</script>
```

The map's div can have special attributes to change the behaviour of the map.
Here's a list of all currently supported attributes + examples.

* `center="[number, number]`: centers the map on some coordinates.
  *`center="[50.605902641613284, 4.752960205078125]"`
* `zoom="number"`: sets the zoom level of the map. This should be a positive number, usually between 2 and 20.
  * `zoom="15"`
* `tileLayer="url"`: This one's a bit more advanced. This is used to override the tile
layer (the actual map). If you don't know how tile layers work, you should probably not change it.
  * `tileLayer="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"`
* `tileLayerAttribution="text"`: Changes the tileLayer's attribution. If you didn't change the tileLayer, changing it is not recommended.
  * `tileLayer="<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors"`
* `maxElements="number"`: Limits the number of features that can appear on screen.
Use `"0"` to remove the limit, else use a positive integer to set a limit.
  * `maxElements="500"`: Maximum 500 features can be shown on screen
  * `maxElements="0"`: An unlimited number of feature can appear on screen.
* `focusOn="query"`: Performs a nominatim search for `query` and centers the map on the first result. (See the `focusOn` function below)
  * `focusOn="Bruxelles"`: Centers the map on Brussels
  * `focusOn="Kortrijk"`: Centers the map on Kortrijk
  * `focusOn="Herman Teirlinckgebouw"`: Centers the map on the Herman Teirlinck building in Brussels.

Changing div attributes is great if you want to touch as little Javascript as possible. However, for maximum control over the map, use the Configuration object.

Please note that the `Configuration` is only used at map creation and when querying for features, so changing the configuration after the map has been shown will not change it! After the map has been created, you'll need to use Leaflet methods or functions such as `focusOn` and `queryAndShowFeatures` to change it.

## Showing features

To show features on the map, add an event listener for the `drawmarkers` event. In that listener, call `queryAndShowFeatures`.

`queryAndShowFeatures` takes 3 parameters.
  * The Leaflet map instance
  * An Overpass query. You can write one manually if you have experience with Overpass, or you can use `getSimpleQuery`.
    * `getSimpleQuery` can create a basic query for you. If you give it no parameters, it'll return a query for every single node in the area. 
      If you give it a `key` and `value` parameter, it'll only return elements that have that `key` and `value`. 
        * For example, `getSimpleQuery("craft", "brewery")` will generate a query that will return every brewery.
    * Note: You can (and should) use the `{{bbox}}` substitution in the query.
  * The `Configuration` object (can be omitted, if that's the case, the default configuration is used).

Example usage:
```
  // Shows all breweries in the area.
  map.addEventListener('drawmarkers', function() {
    queryAndShowFeatures(map, getSimpleQuery("craft", "brewery"));
  });
```

The `drawmarkers` event is an extension of the Leaflet `moveened` event. It is called each time we need to redraw the markers on the map.

`drawmarkers` is only fired if:
  * It's the first time we move/display the map
  * If we move the map outside of an area around the current viewbox; the leeway is determined by `Configuration.boundsPadding`.
    * To put it simply, when we query for features, we get every feature in the area *plus a little more*. 
      If we move to an area for which we have no information about markers, the event if fired again to fetch the markers for that area.

## Centering the map

There's 2 ways to center the map, a precise one, and a query-based one.

*Note: The following lines assume that the variable containing the map is called `map`*

* To center the map on some precise coordinates, use `map.setCenter([lat, lon])`.
  * Example: `map.setCenter([50.605902641613284, 4.752960205078125])`
* To center the map using a query, use `focusOn(map, query)` where `query` is a string containing a query. The query can be anything you want. It's just text, like a Google search.
  * "Gent", "Kortrijk", "Herman Teirlinckgebouw" are all valid queries.
    *  e.g. `focusOn(map, "Gent")`, `focusOn(map, "Kortrijk")` or `focusOn(map, "Herman Teirlinckgebouw")`

## Popups

Popup texts can be customized by changing the `popupTextProvider` function in the `Configuration` object you're passing to `queryAndShowFeatures`.
See `PopupTextProvider`, `Configuration.popupTextProvider` and `defaultPopupTextProvider` for more information.
