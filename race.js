(function(){
'use strict';
const T=THREE,core=AgroRaceCore;
AX.createRace=function(options){
  const element=document.getElementById('race'),canvas=document.getElementById('raceCanvas'),panel=document.getElementById('racePanel');
  const telemetry=document.getElementById('raceTelemetry'),countdown=document.getElementById('raceCountdown'),touchControls=document.getElementById('raceTouch'),held=new Set();
  const names=['Вы','Иван','Марина','Пётр'],modelIds=Object.keys(options.models);
  let renderer,scene,camera,racers=[],vehicles=[],gates=[],phase='setup',count=3,selected=modelIds[0],view='chase',reported=false;
  const time=value=>{const hundredths=Math.round(value*100),minutes=Math.floor(hundredths/6000),seconds=((hundredths%6000)/100).toFixed(2).padStart(5,'0');return minutes+':'+seconds;};
  function mesh(geometry,material,x,y,z){const object=new T.Mesh(geometry,material);object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;scene.add(object);return object;}
  function initialize(){if(renderer)return;renderer=options.renderer(canvas);scene=new T.Scene();scene.background=new T.Color('#c8dfed');scene.fog=new T.Fog('#c8dfed',160,370);
    camera=new T.PerspectiveCamera(52,1,.15,500);scene.add(new T.HemisphereLight('#fff5e1','#607945',1.5));
    const sun=new T.DirectionalLight('#fff2d3',2);sun.position.set(30,70,25);scene.add(sun);
    const grass=new T.MeshStandardMaterial({color:'#63864a',roughness:1}),dirt=new T.MeshStandardMaterial({color:'#95734b',roughness:1});
    mesh(new T.PlaneGeometry(700,700),grass,0,-.06,0).rotation.x=-Math.PI/2;
    const positions=[],indices=[];for(let index=0;index<=160;index++){const angle=index/160*Math.PI*2;
      for(const lane of [-core.WIDTH/2,core.WIDTH/2]){const position=core.point(angle,lane);positions.push(position.x,.01,position.z);}
      if(index<160){const base=index*2;indices.push(base,base+2,base+1,base+1,base+2,base+3);}}
    const track=new T.BufferGeometry();track.setAttribute('position',new T.Float32BufferAttribute(positions,3));track.setIndex(indices);track.computeVertexNormals();mesh(track,dirt,0,0,0);
    const pale=new T.MeshStandardMaterial({color:'#eee9db'}),red=new T.MeshStandardMaterial({color:'#a54330'});
    for(let index=0;index<80;index++){const angle=index/80*Math.PI*2;for(const lane of [-7.2,7.2]){const position=core.point(angle,lane);
      const marker=mesh(new T.BoxGeometry(1.8,.25,.7),index%2?pale:red,position.x,.13,position.z);marker.rotation.y=-core.tangent(angle);}}
    for(let index=0;index<core.GATES;index++){const angle=index/core.GATES*Math.PI*2,center=core.point(angle),arch=new T.Group();arch.position.set(center.x,0,center.z);arch.rotation.y=-angle;
      const material=new T.MeshStandardMaterial({color:'#e5e8df',emissive:'#000000'});
      for(const side of [-1,1]){const post=new T.Mesh(new T.BoxGeometry(.35,4,.35),material);post.position.set(side*6.7,2,0);arch.add(post);}
      const beam=new T.Mesh(new T.BoxGeometry(13.7,.35,.35),material);beam.position.y=4;arch.add(beam);scene.add(arch);gates.push(material);}
    for(let index=0;index<14;index++){const stripe=mesh(new T.BoxGeometry(.9,.025,1),new T.MeshBasicMaterial({color:index%2?'#fff':'#222'}),53.7+index*.9,.04,0);stripe.receiveShadow=false;}
    for(let index=0;index<55;index++){const angle=index/55*Math.PI*2,position=core.point(angle,20+(index%3)*5);
      mesh(new T.CylinderGeometry(.2,.3,2,7),new T.MeshStandardMaterial({color:'#624632'}),position.x,1,position.z);
      mesh(new T.ConeGeometry(2,5,7),grass,position.x,4,position.z);}
  }
  function resize(){if(!renderer||element.hidden)return;const rect=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height);camera.updateProjectionMatrix();}
  function clearVehicles(){vehicles.forEach(vehicle=>{scene.remove(vehicle);const geometries=new Set(),materials=new Set();vehicle.traverse(object=>{if(!object.isMesh)return;geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
      const shared=new Set(Object.values(AX.MAT).map(factory=>factory()));
      geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>{if(shared.has(material))return;for(const value of Object.values(material))if(value&&value.isTexture)value.dispose();material.dispose();});});vehicles=[];}
  function grid(){clearVehicles();racers=[core.createRacer('player',selected,0),...names.slice(1).map((name,index)=>core.createRacer(name,modelIds[index%modelIds.length],index+1))];
    racers.forEach(racer=>{const model=options.models[racer.model],vehicle=AX.makeTractor({color:model.color,rim:model.rim,brand:model.brand,model:model.n});scene.add(vehicle);vehicles.push(vehicle);});
    camera.position.set(75,9,-17);camera.lookAt(60,1,0);updateVehicles(0);}
  function setup(){phase='setup';reported=false;held.clear();countdown.textContent='';panel.hidden=false;telemetry.textContent='';
    panel.innerHTML='<h3>Грунтовое кольцо</h3><p>Три круга против трёх ботов. Проходите ворота по порядку: следующие подсвечены жёлтым. На траве трактор теряет скорость.</p><label>Ваш трактор<select id="raceModel"></select></label><p id="raceBest"></p><button class="btn signal" id="raceStart">На старт · Enter</button><p class="small">WASD / стрелки — газ, тормоз и руль. R — на трассу (+5 с), V — камера, Esc — в павильон. Характеристики здесь игровые.</p>';
    const select=panel.querySelector('select');modelIds.forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=options.models[id].brand+' '+options.models[id].n;select.appendChild(option);});select.value=selected;
    function best(){const record=options.best(selected);panel.querySelector('#raceBest').textContent=record?'Ваш рекорд: '+time(record):'Рекорд пока не установлен';}
    select.onchange=()=>{selected=select.value;best();grid();};panel.querySelector('#raceStart').onclick=start;best();grid();}
  function start(){grid();reported=false;phase='countdown';count=3;panel.hidden=true;held.clear();countdown.textContent='3';}
  function finish(){phase='finished';held.clear();const player=racers[0],order=core.ranking(racers),place=order.indexOf(player)+1,total=player.time+player.penalty;
    if(!reported){reported=true;options.finish({model:selected,time:total,place});}
    panel.hidden=false;panel.innerHTML='<h3>Финиш! '+place+'-е место</h3><p>Ваше время: <b>'+time(total)+'</b>'+(player.penalty?' · штрафы '+player.penalty+' с':'')+'</p><ol id="raceResults"></ol><button class="btn signal" id="raceAgain">Ещё заезд · Enter</button> <button class="btn ghost" id="raceGarage">Выбор трактора</button>';
    telemetry.innerHTML='<span>Финиш · '+place+'-е место</span><span>'+time(total)+'</span>';
    order.forEach(racer=>{const line=document.createElement('li'),index=racers.indexOf(racer);line.textContent=names[index]+' · '+options.models[racer.model].n+' · '+(racer.finished?time(racer.time+racer.penalty):'не финишировал');panel.querySelector('ol').appendChild(line);});
    panel.querySelector('#raceAgain').onclick=start;panel.querySelector('#raceGarage').onclick=setup;}
  function updateVehicles(delta){racers.forEach((racer,index)=>{const vehicle=vehicles[index];vehicle.position.set(racer.x,0,racer.z);vehicle.rotation.y=-racer.heading;
    if(vehicle.userData.spin)vehicle.userData.spin(racer.speed*delta);if(vehicle.userData.steer)vehicle.userData.steer.forEach(wheel=>wheel.rotation.y=-racer.steer);});}
  function collisions(){for(let first=0;first<racers.length;first++)for(let second=first+1;second<racers.length;second++){const left=racers[first],right=racers[second];if(left.finished||right.finished)continue;
    const dx=right.x-left.x,dz=right.z-left.z,gap=Math.hypot(dx,dz);if(gap>=3.7)continue;const push=(3.7-gap)/2,normalX=gap>.001?dx/gap:1,normalZ=gap>.001?dz/gap:0;
    left.x-=normalX*push;left.z-=normalZ*push;right.x+=normalX*push;right.z+=normalZ*push;left.speed*=.96;right.speed*=.96;}}
  function tick(delta){if(element.hidden||!renderer)return;
    if(phase==='countdown'){count-=delta;countdown.textContent=count>0?String(Math.ceil(count)):'СТАРТ!';if(count<=0)phase='racing';}
    else if(phase==='racing'){const input={throttle:held.has('KeyW')||held.has('ArrowUp'),brake:held.has('KeyS')||held.has('ArrowDown'),steer:Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft'))};
      core.step(racers[0],input,delta);racers.slice(1).forEach(racer=>core.step(racer,core.botInput(racer),delta));collisions();if(racers[0].time>1)countdown.textContent='';if(racers[0].finished)finish();}
    touchControls.hidden=phase!=='racing';updateVehicles(delta);const player=racers[0];
    gates.forEach((material,index)=>{const next=index===(player.gates+1)%core.GATES;material.color.set(next?'#ffc33d':'#e5e8df');material.emissive.set(next?'#624000':'#000000');});
    if(phase==='racing'||phase==='countdown'){telemetry.innerHTML='<span>Круг '+Math.min(core.LAPS,Math.floor(player.gates/core.GATES)+1)+' / '+core.LAPS+'</span><span>Место '+(core.ranking(racers).indexOf(player)+1)+' / 4</span><span>'+time(player.time+player.penalty)+'</span><span>'+Math.round(player.speed*3.6)+' км/ч</span><span>'+(player.offroad?'Трава — потеря скорости':'Следующие ворота: '+((player.gates+1)%core.GATES+1))+'</span>';}
    const goal=new T.Vector3(player.x,1.5,player.z),position=view==='top'?new T.Vector3(player.x,65,player.z-1):new T.Vector3(player.x-Math.cos(player.heading)*12,7,player.z-Math.sin(player.heading)*12);
    camera.position.lerp(position,1-Math.exp(-delta*5));camera.lookAt(goal);renderer.render(scene,camera);}
  function close(){element.hidden=true;held.clear();options.close();}
  function key(code,down,repeat){if(element.hidden)return false;if(!down){held.delete(code);return true;}
    if(code==='Escape'){close();return true;}if(code==='Enter'&&!repeat){if(phase==='setup'||phase==='finished')start();return true;}
    if(code==='KeyR'&&!repeat&&phase==='racing'){core.recover(racers[0]);return true;}if(code==='KeyV'&&!repeat){view=view==='chase'?'top':'chase';return true;}
    held.add(code);return true;}
  function clearInput(){held.clear();document.querySelectorAll('#raceTouch button').forEach(button=>button.setAttribute('aria-pressed','false'));}
  document.getElementById('raceX').onclick=close;
  document.querySelectorAll('#raceTouch [data-code]').forEach(button=>{button.onpointerdown=event=>{event.preventDefault();button.setPointerCapture(event.pointerId);key(button.dataset.code,true,false);button.setAttribute('aria-pressed','true');};
    const release=()=>{key(button.dataset.code,false,false);button.setAttribute('aria-pressed','false');};button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;});
  addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);
  return {get active(){return !element.hidden;},open(){element.hidden=false;initialize();resize();setup();},close,key,tick,resize};
};
})();
