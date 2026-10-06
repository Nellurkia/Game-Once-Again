// Chapter routing must ship with the code that implements each minigame.
// A cached public scenes.json can otherwise select an already removed game.
import scenes from '../../public/data/scenes.json';

export async function loadData(){
 const entries=await Promise.all(['story','manifest','music'].map(async name=>{
  const response=await fetch(`${import.meta.env.BASE_URL}data/${name}.json`,{cache:'no-store'});
  if(!response.ok)throw new Error(`Unable to load ${name}`);
  return [name,await response.json()];
 }));
 return {scenes,...Object.fromEntries(entries)};
}
