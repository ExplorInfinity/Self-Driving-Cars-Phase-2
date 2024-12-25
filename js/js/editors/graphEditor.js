import { getNearestPoint } from "../math/utils.js";
import { Point } from "../primitives/point.js";
import { Segment } from "../primitives/segment.js";

export class GraphEditor {
    constructor(viewport, graph) {
        this.viewport = viewport;
        this.canvas = viewport.canvas;
        this.ctx = this.canvas.getContext('2d');

        this.graph = graph;
        this.dragable = false;
        this.moved = false;
        this.selected = null;
        this.hovered = null;
        this.mouse = null;
        this.enableListeners();
    }

    enableListeners() {
        this.controller = new AbortController();
        this.signal = this.controller.signal;
        this.#addEventListeners(this.signal);
    }

    disableListeners() {
        this.controller.abort();
        this.dragable = this.moved = false;
        this.selected = this.hovered = this.mouse = null;
    }

    #addEventListeners(signal) {
        this.canvas.addEventListener('mousewheel', this.#handleMouseMove.bind(this), {signal});
        this.canvas.addEventListener('mousedown',  this.#handleMouseDown.bind(this), {signal});
        this.canvas.addEventListener('mousemove', this.#handleMouseMove.bind(this), {signal});
        this.canvas.addEventListener('mouseup', this.#handleMoveUp.bind(this), {signal});

        window.addEventListener('contextmenu', e => e.preventDefault(), {signal});
    }

    #handleMouseDown(e) {
        const {x, y} = this.viewport.getMouseCoords(e);

        if(this.viewport.keys.includes('Control')) return

        if(e.button === 1) return

        if(e.button === 2) {
            if(this.selected) {
                this.selected = null;
            }
            if(this.hovered) {
               this.graph.removePoint(this.hovered);
               this.hovered = null;
            }
            return
        }

        if (this.hovered) {
            if(this.selected && this.selected !== this.hovered) {
                this.graph.addSegment(this.selected, this.hovered);
            }
            this.selected = this.hovered;
            this.dragable = true;
            return
        }

        const existingPoint = this.graph.containsPoint({x, y});

        if(!existingPoint) {
            const newPoint = new Point(x, y);
            this.graph.addPoint(newPoint);

            if(this.selected) {
                this.graph.addSegment(this.selected, newPoint);
            }
            // this.hovered = newPoint;
            this.selected = newPoint;
            this.dragable = false;
        }
        else {
            this.selected = existingPoint;
        }
    }

    #handleMouseMove(e) {
        const {x, y} = this.viewport.getMouseCoords(e, true);
        // if( this.viewport.keys.includes('Control')) return

        if(this.dragable) {
            this.selected.x = x;
            this.selected.y = y;
            if(!this.moved) this.moved = true;
            return
        }

        if(e.button !== 0) return

        this.mouse = new Point(x, y);
        this.hovered = getNearestPoint(this.mouse, this.graph.points, 10 * this.viewport.zoom)
    }

    #handleMoveUp(e) {
        if( this.viewport.keys.includes('Control')) return

        if(e.button === 1) return

        this.dragable = false;
        if(this.moved) {
            this.moved = false;
            this.selected = null;
        }
    }

    display() {
        this.graph.draw(this.ctx);
        if(this.selected && this.mouse) {
            const p2 = this.hovered ? this.hovered : this.mouse;
            new Segment(this.selected, p2).draw(this.ctx, {dash: true});
        }
        if(this.selected) this.selected.draw(this.ctx, { outline: true });
        if(this.hovered && this.selected !== this.hovered) this.hovered.draw(this.ctx, { hovered: true });
    }

    clear() {
        this.selected = this.hovered = null;
    }
}