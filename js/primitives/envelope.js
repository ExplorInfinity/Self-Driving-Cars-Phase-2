import { angleOfVector, subtract, translateVector } from "../math/utils.js";
import { Point } from "./point.js";
import { Polygon } from "./polygon.js";
import { Segment } from "./segment.js";

export class Envelope {
    constructor(segment, width=50, roundness=10, {protoType=false, polygon}={}) {
        if (!protoType) {
            this.skeleton = segment;
            this.width = width;
            this.roundness = Math.max(1, Math.min(roundness, 20));
            this.polygon = this.#generatePolygon();
        } else {
            this.skeleton = segment;
            this.width = width;
            this.roundness = roundness;
            this.polygon = polygon ?? this.#generatePolygon();
        }
    }

    static loadEnvelope(envInfo) {
        const p1 = Point.loadPoint(envInfo.skeleton.p1);
        const p2 = Point.loadPoint(envInfo.skeleton.p2);
        const segment = new Segment(p1, p2);
        const polygon = Polygon.loadPolygon(envInfo.polygon);
        
        return new Envelope(segment, envInfo.width, envInfo.roundness, {polygon, protoType: true})
    }

    #generatePolygon() {
        const radius = this.width*0.5;
        const {p1, p2} = this.skeleton;
        const alpha = angleOfVector(subtract(p1, p2));
        
        const alpha_cw = alpha + Math.PI*0.5;
        const alpha_ccw = alpha - Math.PI*0.5;

        // const polygonP1 = translateVector(p1, radius, alpha_cw);
        // const polygonP2 = translateVector(p2, radius, alpha_cw);
        // const polygonP3 = translateVector(p2, radius, alpha_ccw);
        // const polygonP4 = translateVector(p1, radius, alpha_ccw);
        // const polygon = [polygonP1, polygonP2, polygonP3, polygonP4];

        let points = [];
        const step = Math.PI / this.roundness;
        const eps = step*0.5;
        for(let i = alpha_ccw; i <= alpha_cw + eps; i+=step) {
            points.push(translateVector(p1, radius, i));
        }
        for(let i = alpha_ccw; i <= alpha_cw + eps; i+=step) {
            points.push(translateVector(p2, radius, Math.PI + i));
        }
        
        return new Polygon(points)
    }

    draw(context, options) {
        this.polygon.draw(context, options);
    }
}