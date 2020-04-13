"use strict";
let dd;

class NicemapGeoJson {
    constructor(options) {
        options = options || {};
        if(!options.url) throw "Missing parameter 'url'";  
        this.url = options.url;
        this.countryName = options.countryName || "MAPLAB";
        this.countryCode = options.countryCode || "ISO3CD";        
    }

    fetch() {
        if(this.result === undefined) 
        {
            console.log("fetching " + this.url);
            const me = this;
            this.result = fetch(this.url)
                .then(r => r.json())
                .then(d => me._processResult(d))
                .catch(e => {
                    console.error(e);
                    return me.result = Promise.resolve(null);
                });
        }
        return this.result;
    }

    _processResult(data) {
        dd = data;
        if(typeof(data) != "object" || data.type != "FeatureCollection") 
            throw "Invalid map data : " + this.url;

        const me = this;
        data.features = data.features.filter(f => f.properties.ISO3CD != "ATA");
        data.features.forEach(f => {
            f._nicemapCountryName = f.properties[me.countryName];
            f._nicemapCountryCode = f.properties[me.countryCode];
        });
        this.result = Promise.resolve(data);
        return this.result;
    }
}


class Nicemap {
    
    // options:
    //    containerId (mandatory) : identifier of the container
    //    data : [[countryid1, value1], [countryid2, value2], ....]
    //    colorScale : 
    //    mapData : a NicemapGeoJson instance
    constructor(options) {
        options = options || {};
        if(!options.containerId) throw "Missing parameter 'containerId'";        
        const containerId = this.containerId = options.containerId;
        const container = this.container = d3.select("#" + containerId).node();
        if(container == null) throw containerId + ": container not found";

        this.colorScaleArg = options.colorScale || ['white', 'black'];
        if(Array.isArray(this.colorScaleArg) && this.colorScaleArg.length==2) {}
        else if(typeof(this.colorScaleArg) == "function") {}
        else throw "color scale must be an array of two colors or a function that return a d3 color scale";
        
        if(!(options.mapData instanceof NicemapGeoJson)) {
            throw "mapData must be an instance of NicemapGeoJson";
        }
        // zoom
        const zoom = this.zoom = d3.zoom()
            .scaleExtent([1, 30])
            .on("zoom", zoomed);

        // main svg 
        this.svg = d3.select(container)
            .append("svg")
            .attr("class", "nicemap-svg")
            .call(zoom)
            .on("dblclick.zoom", null);

        let mapG = this.mapG = this.svg.append("g");
        function zoomed() { mapG.attr("transform", d3.event.transform); }


        this.projection = d3.geoMercator();
        this.boundaryColor = '#bbb';


        this.processData(options.data)

        this.createLegend();
        this.createTooltip();
        this.createZoomButtons();

        
        const worldMapUrl = "geo_un_simple_boundaries.geojson";
        const me = this;

        options.mapData.fetch()
            .then(d=>me.worldMap = d)
            .then(d=>me.redraw());
        
        window.addEventListener('resize', () => me.redraw());        
    }


    redraw() {
        const container = this.container;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const projection = this.projection;

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
        const features = this.worldMap.features;
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
            .style('fill', d => me.getValueColor(d._nicemapCountryCode))

        // handle tooltip
            .on("mouseover", function(d) {
                this.parentNode.appendChild(this);
                d3.select(this).style('stroke', 'black');
                me.showTooltip(d);
            })
            .on("mousemove", function(d) {
                me.showTooltip(d)
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

    // compute value range and build the color scale
    processData(series) {        
        const valueTable = this.valueTable = {}
        if(series) {
            series.forEach(item => valueTable[item[0]] = item[1]);
            this.valueRange = d3.extent(series.map(v=>v[1]));               
        } else {
            this.valueRange = [0,1];
        }

        if(Array.isArray(this.colorScaleArg)) {
            this.colorScale = d3.scaleLinear()
                .range(this.colorScaleArg)
                .domain(this.valueRange);
        } else if(typeof(this.colorScaleArg) == "function") {
            this.colorScale = this.colorScaleArg(this.valueRange);
        }
    }

    // return a color for a given country code
    getValueColor(countryCode) {
        let v = this.valueTable[countryCode]
        if(v === undefined) return '#eee';
        else return this.colorScale(v);
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
    showTooltip(d) {
        const countryCode = d._nicemapCountryCode;
        const countryName = d._nicemapCountryName;
        
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
    
        [0,10,20,30,40,50,60,70,80,90,100].forEach(offset => {
            const v = this.valueRange[0] + (this.valueRange[1]-this.valueRange[0]) * offset * 0.01;
            grad.append("stop")
                .attr("offset", offset+"%")
                .attr("stop-color", this.colorScale(v))
                .attr("stop-opacity", 1);
        })
    
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


