import { average, getIntersectionPoint, getRandomColor, subtract, crossProduct2D, createWorkerChunk, intersectionPossible } from "../math/utils.js";
import { Point } from "./point.js";
import { Segment } from "./segment.js";

export class Polygon {
    constructor(points, {protoType=false, segments}={}) {
        if (!protoType) {
            this.points = points;
            this.segments = [];
            for(let i = 0; i < this.points.length; i++) {            
                this.segments.push(
                    new Segment(
                        this.points[(i+1) % this.points.length], 
                        this.points[i % this.points.length]
                    )
                );
            }
        } else {
            this.points = points;
            this.segments = segments;
        }
    }

    loadSegs(segsInfo) {
        this.segments = segsInfo.map(Segment.loadSegment(segsInfo));
    }

    intersectionPossiblePolys(polygons) {
        return polygons.filter(poly => 
            intersectionPossible(this, poly) && 
            this !== poly
        );
    }

    static loadPolygon(polyInfo) { 
        const points = polyInfo.points.map(pointInfo => Point.loadPoint(pointInfo));
        const segments = polyInfo.segments.map(segInfo => 
            new Segment(Point.loadPoint(segInfo.p1), Point.loadPoint(segInfo.p2))
        );        
        return new Polygon(points, {protoType: true, segments})
    }

    static polygonUnion(polygons) {

        const checkPolys = polygons.map(poly => poly.intersectionPossiblePolys(polygons));

        if(polygons.length <= 0) return
        // console.time('breaking');
        Polygon.multiBreak(polygons, checkPolys);
        // console.timeEnd('breaking');

        const unionSegments = [];

        // console.time('Filtering');
        for(let i = 0; i < polygons.length; i++) {
            for(const seg of polygons[i].segments) {                                
                const point = average(seg.p1, seg.p2);
                
                let keep = true;
                for(let j = 0; j < checkPolys[i].length; j++) {
                    if(checkPolys[i][j].isPointInsidePoly(point)){
                        keep = false;
                        break
                    }
                }

                if(keep) {
                    unionSegments.push(seg);
                }
            }            
        }
        // console.timeEnd('Filtering');

        return unionSegments
    }

    static multiBreak(polygons, checkPolys) {
        for(let i = 0; i < polygons.length-1; i++) {
            for(let j = i+1; j < polygons.length; j++) {
                if(checkPolys[i].find(poly => poly === polygons[j])) {
                    Polygon.break(polygons[i], polygons[j]);
                }
            }
        }        
    }

    static break(poly1, poly2) {
        const segs1 = poly1.segments;
        const segs2 = poly2.segments;

        // const intersections = [];

        for(let i = 0; i < segs1.length; i++) {
            for(let j = 0; j < segs2.length; j++) {
                
                const intersection = getIntersectionPoint(
                    [segs1[i].p1, segs1[i].p2], [segs2[j].p1, segs2[j].p2]
                );

                if( intersection && 
                    intersection.offset !==1 &&
                    intersection.offset !==0
                ){
                    const intPoint = new Point(intersection.x, intersection.y);
                    // intersections.push(intPoint);
                    
                    const segment1 = Segment.breakSegment(segs1[i], intPoint);
                    segs1.splice(i+1, 0, segment1);
                    
                    const segment2 = Segment.breakSegment(segs2[j], intPoint);
                    segs2.splice(j+1, 0, segment2);
                    j++;
                }
            }
        }

        // return intersections
    }

    isPointInsidePoly(point) {
        let windingNumber = 0;
    
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
    
            if (point.y >= Math.min(p1.y, p2.y) && point.y <= Math.max(p1.y, p2.y)) {
                const Vec_p1p2 = subtract(p2, p1);
                const Vec_p1point = subtract(point, p1);
                const cross = crossProduct2D(Vec_p1p2, Vec_p1point);
    
                if (cross === 0) {
                    if (point.x >= Math.min(p1.x, p2.x) && point.x <= Math.max(p1.x, p2.x)) {
                        // console.log(this.points, point);
                        return true;
                    }
                }
    
                if ((point.y > p1.y) !== (point.y > p2.y)) {
                    if (cross > 0) {
                        windingNumber++;
                    } else {
                        windingNumber--;
                    }
                }
            }
        }
    
        return windingNumber !== 0;
    }

    containsSegment(segment, context) {
        const midPoint = average(segment.p1, segment.p2);
        
        return this.containsPoint([midPoint], context);
    }

    containsPoint(points, context) {
        this.drawPath(context);
        for(let i = 0; i < points.length; i++) {            
            if(context.isPointInPath(points[i].x, points[i].y)){
                return true;
            }
        }

        return false
    }

    intersectsPoly(polygon) {
        for(const s1 of this.segments) {
            for(const s2 of polygon.segments) {
                if(getIntersectionPoint([s1.p1, s1.p2], [s2.p1, s2.p2])) {
                    return true
                }
            }
        }

        return false
    }

    minDistFromPoint(point) {
        return Math.min(...this.segments.map(s => s.minDistFromPoint(point)))
    }

    minDistFromPoly(poly) {
        return Math.min(...this.points.map(point => poly.minDistFromPoint(point)))
    }

    drawPath(context) {
        context.beginPath();
        if(Array.isArray(this.points) && this.points.length > 0) {
            context.moveTo(this.points[0].x, this.points[0].y);
            for(let i = 1; i < this.points.length; i++) {
                context.lineTo(this.points[i].x, this.points[i].y);
            }
        }
        context.closePath();
    }

    draw(context, {stroke=true, strokeStyle='blue', fillStyle='rgba(0,0,255,0.3)', lineWidth=2} = {}) {
        context.fillStyle = fillStyle;
        if(stroke) {
            context.strokeStyle = strokeStyle;
            context.lineWidth = lineWidth;
        }
        context.lineCap = 'round';

        this.drawPath(context);
        context.fill();
        if(stroke) context.stroke();

        // this.segments.forEach(segment => 
        //     segment.draw(context, {color: getRandomColor(), lineWidth: 5}));
    }
}