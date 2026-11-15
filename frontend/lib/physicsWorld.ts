import type { GameEntity } from "./project";

export type BodyState = { id: string; x: number; y: number; vx: number; vy: number; grounded: boolean };
export type PhysicsContact = { a: string; b: string; normalX: number; normalY: number; sensor: boolean };
export type PhysicsInput = { up?: boolean; down?: boolean; left?: boolean; right?: boolean; jumpPressed?: boolean };
export type PhysicsConfig = { gravity?: number; maxSubstep?: number; worldWidth: number; worldHeight: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const overlaps = (a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Deterministic axis-separated AABB physics for 2D platform and arcade games. */
export class PhysicsWorld {
  readonly bodies = new Map<string, BodyState>();
  constructor(private config: PhysicsConfig) {}

  sync(entities: GameEntity[]) {
    const valid = new Set(entities.map(e => e.id));
    for (const id of this.bodies.keys()) if (!valid.has(id)) this.bodies.delete(id);
    for (const e of entities) if (!this.bodies.has(e.id)) this.bodies.set(e.id, { id:e.id, x:e.x, y:e.y, vx:0, vy:0, grounded:false });
  }

  step(entities: GameEntity[], dt: number, input: PhysicsInput = {}, playerId?: string): PhysicsContact[] {
    this.sync(entities);
    const maxStep = this.config.maxSubstep ?? 1/120;
    const steps = Math.max(1, Math.ceil(clamp(dt,0,0.1) / maxStep));
    const h = clamp(dt,0,0.1) / steps;
    const contacts = new Map<string,PhysicsContact>();
    for (let s=0;s<steps;s++) this.substep(entities,h,input,playerId,contacts);
    return [...contacts.values()];
  }

  private substep(entities: GameEntity[], dt: number, input: PhysicsInput, playerId: string | undefined, contacts: Map<string,PhysicsContact>) {
    const solids = entities.filter(e => e.visible && !e.isSensor && (e.kind === "platform" || e.bodyType === "static"));
    for (const e of entities) {
      if (!e.visible || e.id !== playerId) continue;
      const body = this.bodies.get(e.id)!;
      const type = e.bodyType ?? (e.kind === "platform" || e.kind === "decoration" ? "static" : "dynamic");
      if (type === "static") { body.vx=0; body.vy=0; continue; }
      if (e.id === playerId) {
        const speed = e.speed ?? 180;
        const target = ((input.right?1:0)-(input.left?1:0))*speed;
        const friction = clamp(e.friction ?? .18,0,1);
        body.vx += (target-body.vx)*clamp((target===0?friction*12:18)*dt,0,1);
        if ((e.gravityScale ?? 1) <= 0) {
          const targetY = ((input.down?1:0)-(input.up?1:0))*speed;
          body.vy += (targetY-body.vy)*clamp((targetY===0?friction*12:18)*dt,0,1);
        } else if (input.jumpPressed && body.grounded) { body.vy = -Math.max(240, speed*1.65); body.grounded=false; }
      }
      if (type === "dynamic") body.vy += (this.config.gravity ?? 980) * (e.gravityScale ?? 1) * dt;
      body.x += body.vx*dt;
      body.x = clamp(body.x,0,Math.max(0,this.config.worldWidth-e.width));
      for (const other of solids) {
        if (other.id===e.id) continue;
        const ob=this.bodies.get(other.id)!;
        if (!overlaps(bodyRect(body,e),bodyRect(ob,other))) continue;
        const key=[e.id,other.id].sort().join(":");
        if (e.isSensor || other.isSensor) { contacts.set(key,{a:e.id,b:other.id,normalX:0,normalY:0,sensor:true}); continue; }
        const movingRight=body.vx>0;
        body.x = movingRight ? ob.x-e.width : ob.x+other.width;
        const invA=1/Math.max(.1,e.mass??1), invB=(other.bodyType??(other.kind==="platform"||other.kind==="decoration"?"static":"dynamic"))==="static"?0:1/Math.max(.1,other.mass??1);
        const impulse=(body.vx-(ob.vx||0))*(e.restitution??.1);
        body.vx -= impulse * (invA/(invA+invB||1));
        contacts.set(key,{a:e.id,b:other.id,normalX:movingRight?-1:1,normalY:0,sensor:false});
      }
      body.grounded=false;
      body.y += body.vy*dt;
      for (const other of solids) {
        if (other.id===e.id) continue;
        const ob=this.bodies.get(other.id)!;
        if (!overlaps(bodyRect(body,e),bodyRect(ob,other))) continue;
        const key=[e.id,other.id].sort().join(":");
        if (e.isSensor || other.isSensor) { contacts.set(key,{a:e.id,b:other.id,normalX:0,normalY:0,sensor:true}); continue; }
        const falling=body.vy>=0;
        if (falling) { body.y=ob.y-e.height; body.grounded=true; }
        else body.y=ob.y+other.height;
        const restitution=clamp(Math.max(e.restitution??0,other.restitution??0),0,1);
        body.vy = -body.vy*restitution;
        if (Math.abs(body.vy)<12) body.vy=0;
        contacts.set(key,{a:e.id,b:other.id,normalX:0,normalY:falling?-1:1,sensor:false});
      }
      if (body.y+e.height>=this.config.worldHeight) {
        body.y=this.config.worldHeight-e.height;
        if (body.vy>0) body.vy=-body.vy*clamp(e.restitution??0,0,1);
        if (Math.abs(body.vy)<12) body.vy=0;
        body.grounded=true;
      }
      if (body.y<0) { body.y=0; if(body.vy<0) body.vy=0; }
      for (const sensor of entities.filter(item => item.visible && item.isSensor && item.id !== e.id)) {
        const sensorBody=this.bodies.get(sensor.id)!;
        if (overlaps(bodyRect(body,e),bodyRect(sensorBody,sensor))) {
          const key=[e.id,sensor.id].sort().join(":");
          contacts.set(key,{a:e.id,b:sensor.id,normalX:0,normalY:0,sensor:true});
        }
      }
    }
    for (const e of entities) {
      const body=this.bodies.get(e.id)!;
      if (e.bodyType==="kinematic" && e.kind!=="player") { body.x=e.x; body.y=e.y; }
    }
  }
}
function bodyRect(body: BodyState, entity: GameEntity) { return {x:body.x,y:body.y,width:entity.width,height:entity.height}; }
