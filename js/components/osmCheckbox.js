import slider_button from "./slider_button.js";

function OSM_Checkbox(label, value, id) {
    const container = document.createElement('div');
    container.classList.add('osmCheckBox');
    
    const osmLabel = document.createElement('p');
    osmLabel.textContent = label;

    const [sliderBtn, isChecked] = slider_button(value, {checked: true});
    sliderBtn.id = id;

    container.appendChild(osmLabel);
    container.appendChild(sliderBtn);

    return [
        container, 
        (label) => { osmLabel.textContent = label }, 
        isChecked
    ]
}

function insertNode(node) {
    document.getElementById('osmSelection')
        .insertBefore(node, document.getElementById('osmGenerate'));
}

const [roadLabel, setRoadLabel, isRoadsChecked] = 
    OSM_Checkbox('Roads', 'roads', 'genRoadsCheck');
const [buildingLabel, setBuildingLabel, isBuildingsChecked] = 
    OSM_Checkbox('Buildings', 'buildings', 'genBuildingsCheck');

insertNode(roadLabel); 
insertNode(buildingLabel);

export { setRoadLabel, isRoadsChecked, setBuildingLabel, isBuildingsChecked };