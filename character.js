import * as THREE from './vendor/three.module.js';
export const ACTIONS=['闲逛','抬头','探窗','坐边','躺椅','捧杯','看花','托腮','举叶','抱花','看书','挥手'];
const ramp=new THREE.DataTexture(new Uint8Array([182,229,255]),3,1,THREE.RedFormat);ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
const white=new THREE.MeshToonMaterial({color:'#fffdf5',gradientMap:ramp});
const ink=new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'void main(){vec4 p=modelViewMatrix*vec4(position,1.0);p.xyz+=normalize(normalMatrix*normal)*0.009;gl_Position=projectionMatrix*p;}',fragmentShader:'void main(){gl_FragColor=vec4(0.204,0.275,0.216,1.0);}'});
const colors={green:'#91a657',blue:'#a8c5de',coral:'#e8afa9',stem:'#657e51',wood:'#c7ac7d'};
const V=(x,y,z)=>new THREE.Vector3(x,y,z),up=V(0,1,0);
const sphere=new THREE.SphereGeometry(1,16,12);
function skin(parent,geo,color=white){
  const m=new THREE.Mesh(geo,typeof color==='string'?new THREE.MeshToonMaterial({color}):color);parent.add(m);m.castShadow=m.receiveShadow=true;
  const border=new THREE.Mesh(geo,ink);m.add(border);return m;
}
function ellipsoid(p,x,y,z,sx,sy,sz,c=white){const m=skin(p,sphere,c);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
function bar(p,a,b,r,c=white){const m=skin(p,new THREE.CapsuleGeometry(r,Math.max(.001,a.distanceTo(b)-2*r),4,10),c);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());return m;}
function box(p,w,h,d,c,x=0,y=0,z=0){const m=skin(p,new THREE.BoxGeometry(w,h,d),c);m.position.set(x,y,z);return m;}
function inkLine(p,points){const g=new THREE.BufferGeometry().setFromPoints(points.map(v=>V(...v)));const m=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#344637'}));p.add(m);return m;}
function roundHead(){
  const w=.41,h=.35,r=.105,s=new THREE.Shape();
  s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const geo=new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSize:.026,bevelThickness:.025,bevelSegments:3,steps:1,curveSegments:12});geo.translate(0,0,-.06);geo.computeVertexNormals();return geo;
}
export function solveJoint(start,target,l1,l2,pole){
  const direction=target.clone().sub(start),distance=THREE.MathUtils.clamp(direction.length(),.001,l1+l2-.001);direction.normalize();
  const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const bend=pole.clone().addScaledVector(direction,-pole.dot(direction)).normalize();
  if(bend.lengthSq()<.001)bend.set(1,0,0);
  return {joint:start.clone().addScaledVector(direction,along).addScaledVector(bend,height),end:start.clone().addScaledVector(direction,distance)};
}
function limb(parent,name,length1,length2,radius){
  const group=new THREE.Group();group.name=name;parent.add(group);
  const upper=skin(group,new THREE.CapsuleGeometry(radius,length1-2*radius,5,12)),lower=skin(group,new THREE.CapsuleGeometry(radius,length2-2*radius,5,12)),joint=ellipsoid(group,0,0,0,radius,radius,radius);
  function segment(mesh,a,b,baseLength){const delta=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(up,delta.clone().normalize());mesh.scale.set(1,Math.max(.002,delta.length()/baseLength),1);}
  return {group,upper,lower,joint,end:V(),setPoints(a,b,c){segment(upper,a,b,length1);segment(lower,b,c,length2);joint.position.copy(b);this.end.copy(c);},set(a,b,pole){const s=solveJoint(a,b,length1,length2,pole);this.setPoints(a,s.joint,s.end);}};
}
function cup(p){
  const g=new THREE.Group();p.add(g);g.name='手中灰绿杯';
  skin(g,new THREE.CylinderGeometry(.115,.095,.2,20),colors.green);const coffee=skin(g,new THREE.CircleGeometry(.095,20),'#806145');coffee.rotation.x=-Math.PI/2;coffee.position.y=.102;
  const h=skin(g,new THREE.TorusGeometry(.07,.018,6,16),colors.green);h.position.x=.13;
  const steam=inkLine(g,[[.02,.14,0],[.055,.2,0],[.02,.27,0],[.055,.33,0]]);steam.name='杯中热气';g.userData.steam=steam;return g;
}
function flower(p){
  const g=new THREE.Group();p.add(g);g.name='抱着的一朵花';bar(g,V(.06,-.17,.34),V(.20,.68,.34),.014,colors.stem);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipsoid(g,.20+Math.cos(a)*.1,.68+Math.sin(a)*.1,.35,.075,.075,.025,colors.coral);}
  ellipsoid(g,.20,.68,.39,.045,.045,.02,'#e9cf72');return g;
}
export function createDoodleFlower(parent){return flower(parent);}
function leaf(p){
  const g=new THREE.Group();p.add(g);g.name='举着的橄榄叶';
  const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-.70,.3,-.68,.95,0,1.25);s.bezierCurveTo(.7,.9,.7,.35,0,0);
  const m=skin(g,new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false,curveSegments:16}),colors.green);m.position.y=.7;m.scale.setScalar(.85);g.position.set(.05,.03,.38);g.rotation.z=-.55;
  bar(g,V(0,-.4,.04),V(0,1.7,.04),.012,colors.stem);for(let i=1;i<6;i++)inkLine(g,[[0,.7+i*.16,.045],[(i%2?1:-1)*.20,.8+i*.16,.045]]);return g;
}
function quietAction(t,period,rise,hold,fall){const u=((t%period)+period)%period;const ease=x=>THREE.MathUtils.smootherstep(x,0,1);return u<rise?ease(u/rise):u<rise+hold?1:u<rise+hold+fall?1-ease((u-rise-hold)/fall):0;}
function book(p){
  const g=new THREE.Group();p.add(g);g.name='展开的小蓝书';g.position.set(0,.25,.36);
  for(const side of [-1,1]){const panel=new THREE.Group();g.add(panel);panel.rotation.y=side*.27;box(panel,.21,.32,.035,colors.blue,side*.105,0,0);box(panel,.195,.30,.01,'#fff8ea',side*.105,0,-.023);}
  const page=box(g,.19,.29,.008,'#fff8ea',.095,0,-.04);page.geometry.translate(-.095,0,0);page.position.x=0;g.userData.page=page;
  return g;
}
function recliner(p){
  const g=new THREE.Group();p.add(g);g.name='蓝白躺椅 / 随角色一起折起';
  const cloth=new THREE.Group();g.add(cloth);cloth.position.set(0,.63,.04);cloth.rotation.x=-.72;
  for(let i=0;i<7;i++)box(cloth,.105,1.3,.025,i%2?'#fff8ea':colors.blue,(i-3)*.105,.45,0);
  for(const x of [-.43,.43]){bar(g,V(x,.07,.55),V(x,1.63,-.70),.022,colors.wood);bar(g,V(x,.04,-.6),V(x,1.24,.30),.022,colors.wood);}
  bar(g,V(-.46,.12,.5),V(.46,.12,.5),.022,colors.wood);bar(g,V(-.46,.9,-.3),V(.46,.9,-.3),.022,colors.wood);return g;
}
function table(p){
  const g=new THREE.Group();p.add(g);g.name='托腮的珊瑚桌';
  const top=skin(g,new THREE.CylinderGeometry(.55,.55,.045,32),colors.coral);top.scale.z=.55;top.position.set(0,1.142,.47);
  for(const x of [-.42,.42])bar(g,V(x,0,.48),V(x,1.12,.48),.023,colors.coral);return g;
}
export function createCharacter(index,{seatEdge=true}={}){
  if(!Number.isInteger(index)||index<1||index>12)throw new Error('Unknown character action');
  const model=new THREE.Group();model.name='闲闲 / '+String(index).padStart(2,'0')+' '+ACTIONS[index-1];
  const rig=new THREE.Group(),body=new THREE.Group();model.add(rig);rig.add(body);
  const torso=ellipsoid(body,0,.28,0,.145,.31,.115);ellipsoid(body,0,.10,0,.145,.18,.115);
  bar(body,index===7?V(0,.46,-.07):V(0,.48,0),index===7?V(0,.68,-.24):V(0,.69,0),.072);
  if(index===7)ellipsoid(body,0,.46,-.07,.14,.17,.12);
  const head=new THREE.Group();body.add(head);head.position.set(0,index===7?.74:.82,index===7?-.32:.005);skin(head,roundHead());
  const face=new THREE.MeshBasicMaterial({color:'#344637'});
  const eyes=[];for(const x of [-.065,.065]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.018,10,8),face);eye.scale.y=1.3;eye.position.set(x,.025,.097);head.add(eye);eyes.push(eye);}
  const arms=[-1,1].map(side=>limb(body,side<0?'左臂':'右臂',.345,.345,.042));
  const legs=[-1,1].map(side=>limb(rig,side<0?'左腿':'右腿',.365,.365,.051));
  const hands=[-1,1].map(()=>ellipsoid(body,0,0,0,.057,.067,.045));
  const feet=[-1,1].map(()=>ellipsoid(rig,0,0,0,.10,.063,.18));
  const fingers=new THREE.Group();hands[1].add(fingers);fingers.name='挥手指尖';
  if(index===12)for(let i=0;i<3;i++)bar(fingers,V((i-1)*.37,.3,.15),V((i-1)*.45,1.15,.15),.16);
  let carried=null;
  if(index===6)carried=cup(body);
  if(index===9)carried=leaf(body);
  if(index===10)carried=flower(body);
  if(index===11)carried=book(body);
  if(index===3&&seatEdge)bar(rig,V(.42,0,.38),V(.42,1.9,.38),.007,'#344637');
  if(index===4&&seatEdge)box(rig,1.05,.025,.15,'#fff8ea',0,.54,-.10);
  if(index===5)recliner(rig);
  if(index===7){const f=flower(rig);f.scale.setScalar(.65);f.position.set(-.58,.12,.7);}
  if(index===8){table(rig);const seat=skin(rig,new THREE.CylinderGeometry(.21,.21,.04,24),colors.wood);seat.position.set(0,.65,0);for(const x of [-.15,.15])for(const z of [-.17,.17])bar(rig,V(x,0,z),V(x,.63,z),.018,colors.wood);bar(rig,V(-.17,.247,.20),V(.17,.247,.20),.018,colors.wood);}
  model.userData.character=index;model.userData.rig={rig,body,head,torso,eyes,arms,legs,hands,feet,carried,phase:index*.37};
  animateCharacter(model,0,true);return model;
}
export const REACTIONS=['走慢一点，看看旁边。','原来天上也有风景。','探出头来，和你打个招呼。','坐一会儿，晃晃脚。','躺一会儿，继续发呆。','举杯，敬今天的闲逛。','花在摇，我也晃晃脚。','今天允许自己发个呆。','把这片叶子借给你遮阳。','送你一朵小花。','一起翻到下一页。','嗨，一起去玩吧！'];
export function interactCharacter(model,now){model.userData.reactionAt=now;return REACTIONS[model.userData.character-1];}
export function animateCharacter(model,now,reduced=false){
  const {rig,body,head,torso,eyes,arms,legs,hands,feet,carried,phase}=model.userData.rig,index=model.userData.character;
  const age=(now-(model.userData.reactionAt??-1e9))/1000,reaction=reduced||age<0||age>2.8?0:Math.sin(Math.PI*age/2.8);
  const t=reduced?phase:now*.001+phase,gait=Math.sin(t*1.8+.18*Math.sin(t*.9))*(index===1?1-reaction*.7:1),breathe=reduced?0:Math.sin(t*1.35)*.012;
  let hip=.825,pitch=0,roll=0,headPitch=0,headRoll=-.08;
  let wrists=[V(-.16,-.22,.02),V(.16,-.22,.02)],ankles=[V(-.12,.075,.02),V(.12,.075,.02)],poles=[V(-.3,-1,.2),V(.3,-1,.2)];
  let legPoles=[V(0,0,1),V(0,0,1)];
  rig.position.set(0,0,0);rig.rotation.set(0,0,0);
  if(index===1||index===9){ankles=[V(-.12,.075+Math.max(0,gait)*.12,gait*.23),V(.12,.075+Math.max(0,-gait)*.12,-gait*.23)];hip=.785+Math.abs(gait)*.007;roll=-.06;if(index===1){wrists=[V(-.02,-.17,-.15),V(.045,-.17,-.15)];poles=[V(-.3,-.4,-1),V(.3,-.4,-1)];}}
  if(index===2){headPitch=-.32+Math.sin(t*.65)*.07;wrists=[V(-.15,-.22,-.04),V(.15,-.22,-.04)];}
  if(index===3){pitch=.48;roll=-.15+(reduced?0:Math.sin(t*.8)*.045);headRoll=-.25;wrists=[V(.34,.30,.30),V(.36,.38,.30)];poles=[V(-1,0,.4),V(1,0,.4)];ankles=[V(-.15,.075,-.08),V(.10,.075,.08)];}
  if(index===4){hip=.63;wrists=[V(-.28,-.035,-.14),V(.28,-.035,-.14)];poles=[V(-.2,0,-1),V(.2,0,-1)];ankles=[V(-.13,.075,.43),V(.13,.075,.43)];headPitch=.04;ankles[0].z+=reduced?0:Math.sin(t*1.1)*.025;}
  if(index===5){hip=.85;pitch=-.72;wrists=[V(-.25,.78,-.03),V(.25,.78,-.03)];ankles=[V(-.13,.22,.40),V(.13,.22,.40)];poles=[V(-1,0,.6),V(1,0,.6)];headPitch=.12;}
  if(index===6){const sip=reduced?0:Math.max(quietAction(t,9,1.6,1.3,1.8)*.09,reaction*.18);wrists=[V(-.16,.21+sip,.35),V(.21,.24+sip,.35)];carried.position.set(0,.25+sip,.35);carried.rotation.x=-sip;headPitch=.09;carried.userData.steam.scale.y=1+(reduced?0:Math.sin(t*1.4)*.12);}
  if(index===7){hip=.13;pitch=Math.PI/2;headPitch=-Math.PI/2;headRoll=-.06;
    wrists=[V(-.16,.80,-.21),V(.16,.80,-.21)];
    ankles=[V(-.13,.43,-.40),V(.13,.39+(reduced?0:Math.sin(t*1.2)*.015),-.42)];
    ankles[0].y+=reaction*.045*Math.sin(t*5);ankles[1].y+=reaction*.04*Math.sin(t*5+1.6);
  }
  if(index===8){hip=.75;pitch=0;wrists=[V(-.12,.73,.14),V(.12,.73,.14)];poles=[V(-.06,-.04,.335),V(.06,-.04,.335)];ankles=[V(-.13,.34,.27),V(.13,.34,.27)];headPitch=.08;}
  if(index===9){wrists=[V(.14,.25,.4),V(.08,.15,.4)];headPitch=-.1;carried.rotation.z=-.55+Math.sin(t*.8)*.025;}
  if(index===10){wrists=[V(.07,.30,.33),V(.14,.12,.33)];headPitch=.12;carried.rotation.z=Math.sin(t*.7)*.015;}
  if(index===11){hip=.08;pitch=.08;ankles=[V(-.64,.075,.55),V(.64,.075,.55)];legPoles=[V(-1,.4,.2),V(1,.4,.2)];wrists=[V(-.225,.25,.305),V(.225,.25,.305)];headPitch=.28+(reduced?0:quietAction(t,7,1.1,1.2,1.3)*.035);const turn=reduced?0:(t%7)/7;const u=THREE.MathUtils.clamp((turn-.55)/.30,0,1);carried.userData.page.rotation.y=-Math.PI*(reaction>0?THREE.MathUtils.smootherstep(age/2.8,0,1):u*u*(3-2*u));}
  if(index===12){wrists=[V(-.20,-.21,.06),V(.28,1.08,.02)];poles=[V(-1,0,.2),V(1,0,0)];headRoll=-.12;wrists[1].x+=reduced?0:Math.sin(t*3.8)*.07;}
  if(!reduced&&![4,7,8].includes(index)){roll+=Math.sin(t*.61)*.012;for(let i=0;i<2;i++)poles[i].x+=Math.sin(t*.8+i)*.018;}
  if(index===2)headPitch-=reaction*.22;
  if(index===3)headRoll-=reaction*.12;
  if(index===4)ankles[0].y+=reaction*.065;
  if(index===5)headRoll+=reaction*.12;
  if(index===8)headRoll+=reaction*.025;
  if(index===9)carried.rotation.z+=reaction*.08;
  if(index===10)carried.rotation.z+=Math.sin(t*5)*reaction*.06;
  if(index===12)wrists[1].x+=Math.sin(t*6)*reaction*.07;
  body.position.set(0,hip,0);body.rotation.set(pitch,0,roll);body.scale.y=1;torso.scale.y=.31*(1+breathe);
  // The support points stay fixed while gaze, breathing and blinks have separate rhythms.
  const glance=reduced?0:THREE.MathUtils.smootherstep((Math.sin(t*.42)+1)/2,.25,.8)-.5;
  head.rotation.set(headPitch+(reduced?0:Math.sin(t*.73)*.018),glance*.07+(index===7||index===8?0:reaction*.12),headRoll+(reduced?0:Math.sin(t*.53)*.015));
  const blinkPhase=(t+phase)%5.7,blink=reduced?0:Math.max(0,1-Math.abs(blinkPhase-4.9)/.12);
  for(const eye of eyes)eye.scale.y=1.3*(1-.92*Math.max(blink,index===8?reaction*.85:0));
  for(let i=0;i<2;i++){const side=i?1:-1;if(index===7)arms[i].setPoints(V(side*.14,.46,-.10),V(side*.18,.72,.088),wrists[i]);else arms[i].set(V(side*.14,.46,0),wrists[i],poles[i]);hands[i].position.copy(arms[i].end);hands[i].rotation.set(index===4?Math.PI/2:index===7?-pitch:0,0,index===12&&i===1?-.3+Math.sin(t*3.8)*.2:index===7?side*.12:0);
    if(index===7)legs[i].setPoints(V(side*.10,.10,0),V(side*.13,.055,-.34),ankles[i]);else if(index===11)legs[i].setPoints(V(side*.10,hip-.03,0),V(side*.35,.06,.28),ankles[i]);else legs[i].set(V(side*.10,hip-.03,0),ankles[i],legPoles[i]);feet[i].position.copy(legs[i].end).add(V(0,-.012,index===7?-.09:.09));feet[i].rotation.set(index===7?(i===0?.9:-.25):0,index===7?Math.PI:index===11?side*.6:0,0);}
}
