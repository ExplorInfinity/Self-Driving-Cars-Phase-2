import { add, scale } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Building } from "../objects/building.js";

onmessage = e => {
    
    const { 
        graph, 
        roadWidth=60, roadRoundness=20,
        minBuildingLength=150, buildingWidth=150, spacing=10,
    } = e.data;

    const tempEnv = [];

    postMessage({comment: 'Creating Area...'});
    for(const segment of graph.segments) {
        tempEnv.push(new Envelope(
            segment, 
            roadWidth + buildingWidth + spacing*8,
            roadRoundness
        ))
    }
    
    postMessage({comment: 'Creating Guides...'});
    const guides = Polygon.polygonUnion(
        tempEnv.map(e => e.polygon)
    ).filter(guide => guide.length() > minBuildingLength+spacing);
    
    postMessage({comment: 'Creating Supports...', progress: {value: 0, max: guides.length}});
    
    const supports = [];
    for(let i = 0; i < guides.length; i++) {
        const segment = guides[i];
        const segLength = segment.length() + spacing;
        const buildingCount = Math.floor(
            segLength / (buildingWidth + spacing)
        );
        const buildingLength = segLength / buildingCount;
        const direction = segment.directionVector();
        
        let p1 = segment.p1;
        let p2 = add(p1, scale(direction, buildingLength));
        
        supports.push(new Segment(p1, p2));
        
        for(let i = 1; i < buildingCount; i++) {
            p1 = add(p2, scale(direction, spacing));
            p2 = add(p1, scale(direction, buildingLength));
            
            supports.push(new Segment(p1, p2));
        }
        postMessage({progress: {value: i+1, max: guides.length}});
    }

    postMessage({
        comment: 'Creating Buildings...', 
        progress: {value: 0, max: supports.length}
    });

    const bases = [];
    for(let i = 0; i < supports.length; i++) {
        const segment = supports[i];
        bases.push(
            new Envelope(segment, buildingWidth, 1).polygon
        );
        postMessage({progress: {value: i+1, max: supports.length}});
    }

    postMessage({
        comment: 'Filtering Buildings...', 
        progress: {value: 0, max: supports.length}
    });

    for(let i = 0; i < bases.length-1; i++) {
        for(let j = i+1; j < bases.length; j++) {
            if (bases[i].intersectsPoly(bases[j]) || 
                bases[i].minDistFromPoly(bases[j]).toFixed(2) < spacing) {                        
                bases.splice(j, 1);
                j--;
            }
        }
        postMessage({progress: {value: i+1, max: bases.length}});
    }

    postMessage(bases.map(base => new Building(base)))
}