import { Tree } from "../objects/tree.js";
import { Point } from "../primitives/point.js";
import { lerp, getDistance } from "../math/utils.js";
import { Polygon } from "../primitives/polygon.js";

onmessage = e => {
    const {
        top, bottom, left, right, treeSize} = e.data;
    const spawnRange = e.data.spawnRange.map(range => range*treeSize);

    const width = bottom - top;
    const height = right - left;
    const area = width * height;
    const maxTreeCount = Math.floor(area / 169000000 * 1300);
        
    const occupiedSpace = e.data.occupiedSpace.map(itemInfo => 
        Polygon.loadPolygon(itemInfo));

    const trees = [];
    let trycount = 0;
    while(trycount < 50 && trees.length <= maxTreeCount) {
        const treePoint = new Point(
            lerp(left, right, Math.random()),
            lerp(top, bottom, Math.random()),
        );

        // Checking whether tree collides with buildings or not
        let keep = true;
        for(const poly of occupiedSpace) {                       
            if( !poly.isPointInsidePoly(treePoint) &&
                poly.minDistFromPoint(treePoint) > spawnRange[0]) continue
            // 0.5, technically, but 0.7 for some spacing

            keep = false;
            break
        }

        // Checking whether tree collides with any other tree or not
        for(const tree of trees){
            if(getDistance(treePoint, tree.center) > treeSize) continue
            keep = false;
            break
        }

        // Checking if tree is enough close to spawn
        if(keep) {
            for(const poly of occupiedSpace) {                
                if(poly.minDistFromPoint(treePoint) < spawnRange[1]) {                        
                    keep = true;
                    break
                }
                keep = false;
            }
        }

        // Adding tree which fulfill all conditions
        if(keep) {
            trees.push(new Tree(treePoint, treeSize));
            trycount=0;
            postMessage({value: 1});
        } else trycount++;

    }
    
    postMessage({result: trees});
}

// onmessage = e => {
//     const {roadBorders, buildings, roads, treeSize} = e.data;
//     const spawnRange = e.data.spawnRange.map(range => range*treeSize);

//     postMessage({comment: 'Generating Trees...'});

//     const points = [
//         ...roadBorders.map(seg => [seg.p1, seg.p2]).flat(),
//         ...buildings.map(building => building.base.points).flat()
//     ];
//     const occupiedSpace = [
//         ...buildings.map(building => building.base),
//         ...roads.map(road => road.polygon),
//     ].map(itemInfo => Polygon.loadPolygon(itemInfo));

//     const top = Math.floor(Math.min(...points.map(point => point.y)));
//     const bottom = Math.floor(Math.max(...points.map(point => point.y)));
//     const left = Math.floor(Math.min(...points.map(point => point.x)));
//     const right = Math.floor(Math.max(...points.map(point => point.x)));

//     const trees = [];
//     let trycount = 0;
//     while(trycount < 100) {
//         const treePoint = new Point(
//             lerp(left, right, Math.random()),
//             lerp(top, bottom, Math.random()),
//         );

//         /* Super slow...........(Added in containsPoint)
//         const treeArcPoints = [];
//         const step = Math.PI/4;
//         const eps = step*0.5;
//         for(let i = 0; i <= 2*Math.PI + eps; i+=step) {
//             const arcPoint = new Point(
//                 treePoint.x + treeSize*Math.cos(i),
//                 treePoint.y + treeSize*Math.sin(i)
//             );
//             treeArcPoints.push(arcPoint);
//         }*/

//         // Checking whether tree collides with buildings or not
//         let keep = true;
//         for(const poly of occupiedSpace) {                       
//             if( !poly.isPointInsidePoly(treePoint) &&
//                 poly.minDistFromPoint(treePoint) > spawnRange[0]) continue
//             // 0.5, technically, but 0.7 for some spacing

//             keep = false;
//             break
//         }

//         // Checking whether tree collides with any other tree or not
//         for(const tree of trees){
//             if(getDistance(treePoint, tree.center) > treeSize) continue
//             keep = false;
//             break
//         }

//         // Checking if tree is enough close to spawn
//         if(keep) {
//             for(const poly of occupiedSpace) {                
//                 if(poly.minDistFromPoint(treePoint) < spawnRange[1]) {                        
//                     keep = true;
//                     break
//                 }
//                 keep = false;
//             }
//         }

//         // Adding tree which fulfill all conditions
//         if(keep) {
//             trees.push(new Tree(treePoint, treeSize));
//             trycount=0;
//         } else trycount++;

//         postMessage({value: trees.length});
//     }
    
//     postMessage({result: trees});
// }