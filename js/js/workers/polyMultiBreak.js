import { getIntersectionPoint } from "../math/utils.js";
import { Point } from "../primitives/point.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";

const workers = [];
const workerPromises = [];
for(let i = 0; i < polygons.length-1; i++) {
    const worker = new Worker('./js/workers/polyMultiBreak.js', {type: 'module'});

    const workerPromise = new Promise((resolve, reject) => {
        worker.onmessage = e => {
            const data = e.data;

            if(data.result) {
                resolve(e.data.result);
            }
        }

        worker.onerror = e => {
            console.error(e);
            reject();
        }

        worker.postMessage({polygons, index: i})
    })

    workers.push(worker);
    workerPromises.push(workerPromise);
}

Promise.all(workerPromises)
    .then(responses => {
        for(const response of responses) {
            for(let i = 0; i < polygons.length; i++) {
                const polygon = response.polygons[i];
                polygons[i].loadSegs(polygon.segments);
            }
        }
    })
    .catch(err => console.error(err))
    .finally(() => workers.forEach(worker => worker.terminate()));
