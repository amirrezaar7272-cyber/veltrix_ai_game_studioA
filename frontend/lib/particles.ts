export type Particle = {x:number;y:number;vx:number;vy:number;life:number;maxLife:number;size:number;color:string;gravity:number};
export class ParticleSystem {
  private items:Particle[]=[];
  emit(x:number,y:number,count:number,color:string,spread=150){
    for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=30+Math.random()*spread,life=.35+Math.random()*.55;this.items.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,maxLife:life,size:2+Math.random()*4,color,gravity:90});}
    if(this.items.length>400)this.items.splice(0,this.items.length-400);
  }
  update(dt:number){
    for(const p of this.items){p.life-=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-dt*1.5);}
    this.items=this.items.filter(p=>p.life>0);
  }
  draw(ctx:CanvasRenderingContext2D){
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(const p of this.items){ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=9;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(.5+.5*p.life/p.maxLife),0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
