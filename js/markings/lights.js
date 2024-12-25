import { angleOfVector, getPerpendicularVector, subtract, translateVector } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Marking } from "./marking.js";

export class TrafficLights extends Marking {
    constructor(
        center, directionVector, width, height,
        {protoType=false, drawSeg, polygon, borders, angle, lights}={}
    ) {
        super(center, directionVector, width, height);
        this.type = 'trafficLights';
        this.boxWidth = 25;

        if (!protoType) {
            this.drawSeg = Segment.generateSegment(
                center, 
                width - this.boxWidth*1.1, 
                getPerpendicularVector(directionVector));
            this.polygon = new Envelope(this.drawSeg, this.boxWidth, 0).polygon;
            this.borders = [this.polygon.segments[3]];
    
            this.angle = angleOfVector(this.drawSeg.directionVector());
            this.lights = [
                translateVector(this.center, -this.drawSeg.length()*0.5, this.angle),
                this.center,
                translateVector(this.center, this.drawSeg.length()*0.5, this.angle),
            ];
        } else {
            this.drawSeg = drawSeg;
            this.polygon = polygon;
            this.borders = borders;
            this.angle = angle;
            this.lights = lights;
        }
        
        this.activeLightNumber = 0;
        this.time = 0;
        this.timeInterval = 1000;
    }

    static loadMarking(markingInfo) {
        return new TrafficLights(
            Point.loadPoint(markingInfo.center), 
            Point.loadPoint(markingInfo.directionVector), 
            markingInfo.width,
            markingInfo.height, 
            { 
                protoType: true, drawSeg: Segment.loadSegment(markingInfo.drawSeg), 
                polygon: Polygon.loadPolygon(markingInfo.polygon), 
                borders: markingInfo.borders.map(segInfo => Segment.loadSegment(segInfo)),
                angle: markingInfo.angle,
                lights: markingInfo.lights.map(lightInfo => Point.loadPoint(lightInfo)),
            }
        )
    }

    update(deltaTime) {        
        this.time += deltaTime;

        if(this.time >= this.timeInterval) {
            this.time = 0;
            this.activeLightNumber++;
            if(this.activeLightNumber > this.lights.length-1) 
                this.activeLightNumber = 0;
        }
    }

    draw(context) {
        this.drawSeg.draw(context, 
            {color: 'black', lineWidth: this.boxWidth*0.9});

        const brightColors = ['rgb(255,0,0)', 'rgb(255,255,0)', 'rgb(0,255,0)'];
        const dullColors = ['rgb(150, 0, 0)', 'rgb(100,100,0)', 'rgb(0,100,0)'];
        for(let i = 0; i < this.lights.length; i++) {
            const color = (i === this.activeLightNumber ? 
                                brightColors[i] : 
                                dullColors[i]);
            this.lights[i].draw(context, {color, size: 10});
        }
    }
}