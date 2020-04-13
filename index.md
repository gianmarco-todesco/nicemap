# Nicemap

#### Interactive maps for data visualizations. Bundled into a single Javascript file.

Datamaps is intended to provide some data visualizations based on geographical data. It's SVG-based, can scale to any screen size, and includes everything inside of 1 script file.
It heavily relies on the amazing [D3.js](https://github.com/mbostock/d3) library.

Out of the box it includes support for choropleths and bubble maps (see [demos](http://datamaps.github.io)), but it's not limited to just that. Its new plugin system allows for the addition of any type of visualization over the map.

##### For feature requests, open an issue!

##### [Contribution Guideliness](#contributing-guidelines)

#### Demos at http://datamaps.github.io

---

Downloads:

 - [World map (94kb, 36.7kb gzip'd)](http://datamaps.github.io/scripts/0.4.4/datamaps.world.min.js)
 - [USA only (35kb, 13.9kb gzip'd)](http://datamaps.github.io/scripts/0.4.4/datamaps.usa.min.js)
 - [USA & World (131kb, 47.1kb gzip'd)](http://datamaps.github.io/scripts/0.4.4/datamaps.all.min.js)
 - [No preset topojson (6.8kb, 2.3kb gzip'd)](http://datamaps.github.io/scripts/0.4.4/datamaps.none.min.js)


### Documentation

#### Getting Started

1. Include D3.js and Topojson on your page
2. Include Datamaps.js on your page
3. Add a container, set the height and width and position to relative
4. Create a `new Datamaps(options)`, passing in at least an `element` option

Example:
```html
<script src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.3/d3.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/topojson/1.6.9/topojson.min.js"></script>
<script src="/datamaps.world.min.js"></script>
<div id="container" style="position: relative; width: 500px; height: 300px;"></div>
<script>
    var map = new Datamap({element: document.getElementById('container')});
</script>
```

This should render a new world map with a standard projection.

#### via [NPM](https://www.npmjs.com/package/datamaps)
1. `npm install datamaps`
2. Refer to file in `dist` directory, like:

```html
<script src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.3/d3.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/topojson/1.6.9/topojson.min.js"></script>
<script src="node_modules/datamaps/dist/datamaps.world.min.js"></script>
<div id="container" style="position: relative; width: 500px; height: 300px;"></div>
<script>
    var map = new Datamap({element: document.getElementById('container')});
</script>
```
