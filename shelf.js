import * as THREE from './vendor/three.module.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export const SHELF={width:6.0,height:7.06,baseY:.28,levels:[.62,2.90,5.18],offsetY:-.38,offsetZ:-1.2,bookScale:.238};
const ramp=new THREE.DataTexture(new Uint8Array([158,218,255]),3,1,THREE.RedFormat);
ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
const outline=new THREE.LineBasicMaterial({color:'#344637',transparent:true,opacity:.66});
const toon=(color,extra={})=>new THREE.MeshToonMaterial({color,gradientMap:ramp,side:THREE.DoubleSide,...extra});
const boardMat=toon('#b68b59'),edgeMat=toon('#dac58f'),woodMat=toon('#c7ac7d');
function mesh(p,geo,mat,x=0,y=0,z=0){const n=new THREE.Mesh(geo,mat);n.position.set(x,y,z);n.castShadow=n.receiveShadow=true;p.add(n);if(geo.type!=='TubeGeometry')n.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,36),outline));return n;}
function box(p,w,h,d,mat,x=0,y=0,z=0){return mesh(p,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
function tube(p,points,radius,mat){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>V(...a))),24,radius,6,false),mat);}
function procedural(w,h,draw){if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function makeShelf(){
 const g=new THREE.Group();g.name='参考书架 / 暖棕背板与三层彩色托边';
 const back=box(g,6,SHELF.height,.15,boardMat,0,SHELF.baseY+SHELF.height/2,-.08);back.name='参考背板 / 高宽比520比442';
 const colors=['#5684ba','#a9c0b6','#e9cf90'];
 SHELF.levels.forEach((y,i)=>{
  const shelf=new THREE.Group();shelf.name=['底层蓝色托边','中层灰绿色托边','上层米黄色托边'][i];g.add(shelf);
  const depth=1.18,front=depth-.043;box(shelf,6.12,.07,depth,edgeMat,0,y,depth/2-.07);const lip=box(shelf,6.22,.25,.075,toon(colors[i]),0,y+.085,front);lip.name='托边前挡条';
 });
 for(const x of [-2.76,2.76])box(g,.10,.32,.48,boardMat,x,.16,-.015);
 return g;
}
function bentLeg(p,angle){
 const radial=V(Math.cos(angle),0,Math.sin(angle)),side=V(-Math.sin(angle),0,Math.cos(angle));
 const curve=new THREE.CatmullRomCurve3([radial.clone().multiplyScalar(.93).setY(.015),radial.clone().multiplyScalar(.91).setY(1.65),radial.clone().multiplyScalar(.83).setY(2.32),radial.clone().multiplyScalar(.65).setY(2.55),radial.clone().multiplyScalar(.30).setY(2.55)]);
 const pos=[],indices=[];for(let i=0;i<=40;i++){const u=i/40,point=curve.getPoint(u),tangent=curve.getTangent(u),normal=new THREE.Vector3().crossVectors(side,tangent).normalize();
  for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const v=point.clone().addScaledVector(side,a*.105).addScaledVector(normal,b*.038);pos.push(v.x,v.y,v.z);}
  if(i<40)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}
 }
 indices.push(0,2,1,0,3,2,160,161,162,160,162,163);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();const leg=mesh(p,geo,woodMat);leg.name='弯曲胶合板凳腿';
 for(const offset of [-.025,0,.025]){const points=[];for(let i=0;i<=40;i++){const u=i/40,pt=curve.getPoint(u),n=new THREE.Vector3().crossVectors(side,curve.getTangent(u)).normalize();points.push(pt.addScaledVector(side,.106).addScaledVector(n,offset));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#927144',transparent:true,opacity:.7}));p.add(line);}
}
function leafTexture(){return procedural(256,512,(c,w,h)=>{c.fillStyle='#91a657';c.fillRect(0,0,w,h);
 c.strokeStyle='#657e51';c.lineWidth=1.8;c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.stroke();for(let y=55;y<500;y+=37)for(const sign of [-1,1]){c.beginPath();c.moveTo(w/2,y);c.quadraticCurveTo(w/2+sign*65,y-20,w/2+sign*120,y-65);c.stroke();}
 });}
export function makeShelfPlant(){
 const g=new THREE.Group();g.name='参考盆栽 / 弯木凳与白色细纹花盆';g.position.set(-3.9,0,1.28);g.scale.setScalar(.5);
 mesh(g,new THREE.CylinderGeometry(.94,.94,.14,64),woodMat,0,2.59,0).name='圆形木凳坐面';
 for(const a of [Math.PI*.25,Math.PI*.75,Math.PI*1.25,Math.PI*1.75])bentLeg(g,a);
 const potMat=toon('#fff8ea');
 const profile=[[.58,0],[.65,.035],[.68,.15],[.70,.98],[.71,1.22],[.69,1.28],[.65,1.28],[.64,1.19],[.64,.94]].map(([x,y])=>new THREE.Vector2(x,y));
 mesh(g,new THREE.LatheGeometry(profile,64),potMat,0,2.66,0).name='白色细纹花盆';
 const rim=mesh(g,new THREE.TorusGeometry(.68,.025,8,48),potMat,0,3.925,0);rim.rotation.x=Math.PI/2;rim.name='花盆圆润收口';
 mesh(g,new THREE.CylinderGeometry(.64,.64,.025,48),toon('#3b3424'),0,3.84,0);
 const crown=new THREE.Group();crown.name='向四面展开的阔叶';crown.userData.sway=.008;g.add(crown);
 const leafMat=toon('#ffffff',{map:leafTexture()});
 const specs=[[-1.95,4.18,.25,1.12,.34],[-1.0,5.65,-.2,1.65,.43],[-.38,5.90,-.25,1.75,.48],[.64,5.78,-.1,1.62,.48],[1.35,5.10,-.12,1.50,.40],[1.72,4.18,.2,1.12,.33],[-1.12,4.48,.68,1.02,.32],[-.40,5.04,.82,1.3,.38],[.63,4.98,.85,1.18,.37],[.98,3.92,.60,.9,.31],[-.10,5.40,.30,1.38,.40],[.32,4.10,1.05,.91,.30]];
 for(let k=0;k<specs.length;k++){
  const [x,y,z,len,width]=specs[k],tip=V(x,y,z),base=V(x*.28,Math.max(3.98,y-len*.85),z*.15);
  tube(crown,[[0,3.84,0],[x*.2,4.05,z*.25],base.toArray()],.016,toon('#42602b'));
  const dir=tip.clone().sub(base).normalize(),across=new THREE.Vector3().crossVectors(dir,V(0,0,1)).normalize();if(across.lengthSq()<.1)across.set(1,0,0);across.applyAxisAngle(dir,Math.sin(k*2.37)*.75);
  const positions=[],uvs=[],ix=[];for(let i=0;i<=20;i++)for(let j=0;j<=10;j++){
   const t=i/20,s=j/10,lateral=(s-.5)*2,widthAt=Math.pow(Math.sin(Math.PI*t),.78)*width;
   const v=base.clone().lerp(tip,t).addScaledVector(across,lateral*widthAt);v.z+=Math.sin(Math.PI*t)*(.16-.13*lateral*lateral)+Math.sin(t*12+k)*.018*lateral;positions.push(v.x,v.y,v.z);uvs.push(s,t);
   if(i<20&&j<10){const a=i*11+j;ix.push(a,a+1,a+11,a+1,a+12,a+11);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(ix);geometry.computeVertexNormals();mesh(crown,geometry,leafMat).name='带叶脉的弧面阔叶';
 }
 return g;
}
export function shelfBookPlacement(level=2){
 const scale=SHELF.bookScale,rotation=new THREE.Euler(Math.PI/3,0,0,'ZYX'),matrix=new THREE.Matrix4().makeRotationFromEuler(rotation);
 let minY=Infinity,minZ=Infinity;for(const x of [-.045,6.045])for(const y of [-.285,.19])for(const z of [-3.59,3.59]){const p=V(x,y,z).applyMatrix4(matrix).multiplyScalar(scale);minY=Math.min(minY,p.y);minZ=Math.min(minZ,p.z);}
 const center=V(3,0,0).applyMatrix4(matrix).multiplyScalar(scale);
 return {scale,rotation,position:V(.45-center.x,SHELF.offsetY+SHELF.levels[level]+.035-minY,SHELF.offsetZ+.005-minZ)};
}
