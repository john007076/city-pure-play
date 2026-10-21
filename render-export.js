// Export from the real scene at 4K; restore the interactive renderer even if encoding fails.
export function renderPNG4K(renderer,scene,camera){
 const size=renderer.getSize({set(x,y){this.x=x;this.y=y;return this;}}),ratio=renderer.getPixelRatio();
 try{renderer.setPixelRatio(3840/Math.max(size.x,size.y));renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}
 finally{renderer.setPixelRatio(ratio);renderer.render(scene,camera);}
}

// Rasterize the actual DOM typography, including handwritten transforms and line breaks.
export async function renderPagePNG4K(renderer,scene,camera,root){
 await document.fonts.ready;
 const bounds=root.getBoundingClientRect(),scale=3840/Math.max(bounds.width,bounds.height);
 const canvas=document.createElement('canvas');canvas.width=Math.round(bounds.width*scale);canvas.height=Math.round(bounds.height*scale);
 const ctx=canvas.getContext('2d'),image=new Image();image.src=renderPNG4K(renderer,scene,camera);await image.decode();ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const copy=root.cloneNode(true),source=[root,...root.querySelectorAll('*')],target=[copy,...copy.querySelectorAll('*')];
 for(let i=0;i<source.length;i++){
  const style=getComputedStyle(source[i]);
  for(const property of style)target[i].style.setProperty(property,style.getPropertyValue(property));
 }
 copy.querySelectorAll('#world,#live,#loading,#error,#interaction-hint,dialog,.sr-only').forEach(el=>el.remove());
 copy.style.cssText+=`;position:relative;left:0;top:0;width:${bounds.width}px;height:${bounds.height}px;background:transparent;`;
 const save=copy.querySelector('#export');if(save){save.removeAttribute('disabled');save.style.opacity='1';}
 const font=await fetch(new URL('./assets/xiaolai-hand-v2.ttf',import.meta.url));
 if(!font.ok)throw new Error('Export font could not be loaded');
 const fontBlob=await font.blob();
 const fontData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(fontBlob);});
 const wrapper=document.createElement('div');wrapper.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
 const style=document.createElement('style');style.textContent=`@font-face{font-family:Xiaolai;src:url("${fontData}") format("truetype");font-weight:400}`;wrapper.append(style,copy);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${bounds.width} ${bounds.height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrapper)}</foreignObject></svg>`;
 const overlay=new Image();overlay.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await overlay.decode();ctx.drawImage(overlay,0,0,canvas.width,canvas.height);
 return canvas.toDataURL('image/png');
}
