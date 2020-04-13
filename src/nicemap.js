"use strict";

class MapLoader {
    constructor() {
        this.dic = {}
    }
    _processResult(mapUrl, response) {
        if(!response.ok) {
            console.log("Error " + r.statusText +"\n" + "Reading " + mapUrl);
        }
        try {
            return this.dic[mapUrl] = Promise.resolve(response.json());
        }
        catch(err) {
            console.log("Error " + err + "\n parsing json : " + mapUrl);
        }
        return this.dic[mapUrl] = Promise.resolve(null);
    }
    fetch(mapUrl) {
        const dic = this.dic;
        const me = this;
        if(dic[mapUrl] === undefined) {
            console.log("fetching " + mapUrl);
            dic[mapUrl] = fetch(mapUrl).then(r => me._processResult(mapUrl, r));
        }
        return dic[mapUrl];
    }
}

const mapLoader = new MapLoader();


class Nicemap {
    
    constructor(options) {
        options = options || {};
        if(!options.containerId) throw "Missing parameter 'containerId'";        
        const containerId = this.containerId = options.containerId;
        const container = this.container = d3.select("#" + containerId).node();
        if(container == null) throw containerId + ": container not found";

        // zoom
        

        const zoom = this.zoom = d3.zoom()
            .scaleExtent([1, 40])
            // 
            // 
            .on("zoom", zoomed);

        // main svg 
        this.svg = d3.select(container)
            .append("svg")
            .attr("class", "nicemap")
            .call(zoom)
            .on("dblclick.zoom", null);

        let mapG = this.mapG = this.svg.append("g");
        function zoomed() { mapG.attr("transform", d3.event.transform); }


        this.projection = d3.geoMercator();
        this.boundaryColor = '#bbb';

        

        this.colorScale = options.colorScale || d3.scaleLinear().range(["#eee", "#2e4"]);        
        this.processData(options.data)

        this.createLegend();
        this.createTooltip();
        this.createZoomButtons();

        /*
        const width = container.node().clientWidth;
        const height = container.node().clientHeight;
        
        

        // we use Mercator projection
        const projection = this.projection = d3.geoMercator()
            .scale(width / 2 / Math.PI)
            .translate([width / 2, height *0.7]);

        
        

        // create the SVG element
        this.svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "map")
            
    
        // geopath transforms GeoJson feature into SVG path 
        this.geopath = d3.geoPath().projection(projection);

        // create the tooltip
        this.createTooltip();

        
        
        let mapG = this.mapG = this.svg.append("g");

        function zoomed() {
            mapG.attr("transform", d3.event.transform);
        }

        
        
        // fetch the map
        const worldMapUrl = "geo_un_simple_boundaries.geojson";
        const me = this;
        console.log("fetch:"+containerId);
        fetch(worldMapUrl)
            .then(d=>d.json())
            .then(d=>me.worldMap = d)
            .then(d=>me.buildMap(d))
            .then(d=>console.log("fetched:"+containerId))
        */
        const worldMapUrl = "geo_un_simple_boundaries.geojson";
        const me = this;
        mapLoader.fetch(worldMapUrl)
           .then(d=>me.worldMap = d)
           .then(d=>me.redraw());
        
        window.addEventListener('resize', () => me.redraw());
        
        
    }


    redraw() {
        const container = this.container;
        const width = container.clientWidth;
        const height = container.clientHeight;
        console.log("redraw. ", width, height);
        const projection = this.projection;
        const ar = width / height;

        const unit = width *0.5;

        projection
            .scale(width / (2 * Math.PI) )
            .translate([width *0.5, height * 0.5 + unit * 0.25]);
        this.svg
            .attr("width", width)
            .attr("height", height);
        const geopath = d3.geoPath().projection(projection);

        let g = this.mapG

        // add countries
        const features = this.worldMap.features.filter(f=>f.properties.ISO3CD != "ATA");
        const me = this;
        let paths = g.selectAll("path")
            .data(features);
        paths.exit().remove();
        paths.enter()
            .append("path")
            .style('stroke', me.boundaryColor)
            .style('vector-effect', 'non-scaling-stroke')
          .merge(paths)
            .attr("d", geopath)
            .style('fill', d => me.getValueColor(d.properties.ISO3CD))

        // handle tooltip
            .on("mouseover", function(d) {
                this.parentNode.appendChild(this);
                d3.select(this).style('stroke', 'black');
                me.showTooltip(d.properties.ISO3CD, d.properties.MAPLAB);
            })
            .on("mousemove", function(d) {
                me.showTooltip(d.properties.ISO3CD, d.properties.ROMNAM)
            })
            .on("mouseout", function(d) {
                d3.select(this).style('stroke', me.boundaryColor);
                me.hideToolTip();
            });

        // update legend
        const y0 = height - 40;
        this.legend
            .attr('visibility', 'visible')
            .attr("transform", "translate(10, "+y0+")")

        // update zoom
        this.zoom
            .translateExtent([[0,0], [width, height]])
            .extent([[0, 0], [width, height]]);
    }

    processData(series) {        
        const valueTable = this.valueTable = {}
        if(series) {
            series.forEach(item => valueTable[item[0]] = item[1]);
            this.valueRange = d3.extent(series.map(v=>v[1]));               
        } else {
            this.valueRange = [0,1];
        }
        this.colorScale.domain(this.valueRange); 
    }


    // return a color for a given country code
    getValueColor(countryCode) {
        let v = this.valueTable[countryCode]
        if(v === undefined) return '#eee';
        else return this.colorScale(v);
    }


    buildMap() {
        let g = this.mapG

        // add countries
        const me = this;
        let paths = g.selectAll("path")
            .data(this.worldMap.features.filter(f=>f.properties.ISO3CD != "ATA"))
            .enter()
            .append("path")
            .attr("d", me.geopath)
            .style('fill', d => me.getValueColor(d.properties.ISO3CD))
            .style('stroke', me.boundaryColor)
            .style('vector-effect', 'non-scaling-stroke');


        // handle tooltip
        paths
            .on("mouseover", function(d) {
                this.parentNode.appendChild(this);
                d3.select(this).style('stroke', 'black');
                me.showTooltip(d.properties.ISO3CD, d.properties.MAPLAB);
            })
            .on("mousemove", function(d) {
                me.showTooltip(d.properties.ISO3CD, d.properties.ROMNAM)
            })
            .on("mouseout", function(d) {
                d3.select(this).style('stroke', me.boundaryColor);
                me.hideToolTip();
            });
    }


    
    // create a tooltip (see .css file for look&feel)
    createTooltip() {
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "nicemap-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden");
        this.tooltip
            .append("div").attr("class", "tooltip-text")
    }


    // visualize & hide the tooltip
    showTooltip(countryCode, countryName) {
        console.log(countryCode, countryName);
        let value = this.valueTable[countryCode];
        if(value === undefined) value = "no value";
        let content = "<strong>" + countryName + "</strong>" + 
            "<br>Value = " + value;
            
        this.tooltip
            .style("visibility", "visible")
            .style("top", (d3.event.pageY+10)+"px") 
            .style("left",(d3.event.pageX+10)+"px")

        this.tooltip.select(".tooltip-text")
            .html(content)
    }

    hideToolTip() {
        this.tooltip.style("visibility", "hidden")
    }


    createLegend() {
        let legend = this.legend = this.svg.append('g');
        legend.attr('visibility', 'hidden');

        const w = 120;
        const h = 30;
        const gradId =  this.containerId + "-gradient";
        let grad = legend.append("defs")
          .append("svg:linearGradient")
          .attr("id", gradId)
          .attr("x1", "0%")
          .attr("y1", "100%")
          .attr("x2", "100%")
          .attr("y2", "100%")
          .attr("spreadMethod", "pad");
    
        grad.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", this.colorScale(this.valueRange[0]))
          .attr("stop-opacity", 1);
    
        grad.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", this.colorScale(this.valueRange[1]))
          .attr("stop-opacity", 1);
    
        legend.append("rect")
          .attr("width", w)
          .attr("height", 10)
          .style("fill", "url(#" + gradId + ")")
          .attr("transform", "translate(0,10)");
    
        var y = d3.scaleLinear()
          .range([0, w])
          .domain(this.valueRange);
    
        var yAxis = d3.axisBottom()
          .scale(y)
          .ticks(5);
    
        legend.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(0,20)")
          .call(yAxis)
    
    }


    createZoomButtons()
    {
        // const y0 = this.container.clientHeight - 30;
        const me = this;
        let buttons = this.svg.selectAll('g.buttons')
            .data(['+','-'])
            .enter()
            .append('g')
            .attr('class', 'nicemap-buttons')
            .attr('transform', (d,i) => 'translate(20,' + (10 + i*17) +')')
        buttons.append('circle')
            .attr('r', 8)            
            .on("click", d => {
                d3.event.stopPropagation();
                me.svg.transition().call(me.zoom.scaleBy, d == '+' ? 2 : 0.5);
            })
        buttons.append('text')
            .text(d => d) 
            .style('font-size', '10px')
            .style("text-anchor", "middle")  
            .style("alignment-baseline", "central")
    }

}


