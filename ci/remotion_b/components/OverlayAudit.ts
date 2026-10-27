/** Shared inventory: leaf graphics outside text panels and physical media.
 * Untagged CSS bars/SVG lines are included automatically, rather than silently
 * treating an empty producer-written list as proof that overlays do not exist.
 */
export function measureNonTextOverlays(){
 const nodes=[...document.querySelectorAll('div,svg line,svg path,svg rect,svg circle,svg polygon,svg polyline')];
 return nodes.flatMap((el,i)=>{
  if(el.closest('[data-image-layer],[data-audit],[data-physical-actor]'))return [];
  if(el.children.length||el.textContent?.trim())return [];
  const style=getComputedStyle(el),svg=el.namespaceURI.includes('svg');
  const color=svg?(style.stroke!=='none'?style.stroke:style.fill):style.backgroundColor;
  const rgba=color.match(/[\d.]+/g)?.map(Number);const r=el.getBoundingClientRect();
  if(!rgba||rgba.length<3||(rgba.length===4&&rgba[3]<.5)||r.width<2||r.height<2)return [];
  const hex='#'+rgba.slice(0,3).map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
  return [{id:el.getAttribute('data-audit-overlay')||'graphic-'+i,x:r.x,y:r.y,w:r.width,h:r.height,palette:[hex]}];
 });
}
