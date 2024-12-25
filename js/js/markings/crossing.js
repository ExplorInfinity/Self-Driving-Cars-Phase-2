import { angleOfVector, getNearestSegment, getPerpendicularVector, translateVector } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Marking } from "./marking.js";

export class Crossing extends Marking {
    constructor(
        center, directionVector, width, height, 
        {protoType=false, supportSeg, polygon, borders}={}
    ) {
        super(center, directionVector, width, height);
        this.type = 'crossing';
        if (!protoType) {
            this.supportSeg = Segment.generateSegment(
                center, width, getPerpendicularVector(directionVector));
            this.polygon = new Envelope(this.supportSeg, height, 0).polygon;
            this.borders = [this.polygon.segments[1], this.polygon.segments[3]];
        } else {
            this.supportSeg = supportSeg ?? Segment.generateSegment(
                center, width, getPerpendicularVector(directionVector));
            this.polygon = polygon ?? new Envelope(this.supportSeg, height, 0).polygon;
            this.borders = borders ?? [this.polygon.segments[1], this.polygon.segments[3]];
        }
    }

    static loadMarking(markingInfo) {
        return new Crossing(
            Point.loadPoint(markingInfo.center), 
            Point.loadPoint(markingInfo.directionVector), 
            markingInfo.width,
            markingInfo.height, 
            { 
                protoType: true, supportSeg: Segment.loadSegment(markingInfo.supportSeg), 
                polygon: Polygon.loadPolygon(markingInfo.polygon), 
                borders: markingInfo.borders.map(segInfo => Segment.loadSegment(segInfo))
            }
        )
    }

    draw(context) {
        // this.borders.forEach(b => b.draw(context));
        this.supportSeg.draw(context, {
            color: 'white', 
            lineWidth: this.height, 
            lineCap: 'butt' ,
            dash: [this.width/9, this.width/9]
        });
    }
}