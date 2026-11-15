import test from "node:test";
import assert from "node:assert/strict";
import { sampleAnimation } from "../lib/animation";
import type { AnimationTrack } from "../lib/project";

test("animation interpolates transform values between keyframes", () => {
  const track:AnimationTrack={id:"t",entityId:"e",name:"Move",duration:2,loop:false,keyframes:[
    {id:"a",time:0,x:0,y:0,width:10,height:10,rotation:0,opacity:1,easing:"linear"},
    {id:"b",time:2,x:20,y:10,width:30,height:20,rotation:180,opacity:0,easing:"linear"}
  ]};
  const pose=sampleAnimation(track,1)!;
  assert.equal(pose.x,10);assert.equal(pose.y,5);assert.equal(pose.width,20);assert.equal(pose.rotation,90);assert.equal(pose.opacity,.5);
});
