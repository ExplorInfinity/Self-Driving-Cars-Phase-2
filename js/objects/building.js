import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Envelope } from "../primitives/envelope.js";
import { add, angleOfVector, average, getDistance, normalize, scale, subtract, translateVector } from "../math/utils.js";
import { LoadingScreen } from "../loading.js";

export class Building {
    constructor(base, {levelCount=1}={}) {
        this.base = base;
        this.levels = levelCount;
        this.levelHeight = 250;
        this.maxHeight = this.levelHeight * this.levels;
        this.baseColor = 'hsl(0, 0%, 100%)';
        this.wallColor = 'hsl(0, 0%, 85%)';
        this.topColor = 'hsl(0, 0%, 90%)';
        this.outlineColor = 'hsl(0, 0%, 80%)';
    }

    static debug = [
        {label: 'Base Color', varName: 'baseColor', default: '#ffffff'}, 
        {label: 'Top Color', varName: 'topColor', default: '#d9d9d9'}, 
        {label: 'Wall Color', varName: 'wallColor', default: '#e6e6e6'}, 
        {label: 'Outline Color', varName: 'outlineColor', default: '#cccccc'}, 
    ]

    #getFake3dPoint(point, viewPoint, height) {
        const dir = normalize(subtract(point, viewPoint));
        const dist = getDistance(point, viewPoint);
        const scaler = Math.atan(dist / 5000) / (Math.PI / 2);
        return add(point, scale(dir, height * scaler));
    }

    draw(context, viewPoint) {
        const maxHeight = this.base.points.length > 4 ? this.maxHeight : this.maxHeight*0.8;

        // Ceiling [part under roof]
        const topPoints = this.base.points.map(point => 
            this.#getFake3dPoint(point, viewPoint, maxHeight)
        );
        const ceiling = new Polygon(topPoints);

        // Roof
        const midPoints = [
            average(topPoints[0], topPoints[1]),
            average(topPoints[2], topPoints[3])
        ];

        const elevatedMidPoints = [
            this.#getFake3dPoint(midPoints[0], viewPoint, this.maxHeight),
            this.#getFake3dPoint(midPoints[1], viewPoint, this.maxHeight),
        ];

        const roof = this.base.points.length > 4 ? [] :
            [
                new Polygon([
                    topPoints[1], topPoints[2], 
                    elevatedMidPoints[1], elevatedMidPoints[0]
                ]),
                new Polygon([
                    topPoints[0], topPoints[3], 
                    elevatedMidPoints[1], elevatedMidPoints[0]
                ])
            ];
        
        // Walls or Sides
        const sides = [];
        for(let i = 0; i < this.base.points.length; i++) {
            const nextIndex = (i+1) % this.base.points.length;
            const topPoint1 = this.#getFake3dPoint(this.base.points[i], viewPoint, maxHeight);
            const topPoint2 = this.#getFake3dPoint(this.base.points[nextIndex], viewPoint, maxHeight);
            const points = [this.base.points[i], this.base.points[nextIndex], topPoint2, topPoint1];
            const sidePoly = new Polygon(points);
            sides.push(sidePoly);

            // Floor Oulines
            if(this.levels > 1) {
                sidePoly.segs = [];
                for(let j = 0; j < this.levels; j++) {
                    const basePoint1 = this.#getFake3dPoint(this.base.points[i], viewPoint, this.levelHeight*j);
                    const basePoint2 = this.#getFake3dPoint(this.base.points[nextIndex], viewPoint, this.levelHeight*j);
                    const topPoint1 = this.#getFake3dPoint(this.base.points[i], viewPoint, this.levelHeight*(j+1));
                    const topPoint2 = this.#getFake3dPoint(this.base.points[nextIndex], viewPoint, this.levelHeight*(j+1));
                    sidePoly.segs.push(new Segment(basePoint1, basePoint2));
                    sidePoly.segs.push(new Segment(topPoint1, topPoint2));
                }
            }
        }        
        
        sides.sort((a, b) => b.minDistFromPoint(viewPoint) - a.minDistFromPoint(viewPoint));
    
        this.base.draw(context, {fillStyle: this.baseColor, strokeStyle: 'hsla(0, 0%, 0%, 0.15)', lineWidth: 17});
        for(const side of sides) {            
            side.draw(context, {fillStyle: this.wallColor, strokeStyle: this.outlineColor})
            if(this.levels > 1) {
                console.log(side.segs);
                
                side.segs.forEach(seg => seg.draw(context, {color: this.outlineColor}));
            }
        }
        if(roof.length > 0) {
            ceiling.draw(context, {fillStyle: this.wallColor, strokeStyle: this.wallColor, lineWidth: 5});
        } else {
            ceiling.draw(context, {fillStyle: this.topColor, strokeStyle: this.outlineColor, lineWidth: 2});
        }
        roof.forEach(roofPart => 
            roofPart.draw(context, {fillStyle: 'hsl(0, 83.10%, 65.10%)', strokeStyle: 'hsl(0, 74.60%, 30%)'})
        );
    }

    static async generateBuildings(world) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('./js/workers/building.js', {type: 'module'});

            worker.onmessage = e => {
                const data = e.data;            
                
                if(Array.isArray(data)) {
                    LoadingScreen.hide();
                    worker.terminate();
                    resolve(data.map(buildingInfo => Building.loadBuilding(buildingInfo)));
                }
                else {
                    LoadingScreen.show();
                    if(data.comment) LoadingScreen.setComment(data.comment);
                    if(data.progress) {
                        const progress = data.progress;
                        LoadingScreen.showProgressBar();
                        LoadingScreen.updateProgressBar(progress.value, progress.max);
                    }
                    else {
                        LoadingScreen.showRandomBar();
                    }
                }
            }

            worker.onerror = e => {
                console.error(e);
                worker.terminate();
                reject();
            }

            const { 
                graph, 
                roadWidth, roadRoundness,
                minBuildingLength, buildingWidth, spacing,
            } = world;
            
            worker.postMessage({ 
                graph, 
                roadWidth, roadRoundness,
                minBuildingLength, buildingWidth, spacing,
            });
        })
    }

    static loadBuilding(info) {        
        return new Building(Polygon.loadPolygon(info.base), {levelCount: info.levels});
    }
}
