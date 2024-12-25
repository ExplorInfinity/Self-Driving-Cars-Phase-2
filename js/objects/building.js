import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";
import { Envelope } from "../primitives/envelope.js";
import { add, average, getDistance, normalize, scale, subtract } from "../math/utils.js";
import { LoadingScreen } from "../loading.js";

export class Building {
    constructor(base, heightCoeff=0.2) {
        this.base = base;
        this.maxHeight = 120;
        this.heightCoeff = heightCoeff;
    }

    #getFake3dPoint(point, viewPoint, height) {
        const dir = normalize(subtract(point, viewPoint));
        const dist = getDistance(point, viewPoint);
        const scaler = Math.atan(dist / 300) / (Math.PI / 2);
        return add(point, scale(dir, height * scaler));
     }

    draw(context, viewPoint) {
        
        const topPoints = this.base.points.map(point => 
            this.#getFake3dPoint(point, viewPoint, this.maxHeight*0.6)
        );
        const ceiling = new Polygon(topPoints);

        const midPoints = [
            average(topPoints[0], topPoints[1]),
            average(topPoints[2], topPoints[3])
        ];

        const elevatedMidPoints = [
            this.#getFake3dPoint(midPoints[0], viewPoint, this.maxHeight),
            this.#getFake3dPoint(midPoints[1], viewPoint, this.maxHeight),
        ];

        const roof = [
            new Polygon([
                topPoints[1], topPoints[2], 
                elevatedMidPoints[1], elevatedMidPoints[0]
            ]),
            new Polygon([
                topPoints[0], topPoints[3], 
                elevatedMidPoints[1], elevatedMidPoints[0]
            ])
        ];
        
        const sides = [];
        for(let i = 0; i < this.base.points.length; i++) {
            const nextIndex = (i+1) % this.base.points.length;
            const points = [
                this.base.points[i], this.base.points[nextIndex], 
                topPoints[nextIndex], 
                topPoints[i]
            ];
            sides.push(new Polygon(points));
        }
        // for(let i = 0; i < this.base.points.length; i++) {
        //     const nextIndex = (i+1) % this.base.points.length;
        //     const points = i % 2 === 0 ?
        //     [
        //         this.base.points[i], this.base.points[nextIndex], 
        //         topPoints[nextIndex], 
        //         i === 0 ? elevatedMidPoints[0] : elevatedMidPoints[1],
        //         topPoints[i]
        //     ] :
        //     [
        //         this.base.points[i], this.base.points[nextIndex], 
        //         topPoints[nextIndex], 
        //         topPoints[i]
        //     ];
        //     sides.push(new Polygon(points));
        // }
        // const roof = [];
        // const roofPart1 = new Polygon([
        //     topPoints[0], 
        //     topPoints[1], 
        //     elevatedMidPoint12,
        //     elevatedMidPoint03
        // ]);
        // const roofPart2 = new Polygon([
        //     topPoints[2], 
        //     topPoints[3], 
        //     elevatedMidPoint03,
        //     elevatedMidPoint12
        // ]);
        // roof.push(roofPart1 ,roofPart2);
        
        // const sides = [];
        // for(let i = 0; i < this.base.points.length; i++) {
        //     const nextIndex = (i+1) % this.base.points.length;
        //     const points = i % 2 === 1 ?
        //     [
        //         this.base.points[i], this.base.points[nextIndex], 
        //         topPoints[nextIndex], 
        //         i === 1 ? elevatedMidPoint12 : elevatedMidPoint03,
        //         topPoints[i]
        //     ] :
        //     [
        //         this.base.points[i], this.base.points[nextIndex], 
        //         topPoints[nextIndex], 
        //         topPoints[i]
        //     ];
        //     sides.push(new Polygon(points));
        // }
        
        sides.sort((a, b) => 
            b.minDistFromPoint(viewPoint) - 
            a.minDistFromPoint(viewPoint)
        )
    
        this.base.draw(context, {fillStyle: 'white', strokeStyle: 'hsla(0, 0.00%, 0.00%, 0.15)', lineWidth: 17});
        for(const side of sides) {
            side.draw(context, {fillStyle: 'hsl(0, 0.00%, 95%)', strokeStyle: 'gray'})
        }
        ceiling.draw(context, {fillStyle: 'hsl(0, 0.00%, 95%)', strokeStyle: 'hsl(0, 0.00%, 95%)', lineWidth: 5})
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
        return new Building(Polygon.loadPolygon(info.base));
    }
}