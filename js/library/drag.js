import { add, getMin, subtract } from "../math/utils.js";
import { Point } from "../primitives/point.js";

export default class DragEvent {
    static addDragAndDrop(
        node, hiddenBtnLabel='>',   
        { hideOnOffscreen=false, runsWhileKeyPressed=false, 
          hideOnStart=true, defaultBtnPos={ x: 0, y: 0 } }={}) {
        // Node Props
        const { width: nodeWidth, height: nodeHeight } = node.getBoundingClientRect();
        const nodePosition = new Point(0, 0);
        if(hideOnStart) node.style.display = 'none';

        // Node Functions
        const updateNodePos = (pos) => {
            const newPos = pos??add(nodePosition, drag.offset);            
            nodePosition.x = getNodeInWindow(newPos).x;
            nodePosition.y = getNodeInWindow(newPos).y;            
        };
        const changeNodePos = (pos) => {
            const newPos = pos??add(nodePosition, drag.offset);
            node.style.top = toPixels(getNodeInWindow(newPos).y);
            node.style.left = toPixels(getNodeInWindow(newPos).x);
        };
        const isOffscreen = (e) => {
            if( drag.end.x <= 0 || 
                drag.end.y <= 0 || 
                drag.end.x >= window.innerWidth || 
                drag.end.y >= window.innerHeight
            ) {
                node.style.display = 'none';
                handleDragEnd(e);
                showAndSetBtn(e);
            }
        };
        const getNodeInWindow = (point, dimensions=[nodeWidth, nodeHeight, 0, 0]) => {
            const windowOffsetX = dimensions[2]??0;
            const windowOffsetY = dimensions[3]??0;
            
            const window_width = window.innerWidth;
            const window_height = window.innerHeight;
            return {
                x: Math.max(0, Math.min(point.x, window_width - dimensions[0]) + windowOffsetX), 
                y: Math.max(0, Math.min(point.y, window_height - dimensions[1]) + windowOffsetY), 
            }
        };

        // Drag and Drop Functionality
        const drag = {
            start: new Point(0, 0), 
            end: new Point(0, 0), 
            offset: new Point(0, 0), 
            isDragging: false
        };

        const registerDragStart = (x, y) => {
            drag.isDragging = true;
            drag.start.x = x;
            drag.start.y = y;
        };
        const registerDragMove = (x, y) => {
            drag.end.x = x;
            drag.end.y = y;
            drag.offset = subtract(drag.end, drag.start);
        };
        const resetDrag = () => {
            drag.start = new Point(0, 0), 
            drag.end = new Point(0, 0), 
            drag.offset = new Point(0, 0), 
            drag.isDragging = false
        };
        const handleDragEnd = (e) => {
            registerDragMove(e.x, e.y);
            updateNodePos();
            resetDrag();
        };

        node.addEventListener('mousedown', e => {
            if( !drag.isDragging && 
                (runsWhileKeyPressed || !keypressed)) 
                registerDragStart(e.x, e.y);
        });
        window.addEventListener('mousemove', e => {
            if(drag.isDragging) {                
                if((!runsWhileKeyPressed && keypressed)) {
                    handleDragEnd(e);
                } else {
                    registerDragMove(e.x, e.y);
                    changeNodePos();
                    if(hideOnOffscreen) isOffscreen(e);
                }
                // console.table(drag)
            }
        });
        window.addEventListener('mouseup', e => {
            if(drag.isDragging) handleDragEnd(e);
            // console.table(drag)
        });

        // Hidden Panel Button Functionality...
        // Add button to document
        const hiddenBtn = hiddenPanelBtn(hiddenBtnLabel);
        document.body.appendChild(hiddenBtn);

        // Button Props
        if(!hideOnStart) hiddenBtn.style.display = 'none';
        
        // Button Functions
        const percentagePos = {
            x: defaultBtnPos.x / window.innerWidth, 
            y: defaultBtnPos.y / window.innerHeight
        };
        const setBtnPos = point => {
            if(point.x <= 0 || point.x >= window.innerWidth) {                
                setVerticalStyle(hiddenBtn);
                const {width: btnWidth, height: btnHeight} = hiddenBtn.getBoundingClientRect();
                const btnPos = getNodeInWindow(point, [btnWidth, btnHeight, -btnWidth*0.5, -btnHeight*0.5]);            
                hiddenBtn.style.top = toPixels(btnPos.y);
                hiddenBtn.style.left = 0;
                percentagePos.x = 0;
                percentagePos.y = (btnPos.y + btnHeight*0.5) / window.innerHeight;
            } else if(point.y <= 0 || point.y >= window.innerHeight) {
                setHorizontalStyle(hiddenBtn);
                const {width: btnWidth, height: btnHeight} = hiddenBtn.getBoundingClientRect();
                const btnPos = getNodeInWindow(point, [btnWidth, btnHeight, -btnWidth*0.5, -btnHeight*0.5]);            
                hiddenBtn.style.top = 0;
                hiddenBtn.style.left = toPixels(btnPos.x);
                percentagePos.x = (btnPos.x + btnWidth*0.5) / window.innerWidth;
                percentagePos.y = 0;
            }
        }
        const showBtn = () => {
            hiddenBtn.style.display = 'block';
        };
        const hideBtn = () => {
            hiddenBtn.style.display = 'none';
        };
        const showAndSetBtn = e => {
            showBtn();
            setBtnPos(e);
        };
        const setHorizontalStyle = () => {
            hiddenBtn.classList.remove('vertical');
            hiddenBtn.classList.add('horizontal');
        }
        const setVerticalStyle = () => {
            hiddenBtn.classList.remove('horizontal');
            hiddenBtn.classList.add('vertical');
        }

        // Button Functinality
        hiddenBtn.addEventListener('mousedown', e => {
            hideBtn();
            node.style.display = 'block';

            const isHorizontal = hiddenBtn.classList.contains('horizontal');            
            const nodeOffset = 10;            
            const nodeNewPos = {
                x: pixelToNumber(hiddenBtn.style.left) + (isHorizontal ? -nodeWidth*0.4 : nodeOffset), 
                y: pixelToNumber(hiddenBtn.style.top) + (isHorizontal ? nodeOffset : -nodeHeight*0.4), 
            };
            if(nodeNewPos.x < 0) nodeNewPos.x = nodeOffset;
            if(nodeNewPos.y < 0) nodeNewPos.y = nodeOffset;
            updateNodePos(nodeNewPos);
            changeNodePos(nodeNewPos);
        });
        window.addEventListener('resize', () => {
            setBtnPos({
                x: window.innerWidth * percentagePos.x, 
                y: window.innerHeight * percentagePos.y, 
            });
        });
        setBtnPos(defaultBtnPos);

        // Keyboard Constraits
        let keypressed = false;
        if(!runsWhileKeyPressed) {
            const keys = new Set();
            window.addEventListener('keydown', e => {
                const { key } = e;
                keys.add(key);
                keypressed = true;
            });
            window.addEventListener('keyup', e => {
                const { key } = e;
                keys.delete(key);
                if(keys.size == 0) {
                    keypressed = false;
                }
            });
        }
    }
}

function hiddenPanelBtn(label) {
    const btn = document.createElement('button');
    btn.classList.add('hiddenPanelBtn');
    btn.textContent = label;

    return btn;
}

function toPixels(value) {
    return `${value}px`
}

function toPercentage(value, denominator) {
    return `${value/denominator}%`
}

function pixelToNumber(value) {
    return Number(value.slice(0, -2))
}

function getInWindowRangeX(value) {
    return Math.max(0, Math.min(value, window.innerWidth));
}

function getInWindowRangeY(value) {
    return Math.max(0, Math.min(value, window.innerHeight));
}
