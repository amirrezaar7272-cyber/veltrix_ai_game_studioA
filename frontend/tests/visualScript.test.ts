import test from "node:test";
import assert from "node:assert/strict";
import { executeLogicGraph } from "../lib/visualScript";
import type { GameScene } from "../lib/project";

test("visual graph executes connected actions from an event", async () => {
  const scene:GameScene={id:"s",name:"Scene",width:100,height:100,background:"#000000",entities:[
    {id:"p",name:"Player",kind:"player",x:10,y:10,width:10,height:10,color:"#ffffff",visible:true}
  ],logicNodes:[
    {id:"event",kind:"start"},
    {id:"move",kind:"move",entityId:"p",value:15},
    {id:"score",kind:"set-score",value:5},
    {id:"sound",kind:"play-audio",audioId:"clip"}
  ],logicEdges:[{from:"event",to:"move"},{from:"move",to:"score"},{from:"score",to:"sound"}]};
  let score=0;const played:string[]=[];
  await executeLogicGraph(scene,"start","p",{addScore:value=>score+=value,playAudio:id=>played.push(id)});
  assert.equal(scene.entities[0].x,25);assert.equal(score,5);assert.deepEqual(played,["clip"]);
});
