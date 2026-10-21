import {THREE} from './scene.js?v=20261020-08';

// Photos stay in this browser; no upload endpoint or external service is used.
const database=new Promise((resolve,reject)=>{
  const request=indexedDB.open('city-play-photos',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('photos');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
});
async function savedPhoto(id,value){
  const db=await database;
  return new Promise((resolve,reject)=>{
    const write=value!==undefined,tx=db.transaction('photos',write?'readwrite':'readonly'),store=tx.objectStore('photos');
    const request=write?(value===null?store.delete(id):store.put(value,id)):store.get(id);
    let result;request.onsuccess=()=>{result=request.result;};
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
async function photoCanvas(blob,aspect){
  if(blob.size>20*1024*1024)throw new Error('这张照片有点大，请选一张小于20MB的图片。');
  const url=URL.createObjectURL(blob),image=new Image();
  try{image.src=url;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=Math.round(1200*Math.min(1,aspect));canvas.height=Math.round(1200/Math.max(1,aspect));
    const ctx=canvas.getContext('2d'),scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);
    ctx.fillStyle='#fffaf1';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,(canvas.width-image.naturalWidth*scale)/2,(canvas.height-image.naturalHeight*scale)/2,image.naturalWidth*scale,image.naturalHeight*scale);
    return canvas;
  }catch(error){if(error.message?.includes('20MB'))throw error;throw new Error('暂时读不了这张图片，请试试 JPG、PNG 或 WebP。');}
  finally{URL.revokeObjectURL(url);}
}
function paint(frame,canvas){
  const photo=frame.userData.photo,old=photo.image.material.map;photo.revision=(photo.revision||0)+1;
  const texture=canvas?new THREE.CanvasTexture(canvas):null;
  if(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;}
  photo.image.material.map=texture;photo.image.material.color.set(canvas?'#ffffff':'#f1f0e9');photo.image.material.needsUpdate=true;
  photo.placeholder.visible=!canvas;photo.hasPhoto=!!canvas;old?.dispose();
}
export function setupPhotos(scenes,announce){
  const dialog=document.createElement('dialog');dialog.id='photo-dialog';
  dialog.innerHTML='<button class="photo-close" aria-label="关闭照片画框">×</button><h2>把今天放进画框</h2><p>选一张你自己玩耍的照片。</p><img class="photo-preview" alt="画框中的照片" hidden><div class="photo-actions"><button class="photo-choose">选择照片</button><button class="photo-remove" hidden>移除照片</button></div><p class="photo-note">照片仅保存在当前浏览器，不会上传到服务器。</p><p class="photo-status" role="status"></p><input type="file" accept="image/*" aria-label="选择玩耍照片" hidden>';
  document.body.append(dialog);
  const input=dialog.querySelector('input'),choose=dialog.querySelector('.photo-choose'),remove=dialog.querySelector('.photo-remove'),preview=dialog.querySelector('img'),status=dialog.querySelector('.photo-status');
  let selected=null,bookId="";
  const photoKey=frame=>bookId?bookId+":"+frame.userData.photo.id:frame.userData.photo.id;
  function refresh(){const photo=selected.userData.photo;preview.style.aspectRatio=String(photo.aspect);choose.textContent=photo.hasPhoto?'替换照片':'选择照片';remove.hidden=!photo.hasPhoto;preview.hidden=!photo.hasPhoto;
    if(photo.hasPhoto)preview.src=photo.image.material.map.image.toDataURL('image/jpeg',.85);else preview.removeAttribute('src');
  }
  function open(frame){selected=frame;status.textContent='';refresh();dialog.showModal();}
  dialog.querySelector('.photo-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  choose.onclick=()=>{input.value='';input.click();};
  input.onchange=async()=>{
    const file=input.files[0];if(!file||!selected)return;
    const frame=selected,key=photoKey(frame);choose.disabled=remove.disabled=true;status.textContent='把照片放进去…';
    try{const canvas=await photoCanvas(file,frame.userData.photo.aspect),blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));if(!blob)throw new Error('照片未能保存，请再试一次。');
      paint(frame,canvas);let stored=true;try{await savedPhoto(key,blob);}catch{stored=false;}
      if(selected===frame){refresh();status.textContent=stored?'已放进画框，刷新后也会保留。':'照片已显示，但当前浏览器无法保存，刷新后需要重新选择。';}
      announce('你的小确幸，已经放进这一页。');
    }catch(error){status.textContent=error.message;}
    finally{choose.disabled=remove.disabled=false;}
  };
  remove.onclick=async()=>{const frame=selected,key=photoKey(frame);choose.disabled=remove.disabled=true;
    try{let stored=true;try{await savedPhoto(key,null);}catch{stored=false;}paint(frame,null);refresh();status.textContent=stored?'画框空出来了，随时再放一张。':'已从画框移除，但浏览器未能更新保存记录，刷新后可能恢复。';announce('已移除这张照片。');}
    catch{status.textContent='暂时没能移除，请稍后重试。';}
    finally{choose.disabled=remove.disabled=false;}
  };
  // Handle unavailable browser storage without preventing the book from opening.
  database.catch(()=>{});
  const allFrames=[];
  for(const scene of scenes){scene.addEventListener('photo-select',e=>open(e.frame));scene.traverse(n=>{if(n.userData.photo)allFrames.push(n);});}
  async function setBook(id=''){bookId=id;dialog.close();selected=null;return Promise.all(allFrames.map(async frame=>{paint(frame,null);const revision=frame.userData.photo.revision,key=photoKey(frame);try{const blob=await savedPhoto(key);if(blob){const canvas=await photoCanvas(blob,frame.userData.photo.aspect);if(frame.userData.photo.revision===revision)paint(frame,canvas);}}catch{}}));}
  setBook();
  const targets=[];
  scenes.forEach((scene,index)=>{let ordinal=0;scene.traverse(frame=>{if(!frame.userData.photo)return;
    const button=document.createElement('button');button.className='photo-frame-target';button.setAttribute('aria-label',scene.name+'，照片画框'+(++ordinal));button.title='点击放入你的照片';button.hidden=true;button.onclick=()=>open(frame);document.querySelector('#experience').append(button);targets.push({frame,button,index});
  });});
  const point=new THREE.Vector3();
  return {setBook,update(camera,width,height,busy,current){
    camera.updateMatrixWorld();
    for(const {frame,button,index} of targets){button.hidden=busy||index!==current;if(button.hidden)continue;
      frame.updateWorldMatrix(true,false);let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(const x of [-frame.userData.photo.width/2,frame.userData.photo.width/2])for(const y of [.24,.24+frame.userData.photo.height]){point.set(x,y,.05).applyMatrix4(frame.matrixWorld).project(camera);const px=(point.x+1)*width/2,py=(1-point.y)*height/2;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);}
      const w=Math.max(44,maxX-minX),h=Math.max(44,maxY-minY);button.style.left=((minX+maxX-w)/2)+'px';button.style.top=((minY+maxY-h)/2)+'px';button.style.width=w+'px';button.style.height=h+'px';
    }
  }};
}
