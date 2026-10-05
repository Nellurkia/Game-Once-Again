const registry=new Map();
export const register=(id,game)=>registry.set(id,game);
export const getMinigame=id=>{if(!registry.has(id))throw new Error('Unknown minigame: '+id);return registry.get(id);};
