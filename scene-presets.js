// Stable IDs keep existing city books and their photos attached to the same scenes.
export const SCENE_PRESETS=[
 {id:0,key:'street',name:'街头晃悠所',poem:'下一页，往哪走？\n走错路，也挺好。',titleAsset:2},
 {id:1,key:'pause',name:'发呆补给站',poem:'坐一会儿，\n也算出发。',titleAsset:3},
 {id:2,key:'keepsake',name:'我的小确幸',poem:'把今天喜欢的小事，\n夹进这一页。',titleAsset:4},
 {id:3,key:'kv',name:'把城市翻开',poem:'沿着楼梯慢慢走，\n总有一处，适合停留。',titleAsset:null},
 {id:4,key:'riverside',name:'河边放空',poem:'让风先走，\n我们在河边坐一会儿。',titleAsset:null},
 {id:5,key:'garden',name:'口袋花园',poem:'不用走很远，\n小小一片绿，也能待一下午。',titleAsset:null},
 {id:6,key:'rooftop',name:'屋顶晚风',poem:'把忙碌留在楼下，\n上来吹一会儿风。',titleAsset:null}
];
export const DEFAULT_PAGES=[3,0,1,4,5,6,2];
export function normalizePages(value){const pages=Array.isArray(value)?value.filter(id=>Number.isInteger(id)&&SCENE_PRESETS.some(p=>p.id===id)).slice(0,10):[];return pages.length?pages:[...DEFAULT_PAGES];}
