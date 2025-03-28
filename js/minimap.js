import DragEvent from "./library/drag.js";
import { Viewport } from "./viewport.js";

const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

minimapCanvas.width = 300;
minimapCanvas.height = 200;

const viewport = new Viewport(minimapCtx, { zoom: 5, zoomDrag: true, fastZoom: true });

DragEvent.addDragAndDrop(minimapCanvas, '🗾', { hideOnOffscreen: true });

const roadOptions = { fillStyle: 'black', strokeStyle: 'black' };
const buildingBaseOptions = { fillStyle: 'gray', strokeStyle: 'hsl(0,0%,40%)' };
export function drawMinimap(world) {
    viewport.reset();
    for(const road of world.roads) {
        road.draw (minimapCtx, roadOptions);
    }
    for(const marking of world.roadMarkings) {
        marking.draw(minimapCtx);
    }
    for(const { base } of world.buildings) {
        base.draw(minimapCtx, buildingBaseOptions);
    }
    minimapCtx.restore();
}