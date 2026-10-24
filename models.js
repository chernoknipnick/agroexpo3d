/* АгроЭкспо 3D — процедурные модели: окружение, трактор, люди. Three.js r152, глобальный THREE. */
(function(){
"use strict";
const T=THREE, V2=T.Vector2, V3=T.Vector3;
const AX=window.AX={};

/* ---------- материалы ---------- */
const matCache={};
function paint(color){return new T.MeshPhysicalMaterial({color,metalness:.25,roughness:.34,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:.75});}
function std(color,metal,rough,extra){return new T.MeshStandardMaterial(Object.assign({color,metalness:metal,roughness:rough},extra||{}));}
function shared(key,fn){return matCache[key]||(matCache[key]=fn());}
const MAT={
  rubber:()=>shared('rubber',()=>std('#1a1b1c',0,.88)),
  rubberSide:()=>shared('rubberSide',()=>std('#232526',0,.78)),
  steel:()=>shared('steel',()=>std('#34383c',.7,.42)),
  darkSteel:()=>shared('darkSteel',()=>std('#1f2225',.6,.5)),
  chrome:()=>shared('chrome',()=>std('#e3e7ea',1,.12)),
  alu:()=>shared('alu',()=>std('#b8bec4',.9,.3)),
  plastic:()=>shared('plastic',()=>std('#17191b',0,.55)),
  seat:()=>shared('seat',()=>std('#2a2d31',0,.75)),
  glass:()=>shared('glass',()=>new T.MeshPhysicalMaterial({color:'#93b6c6',metalness:0,roughness:.03,transparent:true,opacity:.4,envMapIntensity:2,depthWrite:false,side:T.DoubleSide})),
  tail:()=>shared('tail',()=>std('#7a0d0d',0,.3,{emissive:'#ff2a1a',emissiveIntensity:.25})),
  amber:()=>shared('amber',()=>std('#a85a00',0,.3,{emissive:'#ff9a1a',emissiveIntensity:.25})),
  engine:()=>shared('engine',()=>std('#3a3d40',.5,.55)),
  hose:()=>shared('hose',()=>std('#0e0f10',0,.7)),
  white:()=>shared('white',()=>new T.MeshPhysicalMaterial({color:'#f2f3f0',metalness:.1,roughness:.35,clearcoat:.8,clearcoatRoughness:.1}))
};
AX.MAT=MAT;AX.paint=paint;AX.std=std;

function M(geo,mat,parent,x,y,z,cast){const m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=cast!==false;m.receiveShadow=true;if(parent)parent.add(m);return m;}
AX.M=M;
function roundRectShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
AX.roundRectShape=roundRectShape;
/* Скруглённый параллелепипед: экструзия скруглённого прямоугольника с фаской */
function rbox(w,h,d,r,seg){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);
  const g=new T.ExtrudeGeometry(roundRectShape(w-2*r,h-2*r,Math.max(.001,r*.4)),{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:seg||3,curveSegments:6});
  g.translate(0,0,-(d-2*r)/2);g.computeVertexNormals();return g;}
AX.rbox=rbox;
function tube(points,r,mat,parent,seg){const c=new T.CatmullRomCurve3(points.map(p=>new V3(p[0],p[1],p[2])));return M(new T.TubeGeometry(c,seg||24,r,10,false),mat,parent);}
AX.tube=tube;
function cyl(rt,rb,h,seg,mat,parent,x,y,z,axis){const g=new T.CylinderGeometry(rt,rb,h,seg||24);if(axis==='z')g.rotateX(Math.PI/2);if(axis==='x')g.rotateZ(Math.PI/2);return M(g,mat,parent,x,y,z);}
AX.cyl=cyl;
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.userData={c,x};return t;}
AX.canvasTex=canvasTex;


/* Склейка неподвижных деталей узла по материалам: меньше вызовов отрисовки */
AX.mergeRigid=function(root,stops){
  root.updateMatrixWorld(true);const inv=new T.Matrix4().copy(root.matrixWorld).invert();const buckets=new Map(),rm=[];
  (function walk(n){n.children.forEach(c=>{if(c!==root&&stops.has(c))return;if(c.isMesh&&!c.isInstancedMesh&&c.children.length===0&&!c.userData.keep){
      const key=c.material.uuid+(c.castShadow?'s':'n');if(!buckets.has(key))buckets.set(key,{mat:c.material,cast:c.castShadow,list:[]});buckets.get(key).list.push(c);rm.push(c);}
    else if(!c.isMesh||c.children.length)walk(c);});})(root);
  const mm=new T.Matrix4();
  buckets.forEach(b=>{if(b.list.length<2){rm.splice(rm.indexOf(b.list[0]),1);return;}
    const parts=b.list.map(m=>{let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();mm.multiplyMatrices(inv,m.matrixWorld);g.applyMatrix4(mm);return g;});
    let n=0;parts.forEach(g=>n+=g.attributes.position.count);
    const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;
    parts.forEach(g=>{const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);if(g.attributes.normal)N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)U.set(g.attributes.uv.array.subarray(0,c*2),o*2);o+=c;g.dispose();});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.setAttribute('uv',new T.BufferAttribute(U,2));
    const m=new T.Mesh(geo,b.mat);m.castShadow=b.cast;m.receiveShadow=true;root.add(m);});
  rm.forEach(m=>{m.parent.remove(m);});
};
AX.mergeAll=function(nodes){const set=new Set(nodes);nodes.forEach(n=>AX.mergeRigid(n,set));};

/* ---------- окружение для отражений ---------- */
AX.makeEnvironment=function(renderer){
  const es=new T.Scene();
  const sky=new T.SphereGeometry(50,32,16);const col=[];const p=sky.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i)/50;const c=new T.Color();
    if(y>0)c.setRGB(.62+.3*(1-y),.78+.17*(1-y),.95);else c.setRGB(.42,.38,.33);col.push(c.r,c.g,c.b);}
  sky.setAttribute('color',new T.Float32BufferAttribute(col,3));
  es.add(new T.Mesh(sky,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
  const lm=new T.MeshBasicMaterial({color:new T.Color(6,6,5.6)});
  for(let i=-2;i<=2;i++){const b=new T.Mesh(new T.BoxGeometry(3,.25,30),lm);b.position.set(i*7,22,0);es.add(b);}
  const sm=new T.MeshBasicMaterial({color:new T.Color(3,2.8,2.4)});
  const s1=new T.Mesh(new T.PlaneGeometry(18,10),sm);s1.position.set(0,10,-30);es.add(s1);
  const s2=new T.Mesh(new T.PlaneGeometry(14,8),sm);s2.position.set(30,8,10);s2.rotation.y=-Math.PI/2;es.add(s2);
  const pm=new T.PMREMGenerator(renderer);const rt=pm.fromScene(es,.02);pm.dispose();return rt.texture;
};

/* ---------- колесо с протектором ---------- */
function makeWheel(o){
  // o: R радиус, W ширина, rimR, side (+1 наружу по +z), rimMat, lugs, tread
  const g=new T.Group(),R=o.R,W=o.W,rr=o.rimR,s=o.side;
  const prof=[[rr+.01,-W/2+.03],[rr+.06,-W/2],[R-.16,-W/2-.015],[R-.07,-W/2+.03],[R-.035,-W/2+.1],[R-.025,-W/2+.2],[R-.02,0],[R-.025,W/2-.2],[R-.035,W/2-.1],[R-.07,W/2-.03],[R-.16,W/2+.015],[rr+.06,W/2],[rr+.01,W/2-.03]].map(q=>new V2(q[0],q[1]));
  const tg=new T.LatheGeometry(prof,72);tg.rotateX(Math.PI/2);
  M(tg,MAT.rubber(),g);
  // боковина: кольцевая надпись-рельеф
  const rg=new T.TorusGeometry(R-.12,.012,6,72);
  [1,-1].forEach(k=>{const t=M(rg,MAT.rubberSide(),g,0,0,k*(W/2+.012),false);});
  // грунтозацепы ёлочкой
  const n=o.lugs||28,lugH=o.lugH||.05,ang=o.lugAng||.5;
  const lugLen=(W*.56)/Math.cos(ang);
  const lugGeo=new T.BoxGeometry(lugLen,lugH*2,o.lugT||.1);
  const im=new T.InstancedMesh(lugGeo,MAT.rubber(),n*2);im.castShadow=true;im.receiveShadow=true;
  const mx=new T.Matrix4(),dirZ=new V3(0,0,1);let k=0;
  for(let side=-1;side<=1;side+=2)for(let i=0;i<n;i++){
    const th=(i+(side>0?.5:0))/n*Math.PI*2;
    const nr=new V3(Math.cos(th),Math.sin(th),0),tgv=new V3(-Math.sin(th),Math.cos(th),0);
    const long=dirZ.clone().multiplyScalar(Math.cos(ang)*side).addScaledVector(tgv,Math.sin(ang)).normalize();
    const zA=new V3().crossVectors(long,nr).normalize();
    const zc=side*W*.24;
    const pos=nr.clone().multiplyScalar(R-.005).add(new V3(0,0,zc)).addScaledVector(tgv,Math.sin(ang)*lugLen*.5*0);
    mx.makeBasis(long,nr,zA);mx.setPosition(pos);im.setMatrixAt(k++,mx);}
  g.add(im);
  // диск
  const rimMat=o.rimMat;
  const barrel=new T.LatheGeometry([[rr-.02,-W/2+.04],[rr,-W/2+.02],[rr-.005,-W/2+.08],[rr-.05,-W/2+.12],[rr-.05,W/2-.12],[rr-.005,W/2-.08],[rr,W/2-.02],[rr-.02,W/2-.04]].map(q=>new V2(q[0],q[1])),48);barrel.rotateX(Math.PI/2);
  M(barrel,rimMat,g);
  const disc=new T.Shape();disc.absarc(0,0,rr-.04,0,Math.PI*2,false);
  const holes=o.holes||8;for(let i=0;i<holes;i++){const a=i/holes*Math.PI*2,h=new T.Path();h.absellipse(Math.cos(a)*rr*.62,Math.sin(a)*rr*.62,rr*.13,rr*.09,0,Math.PI*2,true,a);disc.holes.push(h);}
  const hc=new T.Path();hc.absarc(0,0,rr*.26,0,Math.PI*2,true);disc.holes.push(hc);
  const dg=new T.ExtrudeGeometry(disc,{depth:.03,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:40});
  M(dg,rimMat,g,0,0,s*W*.12-.015);
  // ступица и болты
  const hub=cyl(rr*.3,rr*.34,.22,32,MAT.steel(),g,0,0,s*(W*.12+.09),'z');
  cyl(rr*.17,rr*.2,.1,24,rimMat,g,0,0,s*(W*.12+.24),'z');
  const nb=o.bolts||10,bg=new T.CylinderGeometry(.022,.022,.05,6);bg.rotateX(Math.PI/2);
  for(let i=0;i<nb;i++){const a=i/nb*Math.PI*2;M(bg,MAT.chrome(),g,Math.cos(a)*rr*.235,Math.sin(a)*rr*.235,s*(W*.12+.21),false);}
  g.userData.R=R;return g;
}
AX.makeWheel=makeWheel;

/* ---------- надписи ---------- */
function decal(text,sub,w,h,color,parent,x,y,z,ry){
  const tex=canvasTex(1024,256,(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle=color||'#fff';c.textBaseline='middle';
    c.font='800 150px "Unbounded","Arial Black",sans-serif';c.fillText(text,10,H*.42,W-20);
    if(sub){c.font='700 70px "JetBrains Mono",monospace';c.globalAlpha=.9;c.fillText(sub,14,H*.86,W-20);}});
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.35,metalness:.2,polygonOffset:true,polygonOffsetFactor:-2}));
  m.position.set(x,y,z);m.rotation.y=ry||0;parent.add(m);return m;
}

/* ---------- трактор ---------- */
/* Ось X — вперёд, Z — вбок, Y — вверх. Длина ~5,9 м, ширина ~2,6 м, высота ~3,15 м. */
AX.makeTractor=function(o){
  o=Object.assign({color:'#b5362b',rim:'#d9d4c6',roof:'white',brand:'',model:'',old:false},o||{});
  const g=new T.Group();g.name='tractor';
  const body=o.old?new T.MeshStandardMaterial({color:o.color,metalness:.15,roughness:.62}):paint(o.color);
  const rimMat=o.old?std(o.rim,.3,.6):new T.MeshPhysicalMaterial({color:o.rim,metalness:.4,roughness:.32,clearcoat:.8,clearcoatRoughness:.12});
  const roofMat=o.roof==='white'?MAT.white():body;
  const ud={wheels:[],steer:[],lights:[],beacon:null,hood:null,door:null,exhaust:null,engineOn:false};
  const RA=-1.25,FA=1.75,RR=.96,FR=.68,RW=.62,FW=.42,RZ=1.12,FZ=.92;

  /* рама, мосты */
  const frame=new T.Group();g.add(frame);
  M(rbox(3.4,.42,.7,.06),MAT.darkSteel(),frame,1.05,.86,0);
  M(rbox(1.3,.7,1.1,.12),MAT.steel(),frame,RA+.1,1.0,0);                     // корпус трансмиссии
  cyl(.17,.17,RZ*2-.25,24,MAT.steel(),frame,RA,RR,0,'z');                      // задний мост
  [-1,1].forEach(s=>cyl(.26,.22,.34,24,MAT.darkSteel(),frame,RA,RR,s*(RZ-.42),'z'));
  M(rbox(.34,.26,FZ*2-.35,.06),MAT.darkSteel(),frame,FA,FR,0);                // передний мост
  M(rbox(.4,.22,.5,.06),MAT.steel(),frame,FA,FR+.18,0);

  /* колёса */
  [-1,1].forEach(s=>{
    const w=makeWheel({R:RR,W:RW,rimR:.58,side:s,rimMat,lugs:32,lugH:.045,lugAng:.6,holes:8,bolts:10});
    w.position.set(RA,RR,s*RZ);g.add(w);ud.wheels.push(w);
    const piv=new T.Group();piv.position.set(FA,FR,s*FZ);g.add(piv);
    const fw=makeWheel({R:FR,W:FW,rimR:.4,side:s,rimMat,lugs:28,lugH:.035,lugAng:.6,lugT:.075,holes:6,bolts:8});piv.add(fw);ud.wheels.push(fw);ud.steer.push(piv);
    // переднее крыло, поворачивается с колесом
    const fs=new T.Shape();fs.absarc(0,0,FR+.13,Math.PI*.12,Math.PI*.86,false);fs.absarc(0,0,FR+.08,Math.PI*.86,Math.PI*.12,true);
    const fg=new T.ExtrudeGeometry(fs,{depth:FW+.08,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2,curveSegments:24});fg.translate(0,0,-(FW+.08)/2);
    M(fg,body,piv);M(rbox(.06,.5,.05,.02),MAT.darkSteel(),piv,-.05,.55,-s*.18);
    cyl(.05,.05,.25,12,MAT.steel(),piv,0,0,-s*.2,'z');
  });

  /* передний балласт */
  const wt=new T.Group();wt.position.set(FA+1.28,FR+.04,0);g.add(wt);
  M(rbox(.42,.42,.7,.06),MAT.darkSteel(),wt,-.1,0,0);
  for(let i=0;i<9;i++){const z=-.68+i*.17;M(rbox(.38,.4,.15,.05),MAT.darkSteel(),wt,.18,-.04,z);M(rbox(.12,.07,.06,.02),MAT.steel(),wt,.4,.14,z);}
  M(rbox(.16,.07,1.6,.04),MAT.steel(),wt,.4,.24,0);

  /* капот: профиль сбоку, экструзия по ширине */
  const hoodW=1.08;
  const hp=new T.Shape();
  hp.moveTo(0,-.95);hp.lineTo(0,0);hp.lineTo(1.9,-.13);hp.quadraticCurveTo(2.42,-.17,2.5,-.5);hp.quadraticCurveTo(2.55,-.78,2.44,-.95);hp.lineTo(0,-.95);
  const hg=new T.ExtrudeGeometry(hp,{depth:hoodW-.16,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:5,curveSegments:24});hg.translate(0,0,-(hoodW-.16)/2);
  const hinge=new T.Group();hinge.position.set(.32,2.02,0);g.add(hinge);ud.hood=hinge;
  M(hg,body,hinge);
  // жалюзи по бокам капота
  [-1,1].forEach(s=>{for(let i=0;i<7;i++){M(rbox(.62,.035,.03,.012),MAT.plastic(),hinge,1.62,-.36-i*.065,s*(hoodW/2+.005));}
    M(rbox(.72,.52,.02,.04),MAT.darkSteel(),hinge,1.62,-.55,s*(hoodW/2-.005),false);});
  // логотип на капоте
  if(o.brand){[-1,1].forEach(s=>decal(o.brand.toUpperCase(),o.model,1.0,.25,'#ffffff',hinge,.62,-.36,s*(hoodW/2+.012),s>0?0:Math.PI));}
  // решётка радиатора и фары
  const grille=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#0b0c0d';c.fillRect(0,0,w,h);c.fillStyle='#3a3e42';for(let y=0;y<h;y+=16)for(let x=(y/16%2)*8;x<w;x+=16){c.beginPath();c.moveTo(x,y+2);c.lineTo(x+7,y+8);c.lineTo(x,y+14);c.lineTo(x-7,y+8);c.closePath();c.fill();}});
  grille.wrapS=grille.wrapT=T.RepeatWrapping;grille.repeat.set(3,2);
  M(rbox(.08,.46,.9,.04),MAT.chrome(),hinge,2.6,-.72,0);
  const gm=new T.Mesh(new T.PlaneGeometry(.8,.38),new T.MeshStandardMaterial({map:grille,metalness:.6,roughness:.45}));gm.position.set(2.646,-.72,0);gm.rotation.y=Math.PI/2;hinge.add(gm);
  const headMat=std('#f4f8ff',.2,.15,{emissive:'#ffffff',emissiveIntensity:0});ud.lights.push(headMat);
  [-1,1].forEach(s=>{M(rbox(.07,.12,.26,.03),MAT.plastic(),hinge,2.6,-.46,s*.3);M(rbox(.03,.08,.22,.02),headMat,hinge,2.64,-.46,s*.3,false);
    M(rbox(.03,.05,.08,.015),MAT.amber(),hinge,2.63,-.46,s*.48,false);});
  const ledMat=std('#dfe9ff',.1,.2,{emissive:'#cfe0ff',emissiveIntensity:0});ud.lights.push(ledMat);
  M(rbox(.05,.03,.8,.012),ledMat,hinge,2.43,-.2,0,false);

  /* двигатель под капотом */
  const eng=new T.Group();eng.position.set(.4,1.08,0);g.add(eng);
  M(rbox(1.5,.5,.62,.06),MAT.engine(),eng,.75,.25,0);
  M(rbox(1.32,.12,.42,.05),paint(o.old?'#555':'#c62f22'),eng,.75,.56,0);
  for(let i=0;i<6;i++)cyl(.03,.03,.16,10,MAT.alu(),eng,.18+i*.22,.68,.12);
  M(rbox(.12,.62,.82,.03),std('#2a3036',.7,.35),eng,1.98,.38,0);              // радиатор
  const turbo=new T.Group();turbo.position.set(.3,.48,-.38);eng.add(turbo);
  M(new T.TorusGeometry(.11,.05,12,24),MAT.alu(),turbo);cyl(.07,.07,.16,16,MAT.alu(),turbo,0,0,-.08,'z');
  tube([[.3,.6,-.38],[.6,.78,-.3],[1.1,.78,-.2],[1.4,.62,-.1]],.05,MAT.hose(),eng);
  tube([[1.6,.3,.33],[1.75,.5,.35],[1.9,.55,.2]],.04,MAT.hose(),eng);
  cyl(.13,.13,.42,24,MAT.plastic(),eng,1.5,.62,-.3,'x');
  M(rbox(.24,.2,.2,.04),MAT.darkSteel(),eng,.1,.15,.38);

  /* кабина */
  const cab=new T.Group();cab.position.set(RA+.15,0,0);g.add(cab);
  const cx0=-.9,cx1=1.25,cw=.8,cy0=1.55,cy1=3.02; // координаты кабины относительно cab
  M(rbox(cx1-cx0,.32,cw*2,.06),MAT.darkSteel(),cab,(cx0+cx1)/2,cy0+.1,0);          // основание
  M(rbox(.9,.5,cw*2-.2,.08),MAT.darkSteel(),cab,cx1-.35,cy0-.12,0);
  // стойки
  const pil=(x0,x1,z)=>tube([[x0,cy0+.25,z],[x0+(x1-x0)*.5,(cy0+cy1)/2,z],[x1,cy1-.12,z]],.045,MAT.plastic(),cab,4);
  [-1,1].forEach(s=>{pil(cx1-.02,cx1-.2,s*(cw-.04));pil(cx0+.02,cx0+.06,s*(cw-.04));pil(.15,.12,s*(cw-.04));});
  // крыша
  const rs=roundRectShape(cx1-cx0+.42,cw*2+.24,.22);
  const rg=new T.ExtrudeGeometry(rs,{depth:.1,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:4,curveSegments:10});rg.rotateX(-Math.PI/2);
  M(rg,roofMat,cab,(cx0+cx1)/2+.08,cy1-.06,0);
  M(rbox(cx1-cx0+.32,.06,cw*2+.1,.03),MAT.plastic(),cab,(cx0+cx1)/2+.06,cy1-.1,0);
  // стёкла
  const gl=MAT.glass();
  const ws=new T.Mesh(new T.PlaneGeometry(1.32,cw*2-.08),gl);ws.position.set(cx1-.11,(cy0+cy1)/2+.12,0);ws.rotation.set(0,Math.PI/2,0);ws.rotation.z=0;ws.rotateX(0);ws.rotation.order='YXZ';ws.rotation.set(-.12,Math.PI/2,0);cab.add(ws);
  const rw=new T.Mesh(new T.PlaneGeometry(1.25,cw*2-.08),gl);rw.position.set(cx0+.04,(cy0+cy1)/2+.12,0);rw.rotation.y=Math.PI/2;cab.add(rw);
  const sideGlass=(z,x0,x1)=>{const m=new T.Mesh(new T.PlaneGeometry(x1-x0,cy1-cy0-.42),gl);m.position.set((x0+x1)/2,(cy0+cy1)/2+.12,z);cab.add(m);return m;};
  sideGlass(-cw+.04,cx0+.05,cx1-.12);
  sideGlass(cw-.04,cx0+.05,.12);
  // дверь слева (+z), петля у средней стойки
  const door=new T.Group();door.position.set(.15,0,cw-.02);cab.add(door);ud.door=door;
  const dw=cx1-.2-.15;
  const dgl=new T.Mesh(new T.PlaneGeometry(dw,cy1-cy0-.42),gl);dgl.position.set(dw/2,(cy0+cy1)/2+.12,.01);door.add(dgl);
  M(rbox(dw,.05,.04,.015),MAT.plastic(),door,dw/2,cy0+.3,.01);M(rbox(dw,.05,.04,.015),MAT.plastic(),door,dw/2,cy1-.14,.01);
  M(rbox(.05,cy1-cy0-.42,.04,.015),MAT.plastic(),door,dw-.02,(cy0+cy1)/2+.12,.01);
  M(rbox(.18,.04,.04,.015),MAT.chrome(),door,dw-.18,(cy0+cy1)/2,.05);
  tube([[dw-.05,cy0+.45,.07],[dw-.05,cy0+.9,.09],[dw-.05,cy0+1.15,.07]],.018,MAT.chrome(),door,8);
  [cx1-.08,cx0+.02].forEach((x,i)=>{const wp=M(rbox(.02,.7,.025,.008),MAT.plastic(),cab,x+(i?-.01:.03),cy0+.75,i?.1:-.2,false);wp.rotation.x=i?-.5:.6;});
  // салон
  M(rbox(.5,.12,.5,.05),MAT.seat(),cab,-.3,cy0+.55,0);
  M(rbox(.14,.62,.5,.06),MAT.seat(),cab,-.55,cy0+.9,0);
  M(rbox(.2,.18,.3,.06),MAT.seat(),cab,-.6,cy0+1.28,0);
  cyl(.06,.08,.3,12,MAT.darkSteel(),cab,-.3,cy0+.34,0);
  const sc=tube([[.75,cy0+.32,0],[.6,cy0+.7,0],[.48,cy0+.95,0]],.035,MAT.plastic(),cab,6);
  const swg=new T.Group();swg.position.set(.46,cy0+.98,0);swg.rotation.z=.85;cab.add(swg);
  const sw=new T.Mesh(new T.TorusGeometry(.19,.02,10,32),MAT.plastic());sw.rotation.x=Math.PI/2;swg.add(sw);
  [0,1,2].forEach(i=>{const sp=M(rbox(.17,.025,.035,.01),MAT.plastic(),swg,0,0,0,false);sp.rotation.y=i*Math.PI*2/3;sp.position.set(Math.cos(i*2.094)*.09,0,Math.sin(i*2.094)*.09);});
  M(rbox(.3,.3,.6,.06),MAT.plastic(),cab,.85,cy0+.55,0);
  M(rbox(.5,.16,.14,.04),MAT.seat(),cab,-.15,cy0+.72,-.32);
  cyl(.018,.018,.12,8,MAT.plastic(),cab,.02,cy0+.86,-.32);
  M(new T.SphereGeometry(.035,12,8),std('#b12a1f',.2,.4),cab,.02,cy0+.94,-.32);
  const scr=canvasTex(256,160,(c,w,h)=>{c.fillStyle='#08130c';c.fillRect(0,0,w,h);c.strokeStyle='#38c46a';c.lineWidth=3;for(let i=0;i<9;i++){c.beginPath();c.moveTo(20+i*24,20);c.lineTo(20+i*24,140);c.stroke();}c.fillStyle='#e8a01a';c.beginPath();c.arc(140,90,8,0,7);c.fill();c.fillStyle='#fff';c.font='bold 20px monospace';c.fillText('AUTO 3.6 га/ч',14,152);});
  const scm=new T.Mesh(new T.PlaneGeometry(.24,.15),new T.MeshStandardMaterial({map:scr,emissiveMap:scr,emissive:'#ffffff',emissiveIntensity:.7,roughness:.3}));scm.position.set(.12,cy0+1.02,-.46);scm.rotation.set(0,Math.PI*.62,-.2);cab.add(scm);
  // зеркала
  [-1,1].forEach(s=>{tube([[cx1-.15,cy1-.45,s*(cw-.02)],[cx1-.05,cy1-.38,s*(cw+.3)],[cx1-.1,cy1-.42,s*(cw+.48)]],.018,MAT.plastic(),cab,8);
    M(rbox(.06,.34,.2,.04),MAT.plastic(),cab,cx1-.12,cy1-.56,s*(cw+.5));});
  // ступеньки и поручни
  for(let i=0;i<3;i++)M(rbox(.42,.04,.16,.015),MAT.darkSteel(),cab,.55,.62+i*.3,cw+.18);
  [-1,1].forEach(k=>M(rbox(.04,.95,.04,.015),MAT.darkSteel(),cab,.55+k*.21,.95,cw+.18));
  // маячок, фары крыши, GPS
  const bm=std('#c46b00',0,.25,{emissive:'#ff8c00',emissiveIntensity:.2,transparent:true,opacity:.92});
  const beacon=M(new T.CylinderGeometry(.08,.1,.16,20),bm,cab,cx0+.35,cy1+.18,-.45);
  M(new T.SphereGeometry(.08,16,8,0,Math.PI*2,0,Math.PI/2),bm,beacon,0,.08,0);ud.beacon={mesh:beacon,mat:bm,on:false};
  cyl(.1,.11,.05,20,MAT.plastic(),cab,cx0+.35,cy1+.09,-.45);
  M(new T.SphereGeometry(.16,24,12,0,Math.PI*2,0,Math.PI/2),MAT.white(),cab,-.1,cy1+.06,0);
  cyl(.165,.165,.04,24,MAT.plastic(),cab,-.1,cy1+.06,0);
  const workMat=std('#eef3ff',.2,.15,{emissive:'#ffffff',emissiveIntensity:0});ud.lights.push(workMat);
  for(let i=0;i<4;i++){const z=-.66+i*.44;M(rbox(.08,.1,.18,.03),MAT.plastic(),cab,cx1+.16,cy1+.02,z);M(rbox(.02,.08,.15,.02),workMat,cab,cx1+.205,cy1+.02,z,false);}
  [-1,1].forEach(s=>{M(rbox(.08,.1,.18,.03),MAT.plastic(),cab,cx0-.14,cy1+.02,s*.55);M(rbox(.02,.08,.15,.02),workMat,cab,cx0-.185,cy1+.02,s*.55,false);});
  // выхлоп справа от капота
  const EX=1.62;
  cyl(.055,.06,1.25,20,MAT.darkSteel(),cab,EX,2.55,-.36);
  M(rbox(.15,.62,.15,.03),MAT.chrome(),cab,EX,2.5,-.36);
  M(rbox(.28,.06,.22,.03),MAT.darkSteel(),cab,EX,1.98,-.36);
  const tip=new T.Object3D();tip.position.set(RA+.15+EX,3.22,-.36);g.add(tip);ud.exhaust=tip;
  cyl(.065,.065,.07,16,MAT.darkSteel(),cab,EX,3.17,-.36);
  // воздухозаборник
  cyl(.1,.1,.85,20,MAT.plastic(),cab,EX,2.4,.36);M(rbox(.26,.14,.26,.05),MAT.plastic(),cab,EX,2.88,.36);M(rbox(.28,.06,.22,.03),MAT.darkSteel(),cab,EX,1.98,.36);

  /* задние крылья */
  [-1,1].forEach(s=>{
    const fs=new T.Shape();fs.absarc(0,0,RR+.14,Math.PI*.02,Math.PI*.98,false);fs.absarc(0,0,RR+.06,Math.PI*.98,Math.PI*.02,true);
    const fg=new T.ExtrudeGeometry(fs,{depth:RW+.06,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,curveSegments:32});fg.translate(0,0,-(RW+.06)/2);
    M(fg,body,g,RA,RR,s*RZ);
    M(rbox(1.7,.05,.3,.02),MAT.darkSteel(),g,RA,RR+.08,s*(RZ-RW/2-.06));
    M(rbox(.08,.14,.22,.03),MAT.tail(),g,RA-1.02,RR+.35,s*(RZ+.1));
    M(rbox(.06,.08,.12,.03),MAT.amber(),g,RA-.2,RR+1.08,s*(RZ+RW/2+.03));
  });
  /* бак */
  M(rbox(.9,.5,.5,.12),MAT.darkSteel(),g,.35,1.05,.65);cyl(.06,.06,.06,16,MAT.chrome(),g,.15,1.32,.72);
  M(rbox(.55,.36,.34,.08),MAT.darkSteel(),g,.4,1.0,-.62);

  /* задняя навеска */
  const hitch=new T.Group();hitch.position.set(RA-.55,.7,0);g.add(hitch);
  [-1,1].forEach(s=>{const l=M(rbox(.7,.08,.08,.03),MAT.steel(),hitch,-.3,-.1,s*.38);l.rotation.z=.18;
    const a=M(rbox(.7,.07,.07,.025),MAT.steel(),hitch,-.2,.55,s*.36);a.rotation.z=-.35;
    cyl(.035,.035,.45,10,MAT.chrome(),hitch,-.45,.25,s*.37);
    M(new T.SphereGeometry(.055,12,8),MAT.chrome(),hitch,-.65,-.16,s*.38);});
  cyl(.05,.05,.75,12,MAT.steel(),hitch,-.45,.58,0,'x');
  cyl(.045,.045,.28,12,MAT.chrome(),hitch,-.1,.02,0,'x');
  M(rbox(.2,.12,.5,.04),MAT.darkSteel(),hitch,.05,-.32,0);
  g.userData.hitch=hitch;

  g.traverse(m=>{if(m.isMesh&&m.material===MAT.glass()){m.castShadow=false;}});
  Object.assign(g.userData,ud);
  // API
  g.userData.setLights=on=>{ud.lights.forEach(m=>m.emissiveIntensity=on?2.2:0);ud.lightsOn=on;};
  g.userData.setBeacon=on=>{ud.beacon.on=on;bm.emissiveIntensity=on?2.5:.2;};
  g.userData.spin=d=>{ud.wheels.forEach(w=>w.rotation.z-=d/w.userData.R);};
  g.userData.update=(dt,t)=>{
    if(ud.beacon.on){ud.beacon.mesh.rotation.y+=dt*8;bm.emissiveIntensity=1.2+Math.max(0,Math.sin(t*12))*2.5;}
    const U=g.userData;U.hood.rotation.z+=((U.hoodOpen?.85:0)-U.hood.rotation.z)*Math.min(1,dt*4);
    U.door.rotation.y+=((U.doorOpen?-1.2:0)-U.door.rotation.y)*Math.min(1,dt*4);
    if(U.engineOn){ud.cabShake=(Math.sin(t*90)*.004);cab.position.y=ud.cabShake;hinge.position.y=2.02+ud.cabShake*.6;eng.position.y=1.08+ud.cabShake;}
    else{cab.position.y=0;hinge.position.y=2.02;eng.position.y=1.08;}
  };
  g.userData.dims={len:6.0,width:2.6,height:3.2,RA,FA,RR,FR};
  AX.mergeAll([g,frame,wt,hinge,eng,cab,door,hitch,beacon,swg,turbo].concat(ud.wheels,ud.steer));
  return g;
};

/* Плуг / культиватор для поля */
AX.makePlow=function(color){
  const g=new T.Group();const b=paint(color||'#2a5ea6');
  M(rbox(.3,.14,2.6,.04),b,g,0,.75,0);
  for(let i=0;i<6;i++){const z=-1.1+i*.44;const a=M(rbox(.08,.6,.08,.02),b,g,-.25-i*.12,.5,z);a.rotation.z=.3;
    const d=cyl(.28,.28,.04,24,MAT.alu(),g,-.4-i*.12,.25,z,'z');d.rotation.y=.35;}
  M(rbox(.8,.1,.12,.03),b,g,.35,.85,0);
  return g;
};

/* ---------- человек ---------- */
AX.makeHuman=function(o){
  o=Object.assign({shirt:'#3d6db0',pants:'#2d3a4a',skin:'#e3b48f',hair:'#3a2a1e',hat:'cap',hatColor:'#f2f0e8',shoes:'#2a2420',vest:false},o||{});
  const g=new T.Group();
  const skin=std(o.skin,0,.62),shirt=std(o.shirt,0,.7),pants=std(o.pants,0,.78),shoe=std(o.shoes,.1,.55),hair=std(o.hair,0,.8);
  const cap=(r,l)=>new T.CapsuleGeometry(r,l,6,14);
  const limb=(parent,x,y,z,r,l,mat)=>{const p=new T.Group();p.position.set(x,y,z);parent.add(p);M(cap(r,l),mat,p,0,-l/2-r*.2,0);return p;};
  const hips=new T.Group();hips.position.y=.98;g.add(hips);
  M(new T.SphereGeometry(.17,20,12),pants,hips,0,0,0).scale.set(1.15,.7,.85);
  const legs=[-1,1].map(s=>{const th=limb(hips,s*.1,-.02,0,.085,.34,pants);const sh=limb(th,0,-.46,0,.072,.32,pants);sh.position.y=-.46;
    const boot=M(rbox(.13,.1,.26,.04),shoe,sh,0,-.47,.05);return {th,sh};});
  const torso=new T.Group();torso.position.y=1.0;g.add(torso);
  const tm=M(cap(.19,.36),shirt,torso,0,.34,0);tm.scale.set(1.08,1,.72);
  if(o.vest){const v=M(cap(.2,.3),std('#f2b417',0,.6),torso,0,.33,0);v.scale.set(1.1,1,.75);}
  M(new T.TorusGeometry(.085,.03,8,20),shirt,torso,0,.62,0).rotation.x=Math.PI/2;
  M(new T.CylinderGeometry(.055,.06,.09,14),skin,torso,0,.66,0);
  const arms=[-1,1].map(s=>{const up=limb(torso,s*.25,.56,0,.06,.24,shirt);const fo=limb(up,0,-.33,0,.052,.22,shirt);fo.position.y=-.33;
    M(new T.SphereGeometry(.055,14,10),skin,fo,0,-.33,0);up.rotation.z=s*.08;return {up,fo};});
  const head=new T.Group();head.position.y=1.79;g.add(head);
  const hm=M(new T.SphereGeometry(.125,28,20),skin,head);hm.scale.set(.95,1.08,1);
  [-1,1].forEach(s=>{M(new T.SphereGeometry(.018,10,8),std('#1b1b1b',0,.3),head,s*.042,.02,.112,false);
    M(new T.SphereGeometry(.026,10,8),skin,head,s*.12,0,0).scale.set(.5,1,.8);
    const br=M(rbox(.05,.012,.012,.005),hair,head,s*.044,.058,.115,false);});
  M(new T.SphereGeometry(.022,10,8),skin,head,0,-.012,.125,false).scale.set(.8,1,1.1);
  M(rbox(.05,.01,.01,.004),std('#9a5a4a',0,.6),head,0,-.06,.115,false);
  if(o.hat==='cap'){const hc=std(o.hatColor,0,.7);M(new T.SphereGeometry(.132,24,12,0,Math.PI*2,0,Math.PI/2),hc,head,0,.035,0).scale.set(1,.85,1.05);
    const vz=new T.Mesh(new T.CylinderGeometry(.11,.11,.012,24,1,false,-Math.PI/2.3,Math.PI/1.15),hc);vz.position.set(0,.04,.06);vz.scale.set(1,1,1.3);head.add(vz);}
  else if(o.hat==='helmet'){const hm2=std('#f2b417',0,.35);M(new T.SphereGeometry(.15,24,12,0,Math.PI*2,0,Math.PI/2),hm2,head,0,.03,0);M(new T.CylinderGeometry(.17,.17,.015,28),hm2,head,0,.03,.01);}
  else{M(new T.SphereGeometry(.13,24,12,0,Math.PI*2,0,Math.PI/2.2),hair,head,0,.02,-.008).scale.set(1,1.05,1.05);}
  g.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  g.userData={legs,arms,torso,head,hips,phase:0};
  AX.mergeAll([g,hips,torso,head].concat(...legs.map(l=>[l.th,l.sh]),...arms.map(a=>[a.up,a.fo])));
  return g;
};
AX.walk=function(h,spd,dt){
  const u=h.userData;u.phase+=dt*(spd>.05?spd*1.9:0);const a=spd>.05?Math.min(.75,.22+spd*.1):0;const s=Math.sin(u.phase);
  u.legs[0].th.rotation.x+=((s*a)-u.legs[0].th.rotation.x)*.3;u.legs[1].th.rotation.x+=((-s*a)-u.legs[1].th.rotation.x)*.3;
  u.legs[0].sh.rotation.x=Math.max(0,-Math.sin(u.phase+.6))*a*1.3;u.legs[1].sh.rotation.x=Math.max(0,Math.sin(u.phase+.6))*a*1.3;
  u.arms[0].up.rotation.x+=((-s*a*.8)-u.arms[0].up.rotation.x)*.3;u.arms[1].up.rotation.x+=((s*a*.8)-u.arms[1].up.rotation.x)*.3;
  u.arms[0].fo.rotation.x=-.25-a*.3;u.arms[1].fo.rotation.x=-.25-a*.3;
  const bob=a?Math.abs(Math.cos(u.phase))*.035:0;u.hips.position.y=.98+bob;u.torso.position.y=1.0+bob;u.head.position.y=1.79+bob;
};
})();
