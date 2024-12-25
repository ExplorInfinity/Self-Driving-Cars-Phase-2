import { add, dot, getDistance, magnitude, normalize, scale, subtract, angleOfVector, translateVector } from "../math/utils.js";
import { Point } from "./point.js";

export class Segment {
    constructor(p1, p2, {oneway=false}={}) {
        this.p1 = p1;
        this.p2 = p2;
        this.oneway = oneway;
    }

    static loadSegment(segInfo) {
        return new Segment(Point.loadPoint(segInfo.p1), Point.loadPoint(segInfo.p2), {oneway: segInfo.oneway})
    }

    static loadSegFromPoints(segInfo, points) {
        const p1 = points.find(point => {
            const segPoint = segInfo.p1;
            return point.x === segPoint.x && point.y === segPoint.y
        })
        const p2 = points.find(point => {
            const segPoint = segInfo.p2;
            return point.x === segPoint.x && point.y === segPoint.y
        })
        return new Segment(p1, p2)
    }

    static breakSegment(segment, breakPoint) {
        const p2 = segment.p2;
        segment.p2 = breakPoint;
        const segment2 = new Segment(breakPoint, p2);
        return segment2;
    }

    static generateSegment(center, height, directionVector) {
        const p1 = translateVector(
            center, 
            height*0.5, 
            angleOfVector(directionVector)
        );
        const p2 = translateVector(
            center, 
            -height*0.5, 
            angleOfVector(directionVector)
        );
        return new Segment(p1, p2); 
    }

    draw(context, {lineWidth=2, color='black', dash=[], lineCap='round'} = {}) {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.lineCap = lineCap;
        if(dash) {
            if(dash !== true) context.setLineDash(dash);
            else context.setLineDash([7, 5])
        }
        if(this.oneway) context.setLineDash([4, 4]);
        context.beginPath();
        context.moveTo(this.p1.x, this.p1.y);
        context.lineTo(this.p2.x, this.p2.y);
        context.stroke();
        context.setLineDash([]);
    }

    length() {
        return getDistance(this.p1, this.p2)
    }

    directionVector() {
        return normalize(subtract(this.p2, this.p1));
    }

    minDistFromPoint(point) {
        if(getDistance(this.p1, this.p2) < 0.001) {
            return Math.min(
                getDistance(point, this.p1), 
                getDistance(point, this.p2)
            )
        }
        
        const projection = this.projectionVec(point);
        if(projection.offset >= 1 || projection.offset <= 0) {
            return Math.min(
                getDistance(point, this.p1), 
                getDistance(point, this.p2)
            )
        }

        return getDistance(projection.point, point);
    }

    projectionVec(point) {
        const A = subtract(point, this.p1);
        const B = subtract(this.p2, this.p1);

        const unitVectorB = normalize(B);
        const scalarProduct = dot(A, unitVectorB);

        const projection = {
            point: add(this.p1, scale(unitVectorB, scalarProduct)),
            offset: scalarProduct / magnitude(B)
        }
        
        return projection
    }
}