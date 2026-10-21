import {buildAdditionalScenes} from './scene-additions.js?v=20261020-08';
import * as THREE from './vendor/three.module.js';
import {createCharacter,animateCharacter,interactCharacter,createDoodleFlower} from './character.js?v=20261020-08';
export { THREE };
export const C={paper:'#fff8ea',cream:'#fff5e5',ink:'#344637',pink:'#e8afa9',coral:'#e87963',sage:'#a9c0b6',olive:'#91a657',blue:'#a8c5de',yellow:'#e9cf72',green:'#657e51',wood:'#c7ac7d'};
const ramp=new THREE.DataTexture(new Uint8Array([158,218,255]),3,1,THREE.RedFormat);
ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
const materials=new Map(),outline=new THREE.LineBasicMaterial({color:C.ink,transparent:true,opacity:.66});
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshToonMaterial({color,gradientMap:ramp,side:THREE.DoubleSide}));return materials.get(color);}
export function shapeMesh(parent,geometry,color,x=0,y=0,z=0,edges=true){
  const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);
  if(edges)m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry,36),outline));return m;
}
export const box=(p,w,h,d,c,x=0,y=0,z=0)=>shapeMesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);
const cylinder=(p,r,h,c,x=0,y=0,z=0,top=r)=>shapeMesh(p,new THREE.CylinderGeometry(top,r,h,24),c,x,y,z);
function line(p,points,color=C.ink){const g=new THREE.BufferGeometry().setFromPoints(points.map(v=>new THREE.Vector3(...v)));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color}));p.add(l);return l;}
function curve(p,points,color=C.ink){const c=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));return line(p,c.getPoints(48).map(v=>v.toArray()),color);}
function flat(p,s,c,depth=.09){return shapeMesh(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:20}),c);}
function root(p,x,z,name){const g=new THREE.Group();g.name=name;g.position.set(x,.025,z);g.userData.fold=true;p.add(g);return g;}
function rectangle(w,h){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();return s;}
function squareHole(s,x,y,w,h){const q=new THREE.Path();q.moveTo(x-w/2,y);q.lineTo(x-w/2,y+h);q.lineTo(x+w/2,y+h);q.lineTo(x+w/2,y);q.closePath();s.holes.push(q);}
function archHole(s,w,h,x=0,y=.005){const r=w/2,q=new THREE.Path();q.moveTo(x-r,y);q.lineTo(x-r,y+h-r);q.absarc(x,y+h-r,r,Math.PI,0,true);q.lineTo(x+r,y);q.closePath();s.holes.push(q);}
function archOutline(w,h){const s=new THREE.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.closePath();return s;}
function hingeTabs(g,w){for(const x of [-w*.3,w*.3]){box(g,.24,.025,.38,C.paper,x,.014,.13);line(g,[[x-.12,.031,0],[x+.12,.031,0]],'#afa98d');}}
function arch(p,x,z,w,h,color,opening=false){
  const g=root(p,x,z,'拱门 / 有厚度的洞口'),s=archOutline(w,h);archHole(s,w*.65,h*.84,0,.005);flat(g,s,color,.16);hingeTabs(g,w);
  if(opening){
    const pivot=new THREE.Group();g.add(pivot);pivot.name='可开启的珊瑚门扇';pivot.position.set(-w*.325,0,.075);
    const door=flat(pivot,archOutline(w*.65,h*.84),C.coral,.065);door.position.x=w*.325;
    const knob=cylinder(pivot,.045,.07,C.ink,w*.56,h*.38,.13);knob.rotation.x=Math.PI/2;
    pivot.rotation.y=-.24;pivot.userData.door={open:false,angle:-.24};g.userData.action={type:'door',node:pivot,message:'这边也想看看。'};
  }
  return g;
}
function facade(p,x,z,w=2.55,h=3.8){
  const g=root(p,x,z,'街角小屋 / 贯通门窗与侧墙'),s=rectangle(w,h);
  archHole(s,.82,1.35,-w*.19,.005);squareHole(s,.2,h*.62,w*.51,.95);
  flat(g,s,C.pink,.13);box(g,.12,h,1.5,C.paper,-w/2,h/2,-.68);
  box(g,w,.12,1.5,C.pink,0,h,-.68);box(g,w*.68,.1,1.4,C.paper,-.3,1.85,-.66);
  box(g,w*.57,.065,.28,C.paper,.2,h*.62,.15);
  line(g,[[w/2,0,.14],[w/2,h,.14]]);hingeTabs(g,w);return g;
}
function stairs(p,x,z,count=8,rot=0){
  const g=root(p,x,z,'淡蓝阶梯 / 独立踏步');g.rotation.y=rot;
  for(let i=0;i<count;i++)box(g,1.05,.18*(i+1),.26,C.blue,0,.09*(i+1),-i*.26);return g;
}
function tree(p,x,z,size=1,color=C.olive){
  const g=root(p,x,z,'纸片树 / 分枝与平涂树冠');const stem=new THREE.Shape();
  stem.moveTo(-.045,0);stem.lineTo(.045,0);stem.lineTo(.065,1.7*size);stem.lineTo(-.025,1.7*size);stem.closePath();flat(g,stem,C.wood,.08);
  const crown=new THREE.Group();g.add(crown);crown.userData.sway=.025;
  const s=new THREE.Shape();s.moveTo(-.7*size,1.3*size);s.bezierCurveTo(-1.25*size,1.55*size,-1.1*size,2.5*size,-.55*size,2.53*size);s.bezierCurveTo(-.35*size,3*size,.3*size,2.92*size,.5*size,2.55*size);s.bezierCurveTo(1.2*size,2.65*size,1.25*size,1.5*size,.65*size,1.25*size);s.bezierCurveTo(.2*size,1*size,-.4*size,1.08*size,-.7*size,1.3*size);s.closePath();flat(crown,s,color,.055);
  for(const [xx,yy] of [[0,2.35],[-.55,1.95],[.6,2.1]])line(g,[[0,.6*size,.13],[0,1.3*size,.13],[xx*size,yy*size,.13]],C.green);hingeTabs(g,1);return g;
}
function leafShape(w,h){const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-w,h*.35,-w*.55,h*.9,0,h);s.bezierCurveTo(w*.7,h*.7,w*.8,h*.15,0,0);return s;}
function plant(p,x,z,scale=.7){
  const g=root(p,x,z,'盆栽 / 纸叶与花盆');cylinder(g,.26*scale,.45*scale,C.coral,0,.225*scale,0,.34*scale);
  for(let i=0;i<5;i++){const leaf=flat(g,leafShape(.25*scale,.95*scale),i%2?C.sage:C.olive,.035);leaf.position.set(0,.35*scale,0);leaf.rotation.z=(i-2)*.33;leaf.rotation.y=i*.7;}return g;
}
function flower(p,x,z,height=1,color=C.coral){
  const g=root(p,x,z,'花 / 可以轻碰的纸花');const head=new THREE.Group();head.position.y=height;g.add(head);
  curve(g,[[0,0,0],[.12,height*.5,0],[0,height,0]],C.green);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;shapeMesh(head,new THREE.CircleGeometry(.14,16),color,Math.cos(a)*.16,Math.sin(a)*.16,.02,false);}
  shapeMesh(head,new THREE.CircleGeometry(.09,16),C.yellow,0,0,.03,false);
  const l=flat(g,leafShape(.16,.45),C.olive,.025);l.position.y=height*.35;l.rotation.z=-.9;
  g.userData.action={type:'wiggle',node:head,message:'带朵花回去。'};head.userData.wiggleAt=-10000;return g;
}
function meadowTuft(p,x,z,height=.4){
  const g=new THREE.Group();g.name='向上生长的纸草';g.position.set(x,.024,z);p.add(g);
  for(const angle of [-.48,-.16,.26,.52]){const blade=flat(g,leafShape(height*.13,height),C.olive,.018);blade.geometry.rotateZ(angle);for(const edge of blade.children)edge.geometry.rotateZ(angle);}
}
function meadowFlower(p,x,z,size=.6){const f=createDoodleFlower(p);f.name='草坪上的粉色纸花';f.scale.setScalar(size);f.position.set(x,.024+.17*size,z);return f;}
function grass(p,x,z,w,d){
  const g=root(p,x,z,'圆润草坪 / 立体花草造景'),s=new THREE.Shape(),r=.28;
  s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
  const ground=flat(g,s,'#b4c699',.035);ground.rotation.x=-Math.PI/2;ground.position.y=-.0125;
  return g;
}
function path(p,points){const g=root(p,0,0,'没有目的地的路');curve(g,points.map(([x,z])=>[x,.015,z]),C.olive);return g;}
function bench(p,x,z){
  const g=root(p,x,z,'长椅 / 椅面与支架');for(let i=0;i<3;i++)box(g,1.6,.06,.13,C.wood,0,.52,i*.15);
  for(let i=0;i<2;i++)box(g,1.6,.14,.055,C.sage,0,.85+i*.2,-.12);
  for(const xx of [-.64,.64]){box(g,.055,1.12,.06,C.ink,xx,.56,-.16);box(g,.055,.52,.06,C.ink,xx,.26,.34);}return g;
}
function cafeHouse(p,x,z){
  const g=root(p,x,z,'发呆小屋 / 拱窗与蓝白遮阳篷'),s=rectangle(3.0,3.05);
  archHole(s,1.1,2.35,.55,.005);squareHole(s,-.8,.95,.8,1.05);flat(g,s,C.pink,.13);
  box(g,.13,3.05,1.4,C.paper,-1.5,1.525,-.65);box(g,3,.12,1.4,C.pink,0,3.05,-.65);
  box(g,1.25,.075,.45,C.wood,-.8,.92,.2);
  const awning=new THREE.Group();g.add(awning);awning.position.set(-.6,2.25,.05);awning.rotation.x=.16;
  for(let i=0;i<7;i++){box(awning,.23,.04,.85,i%2?C.paper:C.blue,(i-3)*.23,0,.38);box(awning,.23,.16,.04,i%2?C.paper:C.blue,(i-3)*.23,-.07,.82);}
  hingeTabs(g,3);return g;
}
function coffee(p,x,z,large=true){
  const g=root(p,x,z,large?'大咖啡杯 / 空心杯壁与杯柄':'咖啡圆桌 / 杯碟');if(large)g.position.y+=.025;const scale=large?1:.35;
  if(!large){cylinder(g,.75,.065,C.wood,0,.78,0);cylinder(g,.04,.78,C.ink,0,.39,0);cylinder(g,.3,.035,C.ink,0,.0175,0);}
  const cup=new THREE.Group();g.add(cup);cup.position.y=large?.01:.82;
  cylinder(cup,.95*scale,.06,C.paper,0,.02,0);
  const profile=[new THREE.Vector2(.52*scale,.06*scale),new THREE.Vector2(.7*scale,.15*scale),new THREE.Vector2(.82*scale,.75*scale),new THREE.Vector2(.84*scale,1.13*scale),new THREE.Vector2(.77*scale,1.13*scale),new THREE.Vector2(.72*scale,.38*scale),new THREE.Vector2(.5*scale,.14*scale)];
  shapeMesh(cup,new THREE.LatheGeometry(profile,40),C.paper,0,0,0,false);
  cylinder(cup,.76*scale,.018,'#806145',0,.99*scale,0);
  const rim=shapeMesh(cup,new THREE.TorusGeometry(.805*scale,.022*scale,6,40),C.ink,0,1.13*scale,0,false);rim.rotation.x=Math.PI/2;
  shapeMesh(cup,new THREE.TorusGeometry(.34*scale,.065*scale,8,24),C.paper,.86*scale,.65*scale,0);
  const steam=new THREE.Group();cup.add(steam);steam.position.y=1.3*scale;steam.userData.steam={base:1.3*scale,scale,burstAt:-10000};
  for(let i=0;i<2;i++)curve(steam,[[i*.17,0,0],[.17+i*.1,.25,0],[-.08+i*.1,.55,0],[.12+i*.1,.85,0]],C.ink);
  cup.traverse(n=>{if(n.isMesh)n.receiveShadow=false;});g.userData.action={type:'steam',node:steam,message:'喝一口，再慢慢出发。'};return g;
}
function paper(p,texture,w,h,x,y,z,name){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,toneMapped:false}));m.name=name;m.position.set(x,y,z);m.castShadow=true;
  m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:texture,alphaTest:.12});p.add(m);return m;
}
function character(p,assets,index,x,z,height=1.8,y=0,angle=.35){
  const g=root(p,x,z,'角色折页 / '+index);g.position.y+=y;g.rotation.y=angle;
  const model=createCharacter(index,{seatEdge:false});model.userData.action={type:'character',node:model};model.scale.setScalar(height/1.8);g.add(model);return g;
}
function prop(p,assets,index,x,z,height=1.1,y=0,angle=.3){
  const g=root(p,x,z,'城市小物 / '+index);g.position.y+=y;g.rotation.y=angle;paper(g,assets.props[index-1],height,height,0,height*.45,0,'纸片小物');return g;
}
function panel(p,x,z,w,h,color,kind){
  const g=root(p,x,z,'小确幸展板 / '+kind),s=new THREE.Shape();
  s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h*.7);s.bezierCurveTo(w*.12,h*.7,w*.12,h,-w/2,h);s.closePath();
  if(kind==='窗')squareHole(s,0,h*.36,w*.52,h*.27);flat(g,s,color,.12);hingeTabs(g,w);return g;
}
function ribbon(p){
  const g=root(p,0,0,'弯曲的收藏丝带'),points=[[-4.6,0,-.9],[-3,.25,.3],[-1.4,0,.6],[-.5,.05,1.9],[1.5,.15,2.1],[2.2,.2,.9],[3.4,0,.7]];
  const c=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),pos=[],indices=[],up=new THREE.Vector3(0,1,0);
  for(let i=0;i<=64;i++){const t=i/64,v=c.getPoint(t),side=c.getTangent(t).cross(up).normalize().multiplyScalar(.18);pos.push(v.x+side.x,v.y+.001,v.z+side.z,v.x-side.x,v.y+.001,v.z-side.z);if(i<64){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();shapeMesh(g,geo,C.olive,0,0,0,false);return g;
}
function photoFrame(p,id,x,z,angle=0,width=1.55,height=1.22){
  const g=root(p,x,z,'照片画框 / '+id);g.rotation.y=angle;
  const center=.24+height/2;box(g,width,height,.075,'#fffdf5',0,center,0);
  const image=new THREE.Mesh(new THREE.PlaneGeometry(width-.21,height-.21),new THREE.MeshBasicMaterial({color:'#f1f0e9',side:THREE.FrontSide}));image.position.set(0,center,.043);g.add(image);
  const placeholder=new THREE.Group();g.add(placeholder);box(placeholder,.22,.018,.008,'#9eaa99',0,center,.05);box(placeholder,.018,.22,.008,'#9eaa99',0,center,.05);
  for(const x of [-width*.355,width*.355])box(g,.055,.24,.18,C.paper,x,.12,-.025);
  g.userData.photo={id,image,placeholder,width,height,aspect:(width-.21)/(height-.21)};g.userData.action={type:'photo',node:g,message:'放一张今天的玩耍照片。'};
  return g;
}
export function buildScenes(book,assets){
  const all=['街头晃悠所','发呆补给站','我的小确幸'].map(name=>{const s=new THREE.Group();s.name=name;book.add(s);return s;});
  let s=all[0];
  const house=facade(s,-1.9,-1.25);house.rotation.y=-.08;
  arch(s,-4.4,.35,1.3,2.2,C.coral,true);stairs(s,-2.8,1.1,8);
  arch(s,3,-1.35,1.9,3.05,C.blue);tree(s,.5,-.5,.85);
  const wall=root(s,1.05,-2,'侧向纸墙');const ws=rectangle(1.25,2.75);squareHole(ws,0,1.2,.6,.8);flat(wall,ws,C.paper,.1);wall.rotation.y=-.35;
  plant(s,2.6,1.55,.8);flower(s,2.5,.8,.9,C.yellow);const seat=bench(s,-4,1.9);
  path(s,[[-4.5,1.1],[-3.5,1.7],[-1.2,1.5],[.4,2.3],[2.8,2.35],[4.6,1.55]]);
  const streetGarden=grass(s,-.7,1.6,2.3,2.1),cornerGarden=grass(s,3.8,2.1,1.8,1.5);
  const walker=character(s,assets,1,-.7,1.6,1.9,.025),looker=character(s,assets,2,3.8,2.15,1.55,.025);streetGarden.attach(walker);cornerGarden.attach(looker);
  meadowFlower(streetGarden,.64,-.62,.65);meadowTuft(streetGarden,-.82,-.55,.62);meadowTuft(streetGarden,.78,.55,.30);meadowTuft(streetGarden,-.82,.72,.36);
  meadowFlower(cornerGarden,-.62,.30,.52);meadowTuft(cornerGarden,.60,-.45,.55);meadowTuft(cornerGarden,-.60,-.40,.32);
  const peeker=character(s,assets,3,-1.7,-1.46,1.35,1.9,0),sitter=character(s,assets,4,-4,2.30,1.8,0,0);house.attach(peeker);seat.attach(sitter);
  prop(s,assets,7,.3,2.5,.65);prop(s,assets,8,-3.55,-1,1,.08);prop(s,assets,13,4.3,-1.4,.95,1.8);
  s=all[1];
  const lawn=grass(s,1,.15,8.7,4.8);meadowTuft(lawn,.1,-2.05,.85);meadowTuft(lawn,3.8,.65,.7);meadowTuft(lawn,-3,1.95,.55);meadowFlower(lawn,1.0,-1.85,.72);cafeHouse(s,-2.8,-1.7);tree(s,2.5,-1.6,.85);
  coffee(s,3.3,.7,true);coffee(s,-4.1,.6,false);plant(s,-4.7,-.6,.75);
  flower(s,.2,2,.65);flower(s,4.5,-.4,.75);character(s,assets,5,.35,-.45,1.95,.025,-.3);
  character(s,assets,6,-4,1.45,1.6);character(s,assets,7,1.8,1.35,1.65,.025);
  character(s,assets,8,-2.75,1.45,1.7,.025);
  const cloud=prop(s,assets,5,1.6,-1.7,1.25,3.25);cloud.userData.float={base:3.37,phase:.7};
  prop(s,assets,7,-3.1,-1.5,.55,3.05);prop(s,assets,8,-.85,2.15,.75);
  // Furniture and its occupants share the support hinge throughout the page turn.
  for(const n of [...s.children])if(n!==lawn&&n.position.x>=-3.35&&n.position.x<=5.35&&n.position.z>=-2.25&&n.position.z<=2.55)lawn.attach(n);
  s=all[2];
  const leafPanel=panel(s,-3.4,-1.65,2.25,3.3,C.yellow,'叶子');paper(leafPanel,assets.props[3],1.3,1.8,0,2.24,.16,'收藏的一片叶');
  const sky=panel(s,-.2,-1.9,2.45,4.1,C.blue,'天空');paper(sky,assets.props[5],1.6,1.6,0,2.9,.17,'收藏的一点阳光');
  const window=panel(s,3,-1.4,2.2,3.3,C.pink,'窗');flower(window,0,.1,1.8);
  arch(s,4.7,.3,1.25,2.05,C.coral,true);ribbon(s);stairs(s,-3.8,.8,4);
  flower(s,1.25,.6,.85);plant(s,-4.25,-.9,.75);plant(s,4,-1.8,.65);
  character(s,assets,9,-2.5,.1,2);character(s,assets,10,.05,2.4,1.9);const readingGarden=grass(s,2.4,2.3,2.7,2.2),reader=character(s,assets,11,2.4,2.5,1.7,.025);readingGarden.attach(reader);meadowTuft(readingGarden,-1,-.73,.65);meadowTuft(readingGarden,1,-.72,.42);meadowFlower(readingGarden,.74,-.75,.65);character(s,assets,12,4.1,1.85,1.6);
  const card=root(s,-3.9,2.2,'纸片收藏 / 书与涂鸦');const cardBody=box(card,1.2,.035,.85,C.paper);const bookIcon=paper(card,assets.props[8],1,.65,0,.03,0,'小书');bookIcon.rotation.x=-Math.PI/2;
  const card2=root(s,-1.9,2.35,'纸片收藏 / 星星');box(card2,1.1,.035,.8,C.paper);const star=paper(card2,assets.props[15],.7,.7,0,.03,0,'星星');star.rotation.x=-Math.PI/2;
  photoFrame(all[0],'street-1',-5.05,-1.45,.08);photoFrame(all[0],'street-2',4.7,-1.8,-.18);
  photoFrame(all[1],'pause-1',-4.95,-1.7,.08);const lawnFrame=photoFrame(all[1],'pause-2',4.7,-1.55,-.18);lawnFrame.position.y+=.025;lawn.attach(lawnFrame);
  photoFrame(all[2],'keepsake-1',-5,1.25,.12);photoFrame(all[2],'keepsake-2',1.65,-.2,-.12);
  photoFrame(all[0],'street-3',4.8,.45,-.15,1.15,1.85);photoFrame(all[0],'street-4',-1.9,2.75,.10,1.08,.80);
  for(const frame of [photoFrame(all[1],'pause-3',-1.05,-1.25,.08,1.15,1.85),photoFrame(all[1],'pause-4',-1,1.55,-.12,1.08,.80)]){frame.position.y+=.025;lawn.attach(frame);}
  photoFrame(all[2],'keepsake-3',-5.35,-1.65,.10,1.15,1.85);photoFrame(all[2],'keepsake-4',0,-.35,-.10,1.08,.80);
  all.push(...buildAdditionalScenes(book,assets,{C,box,root,flat,rectangle,squareHole,archHole,archOutline,line,curve,cylinder,stairs,plant,flower,grass,meadowTuft,meadowFlower,character,photoFrame,coffee,bench,paper,leafShape,hingeTabs}));
  for(const group of all){const counts={meshes:0,characters:0,interactive:0};group.traverse(n=>{if(n.isMesh)counts.meshes++;if(n.userData.character)counts.characters++;if(n.userData.action)counts.interactive++;});group.userData.inventory=counts;}
  return all;
}
export function makeCover(book,assets){
  const g=new THREE.Group();g.name='手写城市书封';g.position.y=.19;book.add(g);
  box(g,6,.09,7,C.sage,3,0,0);box(g,5.7,.025,6.7,C.paper,3,.058,0);
  const lining=box(g,5.98,.025,6.98,C.paper,3,-.058,0);lining.name='白色内封面';
  const heading=paper(g,assets.titles[0],5.15,.8,3,.09,-1.85,'项目手写标题');heading.rotation.x=-Math.PI/2;
  const first=paper(g,assets.titles[4],3.6,.55,3,.095,-.6,'纯玩一座城');first.rotation.x=-Math.PI/2;
  const second=paper(g,assets.titles[5],3.6,.55,3,.095,.04,'打开小确幸');second.rotation.x=-Math.PI/2;
  const garden=new THREE.Group();garden.name='封面 / 趴着看花的草坪造景';g.add(garden);
  const lawnShape=new THREE.Shape();lawnShape.moveTo(-1.35,-.45);
  lawnShape.bezierCurveTo(-1.55,.1,-1.22,.78,-.45,.84);lawnShape.bezierCurveTo(.1,1.02,1.35,.8,1.42,.25);
  lawnShape.bezierCurveTo(1.6,-.35,1.1,-.82,.5,-.82);lawnShape.bezierCurveTo(-.15,-1.02,-1.1,-.9,-1.35,-.45);
  const lawn=flat(garden,lawnShape,'#b4c699',.02);lawn.name='封面草坪 / 圆润草地';lawn.rotation.x=-Math.PI/2;lawn.position.set(3,.076,2);
  const person=createCharacter(7);person.name='闲闲 / 封面趴着看花';person.scale.setScalar(.85);garden.add(person);person.position.set(3,.096,1.95);person.rotation.y=-.4;
  for(const [x,z,size,angle] of [[2.02,1.18,.36,-.25],[3.93,2.43,.42,.18],[3.7,1.16,.32,-.12]]){
    const bud=createDoodleFlower(garden);bud.name='封面粉色小花 / 与看花角色同款';bud.scale.setScalar(size);bud.position.set(x,.096+.17*size,z);bud.rotation.y=angle;
  }
  for(const [x,z] of [[2.05,2.55],[4.06,1.85],[3.2,2.75],[2.68,1.3]]){
    const tuft=new THREE.Group();tuft.name='封面小草';tuft.position.set(x,.096,z);garden.add(tuft);
    for(const angle of [-.5,0,.48]){const blade=flat(tuft,leafShape(.045,.19),C.olive,.012);blade.geometry.rotateZ(angle);for(const edge of blade.children)edge.geometry.rotateZ(angle);}
  }
  g.userData.decoration=garden;
  return g;
}
export {makeShelf,makeShelfPlant,shelfBookPlacement,SHELF} from './shelf.js?v=20261020-08';
export async function loadAssets(){
  const loader=new THREE.TextureLoader(),load=async(name,i)=>{const t=await loader.loadAsync('assets/content-1.0/'+name+'-'+String(i).padStart(2,'0')+'.png');t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
  const [props,titles]=await Promise.all([Promise.all(Array.from({length:16},(_,i)=>load('prop',i+1))),Promise.all(Array.from({length:8},(_,i)=>load('title',i+1)))]);
  return {props,titles};
}
export function activateHit(scene,ray,now=performance.now()){
  for(const hit of ray.intersectObject(scene,true)){let n=hit.object;while(n&&n!==scene){const a=n.userData.action;if(a){if(a.type==='photo')scene.dispatchEvent({type:'photo-select',frame:a.node});if(a.type==='character')return interactCharacter(a.node,now);if(a.type==='door')a.node.userData.door.open=!a.node.userData.door.open;if(a.type==='steam')a.node.userData.steam.burstAt=now;if(a.type==='wiggle')a.node.userData.wiggleAt=now;return a.message;}n=n.parent;}break;}return null;
}
export function updateScene(scene,now,dt,reduced=false){
  scene.traverse(n=>{
    const d=n.userData;
    if(d.rig)animateCharacter(n,now,reduced);
    if(d.door){const target=d.door.open?-1.3:-.24;d.door.angle=THREE.MathUtils.damp(d.door.angle,target,6,dt);n.rotation.y=d.door.angle;}
    if(d.sway)n.rotation.z=reduced?0:Math.sin(now*.0007+n.id)*d.sway;
    if(d.float)n.position.y=d.float.base+(reduced?0:Math.sin(now*.0006+d.float.phase)*.08);
    if(d.wiggleAt!==undefined){const age=(now-d.wiggleAt)/1000;n.rotation.z=reduced?0:Math.sin(age*12)*Math.exp(-age*2)*.3;}
    if(d.steam){const age=(now-d.steam.burstAt)/1000,burst=Math.max(0,1-age/2);n.position.y=d.steam.base+(reduced?0:Math.sin(now*.0012)*.035);n.scale.setScalar(1+burst*.35);n.scale.y*=reduced?1:1+Math.sin(now*.0012)*.08;}
  });
}
export function foldScene(scene,t){
  const items=scene.children.filter(n=>n.userData.fold);
  items.forEach((g,i)=>{
    const delay=.22*i/Math.max(1,items.length-1),v=THREE.MathUtils.clamp((t-delay)/(1-delay),0,1);
    const eased=1+2.1*Math.pow(v-1,3)+1.1*Math.pow(v-1,2);
    g.rotation.x=-(1-eased)*Math.PI/2;g.scale.z=.08+.92*v;
  });
}
