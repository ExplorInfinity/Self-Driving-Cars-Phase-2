import { Point } from "../primitives/point.js";
import { lerp, getDistance, subtract, add, scale, lerp2D, translateVector } from "../math/utils.js";
import { Segment } from "../primitives/segment.js";
import { Polygon } from "../primitives/polygon.js";
import { LoadingScreen } from "../loading.js";

export class Tree {
    constructor(center, size, heightCoeff=0.17, {protoType=false, levels, base}={}) {
        this.center = center;
        this.size = size;
        this.heightCoeff = heightCoeff;
        this.levelCount = 7;
        this.levels = levels??this.#generateTreeLevels();
        this.base = base??this.#generateLevelPoly(center, 0);
    }

    #generateTreeLevels() {
        const levels = [];
        for(let i = 0; i < this.levelCount; i++) {
            const radii = [];
            const t = i / (this.levelCount-1 === 0 ? 2 : this.levelCount-1);
            const radius = lerp(this.size, this.size*0.25, t)*0.5;
            for(let i = 0; i < 32; i++) {
                const noisyRad = radius * (Math.random()*0.5 + 0.5);
                radii.push(noisyRad);
            }
            levels.push(radii);
        }        

        return levels
    }

    #generateLevelPoly(center, level) {
        const points = [];
        for(let i = 0; i < 32; i++) {
            const noisyRad = this.levels[level][i];            
            points.push(translateVector(center, noisyRad, i*Math.PI/16));
        }
        return new Polygon(points)
    }

    draw(context, viewPoint) {
        const diff = subtract(this.center, viewPoint);
        const topPoint = add(this.center, scale(diff, this.heightCoeff));
        for(let i = 0; i < this.levelCount; i++) {
            const t = i / (this.levelCount-1 === 0 ? 2 : this.levelCount-1);
            const center = lerp2D(this.center, topPoint, t);
            const color = `hsl(${lerp(100, 130, t)}, 44%, ${lerp(10, 27, t)}%)`;
            
            const poly = this.#generateLevelPoly(center, i);
            poly.draw(context, {fillStyle: color, strokeStyle: 'rgba(0,0,0,0)'});
        }
    }

    // Spawn range is relative to treeSize [min, max]
    static async generateTrees(world, spawnRange=[0.7, 3]) {
        const {roadBorders, buildings, roads, treeSize} = world;
        const points = [
            ...roadBorders.map(seg => [seg.p1, seg.p2]).flat(),
            ...buildings.map(building => building.base.points).flat()
        ];
        const occupiedSpace = [
            ...buildings.map(building => building.base),
            ...roads.map(road => road.polygon),
        ];
    
        const mapTop = Math.floor(Math.min(...points.map(point => point.y)));
        const mapBottom = Math.floor(Math.max(...points.map(point => point.y)));
        const mapLeft = Math.floor(Math.min(...points.map(point => point.x)));
        const mapRight = Math.floor(Math.max(...points.map(point => point.x)));
        const mapHeight = mapBottom - mapTop;
        const mapWidth = mapRight - mapLeft;
        
        const numberOfWorkers = 16;
        const workers = [];
        const workerPromises = [];
        
        LoadingScreen.show();
        LoadingScreen.showRandomBar();
        LoadingScreen.setComment('Generating Trees...');
        let treeCount = 0;
        LoadingScreen.setProgressValue(treeCount);
        for(let i = 0; i < numberOfWorkers; i++) {
            const worker = new Worker('./js/workers/tree.js', {type: 'module'});

            const workerPromise = new Promise((resolve, reject) => {
                worker.onmessage = e => {
                    const data = e.data;

                    if(data.result) {
                        resolve(data.result.map(treeInfo => Tree.loadTree(treeInfo)));
                    } else {
                        if(data.comment) LoadingScreen.setComment(data.comment);
                        if(data.value) {
                            treeCount += data.value;
                            LoadingScreen.setProgressValue(treeCount);
                        }
                    }
                }
                
                worker.onerror = e => {
                    console.error(e);
                    reject();
                }

                const offset = i % 2 === 0 ? treeSize*0.55 : 0;
                const left = lerp(mapLeft, mapRight, i / numberOfWorkers) + offset;
                const right = mapLeft + (mapWidth / numberOfWorkers) * (i+1) - offset;                
        
                worker.postMessage({
                    top: mapTop, bottom: mapBottom, 
                    left, right,
                    occupiedSpace,
                    treeSize, spawnRange
                });
            })

            workers.push(worker);
            workerPromises.push(workerPromise);
        }

        const trees = 
            await Promise.all(workerPromises)
                .then(res => {
                    LoadingScreen.hide();
                    const trees = res.flat();
                    for(let i = 0; i < trees.length; i++) {
                        for(let j = i+1; j < trees.length; j++) {
                            if(getDistance(trees[i].center, trees[j].center) <= treeSize) {
                                trees.splice(j, 1);
                                j--;
                            }
                        }
                    }
                    
                    return trees;
                })
                .catch(err => console.error(err))
                .finally(() => workers.forEach(worker => worker.terminate()));
        return trees

        // return new Promise((resolve, reject) => {
        //     const worker = new Worker('./js/workers/tree.js', {type: 'module'});

        //     worker.onmessage = e => {
        //         const data = e.data;

        //         if(data.result) {
        //             LoadingScreen.hide();
        //             worker.terminate();
        //             resolve(data.result.map(treeInfo => Tree.loadTree(treeInfo)));
        //         } else {
        //             LoadingScreen.show();
        //             LoadingScreen.showRandomBar();
        //             if(data.comment) LoadingScreen.setComment(data.comment);
        //             if(data.value) LoadingScreen.setProgressValue(data.value);
        //         }
        //     }
            
        //     worker.onerror = e => {
        //         console.error(e);
        //         worker.terminate();
        //     }
    
        //     const {roadBorders, buildings, roads, treeSize} = world;
        //     worker.postMessage({roadBorders, buildings, roads, treeSize, spawnRange});
        // })
    }

    static loadTree(treeInfo) {
        return new Tree(
            Point.loadPoint(treeInfo.center), 
            treeInfo.size, 
            treeInfo.heightCoeff, 
            { protoType: true, 
              levels: treeInfo.levels, 
              base: Polygon.loadPolygon(treeInfo.base)}
        )
    }
}