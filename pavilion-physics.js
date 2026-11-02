(function(root){
'use strict';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function constrain(position,radius,obstacles,bounds){
  for(let pass=0;pass<3;pass++){
    for(const obstacle of obstacles){const dx=position.x-obstacle.x,dz=position.z-obstacle.z,gap=Math.hypot(dx,dz),minimum=radius+obstacle.r;
      if(gap>=minimum)continue;const normalX=gap>.00001?dx/gap:1,normalZ=gap>.00001?dz/gap:0;
      position.x=obstacle.x+normalX*minimum;position.z=obstacle.z+normalZ*minimum;}
    if(bounds){position.x=clamp(position.x,bounds.minX,bounds.maxX);position.z=clamp(position.z,bounds.minZ,bounds.maxZ);}}
}
function move(position,dx,dz,radius,obstacles,bounds){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  for(let step=0;step<steps;step++){position.x+=dx/steps;position.z+=dz/steps;constrain(position,radius,obstacles,bounds);}}
function touching(first,second,extra=0){return Math.abs((first.y||0)-(second.y||0))<1.7&&Math.hypot(first.position.x-second.position.x,first.position.z-second.position.z)<=first.radius+second.radius+extra;}
function solve(agents,obstacles){for(let pass=0;pass<8;pass++){
  for(let first=0;first<agents.length;first++)for(let second=first+1;second<agents.length;second++){
    const left=agents[first],right=agents[second],weight=left.weight+right.weight;if(!weight||!touching(left,right))continue;
    const dx=right.position.x-left.position.x,dz=right.position.z-left.position.z,gap=Math.hypot(dx,dz),overlap=left.radius+right.radius-gap;
    const normalX=gap>.00001?dx/gap:1,normalZ=gap>.00001?dz/gap:0;
    left.position.x-=normalX*overlap*left.weight/weight;left.position.z-=normalZ*overlap*left.weight/weight;
    right.position.x+=normalX*overlap*right.weight/weight;right.position.z+=normalZ*overlap*right.weight/weight;}
  for(const agent of agents)if(agent.weight)constrain(agent.position,agent.radius,obstacles,agent.bounds);
}}
function steer(position,dx,dz,radius,obstacles){const length=Math.hypot(dx,dz);if(!length)return {x:0,z:0};
  const forwardX=dx/length,forwardZ=dz/length;let offset=0;
  for(const obstacle of obstacles){const relativeX=obstacle.x-position.x,relativeZ=obstacle.z-position.z,forward=relativeX*forwardX+relativeZ*forwardZ;
    const side=relativeX*(-forwardZ)+relativeZ*forwardX,clearance=radius+obstacle.r+.15;
    if(forward>0&&forward<clearance+1&&Math.abs(side)<clearance){const strength=(1-forward/(clearance+1))*(1-Math.abs(side)/clearance);
      offset+=(side>0?-1:1)*strength*2;}}
  const resultX=forwardX-forwardZ*offset,resultZ=forwardZ+forwardX*offset,normal=Math.hypot(resultX,resultZ);
  return {x:resultX/normal,z:resultZ/normal};}
const api={move,constrain,touching,solve,steer};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PavilionPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
