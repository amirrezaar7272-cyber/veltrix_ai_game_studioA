import type { AnimationKeyframe, AnimationTrack } from "./project";

const ease = (t:number, kind:AnimationKeyframe["easing"]) =>
  kind==="ease-in"?t*t:kind==="ease-out"?1-(1-t)*(1-t):kind==="ease-in-out"?(t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2):t;

export function sampleAnimation(track:AnimationTrack,time:number):AnimationKeyframe|undefined {
  const frames=[...track.keyframes].sort((a,b)=>a.time-b.time);
  if(!frames.length)return undefined;
  const duration=Math.max(.001,track.duration);
  const t=track.loop?((time%duration)+duration)%duration:Math.max(0,Math.min(duration,time));
  if(t<=frames[0].time)return frames[0];
  if(t>=frames[frames.length-1].time)return frames[frames.length-1];
  for(let i=0;i<frames.length-1;i++){
    const a=frames[i],b=frames[i+1];
    if(t<a.time||t>b.time)continue;
    const ratio=ease(Math.max(0,Math.min(1,(t-a.time)/Math.max(.0001,b.time-a.time))),b.easing);
    const mix=(x:number,y:number)=>x+(y-x)*ratio;
    return {...a,id:"sample",time:t,x:mix(a.x,b.x),y:mix(a.y,b.y),width:mix(a.width,b.width),height:mix(a.height,b.height),rotation:mix(a.rotation,b.rotation),opacity:mix(a.opacity,b.opacity),easing:"linear"};
  }
  return frames[frames.length-1];
}
