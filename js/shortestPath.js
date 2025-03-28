import { Point } from "./primitives/point.js";
import { Segment } from "./primitives/segment.js";

export function getShortestPath(startPoint, endPoint, segments, {timeout=2000}={}) {
    if(startPoint === endPoint) return [startPoint];
    const points = segments.map(seg => [seg.p1, seg.p2]).flat();
    addKeys(points);
    
    const shortestPath = [];

    startPoint.dist = 0;
    let currentPoint = startPoint;
    
    while (!endPoint.visited) {          
        const segsConnected = getNextSegsWithPoint(currentPoint, segments);
        
        const nextPoints = [];
        for(const seg of segsConnected) {
            const nextPoint = seg.p1.isSame(currentPoint) ? seg.p2 : seg.p1;

            const newDist = currentPoint.dist + seg.length();
            if(nextPoint.dist > newDist) {
                nextPoint.dist = newDist;
                nextPoint.prev = currentPoint;                
            }             
            nextPoints.push(nextPoint);
        }

        currentPoint.visited = true;
        
        if(currentPoint.isSame(endPoint)) break     
        
        currentPoint = points.reduce((nearest, point) => {
            return (((point.dist < nearest.dist) && !point.visited) ? point : nearest)
        }, points.find(p => !p.visited));
    }

    if(!endPoint.prev) {
        console.error('Path not found!');
        removeKeys(points);
        return []
    }

    while (currentPoint.prev) {
        shortestPath.unshift(currentPoint);
        currentPoint = currentPoint.prev;
    }
    shortestPath.unshift(startPoint);

    removeKeys(points);
    return shortestPath
}

function getNextSegsWithPoint(point, segments) {
    const connectedSegs = segments.filter(seg => {
        if(seg.oneway) {
            if(seg.p2.isSame(point)) return true
            return false
        }

        return seg.includesPoint(point);
    });

    return connectedSegs??[]
}

function addKeys(points) {
    for(const point of points) {
        point.visited = false;
        point.dist = Number.MAX_SAFE_INTEGER;
        point.prev = null;
    }
}

function removeKeys(points) {
    for(const point of points) {
        delete point.visited;
        delete point.dist;
        delete point.prev;
    }
}