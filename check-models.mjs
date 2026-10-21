import {renderPNG4K} from './render-export.js';
import {SCENE_PRESETS,DEFAULT_PAGES,normalizePages} from './scene-presets.js';
import {readCityBooks} from './city-books.js';
import assert from 'node:assert/strict';
import {makeShelf,makeShelfPlant,shelfBookPlacement,SHELF} from './shelf.js';
import {THREE,buildScenes,foldScene,updateScene,activateHit,makeCover} from './scene.js';
import {ACTIONS,createCharacter,animateCharacter,solveJoint,interactCharacter} from './character.js';
const assets={props:Array.from({length:16},()=>new THREE.Texture()),titles:Array.from({length:8},()=>new THREE.Texture())};
const cover=makeCover(new THREE.Group(),assets);cover.updateMatrixWorld(true);
const coverPerson=new THREE.Box3().setFromObject(cover.userData.decoration);
assert.ok(coverPerson.min.y>=cover.position.y+.0705,'entire cover character must lie above the paper surface');
assert.ok(coverPerson.min.y<cover.position.y+.085,'cover character must touch the cover rather than float');
const coverLawnTop=new THREE.Box3().setFromObject(cover.getObjectByName('封面草坪 / 圆润草地')).max.y;
for(const arm of cover.getObjectByName('闲闲 / 封面趴着看花').userData.rig.arms){const elbow=arm.joint.getWorldPosition(new THREE.Vector3()).y-.042*.85;assert.ok(Math.abs(elbow-coverLawnTop)<.004,'cover elbows must rest on the lawn surface');}
assert.equal(cover.getObjectByName('闲闲 / 封面趴着看花').userData.character,7,'cover must use the authored prone flower-watching pose');
assert.ok(cover.getObjectByName('白色内封面'),'opening cover must reveal a white inner lining');
const scenes=buildScenes(new THREE.Group(),assets);
assert.equal(scenes.length,SCENE_PRESETS.length);
assert.equal(DEFAULT_PAGES[0],3,'KV scene must open the original book');
assert.deepEqual(normalizePages([0,1,2]),[0,1,2],'existing saved books keep their old scene IDs');
assert.deepEqual(normalizePages([-1,99,3,6,1.5]),[3,6]);
assert.deepEqual(scenes.map(s=>s.name),SCENE_PRESETS.map(s=>s.name));
const ids=[];
for(const scene of scenes){const frames=[];scene.traverse(n=>{if(n.userData.photo)frames.push(n);});assert.equal(frames.length,4,'each scene must contain four photo frames');assert.ok(frames.some(f=>f.userData.photo.aspect<1),'each scene needs a portrait frame');assert.ok(frames.some(f=>f.userData.photo.width<1.2&&f.userData.photo.height<1),'each scene needs a small frame');
 for(const frame of frames){ids.push(frame.userData.photo.id);let selected=null;const listener=e=>selected=e.frame;scene.addEventListener('photo-select',listener);activateHit(scene,{intersectObject:()=>[{object:frame.userData.photo.image}]},0);assert.equal(selected,frame,'photo selection must dispatch the exact clicked frame');scene.removeEventListener('photo-select',listener);}}
assert.equal(new Set(ids).size,scenes.length*4,'each photo needs an independent storage key');
assert.equal(scenes.slice(0,3).reduce((n,s)=>n+s.userData.inventory.characters,0),12);
for(const scene of scenes){
  for(const t of [0,.2,.5,.8,1]){foldScene(scene,t);scene.updateMatrixWorld(true);scene.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite),n.name));}
  for(const root of scene.children.filter(n=>n.userData.fold)){assert.ok(Math.abs(root.rotation.x)<1e-8,root.name+' must unfold fully');assert.equal(root.scale.z,1);}
  updateScene(scene,1000,.016);scene.traverse(n=>{if(n.isMesh)assert.ok(n.geometry.attributes.position.array.every(Number.isFinite),n.name);});
}
const gate=scenes[0].children.find(n=>n.name.startsWith('拱门')&&!n.userData.action);
const ring=gate.children.find(n=>n.isMesh);gate.updateMatrixWorld(true);
const origin=gate.localToWorld(new THREE.Vector3(0,1,2)),direction=new THREE.Vector3(0,0,-1);
assert.equal(new THREE.Raycaster(origin,direction).intersectObject(ring,false).length,0,'arch opening must be a real hole');
const door=scenes[0].children.find(n=>n.userData.action?.type==='door');
const leaf=door.userData.action.node;const hit=activateHit(scenes[0],{intersectObject:()=>[{object:leaf.children.find(n=>n.isMesh)}]},100);
assert.ok(hit);updateScene(scenes[0],150,.1);assert.ok(leaf.rotation.y<-.24,'door must respond to activation');
for(let action=1;action<=12;action++){
  const m=createCharacter(action),rig=m.userData.rig;assert.ok(interactCharacter(m,0),'every character must respond to interaction');
  for(let time=0;time<=8000;time+=160){
    animateCharacter(m,time);m.updateMatrixWorld(true);m.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite),ACTIONS[action-1]));
    const footMin=Math.min(...rig.feet.map(f=>new THREE.Box3().setFromObject(f).min.y));
    const elbowMin=Math.min(...rig.arms.map(a=>a.joint.getWorldPosition(new THREE.Vector3()).y-.042));
    const kneeMin=Math.min(...rig.legs.map(a=>a.joint.getWorldPosition(new THREE.Vector3()).y-.051));
    assert.ok(footMin>=-.007&&kneeMin>=-.007,'limbs must not penetrate the support plane: '+ACTIONS[action-1]);
    if(![5,7,8].includes(action))assert.ok(footMin<.012,'feet must contact the ground: '+ACTIONS[action-1]);
    if(action===7)assert.ok(elbowMin>=-.007&&elbowMin<.015,'lying elbows must rest on the ground');
    if(action===8){const table=m.getObjectByName('托腮的珊瑚桌'),tableBounds=new THREE.Box3().setFromObject(table.children[0]),torsoBounds=new THREE.Box3().setFromObject(rig.torso);assert.ok(tableBounds.min.z>torsoBounds.max.z+.02,'table rear edge must clear the torso');assert.ok(Math.abs(elbowMin-1.1645)<.012,'chin pose elbows must touch the table top');assert.ok(Math.abs(footMin-.265)<.003,'seated heels must rest on the stool rail');for(const leg of rig.legs)assert.ok(leg.joint.position.z>.35&&leg.joint.position.y>.67,'seated thighs must extend past the seat before bending down');}
    if(action===4){for(const arm of rig.arms)assert.ok(arm.joint.position.z<-.2,'seated elbows must bend behind the torso');for(const hand of rig.hands)assert.ok(Math.abs(new THREE.Box3().setFromObject(hand).min.y-.55)<.003,'seated palms must lie flat on the seat');}
    if(action===7){assert.ok(Math.abs(rig.body.rotation.x-Math.PI/2)<.001,'prone abdomen must be horizontal');assert.ok(rig.head.getWorldPosition(new THREE.Vector3()).y>.4,'prone head must be raised above the arms');for(const knee of rig.legs)assert.ok(knee.joint.position.y<.07,'prone knees must rest on the ground');for(const foot of rig.feet)assert.equal(foot.rotation.y,Math.PI,'prone toes must point away from the face');}
    if(action===11){for(const leg of rig.legs)assert.ok(leg.joint.position.y<.08,'reading legs must spread along the floor');const panels=rig.carried.children.filter(n=>n.isGroup);for(const panel of panels)assert.ok(panel.children[1].position.z<0,'book pages must face the reader');} 
    if(action===5)assert.ok(Math.abs(footMin-.142)<.012,'reclining feet must rest on the chair foot rail');
    if([1,2,6,9,10,12].includes(action))for(const leg of rig.legs)assert.ok(leg.joint.position.z>=leg.end.z/2-.02,'standing knees must bend forward');
  }
  animateCharacter(m,0,true);const before=rig.head.rotation.toArray();animateCharacter(m,5000,true);assert.deepEqual(rig.head.rotation.toArray(),before,'reduced motion must stay stable');
}
const lying=scenes[1].getObjectByName('闲闲 / 07 看花');
scenes[1].updateMatrixWorld(true);
for(const arm of lying.userData.rig.arms){const contact=arm.joint.getWorldPosition(new THREE.Vector3());assert.ok(contact.z<2.55&&contact.z>-2.25&&contact.x>-3.35&&contact.x<5.35,'prone elbows must stay inside the raised lawn');assert.ok(Math.abs(contact.y-.042-.0475)<.008,'prone elbows must touch the lawn rather than hover over the lower book page');}
for(const point of [new THREE.Vector3(.1,.5,.2),new THREE.Vector3(0,10,0)]){
  const a=new THREE.Vector3(),s=solveJoint(a,point,.35,.35,new THREE.Vector3(1,0,1));
  assert.ok(Math.abs(a.distanceTo(s.joint)-.35)<1e-6);assert.ok(Math.abs(s.joint.distanceTo(s.end)-.35)<1e-6);
}
console.log(JSON.stringify({scenes:scenes.map(s=>({name:s.name,...s.userData.inventory})),actions:ACTIONS,checks:['finite geometry and rig','complete staggered unfolding','real arch hole','door activation','12 animated poses','reduced motion','two-bone limb lengths']},null,2));

const shelfRig=new THREE.Group();shelfRig.add(makeShelf(),makeShelfPlant());shelfRig.updateMatrixWorld(true);shelfRig.traverse(n=>{assert.ok(n.matrixWorld.elements.every(Number.isFinite),'shelf transforms must be finite');if(n.isMesh)assert.ok(n.geometry.attributes.position.array.every(Number.isFinite),'shelf geometry must be finite');});
const placement=shelfBookPlacement(),closedCore=new THREE.Group();
const core=new THREE.Mesh(new THREE.BoxGeometry(6.09,.475,7.18));core.position.set(3,-.0475,0);closedCore.add(core);closedCore.scale.setScalar(placement.scale);closedCore.rotation.copy(placement.rotation);closedCore.position.copy(placement.position);closedCore.updateMatrixWorld(true);
const placedBounds=new THREE.Box3().setFromObject(closedCore);
assert.ok(Math.abs(placedBounds.min.y-(SHELF.offsetY+SHELF.levels[2]+.035))<1e-6,'leaning book bottom must contact top shelf');
assert.ok(placedBounds.min.z>SHELF.offsetZ-.005&&placedBounds.min.z<SHELF.offsetZ+.025,'book must lean against the backboard');
assert.ok(Math.abs(placement.scale-.14*1.7)<1e-8,'book must be 170 percent of its original shelf size');
assert.ok(Math.abs(placedBounds.getCenter(new THREE.Vector3()).x-.45)<.001,'book must sit just right of shelf center');
assert.ok(placedBounds.max.z<SHELF.offsetZ+1.11,'book bottom must stay behind the top ledge lip');
assert.equal(placement.rotation.z,0,'book must remain level from the front');
assert.equal(placement.rotation.y,0,'book must face straight forward');
assert.ok(Math.abs(Math.PI/2-placement.rotation.x-Math.PI/6)<1e-8,'book top must lean backward by thirty degrees');
assert.equal(makeShelfPlant().scale.x,.5,'whole potted plant must be half its previous size');
assert.ok(!shelfRig.getObjectByName('底层白边装饰画'),'decorative picture must be removed');
shelfRig.traverse(n=>assert.ok(!n.name.startsWith('参考图书刊'),'all other books must be removed'));

assert.equal(shelfRig.getObjectByName('米白墙面'),undefined,'shelf view must have no wall');
assert.equal(shelfRig.getObjectByName('木地板'),undefined,'shelf view must have no room floor');
shelfRig.traverse(n=>{if(n.isMesh)for(const material of [n.material].flat())assert.ok(material.isMeshToonMaterial,'all furniture surfaces must use the book toon shading');});

assert.deepEqual(readCityBooks({getItem:()=>'{broken'}),[null,null],'invalid saved library must not break the app');
assert.deepEqual(readCityBooks({getItem:()=>JSON.stringify([{city:'  我的城市  ',title:' 随便走走 '},{city:4,title:'bad'}])}),[{id:'city-book-0',slot:0,city:'我的城市',title:'随便走走',pages:[...DEFAULT_PAGES]},null],'validate stored city books and normalize names');
for(const level of [0,1]){const p=shelfBookPlacement(level);closedCore.position.copy(p.position);closedCore.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(closedCore);assert.ok(Math.abs(b.min.y-(SHELF.offsetY+SHELF.levels[level]+.035))<1e-6,'DIY books must contact their own shelf');}

const kv=scenes[3];
for(const name of ['KV / 左侧蓝色主楼梯','KV / 中央蓝色楼梯','KV / 探窗的闲闲','KV / 咖啡窗里的闲闲','KV / 前景矮花池坐台'])assert.ok(kv.getObjectByName(name),name);
for(const s of scenes.slice(3)){assert.ok(s.userData.inventory.meshes>180,'new scenes need complete modeled detail');assert.ok(s.userData.inventory.characters>=3);}
const roof=scenes[6];roof.updateMatrixWorld(true);
for(const name of ['屋顶 / 躺椅上的闲闲','屋顶 / 读书的闲闲']){const model=roof.getObjectByName(name);const bounds=new THREE.Box3().setFromObject(model);assert.ok(Math.abs(bounds.min.y-1.285)<.015,'rooftop figures must contact the upper terrace: '+name);}
const saved=readCityBooks({getItem:()=>JSON.stringify([{city:'测试',title:'旧书',pages:[0,2]}])});assert.deepEqual(saved[0].pages,[0,2],'expanding presets must not rewrite existing books');
console.log('Verified seven scenes, four photo frames per scene, KV-first order, terrace contacts and saved-book compatibility.');

for(const fail of [false,true]){let ratio=1.5,requested=null;const renderer={getSize:v=>v.set(1440,1024),getPixelRatio:()=>ratio,setPixelRatio:n=>{ratio=n;if(n!==1.5)requested=n;},render(){},domElement:{toDataURL(){if(fail)throw new Error('encode');return 'data:image/png;4K';}}};if(fail)assert.throws(()=>renderPNG4K(renderer,{},{}),/encode/);else assert.equal(renderPNG4K(renderer,{},{}),'data:image/png;4K');assert.equal(requested*1440,3840);assert.equal(ratio,1.5,'export must restore interactive resolution');}
