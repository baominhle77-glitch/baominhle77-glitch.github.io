// Quyết 016 · cảnh riêng cho những vật/hành động HS mô tả cụ thể.
// Không phải bộ hiệu ứng đo điểm. Mỗi phác họa diễn tiến INPUT -> HÀNH ĐỘNG
// chính là thứ người nghe cần thấy; không có rung chữ, đổi màu nền hay nét quét.
const INK="#2E2A26",P="#EFE6D3",W="#FFF5E7",V="#7B3F98",RED="#9E3C77",NAVY="#172638",SEA="#67B8AA",GOLD="#E3B65D",STONE="#D1C1AE";
const U=(o,v)=>o.x+v*o.w,Y=(o,v)=>o.y+v*o.h;
function bar(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
function rr(c,x,y,w,h,col,r=12){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=col;c.fill();}
function line(c,x,y,xx,yy,col=INK,w=5){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.lineWidth=w;c.strokeStyle=col;c.stroke()}
function circ(c,x,y,r,col){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=col;c.fill()}
function arr(c,x,y,xx,yy,col=RED){line(c,x,y,xx,yy,col,9);let a=Math.atan2(yy-y,xx-x);for(const d of [-.47,.47])line(c,xx,yy,xx-22*Math.cos(a+d),yy-22*Math.sin(a+d),col,7)}
function cross(c,o){line(c,U(o,.25),Y(o,.23),U(o,.78),Y(o,.73),RED,16);line(c,U(o,.78),Y(o,.23),U(o,.25),Y(o,.73),RED,16)}
function paper(c,o){rr(c,U(o,.11),Y(o,.10),o.w*.78,o.h*.72,W);for(let i=0;i<7;i++)bar(c,U(o,.2),Y(o,.2+i*.07),o.w*(i%2?.3:.56),o.h*.01,"#B6AA9B")}
function stack(c,o,n=4){for(let i=0;i<n;i++){rr(c,U(o,.16+i*.11),Y(o,.19+i*.055),o.w*.30,o.h*.47,i%2?V:INK);for(let j=0;j<3;j++)bar(c,U(o,.19+i*.11),Y(o,.28+i*.055+j*.085),o.w*.19,o.h*.025,W)}}
function dots(c,o,n=25,sx=.18,sy=.25){
 for(let i=0;i<n;i++){let x=U(o,sx+((i*11)%19)/30),y=Y(o,sy+Math.floor(i/6)*.08);circ(c,x,y,7,i%4?V:SEA)}
}
function earth(c,o,x=.3,y=.5,r=.23){const a=c.createRadialGradient(U(o,x-r*.4),Y(o,y-r*.4),3,U(o,x),Y(o,y),r*o.h);a.addColorStop(0,"#AEE5D6");a.addColorStop(1,"#2D607B");circ(c,U(o,x),Y(o,y),r*o.h,a);}
function moon(c,o,x=.7,y=.4,r=.14){circ(c,U(o,x),Y(o,y),r*o.h,"#C0BDAD");circ(c,U(o,x-.025),Y(o,y-.02),r*o.h*.2,"#898F90")}
function stamp(rc,o,word,y=.49){
 const c=rc.ctx;let size=Math.max(30,Math.min(o.h*.17,o.w/(word.length*.67)));c.save();c.font="bold "+Math.round(size)+"px Georgia,serif";
 c.textBaseline="middle";c.textAlign="center";const x=U(o,.50),py=Y(o,y),wid=c.measureText(word).width;
 c.translate(x,py);c.rotate(-.095);c.strokeStyle=RED;c.lineWidth=7;
 c.strokeRect(-wid*.54,-size*.59,wid*1.08,size*1.18);c.fillStyle=RED;c.fillText(word,0,0);c.restore();
 // BBox conservative for 16:9 + 9:16, within x5%..95%, y shot upper 70%.
 rc.khungChu.push({text:word,lop:"giua",x0:x-wid*.60,y0:py-size*.7,x1:x+wid*.6,y1:py+size*.7,alpha:1});
}
function timeLine(c,o,n=6){line(c,U(o,.11),Y(o,.67),U(o,.89),Y(o,.67),INK,7);for(let i=0;i<n;i++){
 const xx=U(o,.16+i*.68/(n-1));circ(c,xx,Y(o,.67),11,V);line(c,xx,Y(o,.56),xx,Y(o,.79),V,3)}
}
function spheroid(c,o){earth(c,o,.3,.48,.30);moon(c,o,.75,.34,.18);
 c.strokeStyle=SEA;c.lineWidth=4;c.beginPath();c.ellipse(U(o,.53),Y(o,.46),o.w*.36,o.h*.26,-.08,0,Math.PI*2);c.stroke();}
const scenes={
 "h1:1":(rc,o,p)=>{const c=rc.ctx;if(p<.48){dots(c,o,37)}else{dots(c,o,13,.12,.56);arr(c,U(o,.24),Y(o,.40),U(o,.68),Y(o,.44),V);circ(c,U(o,.70),Y(o,.44),o.h*.23,GOLD)}},
 "h4:1":(rc,o,p)=>{const c=rc.ctx;paper(c,o);if(p<.48)stack(c,o,3);else{stamp(rc,o,"NOT VERIFIED");cross(c,o)}},
 "a2:2":(rc,o,p)=>{const c=rc.ctx;if(p<.48){dots(c,o,29);timeLine(c,o)}else{rr(c,U(o,.28),Y(o,.23),o.w*.46,o.h*.38,INK);for(let i=0;i<7;i++)circ(c,U(o,.35+i*.055),Y(o,.43),8,SEA);arr(c,U(o,.25),Y(o,.62),U(o,.51),Y(o,.45),RED)}},
 "a3:1":(rc,o,p)=>{const c=rc.ctx;paper(c,o);for(let i=0;i<4;i++)bar(c,U(o,.25+i*.14),Y(o,.36),o.w*.06,o.h*.15,INK);if(p>.45)stamp(rc,o,"NOT NASA DATA")},
 "a3:2":(rc,o,p)=>{const c=rc.ctx;bar(c,U(o,.14),Y(o,.17),o.w*.68,o.h*.65,NAVY);for(let i=0;i<4;i++){circ(c,U(o,.24+i*.15),Y(o,.39),18,p>.48?GOLD:SEA);line(c,U(o,.24+i*.15),Y(o,.5),U(o,.24+i*.15),Y(o,.68),W,4)}if(p>.48)rr(c,U(o,.32),Y(o,.60),o.w*.35,o.h*.14,INK)},
 "a4:0":(rc,o,p)=>{const c=rc.ctx;rr(c,U(o,.28),Y(o,.15),o.w*.44,o.h*.30,NAVY);for(let i=0;i<5;i++)circ(c,U(o,.34+i*.085),Y(o,.30),13,GOLD);if(p>.45){rr(c,U(o,.12),Y(o,.58),o.w*.30,o.h*.19,SEA);rr(c,U(o,.57),Y(o,.58),o.w*.30,o.h*.19,RED);arr(c,U(o,.5),Y(o,.43),U(o,.29),Y(o,.63));arr(c,U(o,.5),Y(o,.43),U(o,.72),Y(o,.63))}},
 "a4:2":(rc,o,p)=>{const c=rc.ctx;rr(c,U(o,.12),Y(o,.18),o.w*.33,o.h*.47,SEA);rr(c,U(o,.55),Y(o,.18),o.w*.33,o.h*.47,RED);rr(c,U(o,.42),Y(o,.28),o.w*.16,o.h*.25,W);if(p>.45){bar(c,U(o,.18),Y(o,.17),o.w*.20,o.h*.53,INK);bar(c,U(o,.62),Y(o,.17),o.w*.20,o.h*.53,INK)}},
 "a6:0":(rc,o,p)=>{const c=rc.ctx;paper(c,o);if(p>.4){for(let i=0;i<4;i++){bar(c,U(o,.21+i*.15),Y(o,.19),o.w*.12,o.h*.47,i%2?SEA:V);circ(c,U(o,.27+i*.15),Y(o,.45),15,GOLD)}}},
 "t2:1":(rc,o,p)=>{const c=rc.ctx;if(p<.48){dots(c,o,36,.14,.20)}else{for(let i=0;i<3;i++)rr(c,U(o,.15+i*.21),Y(o,.32),o.w*.17,o.h*.24,i%2?NAVY:V);arr(c,U(o,.47),Y(o,.45),U(o,.75),Y(o,.45));rr(c,U(o,.72),Y(o,.24),o.w*.13,o.h*.39,W)}},
 "b4:0":(rc,o,p)=>{const c=rc.ctx;timeLine(c,o,2);if(p<.5){rr(c,U(o,.10),Y(o,.16),o.w*.27,o.h*.26,NAVY);rr(c,U(o,.62),Y(o,.16),o.w*.27,o.h*.26,NAVY)}else{rr(c,U(o,.08),Y(o,.31),o.w*.27,o.h*.22,SEA);rr(c,U(o,.65),Y(o,.31),o.w*.27,o.h*.22,SEA)}},
 "b5:0":(rc,o,p)=>{const c=rc.ctx;rr(c,U(o,.12),Y(o,.10),o.w*.76,o.h*.68,NAVY);stamp(rc,o,"38,30",.37);if(p>.5){line(c,U(o,.15),Y(o,.66),U(o,.82),Y(o,.66),GOLD,8);for(let i=0;i<6;i++)bar(c,U(o,.19+i*.1),Y(o,.56),o.w*.04,o.h*(.04+i*.02),V)}},
 "b7:0":(rc,o,p)=>{const c=rc.ctx;if(p<.5)dots(c,o,31,.10,.24);else{for(let i=0;i<4;i++){rr(c,U(o,.10+i*.21),Y(o,.24+i%2*.15),o.w*.15,o.h*.35,i%2?NAVY:V);if(i<3)arr(c,U(o,.24+i*.21),Y(o,.44),U(o,.30+i*.21),Y(o,.44),GOLD)}}},
 "c3:0":(rc,o,p)=>{const c=rc.ctx;rr(c,U(o,.12),Y(o,.14),o.w*.76,o.h*.62,NAVY);if(p>.5){stamp(rc,o,"NORMAL POINT",.41);line(c,U(o,.67),Y(o,.25),U(o,.8),Y(o,.67),RED,12)}else{circ(c,U(o,.48),Y(o,.42),o.h*.24,GOLD)}},
 "c5:3":(rc,o,p)=>{const c=rc.ctx;rr(c,U(o,.10),Y(o,.16),o.w*.36,o.h*.54,NAVY);rr(c,U(o,.54),Y(o,.16),o.w*.36,o.h*.54,V);circ(c,U(o,.29),Y(o,.42),o.h*.12,GOLD);for(let i=0;i<5;i++)bar(c,U(o,.6+i*.04),Y(o,.30),o.w*.025,o.h*.27,W);if(p>.46){arr(c,U(o,.36),Y(o,.42),U(o,.63),Y(o,.42),RED);cross(c,o)}},
 "r1:2":(rc,o,p)=>{const c=rc.ctx;paper(c,o);if(p<.5)stack(c,o,3);else{rr(c,U(o,.11),Y(o,.26),o.w*.32,o.h*.43,NAVY);rr(c,U(o,.57),Y(o,.26),o.w*.32,o.h*.43,V);arr(c,U(o,.50),Y(o,.22),U(o,.28),Y(o,.42));arr(c,U(o,.5),Y(o,.22),U(o,.72),Y(o,.42))}},
 "r3:1":(rc,o,p)=>{const c=rc.ctx;rr(c,U(o,.14),Y(o,.19),o.w*.72,o.h*.52,NAVY);stamp(rc,o,"38,30",.43);if(p>.5){for(let i=0;i<8;i++)bar(c,U(o,.23+i*.075),Y(o,.68),o.w*.055,o.h*.045,GOLD)}},
 "r4:3":(rc,o,p)=>{const c=rc.ctx;rr(c,U(o,.22),Y(o,.15),o.w*.5,o.h*.44,NAVY);for(let i=0;i<8;i++)bar(c,U(o,.27+i*.052),Y(o,.3),o.w*.026,o.h*.15,GOLD);if(p>.5){rr(c,U(o,.26),Y(o,.53),o.w*.48,o.h*.16,W);cross(c,o)}},
 "c6:0":(rc,o,p)=>{const c=rc.ctx;paper(c,o);for(let i=0;i<3;i++){rr(c,U(o,.2),Y(o,.21+i*.17),o.w*.60,o.h*.12,i%2?STONE:W);circ(c,U(o,.25),Y(o,.27+i*.17),14,V)}if(p>.5)stamp(rc,o,"NOT VERIFIED",.49)},
 "t1:1":(rc,o,p)=>{const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,NAVY);spheroid(c,o);if(p>.49){arr(c,U(o,.32),Y(o,.48),U(o,.72),Y(o,.35),SEA);circ(c,U(o,.69),Y(o,.37),19,GOLD)}},
 "b3:0":(rc,o,p)=>{const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,NAVY);earth(c,o,.48,.43,.30);c.strokeStyle=SEA;c.lineWidth=18;c.beginPath();c.arc(U(o,.48),Y(o,.43),o.h*.34,.1,Math.PI*1.9);c.stroke();if(p>.5)arr(c,U(o,.36),Y(o,.62),U(o,.76),Y(o,.17),GOLD)},
 "b6:3":(rc,o,p)=>{const c=rc.ctx;bar(c,U(o,.10),Y(o,.14),o.w*.40,o.h*.55,W);bar(c,U(o,.55),Y(o,.14),o.w*.35,o.h*.55,NAVY);timeLine(c,o,4);if(p>.5)cross(c,o)},
 "c5:0":(rc,o,p)=>{const c=rc.ctx;for(let i=0;i<8;i++){c.strokeStyle=i%2?V:INK;c.lineWidth=12;c.beginPath();c.arc(U(o,.33),Y(o,.45),o.h*(.08+i*.038),-.6,1.4);c.stroke()}if(p>.5){moon(c,o,.76,.4,.18);line(c,U(o,.52),Y(o,.2),U(o,.52),Y(o,.72),RED,9)}},
 "b5:2":(rc,o,p)=>{const c=rc.ctx;paper(c,o);bar(c,U(o,.18),Y(o,.22),o.w*.5,o.h*.08,INK);for(let i=0;i<6;i++)bar(c,U(o,.18),Y(o,.34+i*.065),o.w*(i%2?.50:.62),o.h*.018,STONE);if(p>.5)rr(c,U(o,.65),Y(o,.22),o.w*.17,o.h*.49,V)},
 "r2:0":(rc,o,p)=>{const c=rc.ctx;bar(c,o.x,o.y,o.w,o.h,NAVY);spheroid(c,o);if(p>.5){arr(c,U(o,.7),Y(o,.35),U(o,.32),Y(o,.48),GOLD)}else arr(c,U(o,.32),Y(o,.48),U(o,.7),Y(o,.35),SEA)},
 "t3:0":(rc,o,p)=>{const c=rc.ctx;for(let i=0;i<3;i++){rr(c,U(o,.07+i*.30),Y(o,.15),o.w*.26,o.h*.59,i%2?NAVY:V);circ(c,U(o,.20+i*.30),Y(o,.43),o.h*.14,i===0?STONE:i===1?GOLD:SEA)}if(p>.5)for(let i=0;i<3;i++)arr(c,U(o,.20+i*.3),Y(o,.44),U(o,.50),Y(o,.75),RED)},
 "c4:0":(rc,o,p)=>{const c=rc.ctx;timeLine(c,o);for(let i=0;i<6;i++)circ(c,U(o,.22+i*.1),Y(o,.5+Math.sin(i)*.09),12,SEA);if(p>.46){line(c,U(o,.16),Y(o,.55),U(o,.82),Y(o,.33),RED,8);cross(c,o)}},
 "a1:3":(rc,o,p,img)=>{const c=rc.ctx;if(img.complete&&img.naturalWidth){c.drawImage(img,857,127,363,383,U(o,.06),Y(o,.04),o.w*.9,o.h*.82);if(p>.5){c.strokeStyle=RED;c.lineWidth=9;c.beginPath();c.ellipse(U(o,.55),Y(o,.59),o.w*.18,o.h*.12,0,0,Math.PI*2);c.stroke()}}},
 "s8:0":(rc,o,p)=>{const c=rc.ctx;timeLine(c,o);c.strokeStyle=V;c.lineWidth=14;c.strokeRect(U(o,.13+p*.40),Y(o,.28),o.w*.28,o.h*.42)},
 "k1:1":(rc,o,p,img)=>{const c=rc.ctx;if(p<.49&&img.complete&&img.naturalWidth)c.drawImage(img,857,127,363,383,U(o,.08),Y(o,.06),o.w*.78,o.h*.75);else{paper(c,o);dots(c,o,28);timeLine(c,o)}},
 "r1:0":(rc,o,p)=>{const c=rc.ctx;paper(c,o);for(let i=0;i<6;i++)rr(c,U(o,.17+i%3*.23),Y(o,.23+Math.floor(i/3)*.25),o.w*.16,o.h*.15,i%2?V:NAVY);if(p>.5){arr(c,U(o,.38),Y(o,.58),U(o,.67),Y(o,.35),RED);rr(c,U(o,.66),Y(o,.30),o.w*.18,o.h*.30,W)}}
};
export function veTranhRieng(rc,o,s,p,img){
 const painter=scenes[s.id+":"+s.si];
 if(!painter)return false;
 rc.ctx.save();
 painter(rc,o,p,img);
 rc.ctx.restore();
 return true;
}
