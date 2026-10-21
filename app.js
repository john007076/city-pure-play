import {renderPNG4K,renderPagePNG4K} from './render-export.js?v=20261020-14';
import {SCENE_PRESETS,DEFAULT_PAGES,normalizePages} from './scene-presets.js?v=20261020-08';
import {setupCityBooks} from './city-books.js?v=20261020-11';
import {setupPhotos} from './photos.js?v=20261020-08';
import {THREE,C,box,buildScenes,makeCover,makeShelf,makeShelfPlant,shelfBookPlacement,SHELF,loadAssets,activateHit,updateScene,foldScene as fold} from './scene.js?v=20261020-08';
const $=s=>document.querySelector(s),host=$('#world');
if(new URLSearchParams(location.search).has('capture'))document.body.classList.add('capture-only');
if(new URLSearchParams(location.search).has('full'))document.body.classList.add('full-export');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false});}catch(e){$('#loading').remove();$('#error').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(C.cream,1);host.appendChild(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(30,1,.1,120);camera.position.set(12,14,19);camera.lookAt(0,0,0);
scene.add(new THREE.AmbientLight(0xffffff,1.5));const sun=new THREE.DirectionalLight(0xffffff,1.5);sun.position.set(-7,13,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:40});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:C.cream}));ground.rotation.x=-Math.PI/2;ground.position.y=-.4;scene.add(ground);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.12}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.39;shadow.receiveShadow=true;scene.add(shadow);
const book=new THREE.Group();book.rotation.order='ZYX';scene.add(book);const base=box(book,6.09,.13,7.18,C.green,-3,-.22,0);const left=box(book,5.98,.2,7,C.paper,-3,-.08,0);const backTurn=new THREE.Group();book.add(backTurn);box(backTurn,6.09,.13,7.18,C.green,3,-.22,0);const right=box(backTurn,5.98,.2,7,C.paper,3,-.08,0);
const pageLines=new THREE.Group();book.add(pageLines);
for(let i=0;i<10;i++){const y=-.16+i*.022;for(let side of [-1,1]){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(side*.03,y,3.505),new THREE.Vector3(side*5.98,y,3.505)]);pageLines.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:'#c9c5b1'})));}}
let assets;
try{assets=await loadAssets();await document.fonts.load('120px "Xiaolai"');}
catch(error){$('#loading')?.remove();$('#error').hidden=false;$('#error').textContent='这一页还没打开。请刷新后再试一次。';throw error;}
const scenes=buildScenes(book,assets);const cover=makeCover(book,assets);
const hint=document.createElement('p');hint.id='interaction-hint';hint.setAttribute('role','status');document.querySelector('#experience').append(hint);let hintTimer;
function announce(message){$('#live').textContent=message;hint.textContent=message;hint.classList.add('show');clearTimeout(hintTimer);hintTimer=setTimeout(()=>hint.classList.remove('show'),3500);}
const photoFrames=setupPhotos(scenes,announce);const shelfSet=new THREE.Group();shelfSet.name='收书后的书架与花盆';shelfSet.visible=false;shelfSet.position.set(0,SHELF.offsetY,SHELF.offsetZ);scene.add(shelfSet);shelfSet.add(makeShelf(),makeShelfPlant());
host.dataset.contentVersion='1.2';host.dataset.inventory=JSON.stringify(scenes.map(s=>({name:s.name,...s.userData.inventory})));
const PAGE_W=6,PAGE_H=7,PAGE_Y=.15,EDGE_STEPS=40;
const pageGeo=new THREE.PlaneGeometry(PAGE_W,PAGE_H,64,32);pageGeo.rotateX(-Math.PI/2);pageGeo.translate(PAGE_W/2,PAGE_Y,0);pageGeo.attributes.position.setUsage(THREE.DynamicDrawUsage);const original=Float32Array.from(pageGeo.attributes.position.array);const leaf=new THREE.Mesh(pageGeo,new THREE.MeshToonMaterial({color:C.paper,gradientMap:null,side:THREE.DoubleSide}));leaf.castShadow=true;leaf.receiveShadow=true;leaf.visible=false;leaf.frustumCulled=false;book.add(leaf);
const edgePositions=new Float32Array((EDGE_STEPS+1)*3);const edgeGeo=new THREE.BufferGeometry();edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3).setUsage(THREE.DynamicDrawUsage));const edge=new THREE.Line(edgeGeo,new THREE.LineBasicMaterial({color:'#8d9783'}));book.add(edge);edge.visible=false;edge.frustumCulled=false;
const coverTitle='城市纯玩企划',coverPoem='今天，没什么安排。\n把地图先收起来。';
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let activeCity=null,shelfMode=false,pagePlan=[...DEFAULT_PAGES];let current=-1,busy=false,reduced=motionPreference.matches,hintSeen=false;motionPreference.addEventListener('change',event=>{reduced=event.matches;});
const easing={inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out:t=>1-Math.pow(1-t,3),back:t=>1+2.1*Math.pow(t-1,3)+1.1*Math.pow(t-1,2),page:t=>{const base=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;return THREE.MathUtils.clamp(base+Math.sin(Math.PI*t)*Math.sin(Math.PI*2*t)*.032,0,1);}};
function setPagePlan(pages){pagePlan=normalizePages(pages);pageLines.children.forEach((line,index)=>line.visible=index<pagePlan.length*2);host.dataset.pageCount=String(pagePlan.length);}
function sceneAt(index){return scenes[pagePlan[index]];}
function lastPageIndex(){return pagePlan.length-1;}
function bezier(a,b,c,d,t){const s=1-t;return s*s*s*a+3*s*s*t*b+3*s*t*t*c+t*t*t*d;}
const controlPoints=Array.from({length:16},()=>new THREE.Vector3()),controlRows=Array.from({length:4},()=>new THREE.Vector3()),surfacePoint=new THREE.Vector3();
function bezierVec(out,a,b,c,d,t){return out.set(bezier(a.x,b.x,c.x,d.x,t),bezier(a.y,b.y,c.y,d.y,t),bezier(a.z,b.z,c.z,d.z,t));}
function pagePoint(u,v,out){for(let j=0;j<4;j++){const k=j*4;bezierVec(controlRows[j],controlPoints[k],controlPoints[k+1],controlPoints[k+2],controlPoints[k+3],u);}return bezierVec(out,controlRows[0],controlRows[1],controlRows[2],controlRows[3],v);}
function bendPage(progress){
 const p=THREE.MathUtils.clamp(progress,0,1),angle=p*Math.PI,curl=Math.pow(Math.max(0,Math.sin(Math.PI*p)),.82),flutter=Math.sin(Math.PI*2*p)*curl;
 for(let j=0;j<4;j++){
  const v=j/3,centered=v-.5,corner=Math.pow(Math.abs(centered*2),1.5),z=centered*PAGE_H,rowAngle=angle+centered*.24*curl+flutter*centered*.08,co=Math.cos(rowAngle),si=Math.sin(rowAngle),lift=curl*(.7+.3*corner),k=j*4;
  controlPoints[k].set(0,PAGE_Y,z);
  controlPoints[k+1].set(PAGE_W/3*co+curl*(.38+.12*corner),PAGE_W/3*si+PAGE_Y+lift*(.28+.18*corner)+flutter*centered*.1,z+centered*curl*.08+flutter*.08);
  controlPoints[k+2].set(PAGE_W*2/3*co+curl*(.65+.3*corner),PAGE_W*2/3*si+PAGE_Y+lift*(.58+.38*corner)+flutter*centered*.22,z-centered*curl*(.18+.12*corner)+flutter*.12);
  controlPoints[k+3].set(PAGE_W*co,PAGE_W*si+PAGE_Y+curl*corner*.2+flutter*centered*.12,z-centered*curl*(.38+.28*corner)+flutter*centered*.16);
 }
 const pos=pageGeo.attributes.position;
 for(let i=0;i<pos.count;i++){const u=original[i*3]/PAGE_W,v=(original[i*3+2]+PAGE_H/2)/PAGE_H;pagePoint(u,v,surfacePoint);pos.setXYZ(i,surfacePoint.x,surfacePoint.y,surfacePoint.z);}
 pos.needsUpdate=true;pageGeo.computeVertexNormals();
 for(let i=0;i<=EDGE_STEPS;i++){pagePoint(1,i/EDGE_STEPS,surfacePoint);edgePositions[i*3]=surfacePoint.x;edgePositions[i*3+1]=surfacePoint.y;edgePositions[i*3+2]=surfacePoint.z;}
 edgeGeo.attributes.position.needsUpdate=true;
}
function tween(ms,fn,ease=easing.inOut){return new Promise(resolve=>{if(reduced){fn(1);resolve();return;}const start=performance.now();function step(now){const t=Math.min(1,(now-start)/ms);fn(ease(t));if(t<1)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});}
function handwrite(el,text,amount=.5){el.replaceChildren();Array.from(text).forEach((ch,i)=>{if(ch==='\n'){el.appendChild(document.createElement('br'));return;}const a=Math.sin((i+1)*12.9898+text.length*3.17),b=Math.sin((i+1)*4.1414+text.length*1.77),c=Math.cos((i+1)*7.319+text.length*2.11),span=document.createElement('span');span.className='hand-char';span.textContent=ch===' '? '\u00a0':ch;span.style.setProperty('--r',`${a*5.5*amount}deg`);span.style.setProperty('--y',`${b*3.2*amount}px`);span.style.setProperty('--sx',1+c*.06*amount);span.style.setProperty('--sy',1+c*.18*amount);el.appendChild(span);});}
function setText(index){
 const preset=index>=0?SCENE_PRESETS[pagePlan[index]]:null,heading=preset?preset.name:activeCity?.title||coverTitle;
 handwrite($('#title'),heading,.9);$('#title').setAttribute('aria-label',heading);$('#title').classList.remove('lettered');$('#title').style.backgroundImage='none';
 handwrite($('#poem'),preset?preset.poem:coverPoem,.55);handwrite($('#eyebrow'),index<0?(activeCity?activeCity.city+' · 城市限定':''):`第 ${index+1} 页 / 共 ${pagePlan.length} 页`,.3);$('#eyebrow').hidden=index<0&&!activeCity;
 handwrite($('#turn-label'),index<0?'翻开看看':index===lastPageIndex()?'合上收藏':'再翻一页',.5);$('#next').setAttribute('aria-label',index<0?'打开城市立体书':index===lastPageIndex()?'合上城市立体书':'翻到下一页');$('#previous').hidden=index<0;if(shelfMode){handwrite($('#turn-label'),'拿起这本书',.5);$('#next').setAttribute('aria-label','从书架取出城市立体书');}$('#live').textContent=heading;
}
function controls(){for(const s of ['#previous','#next','#shelf-entry','#export'])$(s).disabled=busy;$('#shelf-entry').hidden=current>=0||shelfMode;const label=current<0?coverTitle:SCENE_PRESETS[pagePlan[current]].name;host.setAttribute('aria-label',`${label}，三维立体书${busy?'正在翻页':''}`);host.dataset.page=String(current);host.dataset.busy=String(busy);}
function setClosed(on){pageLines.visible=!on;base.visible=!on;left.visible=!on;backTurn.visible=true;right.visible=true;backTurn.rotation.z=0;}
setPagePlan();scenes.forEach(s=>{s.visible=false;fold(s,0);});setClosed(true);setText(-1);controls();
function phase(t,start,length){return THREE.MathUtils.clamp((t-start)/length,0,1);}
async function go(target){
 if(busy||!Number.isInteger(target)||target===current||target<-1||target>lastPageIndex())return;
 busy=true;clearTimeout(hintTimer);hint.classList.remove('show');controls();$('#words').classList.add('changing');const old=current;if(old<0&&shelfMode){await hideShelf();cameraCenterTarget=0;}else cameraCenterTarget=target<0?3:0;cameraFocusTarget=deskFocusY();
 try{
  if(old<0||target<0){
   const opening=old<0,content=sceneAt(opening?target:old);
   leaf.visible=edge.visible=false;book.rotation.z=backTurn.rotation.z=0;
   content.visible=true;cover.visible=true;
   await tween(1850,t=>{
    const progress=opening?t:1-t,turn=easing.out(phase(progress,0,.45));
    cover.rotation.z=turn*Math.PI;cover.position.y=THREE.MathUtils.lerp(.19,-.06,turn);
    cover.userData.decoration.visible=turn<.5;
    const spread=turn>.94;left.visible=base.visible=pageLines.visible=spread;
    // Start the pop-up before the cover settles; closing follows the exact reverse path.
    content.visible=progress>.35;fold(content,easing.out(phase(progress,.35,.65)));
   },t=>t);
   setClosed(!opening);cover.visible=true;cover.rotation.z=opening?Math.PI:0;
   cover.position.y=opening?-.06:.19;cover.userData.decoration.visible=!opening;
   content.visible=opening;fold(content,opening?1:0);
  }else{
   const leaving=sceneAt(old),entering=sceneAt(target),forward=target>old;entering.visible=false;fold(entering,0);leaf.visible=edge.visible=false;
   await tween(1900,t=>{const leave=phase(t,0,.28),turn=phase(t,.14,.68),enter=phase(t,.58,.42);fold(leaving,1-leave);if(leave>=1)leaving.visible=false;const turning=turn>0&&turn<1;leaf.visible=edge.visible=turning;if(turning)bendPage(forward?easing.page(turn):1-easing.page(turn));if(enter>0){entering.visible=true;fold(entering,enter);}},t=>t);
   leaving.visible=false;leaf.visible=edge.visible=false;entering.visible=true;fold(entering,1);
  }
  if(old===lastPageIndex()&&target<0){setText(-1);await tween(500,()=>{});await showShelf();}
  current=target;setText(current);if(old===lastPageIndex()&&target<0)announce('把今天的纯玩，收进书架。');if(old<0&&target>=0&&!hintSeen){hintSeen=true;announce('点点小人，或给空画框放一张照片。');}
 }finally{busy=false;controls();$('#words').classList.remove('changing');}
}
function turn(direction){go(direction>0?(current===lastPageIndex()?-1:current+1):current-1);}
$('#next').onclick=()=>turn(1);$('#previous').onclick=()=>turn(-1);
handwrite($('#shelf-label'),'进入书架',.5);
handwrite($('#export-label'),'保存此刻',.45);
$('#shelf-entry').onclick=async()=>{if(busy||shelfMode)return;busy=true;controls();try{await showShelf();setText(-1);}finally{busy=false;controls();}};
addEventListener('keydown',e=>{if(e.repeat||document.querySelector('#photo-dialog')?.open||document.querySelector('#city-book-dialog')?.open)return;if(e.key==='ArrowRight'){e.preventDefault();turn(1);}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}if(e.key==='Escape'&&current>=0)go(-1);});
const parallax={target:new THREE.Vector2(),current:new THREE.Vector2()},cameraEye=new THREE.Vector3(12,14,19),cameraEyeTarget=cameraEye.clone(),cameraTarget=new THREE.Vector3(),cameraOffset=new THREE.Vector3();let pointer=null,cameraCenterTarget=3,cameraFocusTarget=host.clientWidth<700?2.8:1.1;
const shelfPlacement=shelfBookPlacement();
const bookPose={rotationX:0,rotationY:0,rotationZ:0},deskBookPosition=new THREE.Vector3(),shelfBookPosition=shelfPlacement.position,DESK_CAMERA_POSITION=new THREE.Vector3(12,14,19),SHELF_CAMERA_POSITION=new THREE.Vector3(.5,1.5,21.5);
const cityLibrary=setupCityBooks({shelfSet,cover,announce,handwrite,onChange:data=>{activeCity=data;setPagePlan(data?.pages);if(shelfMode&&!data){shelfBookPosition.copy(shelfBookPlacement(2).position);book.position.copy(shelfBookPosition);}},onOpen:async(data,level)=>{
 if(busy)return;busy=true;controls();try{cityLibrary.apply(data);shelfBookPosition.copy(shelfBookPlacement(level).position);book.position.copy(shelfBookPosition);await photoFrames.setBook(data?.id||'');}finally{busy=false;controls();}await go(0);
}});
function deskFocusY(){return host.clientWidth<700?2.8:1.1;}
function shelfFocusY(){return 4.15;}
async function showShelf(){
 if(shelfMode)return;shelfMode=true;document.body.classList.add('shelf-mode');const startPos=book.position.clone(),startScale=book.scale.x,startRotation=bookPose.rotationX,startLean=bookPose.rotationZ;cameraEyeTarget.copy(SHELF_CAMERA_POSITION);cameraCenterTarget=-1.05;cameraFocusTarget=shelfFocusY();shelfSet.visible=true;shelfSet.scale.setScalar(.01);
 await tween(1500,t=>{const appear=easing.out(phase(t,0,.55)),move=easing.inOut(phase(t,.18,.82));shelfSet.scale.setScalar(Math.max(.01,appear));book.position.lerpVectors(startPos,shelfBookPosition,move);book.scale.setScalar(THREE.MathUtils.lerp(startScale,shelfPlacement.scale,move));bookPose.rotationX=THREE.MathUtils.lerp(startRotation,shelfPlacement.rotation.x,move);bookPose.rotationZ=THREE.MathUtils.lerp(startLean,shelfPlacement.rotation.z,move);},t=>t);
 shelfSet.scale.setScalar(1);book.position.copy(shelfBookPosition);book.scale.setScalar(shelfPlacement.scale);bookPose.rotationX=shelfPlacement.rotation.x;bookPose.rotationZ=shelfPlacement.rotation.z;
}
async function hideShelf(){
 if(!shelfMode)return;const startPos=book.position.clone(),startScale=book.scale.x,startRotation=bookPose.rotationX,startLean=bookPose.rotationZ;cameraEyeTarget.copy(DESK_CAMERA_POSITION);cameraCenterTarget=3;cameraFocusTarget=deskFocusY();
 await tween(1300,t=>{const move=easing.inOut(phase(t,0,.72)),shrink=1-easing.out(phase(t,.42,.58));book.position.lerpVectors(startPos,deskBookPosition,move);book.scale.setScalar(THREE.MathUtils.lerp(startScale,1,move));bookPose.rotationX=THREE.MathUtils.lerp(startRotation,0,move);bookPose.rotationZ=THREE.MathUtils.lerp(startLean,0,move);shelfSet.scale.setScalar(Math.max(.01,shrink));},t=>t);
 shelfSet.visible=false;shelfSet.scale.setScalar(.01);book.position.copy(deskBookPosition);book.scale.setScalar(1);bookPose.rotationX=bookPose.rotationZ=0;shelfMode=false;document.body.classList.remove('shelf-mode');
}
function updateParallax(e){if(reduced||e.pointerType==='touch'){parallax.target.set(0,0);return;}const r=host.getBoundingClientRect();parallax.target.set(THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1),THREE.MathUtils.clamp((e.clientY-r.top)/r.height*2-1,-1,1));}
host.addEventListener('pointerdown',e=>{if(e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0)||pointer)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};updateParallax(e);host.setPointerCapture(e.pointerId);});host.addEventListener('pointermove',e=>{if(e.isPrimary!==false)updateParallax(e);});host.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;updateParallax(e);const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.25)turn(dx<0?1:-1);else if(Math.abs(dx)<10&&Math.abs(dy)<10){const r=host.getBoundingClientRect(),ray=new THREE.Raycaster();ray.params.Line.threshold=.04;ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);if(busy)return;if(current>=0){const message=activateHit(sceneAt(current),ray);if(message){announce(message);host.dataset.lastInteraction=message;return;}}const hit=ray.intersectObject(current<0?cover:right,true)[0];if(hit)turn(1);}});host.addEventListener('pointerleave',()=>parallax.target.set(0,0));host.addEventListener('pointercancel',e=>{if(pointer&&e.pointerId!==pointer.id)return;pointer=null;parallax.target.set(0,0);});
function resize(){const w=host.clientWidth,h=host.clientHeight,aspect=w/h;renderer.setSize(w,h);camera.aspect=aspect;camera.fov=30*Math.max(1,1/aspect);camera.updateProjectionMatrix();cameraEyeTarget.copy(shelfMode?SHELF_CAMERA_POSITION:DESK_CAMERA_POSITION);cameraEye.copy(cameraEyeTarget);cameraFocusTarget=shelfMode?shelfFocusY():deskFocusY();cameraTarget.set(cameraCenterTarget,cameraFocusTarget,0);camera.position.copy(cameraEye);camera.lookAt(cameraTarget);book.position.copy(shelfMode?shelfBookPosition:deskBookPosition);book.scale.setScalar(shelfMode?shelfPlacement.scale:1);bookPose.rotationX=shelfMode?shelfPlacement.rotation.x:0;bookPose.rotationZ=shelfMode?shelfPlacement.rotation.z:0;}
function updateCameraMotion(){if(shelfMode){const x=parallax.current.x,y=parallax.current.y,radius=cameraEye.distanceTo(cameraTarget),xScale=Math.max(1,.7/camera.aspect);cameraOffset.set(radius*x/3*xScale,y>=0?y*y*2.1:y*1.1,-Math.max(0,y)*radius*.07);camera.position.copy(cameraEye).add(cameraOffset);camera.lookAt(cameraTarget);book.rotation.set(bookPose.rotationX,bookPose.rotationY,bookPose.rotationZ);return;}const x=parallax.current.x,y=parallax.current.y,radius=cameraEye.distanceTo(cameraTarget),n=y*320,lower=n>50,vertical=(lower?Math.pow(n-50,1.2)+50:.2*(n-50)+50)-40,xScale=Math.max(1,.7/camera.aspect);cameraOffset.set(radius*x/3*xScale,radius*vertical*.3/720,lower?-radius*(n-50)*.3/720:0);camera.position.copy(cameraEye).add(cameraOffset);camera.lookAt(cameraTarget);book.rotation.y=bookPose.rotationY+x*.045;book.rotation.x=bookPose.rotationX+y*.02;book.rotation.z=bookPose.rotationZ;}
addEventListener('resize',resize);resize();let last=0;function render(now){requestAnimationFrame(render);if(document.hidden)return;const active=busy||Math.abs(cameraCenterTarget-cameraTarget.x)>.001||Math.abs(cameraFocusTarget-cameraTarget.y)>.001||cameraEye.distanceToSquared(cameraEyeTarget)>.00001||parallax.current.distanceToSquared(parallax.target)>.00001;if(!active&&now-last<28)return;const dt=Math.min(.06,Math.max(.001,(now-last)/1000||.016));last=now;if(!reduced){cameraEye.lerp(cameraEyeTarget,1-Math.exp(-dt*2.2));cameraTarget.x+=(cameraCenterTarget-cameraTarget.x)*(1-Math.exp(-dt*2.2));cameraTarget.y+=(cameraFocusTarget-cameraTarget.y)*(1-Math.exp(-dt*2.2));parallax.current.lerp(parallax.target,1-Math.exp(-dt*1.65));updateCameraMotion();if(!busy&&current>=0){updateScene(sceneAt(current),now,dt);}}else{parallax.current.set(0,0);cameraEye.copy(cameraEyeTarget);cameraTarget.x=cameraCenterTarget;cameraTarget.y=cameraFocusTarget;camera.position.copy(cameraEye);camera.lookAt(cameraTarget);book.rotation.x=bookPose.rotationX;book.rotation.y=bookPose.rotationY;book.rotation.z=bookPose.rotationZ;}if(reduced&&!busy&&current>=0)updateScene(sceneAt(current),now,dt,true);if(!busy&&current<0)updateScene(cover.userData.decoration,now,dt,reduced);if(shelfMode&&!busy)updateScene(shelfSet,now,dt,reduced);photoFrames.update(camera,host.clientWidth,host.clientHeight,busy,current>=0?pagePlan[current]:-1);cityLibrary.update(camera,host.clientWidth,host.clientHeight,shelfMode,busy);renderer.render(scene,camera);}requestAnimationFrame(render);
$('#loading').classList.add('done');setTimeout(()=>$('#loading')?.remove(),450);$('#live').textContent='城市立体书已准备好。点击书封或使用右方向键打开。';
$('#export').onclick=async()=>{if(busy)return;$('#export').disabled=true;try{const png=document.body.classList.contains('art-only')?renderPNG4K(renderer,scene,camera):await renderPagePNG4K(renderer,scene,camera,$('#experience'));if(document.body.classList.contains('capture-only')){let preview=$('#export-preview');if(!preview){preview=document.createElement('img');preview.id='export-preview';preview.alt='当前场景导出预览';document.body.append(preview);}preview.src=png;return;}const a=document.createElement('a');a.download=`城市纯玩-${shelfMode?'书架':current+1}-完整页面-4K.png`;a.href=png;a.click();}catch(error){console.error(error);announce('这张暂时没存好，请再试一次。');}finally{controls();}};
// Self-check covers the curved sheet and free edge through intermediate phases.
for(const p of [0,.2,.5,.8,1]){bendPage(p);const a=pageGeo.attributes.position.array;if(!a.every(Number.isFinite)||!edgePositions.every(Number.isFinite))throw new Error('Invalid page geometry');}bendPage(0);
if(new URLSearchParams(location.search).has('art')||new URLSearchParams(location.search).has('full')){if(!new URLSearchParams(location.search).has('full'))document.body.classList.add('art-only');const page=Number(new URLSearchParams(location.search).get('page')??0);if(!new URLSearchParams(location.search).has('shelf')&&page!==-1)go(Number.isInteger(page)&&page>=0&&page<pagePlan.length?page:0);}

if(new URLSearchParams(location.search).has('shelf')){busy=true;controls();showShelf().then(()=>setText(-1)).finally(()=>{busy=false;controls();});}
