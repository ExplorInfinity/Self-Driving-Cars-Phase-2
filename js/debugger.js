import { add, subtract, trimSpaces } from "./math/utils.js";
import { Point } from "./primitives/point.js";

export class Debugger {
    constructor(world, {label, arrayName, object, props}={}) {
        this.world = world;
        this.debugger = document.getElementById('debugger');
        this.label = label;
        this.object = object;
        this.arrayName = arrayName;
        
        this.#createContainer(label);
        
        props.forEach(prop => 
            this.#addColorPicker(prop.label, prop.varName, prop.default));
    }

    #createContainer(label) {
        this.container = document.createElement('div');
        const containerLabel = document.createElement('div');

        this.container.classList.add('debugContainer');
        containerLabel.classList.add('debugLabel');

        containerLabel.textContent = label;

        this.container.appendChild(containerLabel);
        this.debugger.appendChild(this.container);

        this.container.style.display = 'none';
    }

    #addColorPicker(labelName, itemKey, defaultValue) {        
        const colorPicker = document.createElement('input');
        colorPicker.setAttribute('type', 'color');
        colorPicker.id = itemKey;
        colorPicker.value = defaultValue;        

        const label = document.createElement('label');
        label.setAttribute('for', itemKey);
        label.textContent = `${labelName} `;

        this.container.appendChild(label);
        label.appendChild(colorPicker);

        if(this.arrayName) {
            colorPicker.addEventListener('input', e => {            
                this.object[this.arrayName].forEach(b => 
                    b[itemKey] = e.target.value);
            })
        } else {
            colorPicker.addEventListener('input', e => {            
                
                this.object[itemKey] = e.target.value;
            })
        }

        return colorPicker
    }
}

export class DebuggerHandler {
    constructor(world) {
        this.world = world;
        this.debuggers = [];
        this.currentIndex = 0;
        this.debuggerDiv = document.getElementById('debugger');

        window.addEventListener('keydown', e => {
            if(!debuggerShown) return
            const keyPressed = e.key;

            if( keyPressed === 'ArrowRight' && 
                this.currentIndex < this.debuggers.length-1) this.currentIndex++;
            else if( keyPressed === 'ArrowLeft' && 
                this.currentIndex > 0) this.currentIndex--;
            
            this.#enableCurrentDebugger();
        })
        
    }

    #enableCurrentDebugger() {
        this.debuggers.forEach(d => d.container.style.display = 'none');
        this.debuggers[this.currentIndex].container.style.display = 'block';
    }

    addDebuggerClass({label, arrayName, object, props}={}) {
        this.debuggers.push(
            new Debugger(this.world, {label, arrayName, object, props})
        );
        this.#checkDebuggerCount();
    }

    addDebuggerClasses(sections) {
        for(const section of sections) {
            this.addDebuggerClass(section);
        }
    }

    #checkDebuggerCount() {
        if(this.debuggers.length > 0) {
            document.getElementById('nothingScreen').style.display = 'none';
            this.#enableCurrentDebugger();
        }
        else 
            document.getElementById('nothingScreen').style.display = 'block';
    }
}

// Handling Btn Click
const debugBtn = document.getElementById('debugBtn');
let debuggerShown = false;
debugBtn.addEventListener('click', () => {
    document.getElementById('debugger').style.display = 
        debuggerShown ? 'none' : 'block';
    debuggerShown = debuggerShown ? false : true;
})

// Handling dragging
let drag = {
    start: new Point(0, 0), 
    end: new Point(0, 0), 
    offset: new Point(0, 0), 
    isDragging: false, 
}

const current = {
    x: 0, y: 0
}

const debuggerDiv = document.getElementById('debugger');
debuggerDiv.addEventListener('mousedown', e => {
    if(!drag.isDragging) {
        drag.isDragging = true;
        drag.start = new Point(e.x, e.y);
    }
})
window.addEventListener('mousemove', e => {
    if(drag.isDragging) updateDebuggerPos(e);
})
window.addEventListener('mouseup', e => {
    if(drag.isDragging)
        updateDebuggerPos(e, true);
})

function updateDebuggerPos(e, setCurrent=false) {    
    drag.end = new Point(e.x, e.y);
    drag.offset = subtract(drag.end, drag.start);

    const newPosition = add(current, drag.offset);
    newPosition.x = newPosition.x < 0 ? 0 : newPosition.x;
    newPosition.y = newPosition.y < 0 ? 0 : newPosition.y;
    const offscreen = e.x < 0 || e.y < 0;
    if(offscreen) debugBtn.click();
    if (setCurrent || offscreen) {
        current.x = newPosition.x < 0 ? 0 : newPosition.x;
        current.y = newPosition.y < 0 ? 0 : newPosition.y;

        drag = {
            start: new Point(0, 0), 
            end: new Point(0, 0), 
            offset: new Point(0, 0), 
            isDragging: false, 
        }
    }

    debuggerDiv.style.top = `${newPosition.y}px`;
    debuggerDiv.style.left = `${newPosition.x}px`;
}