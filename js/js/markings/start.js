import { angleOfVector } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Marking } from "./marking.js";

export class Start extends Marking {
    constructor(
        center, directionVector, width, height,
        {protoType=false, supportSeg, polygon, borders, imgAngle} = {}
    ) {
        super(center, directionVector, width, height);
        this.type = 'start';
        if (!protoType) {
            this.supportSeg = Segment.generateSegment(center, width, directionVector);
            this.polygon = new Envelope(this.supportSeg, this.boxWidth, 0).polygon;
            this.borders = [this.polygon.segments[0], this.polygon.segments[3]];
        } else {
            this.supportSeg = supportSeg;
            this.polygon = polygon;
            this.borders = borders;
        }

        this.imgAngle = imgAngle ?? angleOfVector(this.directionVector) - Math.PI*0.5;
        this.image = new Image();
        this.image.src = 'car.png';
        this.imgWidth = 30;
        this.imgHeight = 50;
    }
    
    static loadMarking(markingInfo) {
        return new Start(
            Point.loadPoint(markingInfo.center), 
            Point.loadPoint(markingInfo.directionVector), 
            markingInfo.width,
            markingInfo.height, 
            { 
                protoType: true, supportSeg: Segment.loadSegment(markingInfo.supportSeg), 
                polygon: Polygon.loadPolygon(markingInfo.polygon), 
                borders: markingInfo.borders.map(segInfo => Segment.loadSegment(segInfo)),
                imgAngle: markingInfo.imgAngle
            }
        )
    }

    draw(context) {
        context.save();
        context.translate(this.center.x, this.center.y);
        context.rotate(this.imgAngle);
        context.drawImage(
            this.image, 
            -this.imgWidth*0.5, -this.imgHeight*0.5, 
            this.imgWidth, this.imgHeight
        );
        context.restore();
    }
}