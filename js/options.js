import { OSM } from "./osm.js";

const panelLabel = document.getElementById('panelLabel');
const labels = {
    tools: '🛠️',
    save: '💾',
    restore: '💽',
    clear: '🧹',
    generate: '⚙️'
}

const save = document.getElementById('save');
const saveLocal = document.getElementById('saveLocal');
const saveFile = document.getElementById('saveFile');
const restore = document.getElementById('restore');
const restoreLocal = document.getElementById('restoreLocal');
const fileInput = document.getElementById('fileInput');
const openOsmBtn = document.getElementById('openOSM');
const show = document.getElementById('show');
const dispose = document.getElementById('dispose');
const clear = document.getElementById('clear');
const clearAll = document.getElementById('clearAll');
const clearRoads = document.getElementById('clearRoads');
const clearBuildings = document.getElementById('clearBuildings');
const clearTrees = document.getElementById('clearTrees');
const mode = document.getElementById('mode');
const generateBtn = document.getElementById('generate');
const genRoads = document.getElementById('genRoads');
const genBuildings = document.getElementById('genBuildings');
const genTrees = document.getElementById('genTrees');
const debugBtn = document.getElementById('debugBtn');
const backBtn = document.getElementById('back');
const zoom = document.getElementById('zoom');

const mainPanelBtns = [save, restore, openOsmBtn, show, dispose, clear, mode, generateBtn, debugBtn];
const savePanelBtns = [saveLocal, saveFile];
const restorePanelBtns = [restoreLocal, fileInput];
const clearPanelBtns = [clearAll, clearBuildings, clearRoads, clearTrees];
const generationPanelBtns = [genBuildings, genTrees, genRoads];

const mainPanel = [...parentNodes(mainPanelBtns), zoom];
const savePanel = parentNodes(savePanelBtns);
const restorePanel = parentNodes(restorePanelBtns);
const clearPanel = parentNodes(clearPanelBtns);
const generationPanel = parentNodes(generationPanelBtns);

const subPanels = [...savePanel, ...restorePanel, ...clearPanel, ...generationPanel];

addListenerForPanel(save, savePanel, labels.save);
addListenerForPanel(restore, restorePanel, labels.restore);
addListenerForPanel(clear, clearPanel, labels.clear);
addListenerForPanel(generateBtn, generationPanel, labels.generate);

[...subPanels, backBtn].forEach(element => {
    element.addEventListener('click', e => {
        [...subPanels, backBtn].forEach(button => button.style.display = 'none');
        mainPanel.forEach(tool => tool.style.display = 'block');
        updatePanelLabel(labels.tools);
    });
});

const osmPanel = document.getElementById('osmPanel');
const osmData = document.getElementById('osmData');
const osmLoad = document.getElementById('osmLoad');
const osmBack = document.getElementById('osmBack');

const openOsmPanel = () => osmPanel.style.display = 'block';
const closeOsmPanel = () => osmPanel.style.display = 'none';

openOsmBtn.addEventListener('click', openOsmPanel);
osmBack.addEventListener('click', closeOsmPanel);

export function checkData(handler) {
    const value = osmData.value;
    if(value === '') {
        alert('No data provided');
        return
    }    

    try {
        handler.loadOSM(JSON.parse(value));
    } catch (error) {
        console.log(error);
    }

    osmData.value = '';
    closeOsmPanel();
}

function parentNodes(btns) {    
    return btns.map(btn => btn.parentNode);
}

function updatePanelLabel(label) {
    panelLabel.textContent = label;
}

function addListenerForPanel(btn, panel, label) {
    btn.addEventListener('click', e => {    
        mainPanel.forEach(tool => tool.style.display = 'none');
        [...panel, backBtn].forEach(button => button.style.display = 'block');
        updatePanelLabel(label);
    });
}