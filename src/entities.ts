// Logic for players, mobs, enemies

import { GameObj, KaboomCtx } from "kaboom";
import { scale } from "./constants";

export function makePlayer(k: KaboomCtx, posX: number, posY: number){
    const player = k.make([
        // We define the animation of the player. We can find all in main.ts, in gameSetup()
        k.sprite('assets',{anim: 'kirbIdle'}),

        // We create the hitbox
        // k.Rect(position relative to the sprite, width, height)
        k.area({shape: new k.Rect(k.vec2(4,5.9), 8, 10)}),

        // We define that this character can collision, and is sensible to gravity
        k.body(),

        // We place the character in his position, multiplied by the scale
        k.pos(posX * scale, posY * scale),

        // This is to scale the character itself
        k.scale(scale),

        // We set the doubleJump property
        k.doubleJump(10),

        // We define how many hits can the player resist
        k.health(3),

        // Maxed opacity. We will reduce it when the player is hitted
        k.opacity(1),

        // Custom properties that we can access easily.
        // E.g. player.speed returns 300, etc.
        {
            speed: 300,
            direction: 'right',
            isInhaling: false,
            isFull: false
        },

        // tag
        'player'
    ])

    // Define logic on collision between player and enemy
    player.onCollide('enemy', async (enemy: GameObj) => {
        // Inhaling action
        if(player.isInhaling && enemy.isInhalable){
            player.isInhaling = false
            k.destroy(enemy)
            player.isFull = true
            return
        }

        if(player.hp() === 0){
            k.destroy(player)
            k.go('level-1')
            return
        }


        // Hurt and blink effect
        player.hurt()
        // First opacity goes to 0
        await k.tween(
            player.opacity,
            0,
            0.5,
            (val) => (player.opacity = val),
            k.easings.linear
        )
        // Then opacity returns to 1
        await k.tween(
            player.opacity,
            1,
            0.5,
            (val) => (player.opacity = val),
            k.easings.linear
        )
    })
    player.onCollide('exit', ()=>{
        k.go('level-2')
    })

    const inhaleEffect = k.add([
        k.sprite('assets', {anim: 'kirbInhaleEffect'}),
        k.pos(),
        k.scale(scale),
        // This effect is always running, but is not always visible
        k.opacity(0),
        'inhaleEffect'
    ])

    // Zone in which the player can swallow enemies, and where the inhaleEffect is displayed
    const inhaleZone = player.add([
        //starts in position (0,0) relative to the player, and is a (20,4) rectangle
        k.area({shape: new k.Rect(k.vec2(0),20,4)}),
        k.pos(),
        'inhaleZone'
    ])

    // When the player turns direction
    inhaleZone.onUpdate(()=>{
        if(player.direction === 'left'){
            inhaleZone.pos = k.vec2(-14,8),
            inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0)
            inhaleEffect.flipX = true
            return
        }
        inhaleZone.pos = k.vec2(14,8)
        inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0)
        inhaleEffect.flipX = false
    })

    // Player falling
    player.onUpdate(()=>{
        if(player.pos.y > 2000){
            k.go('level-1')
        }
    })

    return player
}