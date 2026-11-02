(function(root){
'use strict';
const TAU=Math.PI*2,LAPS=3,GATES=12,WIDTH=12;
const SPECS={sm2400:{max:17,accel:5.8},kt180:{max:16.3,accel:6.5},pp300:{max:18,accel:5.1}};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function point(angle,lane=0){return {x:(60+lane)*Math.cos(angle),z:(38+lane)*Math.sin(angle)};}
function tangent(angle){return Math.atan2(38*Math.cos(angle),-60*Math.sin(angle));}
function distance(x,z){let best=Infinity;
  for(let index=0;index<160;index++){const start=point(index/160*TAU),end=point((index+1)/160*TAU),dx=end.x-start.x,dz=end.z-start.z;
    const along=clamp(((x-start.x)*dx+(z-start.z)*dz)/(dx*dx+dz*dz),0,1),gap=Math.hypot(x-start.x-dx*along,z-start.z-dz*along);
    if(gap<best)best=gap;}
  return best;}
function createRacer(id,model,grid=0){const angle=-grid*.15,position=point(angle,grid%2?2:-2);
  return {id,model,x:position.x,z:position.z,heading:tangent(angle),speed:0,steer:0,gates:0,finished:false,time:0,penalty:0,offroad:false,lane:grid%2?2:-2};}
function gateCrossed(previous,current,index){const angle=index/GATES*TAU,center=point(angle),direction=tangent(angle),dx=Math.cos(direction),dz=Math.sin(direction);
  const before=(previous.x-center.x)*dx+(previous.z-center.z)*dz,after=(current.x-center.x)*dx+(current.z-center.z)*dz;
  if(before>=0||after<0)return false;
  const fraction=-before/(after-before),crossX=previous.x+(current.x-previous.x)*fraction,crossZ=previous.z+(current.z-previous.z)*fraction;
  return Math.hypot(crossX-center.x,crossZ-center.z)<=WIDTH/2+1;}
function step(racer,input,delta){if(racer.finished)return;
  const spec=SPECS[racer.model]||SPECS.sm2400,previous={x:racer.x,z:racer.z};
  racer.time+=delta;racer.offroad=distance(racer.x,racer.z)>WIDTH/2;
  const maximum=racer.offroad?spec.max*.35:spec.max;
  if(input.throttle)racer.speed+=spec.accel*delta;
  else racer.speed=Math.max(0,racer.speed-delta*1.8);
  if(input.brake)racer.speed=Math.max(0,racer.speed-delta*12);
  racer.speed=Math.min(racer.speed,maximum);
  racer.steer+=(clamp(input.steer||0,-1,1)*.48-racer.steer)*Math.min(1,delta*7);
  racer.heading+=racer.speed*Math.tan(racer.steer)/3.6*delta;
  racer.x+=Math.cos(racer.heading)*racer.speed*delta;racer.z+=Math.sin(racer.heading)*racer.speed*delta;
  racer.x=clamp(racer.x,-95,95);racer.z=clamp(racer.z,-75,75);
  if(gateCrossed(previous,racer,(racer.gates+1)%GATES)){racer.gates++;if(racer.gates>=LAPS*GATES)racer.finished=true;}}
function botInput(racer){const angle=Math.atan2(racer.z/38,racer.x/60),aim=point(angle+.18,racer.lane);
  let error=Math.atan2(aim.z-racer.z,aim.x-racer.x)-racer.heading;error=Math.atan2(Math.sin(error),Math.cos(error));
  return {throttle:Math.abs(error)<1.2,brake:Math.abs(error)>1.3&&racer.speed>7,steer:clamp(error*2.5,-1,1)};}
function recover(racer){if(racer.finished)return;const angle=(racer.gates%GATES)/GATES*TAU,position=point(angle,racer.lane);
  racer.x=position.x;racer.z=position.z;racer.heading=tangent(angle);racer.speed=0;racer.steer=0;racer.penalty+=5;}
function progress(racer){if(racer.finished)return LAPS*GATES;
  const angle=Math.atan2(racer.z/38,racer.x/60),start=(racer.gates%GATES)/GATES*TAU;
  let arc=((angle-start)%TAU+TAU)%TAU;if(arc>Math.PI)arc-=TAU;
  return racer.gates+clamp(arc/(TAU/GATES),0,.999);}
function ranking(racers){return [...racers].sort((first,second)=>{
  if(first.finished&&second.finished)return (first.time+first.penalty)-(second.time+second.penalty);
  if(first.finished!==second.finished)return first.finished?-1:1;
  return progress(second)-progress(first);});}
const api={LAPS,GATES,WIDTH,SPECS,point,tangent,distance,createRacer,gateCrossed,step,botInput,recover,progress,ranking};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AgroRaceCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
