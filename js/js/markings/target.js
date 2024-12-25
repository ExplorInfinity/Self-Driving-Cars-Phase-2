import { angleOfVector } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Marking } from "./marking.js";

export class Target extends Marking {
    constructor(
        center, directionVector, width, height, 
        {protoType=false, supportSeg, polygon}={}
    ) {
        super(center, directionVector, width, height);
        this.type = 'target';
        if (!protoType) {
            this.supportSeg = Segment.generateSegment(center, width, directionVector);
            this.polygon = new Envelope(this.supportSeg, this.boxWidth, 0).polygon;
        } else {
            this.supportSeg = supportSeg;
            this.polygon = polygon;
        }
    }

    static loadMarking(markingInfo) {
        return new Target(
            Point.loadPoint(markingInfo.center), 
            Point.loadPoint(markingInfo.directionVector), 
            markingInfo.width,
            markingInfo.height, 
            { 
                protoType: true, supportSeg: Segment.loadSegment(markingInfo.supportSeg), 
                polygon: Polygon.loadPolygon(markingInfo.polygon), 
            }
        )
    }

    draw(context) {        
        this.center.draw(context, {color: 'red', size: this.width});
        this.center.draw(context, {color: 'white', size: this.width*0.67});
        this.center.draw(context, {color: 'red', size: this.width*0.33});
    }
}