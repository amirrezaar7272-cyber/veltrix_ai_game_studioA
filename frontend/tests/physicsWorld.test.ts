import test from "node:test";
import assert from "node:assert/strict";
import { PhysicsWorld } from "../lib/physicsWorld";
import type { GameEntity } from "../lib/project";

test("dynamic player falls onto a static platform and can jump", () => {
  const player: GameEntity = { id:"player",name:"Player",kind:"player",x:10,y:20,width:10,height:10,color:"#ffffff",visible:true,bodyType:"dynamic",gravityScale:1,speed:100,restitution:0 };
  const floor: GameEntity = { id:"floor",name:"Floor",kind:"platform",x:0,y:50,width:100,height:10,color:"#888888",visible:true,bodyType:"static" };
  const world = new PhysicsWorld({worldWidth:100,worldHeight:100,gravity:980,maxSubstep:1/120});
  for(let i=0;i<120;i++) world.step([player,floor],1/60,{},player.id);
  const body=world.bodies.get(player.id)!;
  assert.equal(body.y,40);
  assert.equal(body.grounded,true);
  world.step([player,floor],1/60,{jumpPressed:true},player.id);
  assert.ok(world.bodies.get(player.id)!.y<40);
});
