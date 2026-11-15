import type { GameScene, LogicNode } from "./project";

export type LogicTrigger = "start"|"collision"|"collect"|"goal";
export type LogicRuntime = { playAudio:(audioId:string)=>void; addScore:(value:number)=>void };

/** Runs a bounded directed event graph. Cycles are visited once per trigger to prevent runaway execution. */
export async function executeLogicGraph(scene:GameScene,trigger:LogicTrigger,entityId:string|undefined,runtime:LogicRuntime):Promise<void> {
  const nodes=scene.logicNodes??[],edges=scene.logicEdges??[];
  const starts=nodes.filter(node=>node.kind===trigger&&(!node.entityId||!entityId||node.entityId===entityId));
  const byId=new Map(nodes.map(node=>[node.id,node]));
  const queue=starts.flatMap(node=>edges.filter(edge=>edge.from===node.id).map(edge=>edge.to));
  const visited=new Set<string>();
  let steps=0;
  while(queue.length&&steps++<128){
    const id=queue.shift()!;
    if(visited.has(id))continue;
    visited.add(id);
    const node=byId.get(id);if(!node)continue;
    if(node.kind==="wait") await new Promise<void>(resolve=>setTimeout(resolve,Math.max(0,Math.min(30000,node.value??1000))));
    else runAction(node,scene,runtime);
    for(const edge of edges)if(edge.from===id&&!visited.has(edge.to))queue.push(edge.to);
  }
}
function runAction(node:LogicNode,scene:GameScene,runtime:LogicRuntime){
  switch(node.kind){
    case "play-audio": if(node.audioId)runtime.playAudio(node.audioId);break;
    case "set-score": runtime.addScore(node.value??0);break;
    case "move": {
      const entity=scene.entities.find(item=>item.id===node.entityId);
      if(entity)entity.x=Math.max(0,Math.min(scene.width-entity.width,entity.x+(node.value??0)));
      break;
    }
    case "set-visible": {
      const entity=scene.entities.find(item=>item.id===node.entityId);
      if(entity)entity.visible=(node.value??1)!==0;
      break;
    }
    default: break;
  }
}
