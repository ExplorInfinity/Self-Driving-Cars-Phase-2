import { Polygon } from "../primitives/polygon.js";
import { Envelope } from "../primitives/envelope.js";

onmessage = e => {
    const { roadWidth, roadRoundness, graph, autoGenLimit } = e.data;

    if(graph.segments.length > autoGenLimit) 
        postMessage({comment: 'Generating Roads...'});

    const roads = [];
    for(const segment of graph.segments) {
        roads.push(
            new Envelope(segment, roadWidth, roadRoundness))
    }

    // console.time('Union');
    const roadBorders = Polygon.polygonUnion(
        roads.map(envelope => envelope.polygon));
    // console.timeEnd('Union');

    postMessage({ result: { roads, roadBorders } });
}