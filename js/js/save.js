import { World } from "./world.js";

export class SaveWorld {
    
    static showSavedMaps() {
        let mapNumber = 0;
        for(let i = 0; i < localStorage.length; i++) {
            if(localStorage.getItem(`Map${mapNumber}`)) {
                console.log(
                    `Map${mapNumber}`, 
                    JSON.parse(localStorage.getItem(`Map${mapNumber}`)
                ));
            }
            mapNumber++;
        }
        window.alert('Check Console for data!');
    }

    static disposeWorld(mapNumber) {
        if(localStorage.getItem(`Map${mapNumber}`)) {
            localStorage.removeItem(`Map${mapNumber}`);
        }
        else window.alert('Map not found!');
    }

    static saveWorld(world, viewport) {
        world.viewport = {
            zoom: viewport.zoom,
            offset: viewport.offset
        }

        let mapNumber = 0;
        while (localStorage.getItem(`Map${mapNumber}`)) {
            mapNumber++;
        }
        localStorage.setItem(`Map${mapNumber}`, 
            JSON.stringify(world)
        );
        window.alert(`Map${mapNumber} Saved!`);
    }

    static restoreWorld(mapNumber) {
        if(localStorage.getItem(`Map${mapNumber}`)) {            
            const worldInfo = JSON.parse(localStorage.getItem(`Map${mapNumber}`));
            return { world: World.loadWorld(worldInfo), viewport: worldInfo.viewport};
        }
        else window.alert('Map not found!');
    }

    static saveToLocalFile(world, viewport) {
        world.viewport = {
            zoom: viewport.zoom,
            offset: viewport.offset
        }

        const button = document.createElement('a');
        button.setAttribute(
            'href', 
            'data:application/json;charset=utf-8,' + 
                encodeURIComponent(JSON.stringify(world))
        );

        const fileName = 'name.world';
        button.setAttribute('download', fileName);
        button.click();
    }

    static async loadFromLocalFile(e) {

        return new Promise((resolve, reject) => {
            const file = e.target.files[0];

            if(!file) {
                reject(new Error('No file Selected.'));
                return
            }
    
            const reader = new FileReader();
            reader.readAsText(file);
            reader.addEventListener('load', e => {
                
            })
            reader.onload = (e) => {
                try {
                    const fileContent = e.target.result;
                    
                    const worldInfo = JSON.parse(fileContent);
                    resolve({ 
                        world: World.loadWorld(worldInfo), 
                        viewport: worldInfo.viewport
                    });
                } catch (error) {
                    reject(new Error('Error Parsing the file: ' + error.message));
                }
            }
        })

    }
}