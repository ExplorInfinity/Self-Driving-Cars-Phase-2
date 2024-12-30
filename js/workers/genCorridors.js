import { Graph } from "../math/graph.js";
import { Envelope } from "../primitives/envelope.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { getShortestPath } from "../shortestPath.js";

onmessage = e => {
    const { roadWidth, roadRoundness } = e.data;
    const { graph } = Graph.covertInfoToGraph(e.data.graph);
    const start = graph.points.find(point => point.isSame(e.data.start));
    const end = graph.points.find(point => point.isSame(e.data.end));
    
    // console.time('Shortest Path');
    const shortestPath = getShortestPath(start, end, graph);    
    // console.timeEnd('Shortest Path');

    const pathSegs = [];
    for(let i = 0; i < shortestPath.length-1; i++) {
        pathSegs.push(new Segment(shortestPath[i], shortestPath[i+1]));
    }
    const tempEnv = 
        pathSegs.map(seg => new Envelope(seg, roadWidth, roadRoundness));

    // console.time('Union');
    const corridor = Polygon.polygonUnion(tempEnv.map(env => env.polygon));
    // console.timeEnd('Union');

    postMessage({result: corridor});
}