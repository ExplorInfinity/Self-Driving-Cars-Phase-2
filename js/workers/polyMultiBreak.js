import { Polygon } from "../primitives/polygon.js";

onmessage = e => {    
    const data = e.data;

    const startIndex = data.startIndex;
    const endIndex = data.endIndex;
    const polygons = data.polygons.map(p => Polygon.loadPolygon(p)) 

    for(let i = startIndex; i < endIndex; i++) {
        for(let j = 0; j < polygons.length; j++) {
            if(i === j) continue
            Polygon.break(polygons[i], polygons[j])
        }
    }

    postMessage({result: {startIndex, endIndex, polygons}});
}

        const availThreads = (navigator.hardwareConcurrency*0.5 || 4) - 2;    
        const workerCount = availThreads < polygons.length ? availThreads : polygons.length;
        const workers = [];
        const workerPromises = [];

        for(let i = 0; i < workerCount; i++) {
            const worker = new Worker(location.origin + '/js/workers/polyMultiBreak.js', {type: 'module'})

            const { startIndex, endIndex } = createWorkerChunk(i, workerCount, polygons);
            
            const workerPromise = new Promise((resolve, reject) => {

                worker.onmessage = e => {
                    const data = e.data;
                    if(data.result) {
                        resolve(data.result);
                    }
                }

                worker.onerror = e => {
                    console.error(e)
                    reject(e);
                }                
                
                worker.postMessage({startIndex, endIndex, polygons});
            })

            workers.push(worker);
            workerPromises.push(workerPromise);
        }

        await Promise.all(workerPromises)
            .then(responses => {
                console.log(responses);
                
                for(const response of responses) {
                    const {startIndex, endIndex} = response;
                    
                    for(let i = startIndex; i < endIndex; i++) {
                        const polygon = polygons[i];
                        const resPolygon = response.polygons[i];
                        polygon.points = 
                            resPolygon.points.map(p => Point.loadPoint(p));
                        polygon.segments = 
                            resPolygon.segments.map(segInfo => 
                                Segment.loadSegment(segInfo));                        
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => workers.forEach(worker => worker.terminate()));