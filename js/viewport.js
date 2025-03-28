import { add, angleOfVector, invLerp, scale, subtract, translateVector } from "./math/utils.js";
import { Point } from "./primitives/point.js";
import { Segment } from "./primitives/segment.js";

export class Viewport {
    constructor(context, { minZoom=0.1, maxZoom=10, zoom=1, fastZoom=false, zoomDrag=false }={}) {
        this.canvas = context.canvas;
        this.context = context;

        this.zoom = zoom;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.step = 0.15;
        this.fastZoom = fastZoom;

        this.center = new Point(this.canvas.width*0.5, this.canvas.height*0.5);
        this.mouse = new Point(0, 0);

        this.offset = scale(this.center, -1);
        this.drag = {
            active: false,
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0)
        }
        this.dragScale = 1;
        this.zoomDrag = zoomDrag;

        this.keys = [];
        this.#addEventListeners();
    }

    getZoomPercentage() {
        return (invLerp(this.maxZoom, this.minZoom, this.zoom)*100).toFixed(0)
    }

    getMouseCoords(e, subtractDragOffset=false) {
        const offset = this.getOffset();
        const x = (e.offsetX - this.center.x) * this.zoom - (subtractDragOffset ? offset.x : this.offset.x);
        const y = (e.offsetY - this.center.y) * this.zoom - (subtractDragOffset ? offset.y : this.offset.y);

        return {x, y}
    }

    getOffset() {
        return add(this.offset, this.drag.offset);
    }

    #addEventListeners() {
        this.canvas.addEventListener('mousewheel', this.#handleMouseWheel.bind(this));
        this.canvas.addEventListener('mousedown', this.#handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.#handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.#handleMouseUp.bind(this));
        
        window.addEventListener('keydown', this.#handleKeyDown.bind(this));
        window.addEventListener('keyup', this.#handleKeyUp.bind(this));
    }

    #handleMouseWheel(e) {
        e.preventDefault();
        if(this.drag.active) return
        if(!this.keys.includes('Control')) return

        const direction = Math.sign(e.deltaY);
        const value = this.zoom + direction * this.step * ((this.fastZoom || this.keys.includes('Shift')) ? 5 : 1);
        this.zoom = Math.max(this.minZoom, Math.min(value, this.maxZoom));
    }

    #handleMouseDown(e) {
        if( this.keys.includes('Control') && 
            !this.drag.active) this.startDrag(e);
    }
    
    #handleMouseMove(e) {
        const {x, y} = this.getMouseCoords(e);
        this.mouse.x = x;
        this.mouse.y = y;
        if( this.keys.includes('Control') && 
            this.drag.active) this.handleDrag(e);
        else if(this.drag.active) this.endDrag(e); 
    }
    
    #handleMouseUp(e) {
        if( this.keys.includes('Control') && 
            this.drag.active) this.endDrag(e);
    }

    #handleKeyDown(e) {
        const keyPressed = e.key;
        if(keyPressed === 'Control' && !this.keys.includes(keyPressed)) 
            this.keys.push(keyPressed);
        if(keyPressed === 'Shift' && !this.keys.includes(keyPressed)) 
            this.keys.push(keyPressed);
        if(keyPressed === 'Shift') {
            if(this.drag.active) {
                this.endDrag(this.mouse);
                this.startDrag(this.mouse);
            }
            this.dragScale = this.zoom;
        }
    }

    #handleKeyUp(e) {
        const keyReleased = e.key;
        if(keyReleased === 'Control' && this.keys.includes(keyReleased)) 
            this.keys.splice(this.keys.indexOf(keyReleased), 1);
        if(keyReleased === 'Shift' && this.keys.includes(keyReleased)) 
            this.keys.splice(this.keys.indexOf(keyReleased), 1);
        
        if(keyReleased === 'Shift') {
            if(this.drag.active) {
                this.endDrag(this.mouse);
                this.startDrag(this.mouse);
            }
            this.dragScale = 1;
        }        
    }

    startDrag(e) {
        const {x, y} = {x: e.x, y: e.y};
        this.mouse.x = x;
        this.mouse.y = y;
        this.drag.active = true;
        this.drag.start = new Point(x, y);
    }

    handleDrag(e) {
        const {x, y} = {x: e.x, y: e.y};
        this.mouse.x = x;
        this.mouse.y = y;
        this.drag.end = new Point(x, y);
        this.drag.offset = scale(subtract(this.drag.end, this.drag.start), 
                                 this.zoomDrag ? this.zoom : this.dragScale);
    }

    endDrag(e) {
        this.handleDrag(e);
        this.offset = add(this.offset, this.drag.offset);            

        this.drag = {
            active: false,
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0)
        }
    }

    reset() {
        // this.context.restore();
        
        this.context.clearRect(0, 0, canvas.width, canvas.height);
        this.context.save();
        
        // Zoom
        this.context.translate(this.center.x, this.center.y);
        this.context.scale(1 / this.zoom, 1 / this.zoom);
        
        // Offset Translation
        const offset = this.getOffset();
        this.context.translate(offset.x, offset.y);
    }
}
