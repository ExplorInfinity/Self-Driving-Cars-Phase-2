import { Segment } from "../primitives/segment.js";
import { invLerp, degToRad } from "../math/utils.js";
import { Point } from "../primitives/point.js";


onmessage = e => {
    const data = e.data;
    const nodes = data.elements.filter(n => n.type === 'node');

    const lats = nodes.map(node => node.lat);
    const lons = nodes.map(node => node.lon);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const deltaLon = maxLon - minLon;
    const deltaLat = maxLat - minLat;
    const mapAspectRatio = deltaLon / deltaLat;
    const height = deltaLat * 111000 * 10; // One degree lat is equal to 111km, scaling to 1px to 10m
    const width = height * mapAspectRatio;

    postMessage({comment: 'Parsing Nodes...'});
    const points = [];
    for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const y = invLerp(maxLat, minLat, node.lat) * height;
        const x = invLerp(minLon, maxLon, node.lon) * width * Math.cos(degToRad(node.lat));
        const point = new Point(x, y);
        point.id = node.id;
        points.push(point);

        postMessage({value: i+1, max: nodes.length});
    }

    postMessage({comment: 'Parsing Ways...'});
    const ways = data.elements.filter(element => element.type === 'way');
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

    postMessage({ result: { points, segments } });
}