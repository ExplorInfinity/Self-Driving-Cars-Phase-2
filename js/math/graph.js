import { Point } from "../primitives/point.js";
import { Segment } from "../primitives/segment.js";

export class Graph {
    constructor(points = [], segments = []) {
        this.points = points;
        this.segments = segments;
    }

    static covertInfoToGraph(graphInfo) {
        const points = graphInfo.points.map(pointInfo => Point.loadPoint(pointInfo));
        const segments = graphInfo.segments.map(segInfo => Segment.loadSegFromPoints(segInfo, points));

        return {points, segments, graph: new Graph(points, segments)}
    }

    draw(context) {
        for(const point of this.points) {
            point.draw(context, { size: 15, color: 'hsla(0,0%,30%,0.75)'});
        }
        // for(const segment of this.segments) {
        //     segment.draw(context);
        // }
    }

    addPoint(newPoint) {
        const existingPoint = this.containsPoint(newPoint);

        if(!existingPoint) this.points.push(newPoint);
        else console.log('Already a point is there!');
    }

    addSegment(point1, point2) {
        let p1 = point1;
        let p2 = point2;

        if(this.containSegment(p1, p2)) return

        if(this.segments.length >= this.segmentsPossible()) {
            console.log('Maximum Segments are added to Graph');
            return
        }

        if (!p1 && !p2) {
            do {
                p1 = this.points[Math.floor(Math.random() * this.points.length)];
                do {
                    p2 = this.points[Math.floor(Math.random() * this.points.length)];
                } while (p2 === p1);
            } while (this.containSegment(p1, p2))
        }

        const newSegment = new Segment(p1, p2);

        this.segments.push(newSegment);
        // console.log('A segement is inserted!');
        // console.log(this.segments);
    }

    containSegment(p1, p2) {
        return(
            this.segments.find(segment => {
            const condition1 = (segment.p1 === p1 || segment.p1 === p2);
            const condition2 = (segment.p2 === p1 || segment.p2 === p2);
            return condition1 && condition2
            }) ? true : false
        )
    }

    segmentsPossible() {
        let sum = 0;
        for(let i = 0; i < this.points.length; i++) {
            for(let j = i+1; j < this.points.length; j++) {
                sum++;
            }
        }

        return sum
    }

    removePoint(point) {
        if(this.points.length === 0 || !point) return;
        this.points.splice(this.points.indexOf(point), 1);
        const deletedPoint = point;

        this.segments = this.getSegmentsOfPoint(deletedPoint);
    }

    removeSegment() {
        if(this.segments.length === 0) return;
        this.segments.pop();
    }

    containsPoint({x, y}) {
        const point = this.points.find(point => point.x === x && point.y === y);
        return point ? point : false
    }

    getSegmentsOfPoint(point) {
        return this.segments.filter(segment => segment.p1 !== point && segment.p2 !== point)
    }

    clear() {
        this.points.length = this.segments.length = 0;
    }
}