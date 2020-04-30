
var canvas, engine, scene, camera;
var earth;
var texture;
const textureSize = 2048;
const idMapSize = 1024;
var idMap;
let idMapCtx;
let features;
let countryBorder = null;

window.onload = function() {

    canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2,0.2,0.2);
    scene.ambientColor.set(1,1,1);
    // camera
    camera = new BABYLON.ArcRotateCamera(
        "camera1", 0.0 ,1.0,10, BABYLON.Vector3.Zero(),scene);
    camera.attachControl(canvas, false);
    camera.wheelPrecision = 20;
    camera.radius = 15;
    camera.lowerRadiusLimit = 10.8;
    // luce
    var light = new BABYLON.PointLight(
        "light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = .9;
    light.parent = camera;
        
    earth = BABYLON.MeshBuilder.CreateSphere('a', {
        diameter:10
    }, scene);
    earth.rotation.y = Math.PI;

    texture = new BABYLON.DynamicTexture('a', {
        width:textureSize, 
        height:textureSize}, 
        scene); 
    texture.hasAlpha = true; 

    var material = new BABYLON.StandardMaterial("Mat", scene);                    
    material.diffuseTexture = texture;
    material.backFaceCulling = false;
    material.specularColor.set(0.1,0.1,0.1);
    earth.material = material;
    
    // fa partire il rendering
    engine.runRenderLoop(function () { scene.render(); });   
    // informa l'engine se la finestra del browser cambia dimensioni
    window.addEventListener('resize', function(){ engine.resize(); });   


    fetch('geo_un_simple_boundaries.geojson')
        .then(r => r.json())
        .then(d => processResult(d));

    this.canvas.addEventListener("mousemove", onMouseMove);

    
}

function processResult(d) {
    let t0 = performance.now();
    let width = textureSize;
    let height = textureSize;
    idMap = document.createElement("canvas");
    idMap.width = idMap.height = idMapSize;
    
    let tb = tbb = {};
    let minValue , maxValue;
    minValue = maxValue = series_1[0][1];
    series_1.forEach(d => {
        let v = d[1];
        tb[d[0]] = { value:v };
        if(v<minValue)minValue=v;
        else if(v>maxValue) maxValue=v;
    });

    features = d.features;

    let ctx = texture.getContext();
    d.features.forEach(feature => {
        let rec = tb[feature.properties.ISO3CD];
        if(rec === undefined) { 
            rec = tb[feature.properties.ISO3CD] = {};
        }
        let color = "gray";
        if(rec.value !== undefined) {
            let v = rec.value;
            let vt = (v-minValue)/(maxValue-minValue);
            color = "rgb(0,"+vt*255+",0)";    
        }
        let cx=0, cy=0;
        let ptCount = 0;
        // console.log(feature.properties.ROMNAM);
        //if(feature.properties.ISO3CD == "ITA") {
        feature.geometry.coordinates.forEach(c => {
            c[0].forEach(p => {
                cx+=p[0]; 
                cy+=p[1];
                ptCount++;
            });
            let pts = c[0].map(p => {
                let x = width * (-p[0]+180)/360;
                let y = height * (p[1]+90) / 180;
                return [x,y];
            });
            let m = pts.length;
            ctx.beginPath();
            ctx.moveTo(pts[m-1][0], pts[m-1][1]);
            for(let i=0;i<m;i++) 
                ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();
        });
        rec.pos = [cx/ptCount, cy/ptCount];        
        
    });
    texture.update();

    ctx = idMapCtx = idMap.getContext('2d');
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0,0,256,256);
    d.features.forEach((feature,i) => {
        let rec = tb[feature.properties.ISO3CD];
        let red = i%256;
        let green = i>>8;
        let color = "rgb("+red+","+green+",0)";
        feature.geometry.coordinates.forEach(c => {
            let pts = c[0].map(p => {
                let x = idMapSize * (p[0]+180)/360;
                let y = idMapSize-1-idMapSize * (p[1]+90) / 180;
                return [x,y];
            });
            let m = pts.length;
            ctx.beginPath();
            ctx.moveTo(pts[m-1][0], pts[m-1][1]);
            for(let i=0;i<m;i++) 
                ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();
        });
    });
    document.body.appendChild(idMap);

    let cyl = BABYLON.MeshBuilder.CreateCylinder('a',{
        diameter:0.1,
        height:1,
    }, scene);
    cyl.material = new BABYLON.StandardMaterial('a',scene);
    cyl.material.diffuseColor.set(1,0,0);
    cyl.material.specularColor.set(0.1,0.1,0.1);
    // cyl.setPivotMatrix(BABYLON.Matrix.Translation(0,-1,0));
    cyl.isVisible = false;

    let sphere = BABYLON.MeshBuilder.CreateSphere('a',{
        diameter:1,
    }, scene);
    sphere.material = new BABYLON.StandardMaterial('a',scene);
    sphere.material.diffuseColor.set(1,0,0);
    sphere.material.specularColor.set(0.1,0.1,0.1);
    sphere.material.alpha = 0.3;
    sphere.isVisible = false;

    bubbleData.forEach(d => {
        let code = d[0];
        let value = d[1];
        let rec = tb[code];
        if(rec===undefined || rec.pos === undefined) return;
        // console.log(code);
        let lat = rec.pos[1];
        let lng = rec.pos[0];
        let theta = lat * Math.PI/180.0;
        let phi = lng * Math.PI/180.0;
        let radius = 5;
        let uy = Math.sin(theta);
        let rxz = Math.cos(theta);
        let ux = rxz * Math.cos(phi);
        let uz = rxz * Math.sin(phi);
        let x = radius * ux;
        let y = radius * uy;
        let z = radius * uz;
        
        let bin = sphere.createInstance('a');
        //let h = 0.1*Math.log(value);
        // bin.scaling.y = h;
        let h = 0.1*Math.log(value);
        bin.scaling.x = bin.scaling.y = bin.scaling.z = h;
        //bin.rotate(BABYLON.Axis.Z, theta - Math.PI*0.5 , BABYLON.Space.WORLD);
        //bin.rotate(BABYLON.Axis.Y, -phi, BABYLON.Space.WORLD);
        
        //bin.position.set(x + ux*h*0.5,y + uy*h*0.5,z+uz*h*0.5);
        bin.position.set(x,y,z);
        bin.isPickable = false;

    })
    let t1 = performance.now();
    console.log("time=", t1-t0);  
}

function onMouseMove(e) {
    let x = e.clientX;
    let y = e.clientY;
    var ray = scene.createPickingRay(scene.pointerX,scene.pointerY, BABYLON.Matrix.Identity(), camera);	
    var hit = scene.pickWithRay(ray);
    if(hit.hit) {
        let p = hit.pickedPoint;
        let lon = Math.atan2(p.z,p.x) * 180.0 / Math.PI;
        let lat = 90 - Math.acos(p.y / p.length()) * 180.0 / Math.PI;    
        let index = pickCountryIndex(lat,lon);
        if(index>=0) {
            console.log(lat, lon, features[index].properties.MAPLAB);
            highlight(index);
        } else {
            console.log(lat, lon);
            highlight(null);
        }
    }
    else highlight(null);
}


function pickCountryIndex(lat, lon) {
    let tx = Math.floor(0.5 + idMapSize * (180+lon)/360);
    let ty = Math.floor(0.5 + idMapSize * (90-lat)/180);
    if(tx<1 || tx+1>=idMapSize || ty<1 || ty+1>=idMapSize) return -1;
    let pixData = idMapCtx.getImageData(tx-1,ty-1, 3,3).data;
    for(let i=0; i<3;i++) {
        for(let j=1; j<9; j++) {
            if(pixData[i+4*j] != pixData[i+4*j-4]) return -1;
        }
    }
    let pixVal = pixData[1]*255+pixData[0];
    if(pixVal>=features.length) return -1;
    else return pixVal;

}


function highlight(index) {
    if(countryBorder != null) { countryBorder.dispose(); countryBorder=null;}
    if(index == null || index<0 || index>=features.length) 
    {
        if(countryBorder != null) countryBorder.isVisible = false;
        return;
    }
    let feature = features[index];
    const R = 5.01;
    const lines = [];
    feature.geometry.coordinates.forEach(c => {
        lines.push(c[0].map(p => {
            let lat = p[1];
            let lng = p[0];
            let theta = Math.PI*lat/180.0;
            let phi = Math.PI*lng/180.0;
            
            let y = R*Math.sin(theta);
            let rxz = R*Math.cos(theta);
            let x = rxz*Math.cos(phi);
            let z = rxz*Math.sin(phi);
            return new BABYLON.Vector3(x,y,z);
        }));
    });
    if(countryBorder == null) {
        countryBorder = BABYLON.MeshBuilder.CreateLineSystem('ls', {lines:lines, updatable:true}, scene);
    } else {
        countryBorder = BABYLON.MeshBuilder.CreateLineSystem('ls', {lines:lines, instance:countryBorder});
        countryBorder.isVisible = true;
    }

}