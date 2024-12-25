import { Polygon } from "../primitives/polygon.js";
import { Envelope } from "../primitives/envelope.js";

onmessage = e => {
    const { graph, roadWidth, roadRoundness } = e.data;

    if(graph.segments.length > 50) postMessage({comment: 'Enabling Marking Editor...'});

    const lanes = [];
    for(const segment of graph.segments) {            
        lanes.push(
            new Envelope(segment, roadWidth*0.5, roadRoundness));    
    }

    const laneGuides = Polygon.polygonUnion(
        lanes.map(envelope => envelope.polygon));

    postMessage({result: laneGuides});
}