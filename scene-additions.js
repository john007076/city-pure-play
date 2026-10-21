import * as THREE from './vendor/three.module.js';

export function buildAdditionalScenes(book,assets,k){
 const {C,box,root,flat,rectangle,squareHole,archHole,archOutline,line,curve,cylinder,stairs,plant,flower,grass,meadowTuft,meadowFlower,character,photoFrame,coffee,bench,paper,leafShape,hingeTabs}=k;
 const make=name=>{const g=new THREE.Group();g.name=name;book.add(g);return g;};
 function wall(p,x,z,w,h,color,holes=[]){const g=root(p,x,z,'纸艺建筑 / '+color),s=rectangle(w,h);for(const q of holes){if(q.arch)archHole(s,q.w,q.h,q.x||0,q.y||.005);else squareHole(s,q.x||0,q.y||0,q.w,q.h);}flat(g,s,color,.11);hingeTabs(g,w);return g;}
 function ledge(p,w,d,y,color=C.paper,x=0,z=0){return box(p,w,.075,d,color,x,y-.0375,z);}
 function seated(p,x,z,seatY,height=1.35,angle=0){const g=character(p,assets,4,x,z,height,seatY-.55*height/1.8,angle);g.userData.support={kind:'seat',surfaceY:seatY};return g;}
 function ivy(p,x,y,z,length=1.2){const g=new THREE.Group();g.name='垂落藤蔓 / 叶脉细节';p.add(g);g.position.set(x,y,z);curve(g,[[0,0,0],[.05,-length*.35,.02],[-.02,-length*.7,.04],[.08,-length,.05]],C.green);for(let i=0;i<8;i++){const leaf=flat(g,leafShape(.09,.2),i%2?C.olive:C.green,.018);leaf.position.set(i%2?.03:-.03,-i*length/8,.04);leaf.rotation.z=i%2?-.9:1.1;}return g;}
 function flowerBed(p,x,z,w,d,count=7){const g=grass(p,x,z,w,d);for(let i=0;i<count;i++){const xx=(i%4-1.5)*w*.21,zz=(Math.floor(i/4)-(Math.ceil(count/4)-1)/2)*d*.32;meadowFlower(g,xx,zz,.42+(i%3)*.10);meadowTuft(g,xx+.12,zz+.14,.25+(i%2)*.18);}return g;}
 function planter(p,x,z,w=1.2,d=.55,h=.45){const g=root(p,x,z,'花池 / 边框与种植层');box(g,w,h,d,C.paper,0,h/2,0);box(g,w-.12,.025,d-.12,C.green,0,h+.005,0);for(let i=0;i<5;i++){const f=meadowFlower(g,(i-2)*w*.16,0,.48);f.position.y+=h;meadowTuft(g,(i-2)*w*.16,.10,.3);const tuft=g.children.at(-1);tuft.position.y+=h;}return g;}
 function detailedTree(p,x,z,size=1){const g=root(p,x,z,'大树 / 分枝、层叠树冠与树影');
  const branch=(a,b,r)=>{const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),m=cylinder(g,r,d.length(),C.wood,...new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5).toArray(),r*.7);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());};
  branch([0,0,0],[.05,1.9*size,0],.09*size);for(const [xx,yy,zz] of [[-.65,2.25,.05],[.68,2.35,0],[-.35,2.8,-.12],[.38,2.9,.06]])branch([0,1.1*size,0],[xx*size,yy*size,zz*size],.044*size);
  for(const [i,v] of [[-.72,2.30,.05,.78],[.65,2.40,.02,.82],[-.28,2.90,-.04,.85],[.48,2.94,-.07,.65],[0,2.38,.16,.87]].entries()){
   const s=new THREE.Shape(),r=v[3]*size;for(let j=0;j<=48;j++){const a=j/48*Math.PI*2,rr=r*(1+.08*Math.sin(a*9+i));const xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.74;j?s.lineTo(xx,yy):s.moveTo(xx,yy);}s.closePath();const c=flat(g,s,i%2?C.olive:'#a6b56b',.055);c.position.set(v[0]*size,v[1]*size,v[2]*size);c.rotation.y=(i-2)*.18;c.userData.sway=.012;
  }return g;
 }
 function frames(p,key,layout){layout.forEach(([x,z,angle,w,h],i)=>photoFrame(p,key+'-'+(i+1),x,z,angle,w,h));}
 function canopy(p,x,y,z,width=2.25,depth=.95){const g=new THREE.Group();g.name='蓝白条纹遮阳篷 / 折边与支架';p.add(g);g.position.set(x,y,z);g.rotation.x=.18;for(let i=0;i<9;i++){const xx=(i-4)*width/9,color=i%2?C.paper:C.blue;box(g,width/9,.045,depth,color,xx,0,depth/2);box(g,width/9,.16,.04,color,xx,-.07,depth);}for(const xx of [-width*.45,width*.45])line(g,[[xx,0,.02],[xx,-.4,depth*.9]]);return g;}
 function roundTable(p,x,z,y=.76){const g=root(p,x,z,'露天咖啡桌 / 杯碟与三脚');cylinder(g,.46,.055,C.paper,0,y-.0275,0);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;box(g,.035,y,.035,C.pink,Math.cos(a)*.28,y/2,Math.sin(a)*.28);}const mug=coffee(g,0,0,true);mug.scale.setScalar(.19);mug.position.y=y;return g;}
 // KV: same left stair tower, central coral arch, striped café and right lawn as the approved artwork.
 const kv=make('把城市翻开');
 const tower=wall(kv,-2.45,-1.5,1.7,4.15,'#e8c0b0',[{x:.05,y:2.67,w:.95,h:.95},{x:.05,y:.1,w:.8,h:1.65}]);
 const creamWing=wall(kv,-4.05,-2,1.55,3.8,C.paper,[{x:0,y:2.15,w:.4,h:1.1},{x:.2,y:.1,w:.7,h:1.5}]);box(creamWing,1.6,.22,.12,'#e8c0b0',0,3.7,.02);box(creamWing,.12,3.8,1.45,'#e8c0b0',-.77,1.9,-.65);
 ledge(tower,1.7,1.4,4.15,'#e8c0b0',0,-.65);box(tower,1.7,.3,.10,'#e8c0b0',0,4.28,-1.35);box(tower,.12,.3,1.4,'#e8c0b0',-.80,4.28,-.65);
 box(tower,1.08,.07,.32,C.paper,.15,2.67,.12);for(const x of [-.27,.55]){const curtain=box(tower,.12,.9,.035,C.yellow,x,3.15,.045);curtain.rotation.z=x<0?-.1:.1;}
 for(const x of [.48,.73])ivy(tower,x,4.25,.10,1.0+(x-.48));
 const towerPerson=character(tower,assets,3,.05,-.18,1.05,2.30,-.1);towerPerson.name='KV / 探窗的闲闲';
 const flight=stairs(kv,-3.38,1.26,10,0);flight.name='KV / 左侧蓝色主楼梯';ledge(flight,1.12,.58,1.8,C.blue,0,-2.6);
 const lower=wall(kv,-4.25,.15,1.6,1.82,C.pink,[{x:0,w:.67,h:1.35,arch:true}]);lower.rotation.y=.06;
 const stairSeat=root(kv,-2.74,-.56,'KV / 楼梯侧边坐台');ledge(stairSeat,.46,.65,1.44,C.blue);box(stairSeat,.06,1.44,.62,C.paper,-.20,.72,0);const stairSitter=seated(kv,-2.73,-.56,1.44,1.25,Math.PI/2);stairSitter.name='KV / 楼梯边的闲闲';stairSeat.attach(stairSitter);
 const arch=wall(kv,-.05,-.42,2.22,3.12,'#e8a083',[{x:0,w:1.23,h:2.7,arch:true}]);
 const slantedTop=box(arch,2.25,.1,1.32,'#e8a083',0,3.12,-.57);slantedTop.rotation.z=.08;
 const connector=wall(kv,1.18,-1.35,2.15,2.8,C.yellow);connector.rotation.y=Math.PI/2;
 const flight2=stairs(kv,.15,2.15,6,0);flight2.name='KV / 中央蓝色楼梯';ledge(flight2,1.05,.6,1.08,C.blue,0,-1.7);
 const gateWalker=character(kv,assets,1,.15,.43,1.18,1.08,-.12);flight2.attach(gateWalker);
 const cafe=wall(kv,2.15,-.15,2.15,2.33,'#eddda5',[{x:0,y:.78,w:1.62,h:1.24}]);
 wall(cafe,-1.03,-.7,1.4,2.33,C.paper).rotation.y=Math.PI/2;ledge(cafe,2.15,1.4,2.33,C.paper,0,-.65);box(cafe,1.8,.075,.38,C.wood,0,.78,.14);canopy(cafe,0,2.13,.12,2.30,1.02);
 const cupPerson=character(cafe,assets,6,.32,-.18,.94,.28,0);cupPerson.name='KV / 咖啡窗里的闲闲';
 const lamp=root(cafe,-.7,.2,'咖啡窗口 / 小吊灯');line(lamp,[[0,1.0,0],[0,1.7,0]]);cylinder(lamp,.09,.12,C.yellow,0,1,0,.035);
 const rear=wall(kv,3.18,-2.05,1.55,3.2,C.sage,[{x:0,y:1.6,w:.42,h:.75}]);rear.rotation.y=-.1;
 const garden=flowerBed(kv,3.18,1.70,4.05,2.25,9),oak=detailedTree(kv,4.25,.6,.92);garden.attach(oak);
 const nap=character(kv,assets,7,4.0,1.7,1.45,.025,-.45);garden.attach(nap);
 const lowSeat=root(kv,2.4,2.35,'KV / 前景矮花池坐台');ledge(lowSeat,1.45,.42,.5);box(lowSeat,1.45,.5,.08,C.paper,0,.25,0);seated(lowSeat,.08,.23,.5,1.15,.2);
 planter(kv,-1.55,1.36,2.0,.6,.48);plant(kv,1.30,.72,.67);plant(kv,-2.56,-.2,.55);roundTable(kv,2.65,.65,.68);
 const chair=root(kv,3.35,.65,'咖啡小椅');ledge(chair,.38,.4,.39,C.yellow);box(chair,.4,.48,.045,C.yellow,0,.67,-.17);for(const xx of [-.14,.14])for(const zz of [-.14,.14])box(chair,.03,.38,.03,C.wood,xx,.19,zz);
 character(kv,assets,10,-1.42,2.4,1.28,0,.20);curve(root(kv,0,0,'KV / 贯穿前景的弯曲小路'),[[-4.8,.018,2.8],[-2.8,.018,2.65],[-.8,.018,3],[.55,.018,2.4],[1.5,.018,1.85]],'#c4b99a');
 frames(kv,'kv',[[-5.25,-2.1,.1,.92,1.30],[5.15,-1.7,-.2,.92,1.30],[-4.55,2.8,.08,.94,.72],[.6,2.85,-.16,.94,.72]]);
 for(const f of kv.children.filter(n=>n.userData.photo&&n.userData.photo.height<1)){const hinge=root(kv,f.position.x,f.position.z,'KV / 平放的照片卡片');hinge.position.y=.05;hinge.add(f);f.position.set(0,0,0);f.userData.fold=false;f.rotation.x=-Math.PI/2;}
 // Riverside: a proper riverbed and a small bridge, with a folded boat and a willow canopy.
 const river=make('河边放空');
 const water=root(river,.6,.6,'河湾 / 曲线水面与纸岸'),ws=new THREE.Shape();ws.moveTo(-5.5,-.65);ws.bezierCurveTo(-2.1,-1.3,-1.7,.5,.2,.05);ws.bezierCurveTo(2.4,-.4,3,-1.7,5.4,-1);ws.lineTo(5.4,.45);ws.bezierCurveTo(3.1,-.15,2.4,.8,.2,1.25);ws.bezierCurveTo(-1.8,1.7,-2.8,.2,-5.5,.8);ws.closePath();const wm=flat(water,ws,C.blue,.035);wm.rotation.x=-Math.PI/2;
 for(let i=0;i<6;i++)curve(water,[[-4.8+i*1.7,.045,.06],[-4.5+i*1.7,.045,.13],[-4.2+i*1.7,.045,.08]],'#d4e4e4');
 const bridge=root(river,-.8,.62,'小桥 / 弯拱、踏板与扶手');for(let i=0;i<11;i++){const z=(i-5)*.25,y=.09+.30*Math.sin(i/10*Math.PI);box(bridge,1.28,.08,.24,C.wood,0,y,z);for(const xx of [-.62,.62]){box(bridge,.035,.55,.035,C.sage,xx,y+.26,z);if(i<10)line(bridge,[[xx,y+.53,z],[xx,.62+.30*Math.sin((i+1)/10*Math.PI),z+.25]],C.green);}}
 const back=flowerBed(river,-2.3,-1.7,5,2.2,8),willow=detailedTree(river,-3.5,-1.6,.95);back.attach(willow);for(const x of [-.7,-.2,.4,.8])ivy(willow,x,2.5,.16,1.1+Math.abs(x)*.6);
 const riversideSeat=bench(river,2.55,-1.25),rs=seated(river,2.55,-.94,.58,1.45,.05);riversideSeat.attach(rs);plant(river,3.65,-1.4,.8);coffee(river,4.25,-.83,false);
 const readLawn=flowerBed(river,2.8,2.2,3.7,1.6,6),read=character(river,assets,11,2.7,2.25,1.6,.025,.15);readLawn.attach(read);character(river,assets,1,-3.7,2.0,1.55,0,-.4);
 const kiosk=wall(river,1.25,-2,1.65,2.25,C.pink,[{x:0,y:.7,w:1.2,h:1.05}]);canopy(kiosk,0,2,.12,1.8,.65);box(kiosk,1.35,.08,.32,C.wood,0,.7,.1);character(kiosk,assets,6,0,-.08,1.1,-.02,0);
 const boat=root(river,3.7,.48,'纸船 / 折叠船舷');const boatShape=new THREE.Shape();boatShape.moveTo(-.62,0);boatShape.lineTo(.62,0);boatShape.lineTo(.38,-.25);boatShape.lineTo(-.38,-.25);boatShape.closePath();const boatMesh=flat(boat,boatShape,C.paper,.38);boatMesh.position.y=.3;line(boat,[[-.5,.3,0],[0,.42,.2],[.5,.3,.38]]);boat.userData.float={base:.045,phase:1.2};
 frames(river,'riverside',[[-5,-2.1,.1,1.2,1.65],[4.9,-1.95,-.15,1.5,1.1],[-4.9,1.6,.12,1.3,1.0],[.55,2.55,.04,1.05,.8]]);
 // Pocket garden: curved greenhouse, potting table, raised beds and varied foliage.
 const gardenScene=make('口袋花园'),gardenGround=flowerBed(gardenScene,0,.1,9.8,5.7,12);
 const greenhouse=root(gardenScene,-2.25,-1.5,'温室 / 拱顶门窗与透光侧墙'),front=archOutline(3,3.4);archHole(front,1.2,2.6,0,.005);squareHole(front,-1,1,.55,.9);squareHole(front,1,1,.55,.9);flat(greenhouse,front,C.sage,.1);
 for(const z of [-1.25,-.65,0]){const points=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;points.push([Math.cos(a)*1.5,1.9+Math.sin(a)*1.5,z]);}line(greenhouse,points,C.green);}for(const xx of [-1.5,1.5])box(greenhouse,.055,1.95,1.3,C.sage,xx,.975,-.6);
 for(const x of [-.9,.9]){plant(greenhouse,x,-.65,.8);ivy(greenhouse,x,2.95,-.18,.7);}
 const potting=root(gardenScene,1.4,-1.7,'园艺工作台 / 陶盆、书和小铲');ledge(potting,2.3,.8,.85,C.wood);for(const xx of [-.95,.95])box(potting,.06,.85,.65,C.sage,xx,.425,0);for(const x of [-.65,.15,.7]){const pot=plant(potting,x,0,.40);pot.position.y+=.85;}
 const bookCard=paper(potting,assets.props[8],.6,.4,-.3,.87,.12,'园艺手册');bookCard.rotation.x=-Math.PI/2;
 planter(gardenScene,2.8,.28,2.5,1,.38);planter(gardenScene,-2.55,1.25,2.1,.75,.38);planter(gardenScene,1.85,2.3,2.2,.65,.32);
 const leafPerson=character(gardenScene,assets,9,.25,.5,1.7,.025,-.15),flowerPerson=character(gardenScene,assets,10,-2.4,2.15,1.6,.025,.3);gardenGround.attach(leafPerson);gardenGround.attach(flowerPerson);const lawnNap=character(gardenScene,assets,7,3.6,1.55,1.55,.025,-.3);gardenGround.attach(lawnNap);
 const hoop=root(gardenScene,3.65,-1.5,'攀援花架 / 藤蔓与拱线');const hs=archOutline(1.8,2.6);archHole(hs,1.62,2.45,0,.005);flat(hoop,hs,C.wood,.08);for(const x of [-.75,.75])ivy(hoop,x,2.3,.1,1.4);
 for(let i=0;i<5;i++)box(gardenGround,.55,.025,.38,C.paper,-.75+i*.36,.025,1.4-i*.48);
 frames(gardenScene,'garden',[[-5.05,-1.75,.16,1.1,1.65],[5,-1.8,-.14,1.4,1.05],[-4.9,2.1,.12,1.1,.85],[.3,2.65,-.1,1.05,.8]]);
 // Rooftop: a raised terrace, stairs and railings, reading lights, a roof garden and open sky.
 const roof=make('屋顶晚风');const terrace=root(roof,1,-.55,'屋顶露台 / 立面与双层平台');
 const face=rectangle(6.1,1.2);archHole(face,.9,1.1,-1.85,.005);squareHole(face,1.5,.25,1.05,.62);flat(terrace,face,C.pink,.13);ledge(terrace,6.1,3,1.26,C.paper,0,-1.4);box(terrace,.12,1.2,3,C.paper,3, .6,-1.4);box(terrace,6.1,.4,.10,C.sage,0,1.46,-2.85);
 for(const x of [-2.95,2.95]){box(terrace,.055,.48,3,C.sage,x,1.50,-1.4);for(let j=0;j<7;j++)box(terrace,.04,.5,.04,C.ink,x,1.5,-j*.43);}
 const roofSteps=stairs(roof,-3.65,1.5,7);roofSteps.name='屋顶楼梯 / 连到上层露台';const landing=root(roof,-2.8,-.42,'屋顶楼梯 / 连续转角平台');ledge(landing,2.1,.7,1.26,C.blue);box(landing,.10,1.26,.65,C.paper,.85,.63,0);
 const lounge=character(terrace,assets,5,1.2,-1.5,1.65,1.235,-.2),roofReader=character(terrace,assets,11,-1.3,-1.4,1.6,1.235,.05);lounge.name='屋顶 / 躺椅上的闲闲';roofReader.name='屋顶 / 读书的闲闲';
 // Match the full chair/figure silhouette to the terrace, rather than assuming all poses share a sole height.
 roof.updateMatrixWorld(true);for(const model of [lounge,roofReader]){const bounds=new THREE.Box3().setFromObject(model);model.position.y+=1.285-bounds.min.y;}

 const roofTable=roundTable(terrace,.0,-1.2,.62);roofTable.position.y+=1.26;const pots=planter(terrace,1.7,-2.45,1.8,.5,.38);pots.position.y+=1.26;
 const tall=wall(roof,-3.15,-2.1,2,3.1,C.yellow,[{x:0,y:1.8,w:.7,h:.8}]);tall.rotation.y=-.1;canopy(tall,0,1.2,.1,1.6,.55);plant(roof,-4.6,-1.75,.8);
 const hanging=root(terrace,0,0,'屋顶灯串 / 弧线与小灯');for(const x of [-2.6,2.6])cylinder(hanging,.025,1.6,C.wood,x,2.06,-1.9);curve(hanging,[[-2.6,2.86,-1.9],[0,2.35,-1.9],[2.6,2.86,-1.9]],C.ink);for(let i=0;i<9;i++){const x=(i-4)*.58,y=2.35+.5*(x/2.6)**2;cylinder(hanging,.065,.12,i%2?C.yellow:C.paper,x,y-.12,-1.9,.045);}
 const frontGarden=flowerBed(roof,1.6,2.1,5.6,1.65,9),standing=character(roof,assets,12,3.7,1.9,1.5,.025,-.15);frontGarden.attach(standing);character(roof,assets,2,-1.0,2.5,1.6,0,-.2);const sky=wall(roof,4.2,-2,1.2,3.0,C.blue);paper(sky,assets.props[15],.6,.6,0,2.35,.14,'晚风里的一颗星');
 frames(roof,'rooftop',[[-5.05,.25,.10,1.1,1.65],[5,1.0,-.2,1.3,1],[-4.65,2.45,.12,1.05,.8],[.1,2.8,-.1,1.05,.8]]);
 return [kv,river,gardenScene,roof];
}
