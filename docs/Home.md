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

To add the map, create a new div where you want the map to be.
The map height's and width will depend on the div's styling, so style the div as you want. Give this div a unique id, for instance "slippy-map".

`<div id="slippy-map" style="height:800px" ></div>`

Once that's done, you can call `showMap` to actually show the map.
`showMap` takes 2 argument, one mandatory and one optional.
  1. The ID of the div that should become the map. e.g. `slippy-map` like above.
  2. Optionally, a Configuration object. If none is provided, `showMap` will use the default configuration.

```
<script>
  showMap("mapid");
  // let someConfiguration = new Configuration();
  /* customize the configuration */
  // showMap("mapid", someConfiguration);
</script>
```

The div can also have a few extra attributes that'll be used at map creation.
Here's a list of all currently supported attributes, along with a few examples.

* `center="[number, number]`: centers the map on some coordinates.
  *`center="[50.605902641613284, 4.752960205078125]"`
* `zoom="number"`: sets the zoom level of the map. This should be a positive number, usually between 2 and 20.
  * `zoom="15"`
* `tileLayer="url"`: This one's a bit more advanced. This is used to override the tile
layer. If you don't know how tile layers work, don't change it.
  * `tileLayer="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"`
* `tileLayerAttribution="text"`: Changes the tileLayer's attribution. If you didn't change the tileLayer, don't change it.
  * `tileLayer="<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors"`
* `maxElements="number"`: Limits the number of features that can appear on screen.
Use `"0"` to remove the limit, else use a positive integer.
  * `maxElements="500"`: Maximum 500 features can be shown on screen
  * `maxElements="0"`: An unlimited number of feature can appear on screen.
* `focusOn="query"`: Performs a nominatim search for `query` and centers the map on the first result.
  * `focusOn="Bruxelles"`: Centers the map on Brussels
  * `focusOn="Kortrijk"`: Centers the map on Kortrijk
  * `focusOn="Herman Teirlinckgebouw"`: Centers the map on the Herman Teirlinck building in Brussels.

Note that changing div attributes is great if you want to touch as little Javascript as possible. However, for maximum control over the map, use the Configuration object.
The Configuration object can only be used at map creation, and when querying for features.

Both `showMap` and `queryAndShowFeatures` will use the default configuration is no configuration object is passed.

After the map has been created, you'll need to use Leaflet methods to change it, or
you can check a few other methods such as `focusOn` and `queryAndShowFeatures`.

## Showing features

To show features on the map, add an event listener for the `drawmarkers` event. In that listener, call `queryAndShowFeatures`.

`queryAndShowFeatures` takes 3 parameters.
  * the map
  * a query. This is an overpass query, you can write one manually if you're experienced, else use `getSimpleQuery`.
    * `getSimpleQuery` can create a basic query for you. If you give it no parameters, it'll return a query for every single node in the area. 
      If you give it a `key` and `value` parameter, it'll only return elements that have that `key` and `value`.
  * the configuration object (can be omitted, if that's the case, it will use the default configuration).

Example usage:
```
  // Shows all breweries in the area.
  map.addEventListener('drawmarkers', function() {
    queryAndShowFeatures(map, getSimpleQuery("craft", "brewery"), configuration);
  });
```

The `drawmarkers` event is an extension of the `moveened` event. It is called each time we need to redraw the markers on the map.

`drawmarkers` is only fired if:
  * It's the first time we move the map (= the map has been initialized)
  * If we move the map outside of a given area around the current viewbox determined by `Configuration.boundsPadding`.
    * To put it simply, when we query for features, we get every feature in the area *plus a little more*. 
      If we move to an area for which we have no information about markers, the event if fired again.
It essentially exists as an optimization.

## Centering the map

There's 2 ways to center the map, a precise one, and a query-based one.

*Note: The following lines assume that the variable containing the map is called `map`*

* To center the map on some precise coordinates, use `map.setCenter([lat, lon])`.
  * Example: `map.setCenter([50.605902641613284, 4.752960205078125])`
* To center the map using a query, use `focusOn(map, query)` where `query` is a string containing a query. The query can be anything you want. It's just text, like a Google search.
  * "Gent", "Kortrijk", "Herman Teirlinckgebouw" are all valid queries.

## Popups

Popup texts can be customized by changing the `popupTextProvider` function in the Configuration object you're passing to `queryAndShowFeatures`.
See `PopupTextProvider`, `Configuration.popupTextProvider` and `defaultPopupTextProvider` for more information.