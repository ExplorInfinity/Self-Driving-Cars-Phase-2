import { LoadingScreen } from "./loading.js";
import { Crossing } from "./markings/crossing.js";
import { TrafficLights } from "./markings/lights.js";
import { Marking } from "./markings/marking.js";
import { Parking } from "./markings/parking.js";
import { Start } from "./markings/start.js";
import { Stop } from "./markings/stop.js";
import { Target } from "./markings/target.js";
import { Yield } from "./markings/yield.js";
import { Graph } from "./math/graph.js";
import { add, getDistance, getNearestSegment, lerp, scale } from "./math/utils.js";
import { Building } from "./objects/building.js";
import { Tree } from "./objects/tree.js";
import { Envelope } from "./primitives/envelope.js";
import { Point } from "./primitives/point.js";
import { Polygon } from "./primitives/polygon.js";
import { Segment } from "./primitives/segment.js";
import { getShortestPath } from "./shortestPath.js";

export class World {
    constructor(
        graph, 
        roadWidth=120, roadRoundness=20,
        minBuildingLength=150, buildingWidth=200, spacing=50,
        treeSize = 150,
        {roads, roadBorders, buildings, trees, roadMarkings}={}
    ) {
        this.graph = graph;
        this.roadWidth = roadWidth;
        this.roadRoundness = roadRoundness;

        this.spacing = spacing;
        this.minBuildingLength = minBuildingLength;
        this.buildingWidth = buildingWidth;

        this.treeSize = treeSize;

        this.autoGenLimit = 50;

        this.roads = roads ?? [];
        this.roadBorders = roadBorders ?? [];
        this.buildings = buildings ?? [];
        this.trees = trees ?? [];
        this.roadMarkings = roadMarkings ?? [];
    }

    clearWorld() {
        this.roads = [];
        this.roadBorders = [];
        this.buildings = [];
        this.trees = [];
        this.roadMarkings = [];
    }

    static loadWorld(worldInfo) {
        const { points, segments, graph } = Graph.covertInfoToGraph(worldInfo.graph);        
        
        const roads = worldInfo.roads.map(env => 
            Envelope.loadEnvelope(env));
        
        const roadBorders = worldInfo.roadBorders.map(borderInfo => 
            Segment.loadSegment(borderInfo));
        
        const buildings = worldInfo.buildings.map(info => 
            Building.loadBuilding(info));
        
        const trees = worldInfo.trees.map(treeInfo => 
            Tree.loadTree(treeInfo));
        
        const roadMarkings = worldInfo.roadMarkings.map(markingInfo => {
            switch(markingInfo.type) {
                case 'crossing':
                    return Crossing.loadMarking(markingInfo);
                case 'parking':
                    return Parking.loadMarking(markingInfo);
                case 'trafficLights':
                    return TrafficLights.loadMarking(markingInfo);
                case 'stop':
                    return Stop.loadMarking(markingInfo);
                case 'yield':
                    return Yield.loadMarking(markingInfo);
                case 'start':
                    return Start.loadMarking(markingInfo);
                case 'target':
                    return Target.loadMarking(markingInfo);
            }
        });


        const roadWidth = worldInfo.roadWidth;
        const roadRoundness = worldInfo.roadRoundness;
        const minBuildingLength = worldInfo.minBuildingLength;
        const buildingWidth = worldInfo.buildingWidth;
        const spacing = worldInfo.spacing;
        const treeSize = worldInfo.treeSize;

        return new World(
            graph, roadWidth, roadRoundness, minBuildingLength, buildingWidth, spacing, treeSize, 
            { roads, roadBorders, buildings, trees, roadMarkings }
        );
    }

    async generate() {
        if(this.graph.segments.length < this.autoGenLimit) {
            this.roads = [];
            for(const segment of this.graph.segments) {
                this.roads.push(
                    new Envelope(segment, this.roadWidth, this.roadRoundness))
            }            
            
            this.roadBorders = Polygon.polygonUnion(
                this.roads.map(envelope => envelope.polygon))??[];
        } else {
            const worker = new Worker('./js/workers/genRoads.js', {type: 'module'});
            const { roads, roadBorders } = await new Promise((resolve, reject) => {
                LoadingScreen.show();
                LoadingScreen.showProgressBar();

                worker.onmessage = e => {
                    const data = e.data;
                    if(data.result) {
                        LoadingScreen.hide();
                        worker.terminate();
                        resolve(data.result);
                    } else if(data.comment) {
                        LoadingScreen.setComment(data.comment);
                    } else if(data.value && data.max) {                        
                        LoadingScreen.updateProgressBar(data.value, data.max);
                    }
                }

                worker.onerror = e => {
                    console.error(e);
                    worker.terminate();
                    reject();
                }

                const { roadWidth, roadRoundness, graph, autoGenLimit } = this;
                worker.postMessage({ roadWidth, roadRoundness, graph, autoGenLimit });
            });

            this.roads = roads ? roads.map(roadInfo => Envelope.loadEnvelope(roadInfo)) : [];
            this.roadBorders = roadBorders ? roadBorders.map(segInfo => Segment.loadSegment(segInfo)) : [];
        }

        if(this.graph.segments.length <= 100) {
            this.buildings = [];
            this.trees = [];
        }
        this.roadMarkings = [];
    }

    async generateBuildings() {
        this.trees = [];
        this.buildings = await Building.generateBuildings(this);
    }
    
    async generateTrees() {
        this.trees = await Tree.generateTrees(this);
    }

    update(deltaTime) {
        this.roadMarkings.forEach(marking => marking.update(deltaTime));
    }

    draw(context, viewPoint, {renderDistance=1000}={}) {
        this.roads.forEach(road => road.draw(context, {fillStyle: '#BBB', strokeStyle: '#BBB', lineWidth: this.roadWidth*0.25}));
        this.roadBorders.forEach(intersection => intersection.draw(context, {color: 'white', lineWidth: this.roadWidth*0.0625}));        
        for(const segment of this.graph.segments) {
            segment.draw(context, {color: 'white', dash: [10, 10], lineWidth: this.roadWidth*0.05});
        }
        this.roadMarkings.forEach(marking => marking.draw(context));

        if(this.corridor) {
            for(let item of this.corridor) {
                item.draw(context);
            }
        }
        
        const items = [...this.buildings??[], ...this.trees]
        .filter(item => item.base.minDistFromPoint(viewPoint) <= renderDistance)
        .sort(
            (a, b) => 
                b.base.minDistFromPoint(viewPoint) -
                a.base.minDistFromPoint(viewPoint)
        ).forEach(item => item.draw(context, viewPoint));
    }

    async generateCorridors(start, end) {        
        console.time('Corridor');
        const worker = new Worker(`${location.origin}/js/workers/genCorridors.js`, {type: 'module'});
        
        this.corridor = await new Promise((resolve, reject) => {
            worker.onmessage = e => {
                const data = e.data;
                
                if(data.result) {
                    worker.terminate();
                    const result = 
                        data.result.map(segInfo => Segment.loadSegment(segInfo));
                    resolve(result);
                } else if(data.abort) {
                    worker.terminate();
                    resolve(this.corridor);
                }
            }

            worker.onerror = e => {
                worker.terminate();
                console.error(e);
                reject();
            }

            worker.postMessage({
                start, end, graph: this.graph, 
                roadWidth: this.roadWidth, 
                roadRoundness: this.roadRoundness})
        })
        console.timeEnd('Corridor');
    }
}