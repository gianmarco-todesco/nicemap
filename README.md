# Nicemap

#### Yet another tool for data visualization with interactive maps

Nicemap is SVG-based and relies on [D3.js](https://github.com/mbostock/d3) library. It is inspired by the very good [Datamap.js](https://datamaps.github.io/), but it uses [Geo Json](https://geojson.org/) maps,
generated by UN.

#### Main Features
 - Configurable color scale
 - Map containers can be resized at anytime
 - Tooltip to visualize Country names and data values
 - Zoom (using mouse wheel or +/- buttons) & Pan 
 - Color legend

#### Demos at http://gianmarco-todesco.github.io/nicemap

### Documentation

#### Getting Started

You need:
1. Include `D3.js`, `nicemap.map.js` and  `nicemap.css` on your page
2. Define the data (one or more javascript variables)
3. Add one or more containers, assigning ID, width and height
4. Create a `new Nicemap(options)`, passing in at least a `containerId` option


Example:
```html
<script type="text/javascript" src="https://d3js.org/d3.v4.min.js"></script>
<script src="dist/nicemap.min.js"></script>
<link rel="stylesheet" href="src/nicemap.css"/>
<script>
    var series_1 = [
        ["BLZ",13.5],["GRL",9.1],["KEN",12.6],["BLR",22.1],["SDN",34.7],["GRD",38.9],...
    ];
</script>
...
<body>
    ...
    <div id="graph1" class="nicemap other-classes"></div>
    ...
    <script>
        var map1 = new Nicemap({
            containerId:'container1',
            data: series_1,
            map_data: 'geo_un_simple_boundaries.geojson',
            
        });
    </script>
```
