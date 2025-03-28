import { Segment } from "../primitives/segment.js";
import { invLerp, degToRad, getMin, getMax, getPointFromGeoCoords, getBoundingBox } from "../math/utils.js";
import { Point } from "../primitives/point.js";
import { Building } from "../objects/building.js";
import { Polygon } from "../primitives/polygon.js";

const Earth_Circumference = 400000000; //dm

onmessage = e => {
    
    const data = e.data;
    const nodes = data.nodes;
    const buildings = data.buildings;
    
    const lats = nodes.length > 0 ? 
        nodes.map(node => node.lat) : 
        buildings.map(b => b.geometry.map(c => c.lat)).flat();
    const lons = nodes.length > 0 ? 
        nodes.map(node => node.lon) : 
        buildings.map(b => b.geometry.map(c => c.lon)).flat();
    
    const minLat = getMin(lats);
    const maxLat = getMax(lats);
    const minLon = getMin(lons);
    const maxLon = getMax(lons);
    
    const deltaLon = maxLon - minLon;
    const deltaLat = maxLat - minLat;
    const mapAspectRatio = deltaLon / deltaLat;
    const height = deltaLat * 111000 * 10; // One degree lat is equal to 111km, scaling to 1px to 10dm
    const width = height * mapAspectRatio;
    const mapBoundingBox = {minLat, maxLat, minLon, maxLon, height, width};

    postMessage({comment: 'Parsing Nodes...'});
    const points = [];
    for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const point = getPointFromGeoCoords(mapBoundingBox, node);
        point.id = node.id;
        points.push(point);

        postMessage({value: i+1, max: nodes.length});
    }

    postMessage({comment: 'Parsing Ways...'});
    const ways = data.ways;
    const segments = [];
    for(let j = 0; j < ways.length; j++) {
        const way = ways[j];
        for(let i = 1; i < way.nodes.length; i++) {
            const p1 = points.find(point => point.id === way.nodes[i-1]);
            const p2 = points.find(point => point.id === way.nodes[i]);                
            const oneway = way.tags.oneway || way.tags.lanes === 1;
            
            segments.push(new Segment(p1, p2, {oneway}));
        }
        postMessage({value: j+1, max: ways.length});
    }

    postMessage({comment: 'Parsing Buildings...'});
    const parsedBuildings = [];
    for(let j = 0; j < buildings.length; j++) {
        const geometryPoints = [];
        for(const node of buildings[j].geometry) {
            geometryPoints.push(
                getPointFromGeoCoords(mapBoundingBox, node));
        }
        parsedBuildings.push(
            new Building(
                new Polygon(geometryPoints), 
                { levelCount: Number(buildings[j].tags['building:levels'] ?? 1) }
            )
        );        
        
        postMessage({value: j+1, max: ways.length});
    }

    postMessage({ result: { points, segments, buildings: parsedBuildings } });
}