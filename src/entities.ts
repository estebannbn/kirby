// Logic for players, mobs, enemies

import { BodyComp, GameObj, KaboomCtx, OpacityComp, ScaleComp, SpriteComp, PosComp, DoubleJumpComp, HealthComp } from "kaboom";
import { scale } from "./constants";

type PlayerGameObj = GameObj<
    SpriteComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp &
    HealthComp &
    OpacityComp & {
        speed: number,
        direction: string,
        isInhaling: boolean,
        isFull: boolean
    }
>
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

export function setControls(k: KaboomCtx, player: PlayerGameObj){
    // k.get() returns an array with all elements with that tag
    // in this case, only one does have it
    const inhaleEffectRef = k.get('inhaleEffect')[0]

    k.onKeyDown( (key)=>{
        switch(key){
            case 'left':
                player.direction = 'left'
                // flipX property is offered by Kaboom if the player has a sprite
                player.flipX = true
                // player.move(horizontalSPeed,verticalSpeed)
                player.move(-player.speed, 0)
                break
            case 'right':
                player.direction = 'right'
                player.flipX = false
                player.move(player.speed, 0)
                break
            case 'x':
                if(player.isFull){
                    // Plays an animation
                    player.play('kirbFull')
                    inhaleEffectRef.opacity = 0
                    break
                }
                // Following lines will not be executed if player.isFull bc of the break
                player.isInhaling = true
                player.play('kirbInhaling')
                inhaleEffectRef.opacity = 1
        }
    })

    k.onKeyPress((key)=>{
        if(key === 'z') player.doubleJump()
    })

    k.onKeyRelease((key)=>{
        if(key === 'x'){
            if(player.isFull){
                player.play('kirbInhaling')
                const shootingStar = k.add([
                    k.sprite('assets',{
                        anim: 'shootingStar',
                        // Default direction of the anim is left, so if
                        // player.direction === 'right, we need to flipX
                        flipX: player.direction === 'right'
                    }),
                    k.area({shape: new k.Rect(k.vec2(5,4),6,6)}),
                    k.pos(
                        player.direction === 'left' ? player.pos.x - 80 : player.pos.x + 80,
                        player.pos.y + 5
                    ),
                    k.scale(scale),
                    player.direction === 'left'
                        ? k.move(k.LEFT,800)
                        : k.move(k.RIGHT,800),
                    'shootingStar'
                ])
                shootingStar.onCollide('platform',()=> k.destroy(shootingStar))
                player.isFull = false

                // We will wait 1 second to return to this animation
                k.wait(1,()=> player.play('kirbIdle'))
                return
            }

            inhaleEffectRef.opacity = 0
            player.isInhaling = false
            player.play('kirbIdle')
        } 
    })
}


export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number){
    const flame = k.add([
        k.sprite('assets',{anim:'flame'}),
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(4,6),8,10),
            collisionIgnore: ['enemy']
        }),
        k.body(),
        k.state('idle',['idle','jump']),
        'enemy'
    ])

    makeInhalable(k, flame)

    // When it turns to idle, will wait 1 second and jump again
    flame.onStateEnter('idle',async ()=>{
        await k.wait(1)
        flame.enterState('jump')
    })

    flame.onStateEnter('jump', ()=>{
        flame.jump(1000)
    })

    flame.onStateUpdate('jump', ()=>{
        // isGrounded is a Kaboom function which returns true when the object is on a plataform
        if(flame.isGrounded()){
            flame.enterState('idle')
        }
    })
    return flame
}

export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number){
    const guy = k.add([
        k.sprite('assets',{anim:'guyWalk'}),
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(4,6),8,10),
            collisionIgnore: ['enemy']
        }),
        k.body(),
        k.state('idle',['idle','jump', 'left','right']),
        {isInhalable: false, speed: 100},
        'enemy'
    ])

    makeInhalable(k,guy)

    guy.onStateEnter('idle',async()=>{
        await k.wait(1)
        guy.enterState('left')
    })

    guy.onStateEnter('left',async()=>{
        guy.flipX = false
        await k.wait(2)
        guy.enterState('right')
    })

    guy.onStateUpdate('left',()=>{
        guy.move(-guy.speed,0)
    })

    guy.onStateEnter('right', async()=>{
        guy.flipX = true,
        await k.wait(2)
        guy.enterState('left')
    })

    guy.onStateUpdate('right',()=>{
        guy.move(guy.speed,0)
    })
    return guy
}
export function makeInhalable(k: KaboomCtx, enemy: GameObj){
    enemy.onCollide('inhaleZone', ()=>{
        enemy.isInhalable = true
    })

    enemy.onCollideEnd('inhaleZone', ()=> {
        enemy.isInhalable = false
    })

    enemy.onCollide('shootingStar', (shootingStar: GameObj)=>{
        k.destroy(enemy)
        k.destroy(shootingStar)
    })

    const playerRef = k.get('player')[0]
    enemy.onUpdate(()=>{
        if(playerRef.isInhaling && enemy.isInhalable){
            if(playerRef.direction === 'right'){
                enemy.move(-800,0)
            }else{
                enemy.move(800,0)
            }
        }
    })
}

export function makeBirdEnemy(
    k: KaboomCtx,
    posX: number,
    posY: number,
    speed:number
){
    const bird = k.add([
        k.sprite('assets',{anim:'bird'}),
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(4,6),8,10),
            collisionIgnore: ['enemy']
        }),
        k.body({isStatic: true}),
        k.move(k.LEFT,speed),
        k.offscreen({destroy: true, distance: 400}),
        'enemy'
    ])
    makeInhalable(k,bird)

    return bird
}