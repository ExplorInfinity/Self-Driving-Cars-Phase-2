import { LoadingScreen } from "../loading.js";
import { Crossing } from "../markings/crossing.js";
import { TrafficLights } from "../markings/lights.js";
import { Parking } from "../markings/parking.js";
import { Start } from "../markings/start.js";
import { Stop } from "../markings/stop.js";
import { Target } from "../markings/target.js";
import { Yield } from "../markings/yield.js";
import { getNearestSegment } from "../math/utils.js";
import { Envelope } from "../primitives/envelope.js";
import { Polygon } from "../primitives/polygon.js";
import { Segment } from "../primitives/segment.js";

export class MarkingEditor {
    constructor(viewport, world) {
        this.viewport = viewport;
        this.world = world;
        
        this.canvas = viewport.canvas;
        this.context = viewport.context;
        this.testCanvas = document.createElement('canvas');
        this.testContext = this.testCanvas.getContext('2d');

        this.laneGuides = [];
        this.intent = null;
        this.selected = this.hovered = this.mouse = null;

        this.mode = '';
        this.signGuides = [this.laneGuides, this.world.graph.segments];        
        this.markings = {
            stopSign: { className: Stop, 
                    width: this.world.roadWidth*0.45, 
                    height: this.world.roadWidth*0.5,
                    guideLines: 0,
                    button: document.getElementById('stopSign'),
                },
            crossingSign: { className: Crossing, 
                    width: this.world.roadWidth, 
                    height: this.world.roadWidth*0.5,
                    guideLines: 1,
                    button: document.getElementById('crossingSign'),
                },
            yieldSign: { className: Yield, 
                    width: this.world.roadWidth*0.45, 
                    height: this.world.roadWidth*0.5,
                    guideLines: 0,
                    button: document.getElementById('yieldSign'),
                },
            targetSign: { className: Target, 
                    width: this.world.roadWidth*0.45, 
                    height: this.world.roadWidth*0.5,
                    guideLines: 0,
                    button: document.getElementById('targetSign'),
                },
            startSign: { className: Start, 
                    width: this.world.roadWidth*0.45, 
                    height: this.world.roadWidth*0.5,
                    guideLines: 0,
                    button: document.getElementById('startSign'),
                },
            parkingSign: { className: Parking, 
                    width: this.world.roadWidth*0.45, 
                    height: this.world.roadWidth*0.5,
                    guideLines: 0,
                    button: document.getElementById('parkingSign'),
                },
            trafficLights: { className: TrafficLights, 
                    width: this.world.roadWidth*0.45, 
                    height: this.world.roadWidth*0.5,
                    guideLines: 0,
                    button: document.getElementById('trafficLights'),
                },
        };
    }
    
    setModeWithName(modeName) {
        document.querySelectorAll('.selectedBtn')
        .forEach(btn => btn.classList.remove('selectedBtn'));
        this.mode = modeName;
        this.markings[this.mode].button.classList.add('selectedBtn');
    }

    #addMenuListeners(signal) {
        this.mode = '';
        document.querySelectorAll('.selectedBtn')
            .forEach(btn => btn.classList.remove('selectedBtn'));
        for(const marking of Object.values(this.markings)) {            
            marking.button.addEventListener('click', this.#setMode.bind(this), {signal});
        }
    }

    #setMode(e) {
        this.intent = null;
        this.selected = this.hovered = this.mouse = null;
        const selectedBtn = e.target;        
        this.setModeWithName(selectedBtn.id);
    }

    async generate() {
        this.laneGuides.length = 0;
        if(this.world.graph.segments.length <= 0) return
        
        const laneGuides = await new Promise((resolve, reject) => {
            const worker = new Worker('./js/workers/markingEditor.js', {type: 'module'});

            LoadingScreen.show();
            LoadingScreen.showRandomBar();
            LoadingScreen.setComment('Initiating...');
            worker.onmessage = e => {
                const data = e.data;
                if(data.result) {
                    LoadingScreen.hide();
                    worker.terminate();
                    resolve(data.result);
                } else if(data.comment) {
                    LoadingScreen.setComment(data.comment);
                }
            }

            worker.onerror = e => {
                LoadingScreen.hide();
                worker.terminate();
                reject(e);
            }

            const { graph, roadWidth, roadRoundness } = this.world;
            worker.postMessage({ graph, roadWidth, roadRoundness });
        });        
                
        if(laneGuides.length > 0) 
            this.laneGuides = laneGuides.map(lane => Segment.loadSegment(lane));
    }

    enableListeners() {
        this.controller = new AbortController();
        const signal = this.controller.signal;
        this.#addEventListeners(signal);
        this.#addMenuListeners(signal);
    }

    disableListeners() {
        this.controller.abort();
        this.intent = null;
        this.selected = this.hovered = this.mouse = null;
    }

    #addEventListeners(signal) {
        this.canvas.addEventListener('mousedown',  this.#handleMouseDown.bind(this), {signal});
        this.canvas.addEventListener('mousemove', this.#handleMouseMove.bind(this), {signal});

        window.addEventListener('contextmenu', e => e.preventDefault(), {signal});
    }

    #handleMouseDown(e) {
        if(this.viewport.keys.includes('Control')) return

        if(e.button === 0) {
            if(!this.intent) return 
            this.world.roadMarkings.push(this.intent);
            this.hovered = this.intent;
            this.intent = null;
        }
        else if(e.button === 2) {
            if(!this.hovered) return
            this.mouse = this.viewport.getMouseCoords(e);
            const roadMarkings = this.world.roadMarkings;

            roadMarkings.splice(roadMarkings.indexOf(this.hovered), 1);
            this.hovered = null;
        }
    }

    #handleMouseMove(e) {   
        this.mouse = this.viewport.getMouseCoords(e, true);
        
        this.hovered = this.checkSelection(this.mouse);
        if(this.hovered) {
            this.intent = null;
            return
        }
        
        if(this.mode === '') return
        this.signGuides = [this.laneGuides, this.world.graph.segments];        
        const hoveredSeg = getNearestSegment(
            this.mouse, 
            this.signGuides[this.markings[this.mode].guideLines],
            40 * this.viewport.zoom
        );

        if (hoveredSeg && hoveredSeg.length() >= this.world.roadWidth*0.5) {
            const projection = hoveredSeg.projectionVec(this.mouse);
            if( projection && 
                projection.offset < 1 && 
                projection.offset > 0 ) {
                this.intent = new this.markings[this.mode].className(
                    projection.point, 
                    hoveredSeg.directionVector(),
                    this.markings[this.mode].width,
                    this.markings[this.mode].height,
                );                
            } else this.intent = null;
        } else this.intent = null;

        if(this.intent)
            this.intent = this.checkOverlap(this.intent.polygon) ? null : this.intent;
    }

    checkSelection(point) {
        const roadMarkings = this.world.roadMarkings;
        for(const marking of roadMarkings) {
            if(marking.polygon.containsPoint([point], this.testContext)) {
                return marking
            }
        }
        return null
    }

    checkOverlap(poly) {
        const roadMarkings = this.world.roadMarkings;
        for(const marking of roadMarkings) {
            if(marking.polygon.intersectsPoly(poly)) {
                return marking
            }
        }
        return null
    }

    display(context) {
        if(this.intent) this.intent.draw(context);
        else if(this.hovered) this.hovered.polygon.draw(context, {fillStyle: 'rgba(255,0,0,0.3)', strokeStyle: 'red'});
    }

    clear() {
        this.intent = null;
        this.selected = this.hovered = this.mouse = null;
    }
}