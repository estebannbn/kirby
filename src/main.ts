// Entry point of project

import {k} from './kaboomCtx'

async function gameSetup() {
    // Cargamos sprites
    // Para los assets, por defecto busca la carpeta /public para pararse si es que existe
    k.loadSprite('assets','./kirby-like.png',{
        sliceX: 9,  // Sprites in X axis
        sliceY: 10,  // Sprites in Y axis
        anims: {  // mobs
            kirbIdle: 0,  // Every attr of the object is a custom name for a mob
            kirbInhaling: 1,  // The number is the position of the sprite...
            kirbFull: 2, //...from top left to bottom right.

            // This is the animation effect. Speed is frames per second
            // We can decide if animation loops or plays once
            kirbInhaleEffect: {from: 3, to: 8, speed: 15, loop:true},
            shootingStar: 9,
            flame: {from:36, to: 37, speed: 4, loop:true},
            guyIdle: 18,
            guyWalk: {from:18, to:19, speed:4, loop:true},
            bird: {from:27, to:28, speed: 4, loop: true}
        }
    })

    k.loadSprite('level-1','level-1.png')

    // to define a scene
    k.scene('level-1', ()=>{
        k.setGravity(2100)

        // we add elements to the game
        k.add([
            // we add a rectangle that fills the screen
            // parameters are the width and height, returned from those functions
            k.rect(k.width(),k.height()),
            // we add color pink to the background
            k.color(k.Color.fromHex('#f7d7db')),
            // this rectanlge will be fixed, not affected by camera movement
            k.fixed()
        ])
    })

    // to go to that scene
    k.go('level-1')
}
gameSetup()