import { angleOfVector } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Marking } from "./marking.js";

export class Parking extends Marking {
    constructor(
        center, directionVector, width, height,
        {protoType=false, angle, polygon, borders, supportSeg}={}
    ) {
        super(center, directionVector, width, height);
        this.type = 'parking';
        if (!protoType) {
            this.angle = angleOfVector(this.directionVector) - Math.PI*0.5;
            this.supportSeg = Segment.generateSegment(center, height, directionVector);
            this.polygon = new Envelope(this.supportSeg, width, 0).polygon;
            this.borders = [this.polygon.segments[0], this.polygon.segments[2]];
        } else {
            this.angle = angle;
            this.supportSeg = supportSeg;
            this.polygon = polygon;
            this.borders = borders;
        }
    }

    static loadMarking(markingInfo) {
        return new Parking(
            Point.loadPoint(markingInfo.center), 
            Point.loadPoint(markingInfo.directionVector), 
            markingInfo.width,
            markingInfo.height, 
            { 
                protoType: true, supportSeg: Segment.loadSegment(markingInfo.supportSeg), 
                polygon: Polygon.loadPolygon(markingInfo.polygon), 
                borders: markingInfo.borders.map(segInfo => Segment.loadSegment(segInfo)),
                angle: markingInfo.angle
            }
        )
    }

    draw(context) {        
        this.borders.forEach(border => 
            border.draw(context, {color: 'white', lineWidth: 5})
        );

        context.save();
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.font = `bold ${this.height*0.4}px Arial`;
            context.fillStyle = 'white';
            context.translate(this.center.x, this.center.y);
            context.rotate(this.angle);
            context.scale(2, 2);
            context.fillText('P', 0, this.height*0.009);
        context.restore();
    }
}