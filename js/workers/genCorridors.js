import { Graph } from "../math/graph.js";
import { getNearestSegment } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { getShortestPath } from "../shortestPath.js";

onmessage = e => {
    const { start, end, roadWidth, roadRoundness } = e.data;
    const { graph } = Graph.covertInfoToGraph(e.data.graph);
    
    const startSeg = getNearestSegment(start, graph.segments, roadWidth*2);
    const endSeg = getNearestSegment(end, graph.segments, roadWidth*2);
    
    if(!startSeg || !endSeg) {
        postMessage({abort: true});
        return
    }

    const projStart = startSeg.closestPointOnSeg(start);
    const projEnd = endSeg.closestPointOnSeg(end);

    let tempSegs = [];
    if(startSeg === endSeg) tempSegs = [new Segment(projStart, projEnd)];
    else {
        const seg1 = Segment.breakSegment(startSeg, projStart);
        const seg2 = Segment.breakSegment(endSeg, projEnd);
        
        tempSegs = [seg1, seg2];
    }
    
    const segments = graph.segments.concat(tempSegs);
    
    // console.time('Shortest Path');
    const shortestPath = getShortestPath(projStart, projEnd, segments);    
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