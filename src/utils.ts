import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

export async function makeMap(k:KaboomCtx, name:string) {

    // load data from a map. We need to pass the name of the map as param
    const mapData = await (await fetch(`./${name}.json`)).json()

    // create a game object, but does not add it to the scene
    const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)])

    const spawnPoints: {[key:string]: {x:number, y:number}[]} = {}

    for(const layer of mapData.layers){
        if(layer.name === 'colliders'){
            for(const collider of layer.objects){
                // We add the colliders
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
                        collisionIgnore: ['platform','exit']
                    }),
                    // Platforms will be static on collisions
                    collider.name !== 'exit' ? k.body({isStatic: true}) : null,
                    k.pos(collider.x,collider.y),
                    collider.name !== 'exit' ? 'platform' : 'exit'
                ])
            }
            // We will not run the other ifs
            continue
        }
        if(layer.name === 'spawnpoints'){
            for(const spawnPoint of layer.objects){
                // If the spawnPoint exists
                if(spawnPoints[spawnPoint.name]){
                    // We add the properties x and y
                    spawnPoints[spawnPoint.name].push({
                        x: spawnPoint.x,
                        y: spawnPoint.y
                    })
                    // CAMBIO RESPECTO AL VIDEO
                }else{
                    // Else, we add a new spawnPoint in the array, with its properties
                    spawnPoints[spawnPoint.name] = [{x:spawnPoint.x, y: spawnPoint.y}]
                }
                
            }
        }
    }
    return {map, spawnPoints}
}