import { add, invLerp, scale, subtract } from "./math/utils.js";
import { Point } from "./primitives/point.js";

export class Viewport {
    constructor(context) {
        this.canvas = context.canvas;
        this.context = context;

        this.zoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 5;
        this.step = 0.15;

        this.center = new Point(this.canvas.width*0.5, this.canvas.height*0.5);

        this.offset = scale(this.center, -1);
        this.drag = {
            active: false,
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0)
        }

        this.keys = [];
        this.#addEventListeners();
    }

    getZoomPercentage() {
        return (invLerp(this.maxZoom, this.minZoom, this.zoom)*100).toFixed(0)
    }

    getMouseCoords(e, subtractDragOffset=false) {
        const offset = this.getOffset();
        const x = (e.offsetX - this.center.x) * this.zoom - this.offset.x - (subtractDragOffset ? this.drag.offset.x : 0);
        const y = (e.offsetY - this.center.y) * this.zoom - this.offset.y - (subtractDragOffset ? this.drag.offset.y : 0);

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
        const value = this.zoom+direction*this.step;
        this.zoom = Math.max(this.minZoom, Math.min(value, this.maxZoom));
    }

    #handleMouseDown(e) {
        if( this.keys.includes('Control') && 
            !this.drag.active) this.startDrag(e);
    }
    
    #handleMouseMove(e) {
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
    }

    #handleKeyUp(e) {
        const keyReleased = e.key;
        if(keyReleased === 'Control' && this.keys.includes(keyReleased)) 
            this.keys.splice(this.keys.indexOf(keyReleased), 1);        
    }

    startDrag(e) {
        const {x, y} = {x: e.x, y: e.y};
        this.drag.active = true;
        this.drag.start = new Point(x, y);
    }

    handleDrag(e) {
        const {x, y} = {x: e.x, y: e.y};
        this.drag.end = new Point(x, y);
        this.drag.offset = subtract(this.drag.end, this.drag.start);
    }

    endDrag(e) {
        const {x, y} = {x: e.x, y: e.y};
        this.drag.end = new Point(x, y);
        this.drag.offset = subtract(this.drag.end, this.drag.start);
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
