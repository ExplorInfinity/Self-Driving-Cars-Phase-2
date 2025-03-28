import { LoadingScreen } from "./loading.js";
import { Building } from "./objects/building.js";
import { Point } from "./primitives/point.js";
import { Segment } from "./primitives/segment.js";

export class OSM {
    static async getWorldInfo(data) {
        const {points, segments, buildings} = await this.parseData(data);
        
        return {
            points: points.map(pointInfo => Point.loadPoint(pointInfo)), 
            segments: segments.map(segInfo => Segment.loadSegment(segInfo)), 
            buildings: buildings.map(buildingInfo => Building.loadBuilding(buildingInfo))
        }
    }

    static async parseData(data) {
        return await new Promise((resolve, reject) => {
            const worker = new Worker('./js/workers/osmParser.js', {type: 'module'});

            worker.onmessage = e => {                
                const data = e.data;
                if(data.result) {
                    LoadingScreen.hide();
                    worker.terminate();
                    resolve(data.result);
                } else {
                    if(data.comment) {
                        LoadingScreen.show();
                        LoadingScreen.showProgressBar();
                        LoadingScreen.setComment(data.comment);
                    }
                    if (data.value) {
                        LoadingScreen.updateProgressBar(data.value, data.max);
                    }
                }
            }
    
            worker.onerror = e => {
                console.error(e);
                worker.terminate();
                reject();
            }
    
            worker.postMessage(data);
        });
    }
}