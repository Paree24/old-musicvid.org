import store from '../store'
export function selectItem(item){
    store.dispatch({
        type: "SELECT_ITEM",
        payload: item
        } 
    );  
}


export function addAutomation(item){
    store.dispatch({
        type: "ADD_AUTOMATION",
        payload: item
        } 
    );  
}

export function addLayer(item){
    store.dispatch({
        type: "ADD_LAYER",
        payload: item
        } 
    );  
}

export function addSound(item){
    store.dispatch({
        type: "ADD_SOUND",
        payload: item
        } 
    ); 
}


export function selectLayer(index){
    store.dispatch({
        type: "SELECT_LAYER",
        payload: index
    });  
}


export function removeAudio(){
    store.dispatch({
        type: "REMOVE_AUDIO",

        } 
    );  
}


export function editEffect(item) {
    store.dispatch({
        type: "EDIT_EFFECT",
        payload: item
        } 
    );  
} 

export function addEffect(item) {
    store.dispatch({
        type: "ADD_EFFECT",
        payload: item
        } 
    );  
} 

export function createEffect(item) {
    store.dispatch({
        type: "CREATE_EFFECT",
        payload: item
        } 
    );  
} 


export function removeEffect(item) {
    store.dispatch({
        type: "REMOVE_EFFECT",
        payload: item
        } 
    );  
} 

export function selectEffect(item) {
    store.dispatch({
        type: "SELECT_EFFECT",
        payload: item
        } 
    );  
} 



export function setSidebarWindowIndex(item) {
    store.dispatch({
        type: "SET_SIDEBAR_WINDOW_INDEX",
        payload: item,
        } 
    ); 
}

export function addItem(item, itemType){
    store.dispatch({
        type: "ADD_ITEM",
        payload: item,
        itemType
        } 
    );  
}

export function createItem(item, itemType){
    store.dispatch({
        type: "CREATE_ITEM",
        payload: item,
        itemType
        } 
    );  
}

export function removeItem(item){
    store.dispatch({
        type: "REMOVE_ITEM",
        payload: item
        } 
    );  
}

export function editItem(item){
    store.dispatch({
        type: "EDIT_SELECTED_ITEM",
        key: item.key,
        value: item.value,
    });  
}

