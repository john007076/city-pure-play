import {renderPNG4K} from './render-export.js?v=20261020-08';
import * as THREE from './vendor/three.module.js';
import {ACTIONS,createCharacter,animateCharacter,interactCharacter} from './character.js?v=20261020-08';
const items=[],host=document.querySelector('#poses');let angle=0,spinning=false,paused=false,time=0,last=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const params=new URLSearchParams(location.search),focus=Number(params.get('pose')),selection=(params.get('poses')||'').split(',').map(Number).filter(n=>n>=1&&n<=12);if(selection.length){host.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';host.style.maxWidth='1000px';host.style.margin='auto';}if(focus>=1&&focus<=12){host.style.gridTemplateColumns='minmax(0,680px)';host.style.justifyContent='center';}
for(let i=1;i<=12;i++){
  if(focus>=1&&focus<=12&&i!==focus||selection.length&&!selection.includes(i))continue;
  const card=document.createElement('article'),title=document.createElement('h2'),canvas=document.createElement('canvas');title.textContent=String(i).padStart(2,'0')+' / '+ACTIONS[i-1];card.append(title,canvas);host.append(card);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#fffaf1',params.has('capture')?0:1);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1.25,1.25,1.25,-1.25,.1,20);camera.position.set(0,2.2,8);camera.lookAt(0,.95,0);
  scene.add(new THREE.AmbientLight(0xffffff,1.5));const light=new THREE.DirectionalLight(0xffffff,1.6);light.position.set(-3,5,6);scene.add(light);
  const model=createCharacter(i);scene.add(model);model.rotation.y=[-.8,-.2,-.45,-.65,-.65,-.1,-.8,-.1,-.45,-.15,-.15,-.1][i-1];if(i===7)model.position.z=-.2;if(i===9)model.scale.setScalar(.9);
  if(params.has('capture')){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),view=new THREE.Box3();for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])view.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));const center=view.getCenter(new THREE.Vector3()),size=view.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y)*.57,offset=new THREE.Vector3(center.x,center.y,0).transformDirection(camera.matrixWorld);offset.set(0,0,0).addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),center.x).addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),center.y);camera.position.add(offset);camera.lookAt(new THREE.Vector3(0,.95,0).add(offset));camera.left=camera.bottom=-extent;camera.right=camera.top=extent;camera.updateProjectionMatrix();}
  canvas.tabIndex=0;canvas.setAttribute('role','button');canvas.setAttribute('aria-label',ACTIONS[i-1]+'，点击和角色互动');
  const react=()=>{document.querySelector('#status').textContent=interactCharacter(model,time);};
  canvas.addEventListener('click',react);canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();react();}});
  items.push({renderer,scene,camera,model,canvas,base:model.rotation.y});
}
function resize(){for(const i of items){const width=i.canvas.clientWidth;i.renderer.setSize(width,width,false);}}
addEventListener('resize',resize);resize();
for(const [id,a] of [['front',0],['side',Math.PI/2]])document.querySelector('#'+id).onclick=()=>{angle=a;spinning=false;for(const item of items)item.base=0;for(const n of ['front','side','spin'])document.querySelector('#'+n).setAttribute('aria-pressed',String(n===id));};
document.querySelector('#spin').onclick=()=>{spinning=!spinning;document.querySelector('#spin').setAttribute('aria-pressed',String(spinning));};
document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').setAttribute('aria-pressed',String(paused));document.querySelector('#pause').textContent=paused?'继续动作':'暂停动作';};
function render(now){requestAnimationFrame(render);if(document.hidden||now-last<32)return;const dt=last?Math.min(now-last,60):0;last=now;if(!paused)time+=dt;if(spinning&&!reduced)angle+=dt*.00035;for(const i of items){animateCharacter(i.model,time,reduced);i.model.rotation.y=angle+i.base;i.renderer.render(i.scene,i.camera);}}
requestAnimationFrame(render);document.body.dataset.characterModels=String(items.length);
document.querySelector('#status').textContent='同一套人物模型，'+items.length+'组动作';
if(items.length<12){const all=document.createElement('a');all.href='characters.html';all.textContent='查看全部12组动作';document.querySelector('header').append(all);}

const savePose=document.createElement('button');savePose.id='export-pose';savePose.textContent='保存角色4K';document.querySelector('header').append(savePose);
savePose.onclick=()=>{const item=items[0],png=renderPNG4K(item.renderer,item.scene,item.camera);if(params.has('capture')){let img=document.querySelector('#pose-export');if(!img){img=new Image();img.id='pose-export';img.alt='角色4K导出预览';img.style.cssText='position:fixed;right:12px;bottom:12px;width:100px;z-index:10';document.body.append(img);}img.src=png;}else{const a=document.createElement('a');a.download='闲闲-'+item.model.userData.character+'-4K.png';a.href=png;a.click();}};
