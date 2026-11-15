import type { GameEntity, GameScene } from "./project";

type Pose = { x?:number;y?:number;width?:number;height?:number;rotation?:number;opacity?:number };
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.roundRect(x,y,w,h,radius);
}
function hexRgb(hex:string){const n=parseInt(hex.replace("#",""),16);return [(n>>16)&255,(n>>8)&255,n&255] as const;}
function shade(hex:string,amount:number){const [r,g,b]=hexRgb(hex);return `rgb(${clamp(r+amount,0,255)},${clamp(g+amount,0,255)},${clamp(b+amount,0,255)})`;}
function drawCityBackground(ctx:CanvasRenderingContext2D,scene:GameScene,time:number){
  const {width:w,height:h}=scene;
  const grass=ctx.createLinearGradient(0,0,w,h);grass.addColorStop(0,"#315a49");grass.addColorStop(1,"#1d3c35");ctx.fillStyle=grass;ctx.fillRect(0,0,w,h);
  // Green public-space strips and sidewalk curbs.
  ctx.fillStyle="#52735a";ctx.fillRect(0,0,w,24);ctx.fillRect(0,h-24,w,24);ctx.fillRect(0,0,24,h);ctx.fillRect(w-24,0,24,h);
  ctx.fillStyle="#b2b5a0";ctx.fillRect(0,184,w,18);ctx.fillRect(0,338,w,18);ctx.fillRect(385,0,18,h);ctx.fillRect(570,0,18,h);
  ctx.fillStyle="#343e49";ctx.fillRect(0,202,w,134);ctx.fillRect(403,0,167,h);
  ctx.fillStyle="#e9dba0";ctx.globalAlpha=.72;
  for(let x=20;x<w;x+=78){ctx.fillRect(x,266,42,3);}
  for(let y=18;y<h;y+=76){ctx.fillRect(483,y,3,38);}
  ctx.globalAlpha=1;
  // Crosswalks at the central intersection.
  ctx.fillStyle="#f1f0dd";for(let i=0;i<7;i++){ctx.fillRect(405+i*23,211,12,22);ctx.fillRect(405+i*23,305,12,22);ctx.fillRect(405,211+i*17,22,9);ctx.fillRect(548,211+i*17,22,9);}
  // Park texture and subtle ambient lamps.
  for(let i=0;i<24;i++){const px=(i*137.3)%w,py=(i*83.1)%h;if((py<180||py>360)&&(px<380||px>590)){ctx.fillStyle=i%3===0?"#8bb87833":"#0d251c22";ctx.beginPath();ctx.arc(px,py,5+(i%4)*2,0,Math.PI*2);ctx.fill();}}
  const night=ctx.createRadialGradient(w*.5,h*.48,30,w*.5,h*.48,w*.8);night.addColorStop(0,"#ffffff00");night.addColorStop(1,"#06101a66");ctx.fillStyle=night;ctx.fillRect(0,0,w,h);
}
export function drawSceneBackground(ctx:CanvasRenderingContext2D,scene:GameScene,time:number){
  const {width:w,height:h}=scene;
  if(scene.environment==="city"){drawCityBackground(ctx,scene,time);return;}const [r,g,b]=hexRgb(scene.background);
  const night=r+g+b<260 || b>r*1.12;
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,shade(scene.background,night?18:35));sky.addColorStop(.62,shade(scene.background,night?5:12));sky.addColorStop(1,shade(scene.background,-20));
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w*.78,h*.2,4,w*.78,h*.2,w*.48);
  glow.addColorStop(0,night?"#79bfff25":"#ffe6a855");glow.addColorStop(1,"#ffffff00");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  if(night){
    for(let i=0;i<54;i++){const sx=(i*193.7%w),sy=(i*83.9%(h*.62));const pulse=.45+.35*Math.sin(time*1.2+i);ctx.globalAlpha=pulse;ctx.fillStyle="#e8f5ff";ctx.fillRect(sx,sy,i%7===0?2:1,i%7===0?2:1);}
    ctx.globalAlpha=1;
  }
  // Distant layered skyline gives scenes depth without requiring downloaded art.
  const horizon=h*.72;
  for(let layer=0;layer<3;layer++){
    const parallax=layer*17,base=horizon+layer*17;
    ctx.fillStyle=layer===0?"#101c3155":layer===1?"#0b172b88":"#071426bb";
    let x=-40;
    for(let i=0;i<18;i++){
      const bw=34+(i*29+layer*13)%58,bh=35+(i*47+layer*31)%(layer===0?100:75);
      ctx.fillRect(x,base-bh,bw,bh);
      if(layer>0){ctx.fillStyle="#b6dfff22";for(let wy=base-bh+9;wy<base-7;wy+=13)for(let wx=x+7;wx<x+bw-5;wx+=12)ctx.fillRect(wx,wy,4,5);}
      x+=bw+9;ctx.fillStyle=layer===0?"#101c3155":layer===1?"#0b172b88":"#071426bb";
    }
  }
  const ground=ctx.createLinearGradient(0,horizon,0,h);ground.addColorStop(0,"#15283b");ground.addColorStop(1,"#07111e");
  ctx.fillStyle=ground;ctx.fillRect(0,horizon,w,h-horizon);
  ctx.strokeStyle="#a8d8ff18";ctx.lineWidth=1;
  for(let i=0;i<12;i++){const yy=horizon+Math.pow(i/11,1.8)*(h-horizon);ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(w,yy);ctx.stroke();}
  for(let i=-10;i<=20;i++){ctx.beginPath();ctx.moveTo(w/2+(i-w/2)*.08,horizon);ctx.lineTo(i*w/10,h);ctx.stroke();}
  const vignette=ctx.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,h*.78);vignette.addColorStop(.55,"#00000000");vignette.addColorStop(1,"#02071188");ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
}
export function drawGameEntity(ctx:CanvasRenderingContext2D,entity:GameEntity,x:number,y:number,time:number,pose:Pose={}){
  const w=pose.width??entity.width,h=pose.height??entity.height,rotation=pose.rotation??entity.rotation??0;
  ctx.save();ctx.globalAlpha=clamp(pose.opacity??entity.opacity??1,0,1);ctx.translate(x+w/2,y+h/2);ctx.rotate(rotation*Math.PI/180);
  const color=entity.color;const glow=entity.kind==="collectible"||entity.kind==="goal"||entity.kind==="player";
  ctx.shadowColor=glow?color:"#00000066";ctx.shadowBlur=glow?14:5;ctx.shadowOffsetY=4;
  if(entity.kind==="player"||entity.kind==="npc"){
    const isPlayer=entity.kind==="player";const bob=Math.sin(time*5+(isPlayer?0:1))*1.5;
    ctx.fillStyle="#00000055";ctx.shadowBlur=0;ctx.beginPath();ctx.ellipse(0,h*.43,w*.38,h*.09,0,0,Math.PI*2);ctx.fill();
    const body=ctx.createLinearGradient(-w/2,0,w/2,0);body.addColorStop(0,shade(color,-35));body.addColorStop(.5,color);body.addColorStop(1,shade(color,35));
    ctx.fillStyle=body;rounded(ctx,-w*.34,-h*.05+bob,w*.68,h*.55,h*.16);ctx.fill();
    ctx.fillStyle="#f0c8a4";ctx.beginPath();ctx.ellipse(0,-h*.25+bob,w*.28,h*.25,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isPlayer?"#263b56":"#45334f";rounded(ctx,-w*.29,-h*.49+bob,w*.58,h*.16,h*.08);ctx.fill();
    ctx.fillStyle="#172334";ctx.beginPath();ctx.arc(-w*.1,-h*.27+bob,Math.max(1.5,w*.035),0,Math.PI*2);ctx.arc(w*.1,-h*.27+bob,Math.max(1.5,w*.035),0,Math.PI*2);ctx.fill();
    ctx.fillStyle=shade(color,-18);rounded(ctx,-w*.3,h*.37,w*.22,h*.12,3);ctx.fill();rounded(ctx,w*.08,h*.37,w*.22,h*.12,3);ctx.fill();
  }else if(entity.kind==="collectible"){
    const pulse=1+Math.sin(time*4)*.08;ctx.scale(pulse,pulse);ctx.rotate(time*.7);
    ctx.fillStyle=shade(color,40);ctx.beginPath();ctx.moveTo(0,-h*.55);ctx.lineTo(w*.42,-h*.08);ctx.lineTo(0,h*.55);ctx.lineTo(-w*.42,-h*.08);ctx.closePath();ctx.fill();
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-h*.42);ctx.lineTo(w*.27,-h*.08);ctx.lineTo(0,h*.36);ctx.lineTo(-w*.27,-h*.08);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#ffffffaa";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-h*.36);ctx.lineTo(0,h*.28);ctx.stroke();
  }else if(entity.kind==="goal"){
    const pulse=1+Math.sin(time*3)*.045;ctx.scale(pulse,pulse);
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(4,w*.1);ctx.beginPath();ctx.ellipse(0,0,w*.4,h*.47,time*.15,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle="#eaffffcc";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,w*.24,h*.34,-time*.2,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#dfffff22";ctx.beginPath();ctx.ellipse(0,0,w*.2,h*.29,0,0,Math.PI*2);ctx.fill();
  }else if(entity.kind==="building"){
    const grad=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);grad.addColorStop(0,shade(color,38));grad.addColorStop(.5,color);grad.addColorStop(1,shade(color,-45));
    ctx.fillStyle="#00000055";rounded(ctx,-w/2+5,-h/2+8,w,h,8);ctx.fill();
    ctx.fillStyle=grad;rounded(ctx,-w/2,-h/2,w,h,8);ctx.fill();
    ctx.fillStyle="#202e3e";rounded(ctx,-w*.38,-h*.35,w*.76,h*.7,5);ctx.fill();
    ctx.fillStyle="#b8d8df";for(let wy=-h*.27;wy<h*.27;wy+=Math.max(13,h*.2))for(let wx=-w*.3;wx<w*.3;wx+=Math.max(16,w*.2)){ctx.fillRect(wx,wy,Math.max(6,w*.1),Math.max(7,h*.1));}
    ctx.fillStyle=shade(color,55);ctx.fillRect(-w/2,-h/2,w,5);
    ctx.fillStyle="#263b4a";ctx.fillRect(-w*.13,h*.22,w*.26,h*.28);
  }else if(entity.kind==="vehicle"){
    ctx.fillStyle="#00000066";rounded(ctx,-w/2+2,-h*.35+6,w,h*.7,8);ctx.fill();
    ctx.fillStyle="#171f2b";rounded(ctx,-w*.48,-h*.36,w*.96,h*.72,8);ctx.fill();
    const body=ctx.createLinearGradient(0,-h/2,0,h/2);body.addColorStop(0,shade(color,45));body.addColorStop(.5,color);body.addColorStop(1,shade(color,-35));
    ctx.fillStyle=body;rounded(ctx,-w*.44,-h*.31,w*.88,h*.62,7);ctx.fill();
    ctx.fillStyle="#a8d8e8";rounded(ctx,-w*.18,-h*.25,w*.36,h*.5,5);ctx.fill();
    ctx.fillStyle="#fff2bf";ctx.fillRect(-w*.4,-h*.22,4,6);ctx.fillRect(w*.36,-h*.22,4,6);
  }else if(entity.kind==="platform"){
    const grad=ctx.createLinearGradient(0,-h/2,0,h/2);grad.addColorStop(0,shade(color,55));grad.addColorStop(.22,color);grad.addColorStop(1,shade(color,-55));
    ctx.fillStyle=grad;rounded(ctx,-w/2,-h/2,w,h,Math.min(9,h*.3));ctx.fill();
    ctx.fillStyle="#ffffff33";rounded(ctx,-w/2+3,-h/2+2,w-6,Math.max(2,h*.14),3);ctx.fill();
  }else if(entity.kind==="decoration"){
    ctx.fillStyle=color;rounded(ctx,-w/2,-h/2,w,h,Math.min(10,w*.2));ctx.fill();
    ctx.strokeStyle="#ffffff66";ctx.lineWidth=2;ctx.stroke();
  }else{
    const grad=ctx.createRadialGradient(-w*.15,-h*.2,2,0,0,Math.max(w,h)*.7);grad.addColorStop(0,shade(color,65));grad.addColorStop(1,shade(color,-45));
    ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(0,0,w*.48,h*.48,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-w*.13,-h*.08,Math.max(2,w*.055),0,Math.PI*2);ctx.arc(w*.13,-h*.08,Math.max(2,w*.055),0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#172334";ctx.beginPath();ctx.arc(-w*.13,-h*.08,Math.max(1,w*.025),0,Math.PI*2);ctx.arc(w*.13,-h*.08,Math.max(1,w*.025),0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
