/* ================= BÓI TOÁN — LOGIC ================= */
"use strict";
var CAN=["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
var CHI=["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
var GIO_LABEL=["Tý (23–1h)","Sửu (1–3h)","Dần (3–5h)","Mão (5–7h)","Thìn (7–9h)","Tỵ (9–11h)","Ngọ (11–13h)","Mùi (13–15h)","Thân (15–17h)","Dậu (17–19h)","Tuất (19–21h)","Hợi (21–23h)"];
var TZ=7;

/* ---------- Âm lịch (thuật toán Hồ Ngọc Đức) ---------- */
function INT(x){return Math.floor(x);}
function jdFromDate(dd,mm,yy){
  var a=INT((14-mm)/12),y=yy+4800-a,m=mm+12*a-3;
  var jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-INT(y/100)+INT(y/400)-32045;
  if(jd<2299161){jd=dd+INT((153*m+2)/5)+365*y+INT(y/4)-32083;}
  return jd;
}
function getNewMoonDay(k,tz){
  var T=k/1236.85,T2=T*T,T3=T2*T,dr=Math.PI/180;
  var Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;
  Jd1+=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*dr);
  var M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3;
  var Mpr=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3;
  var F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;
  var C1=(0.1734-0.000393*T)*Math.sin(M*dr)+0.0021*Math.sin(2*dr*M);
  C1=C1-0.4068*Math.sin(Mpr*dr)+0.0161*Math.sin(dr*2*Mpr);
  C1=C1-0.0004*Math.sin(dr*3*Mpr);
  C1=C1+0.0104*Math.sin(dr*2*F)-0.0051*Math.sin(dr*(M+Mpr));
  C1=C1-0.0074*Math.sin(dr*(M-Mpr))+0.0004*Math.sin(dr*(2*F+M));
  C1=C1-0.0004*Math.sin(dr*(2*F-M))-0.0006*Math.sin(dr*(2*F+Mpr));
  C1=C1+0.0010*Math.sin(dr*(2*F-Mpr))+0.0005*Math.sin(dr*(2*Mpr+M));
  var deltat;
  if(T<-11){deltat=0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3;}
  else{deltat=-0.000278+0.000265*T+0.000262*T2;}
  return INT(Jd1+C1-deltat+0.5+tz/24);
}
function getSunLongitudeDeg(jd,tz){
  var T=(jd-2451545.5-tz/24)/36525,T2=T*T,dr=Math.PI/180;
  var M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2;
  var L0=280.46645+36000.76983*T+0.0003032*T2;
  var DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M);
  DL+=(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.000290*Math.sin(dr*3*M);
  var L=(L0+DL)%360; if(L<0)L+=360;
  return L;
}
function getSunLongitude(jd,tz){return INT(getSunLongitudeDeg(jd,tz)/30);}
function getLunarMonth11(yy,tz){
  var off=jdFromDate(31,12,yy)-2415021;
  var k=INT(off/29.530588853);
  var nm=getNewMoonDay(k,tz);
  if(getSunLongitude(nm,tz)>=9){nm=getNewMoonDay(k-1,tz);}
  return nm;
}
function getLeapMonthOffset(a11,tz){
  var k=INT((a11-2415021.076998695)/29.530588853+0.5);
  var last=0,i=1,arc=getSunLongitude(getNewMoonDay(k+i,tz),tz);
  do{last=arc;i++;arc=getSunLongitude(getNewMoonDay(k+i,tz),tz);}while(arc!=last&&i<14);
  return i-1;
}
function solar2lunar(dd,mm,yy){
  var tz=TZ,dayNumber=jdFromDate(dd,mm,yy);
  var k=INT((dayNumber-2415021.076998695)/29.530588853);
  var monthStart=getNewMoonDay(k+1,tz);
  if(monthStart>dayNumber){monthStart=getNewMoonDay(k,tz);}
  var a11=getLunarMonth11(yy,tz),b11=a11,lunarYear;
  if(a11>=monthStart){lunarYear=yy;a11=getLunarMonth11(yy-1,tz);}
  else{lunarYear=yy+1;b11=getLunarMonth11(yy+1,tz);}
  var lunarDay=dayNumber-monthStart+1;
  var diff=INT((monthStart-a11)/29);
  var lunarLeap=0,lunarMonth=diff+11;
  if(b11-a11>365){
    var leapMonthDiff=getLeapMonthOffset(a11,tz);
    if(diff>=leapMonthDiff){lunarMonth=diff+10;if(diff==leapMonthDiff){lunarLeap=1;}}
  }
  if(lunarMonth>12){lunarMonth-=12;}
  if(lunarMonth>=11&&diff<4){lunarYear-=1;}
  return {d:lunarDay,m:lunarMonth,y:lunarYear,leap:lunarLeap,jd:dayNumber};
}
/* ---------- Can chi ---------- */
function canChiYear(y){return CAN[(y+6)%10]+" "+CHI[(y+8)%12];}
function canChiDay(jd){return CAN[(jd+9)%10]+" "+CHI[(jd+1)%12];}
function canChiMonth(lm,ly){return CAN[(ly*12+lm+3)%10]+" "+CHI[(lm+1)%12];}
/* Nạp âm 60 hoa giáp — 30 tên, mỗi tên 2 năm */
var NAPAM_NAMES=["Hải Trung Kim","Lư Trung Hỏa","Đại Lâm Mộc","Lộ Bàng Thổ","Kiếm Phong Kim","Sơn Đầu Hỏa","Giản Hạ Thủy","Thành Đầu Thổ","Bạch Lạp Kim","Dương Liễu Mộc","Tuyền Trung Thủy","Ốc Thượng Thổ","Tích Lịch Hỏa","Tùng Bách Mộc","Trường Lưu Thủy","Sa Trung Kim","Sơn Hạ Hỏa","Bình Địa Mộc","Bích Thượng Thổ","Kim Bạch Kim","Phú Đăng Hỏa","Thiên Hà Thủy","Đại Dịch Thổ","Thoa Xuyến Kim","Tang Đố Mộc","Đại Khê Thủy","Sa Trung Thổ","Thiên Thượng Hỏa","Thạch Lựu Mộc","Đại Hải Thủy"];
function napAm(can,chi){
  var p=(6*can-5*chi+60)%60;
  return NAPAM_NAMES[INT(p/2)];
}
function hanhOfNapAm(name){return name.split(" ").pop();}

/* ---------- Xem ngày ---------- */
var GIO_HD=[[0,1,3,6,8,9],[2,3,5,8,10,11],[0,1,4,5,7,10],[0,2,3,6,7,9],[2,4,5,8,9,11],[1,4,6,7,10,11]];
var SAO_NGAY=[["Thanh Long",1],["Minh Đường",1],["Thiên Hình",0],["Chu Tước",0],["Kim Quỹ",1],["Kim Đường (Bảo Quang)",1],["Bạch Hổ",0],["Ngọc Đường",1],["Thiên Lao",0],["Huyền Vũ",0],["Tư Mệnh",1],["Câu Trận",0]];
var TRUC=[["Kiến","Tốt cho khởi công, nhậm chức, xuất hành; kỵ động thổ, chôn cất."],
["Trừ","Tốt cho trừ bỏ cái cũ, chữa bệnh, dọn dẹp; kỵ cưới hỏi, khai trương."],
["Mãn","Tốt cho cầu tài, khai trương, ký kết; kỵ kiện tụng, nhậm chức."],
["Bình","Ngày bình hoà, tốt cho hoà giải, sửa đường; việc lớn nên chọn ngày khác."],
["Định","Tốt cho cưới hỏi, ký hợp đồng, mua gia súc; kỵ kiện tụng, xuất quân."],
["Chấp","Tốt cho tuyển người, săn bắt, xây dựng nhỏ; kỵ dời nhà, xuất hành xa."],
["Phá","Xấu cho hầu hết mọi việc; chỉ hợp phá dỡ, chấm dứt điều cũ."],
["Nguy","Ngày cần thận trọng; hợp cúng lễ, an tĩnh; kỵ leo cao, đi thuyền, mạo hiểm."],
["Thành","Tốt cho khai trương, nhập học, cưới hỏi, kết giao; kỵ kiện tụng."],
["Thu","Tốt cho thu hoạch, đòi nợ, tích trữ; kỵ khai trương, cho vay."],
["Khai","Tốt cho khai trương, động thổ, cưới hỏi, xuất hành; kỵ an táng."],
["Bế","Xấu, vạn sự bế tắc; chỉ hợp đắp đê, lấp hố, kết thúc việc."]];
function xemNgay(dd,mm,yy,birthYear){
  var lu=solar2lunar(dd,mm,yy);
  var jd=lu.jd, dayCan=(jd+9)%10, dayChi=(jd+1)%12;
  var monthChi=(lu.m+1)%12;
  var startChi=((monthChi-2+12)*2)%12;
  var sao=SAO_NGAY[(dayChi-startChi+24)%12];
  var truc=TRUC[(dayChi-monthChi+24)%12];
  var gio=GIO_HD[dayChi%6];
  var xungChi=(dayChi+6)%12;
  var res={lu:lu,dayCC:canChiDay(jd),monthCC:canChiMonth(lu.m,lu.y),yearCC:canChiYear(lu.y),
    napam:napAm((jd+9)%10,(jd+1)%12),sao:sao,truc:truc,gio:gio,dayChi:dayChi,xungChi:xungChi,xungTuoi:null};
  if(birthYear&&birthYear>1900){
    var bChi=(birthYear+8)%12;
    res.birthCC=canChiYear(birthYear);
    res.xungTuoi=(bChi===xungChi);
  }
  return res;
}

/* ---------- Ngẫu nhiên ---------- */
function rnd(n){
  if(window.crypto&&crypto.getRandomValues){
    var b=new Uint32Array(1);crypto.getRandomValues(b);return b[0]%n;
  }
  return Math.floor(Math.random()*n);
}
function shuffleDraw(arr,count){
  var idx=arr.map(function(_,i){return i;}),out=[];
  for(var i=0;i<count&&idx.length;i++){out.push(idx.splice(rnd(idx.length),1)[0]);}
  return out;
}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- Tử Vi ---------- */
var CUC_NUM={"Thủy":2,"Mộc":3,"Kim":4,"Thổ":5,"Hỏa":6};
var CUC_TEN={2:"Thủy Nhị Cục",3:"Mộc Tam Cục",4:"Kim Tứ Cục",5:"Thổ Ngũ Cục",6:"Hỏa Lục Cục"};
var HOUSES=["Mệnh","Phụ Mẫu","Phúc Đức","Điền Trạch","Quan Lộc","Nô Bộc","Thiên Di","Tật Ách","Tài Bạch","Tử Tức","Phu Thê","Huynh Đệ"];
var LOC_TON=[2,3,5,6,5,6,8,9,11,0];
var KHOI=[1,0,11,11,1,0,1,6,3,3], VIET=[7,8,9,9,7,8,7,2,5,5];
var HOA_TABLE={0:["Liêm Trinh","Phá Quân","Vũ Khúc","Thái Dương"],1:["Thiên Cơ","Thiên Lương","Tử Vi","Thái Âm"],2:["Thiên Đồng","Thiên Cơ","Văn Xương","Liêm Trinh"],3:["Thái Âm","Thiên Đồng","Thiên Cơ","Cự Môn"],4:["Tham Lang","Thái Âm","Hữu Bật","Thiên Cơ"],5:["Vũ Khúc","Tham Lang","Thiên Lương","Văn Khúc"],6:["Thái Dương","Vũ Khúc","Thiên Đồng","Thái Âm"],7:["Cự Môn","Thái Dương","Văn Khúc","Văn Xương"],8:["Thiên Lương","Tử Vi","Tả Phụ","Vũ Khúc"],9:["Phá Quân","Cự Môn","Thái Âm","Tham Lang"]};
function lapLaSo(dd,mm,yy,hourChi,gender){
  var lu=solar2lunar(dd,mm,yy);
  var yCan=(lu.y+6)%10, yChi=(lu.y+8)%12;
  var m=lu.m, d=lu.d, h=hourChi;
  var menh=((2+(m-1)-h)%12+12)%12;
  var than=(2+(m-1)+h)%12;
  /* Cục: nạp âm của can-chi cung Mệnh (ngũ hổ độn) */
  var canDan=((yCan%5)*2+2)%10;
  var canMenh=(canDan+((menh-2+12)%12))%10;
  var napamMenhCung=napAm(canMenh,menh);
  var cuc=CUC_NUM[hanhOfNapAm(napamMenhCung)];
  /* An Tử Vi */
  var mth=Math.ceil(d/cuc), k=mth*cuc-d;
  var tv=((2+(mth-1)+(k%2===1?-k:k))%12+12)%12;
  var stars={}; for(var i=0;i<12;i++)stars[i]={maj:[],min:[],van:[]};
  function addMaj(name,pos){stars[((pos)%12+12)%12].maj.push(name);}
  function addMin(name,pos){stars[((pos)%12+12)%12].min.push(name);}
  addMaj("Tử Vi",tv);addMaj("Thiên Cơ",tv-1);addMaj("Thái Dương",tv-3);
  addMaj("Vũ Khúc",tv-4);addMaj("Thiên Đồng",tv-5);addMaj("Liêm Trinh",tv-8);
  var tf=((4-tv)%12+12)%12;
  addMaj("Thiên Phủ",tf);addMaj("Thái Âm",tf+1);addMaj("Tham Lang",tf+2);
  addMaj("Cự Môn",tf+3);addMaj("Thiên Tướng",tf+4);addMaj("Thiên Lương",tf+5);
  addMaj("Thất Sát",tf+6);addMaj("Phá Quân",tf+10);
  /* Phụ tinh */
  addMin("Tả Phụ",4+(m-1));addMin("Hữu Bật",10-(m-1));
  addMin("Văn Xương",10-h);addMin("Văn Khúc",4+h);
  var lt=LOC_TON[yCan];addMin("Lộc Tồn",lt);addMin("Kình Dương",lt+1);addMin("Đà La",lt-1);
  addMin("Địa Kiếp",11+h);addMin("Địa Không",11-h);
  addMin("Thiên Khôi",KHOI[yCan]);addMin("Thiên Việt",VIET[yCan]);
  var hoaStart={2:[1,3],8:[2,10],0:[2,10],5:[3,10],9:[3,10],11:[9,10],3:[9,10],7:[9,10],6:[1,3],10:[1,3],4:[2,10],1:[3,10]};
  var hs=hoaStart[yChi]||[1,3];
  addMin("Hỏa Tinh",hs[0]+h);addMin("Linh Tinh",hs[1]+h);
  /* Tứ hóa */
  var hoa=HOA_TABLE[yCan], hoaNames=["Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ"];
  /* Tuần — Triệt */
  var s=(yChi-yCan+12)%12;
  var tuan=[(s+10)%12,(s+11)%12];
  var triet=[[8,9],[6,7],[4,5],[2,3],[0,1]][yCan%5];
  /* Đại vận */
  var duong=(yCan%2===0);
  var thuan=(duong&&gender==="nam")||(!duong&&gender==="nu");
  var daivan={};
  for(i=0;i<12;i++){
    var cell=thuan?(menh+i)%12:((menh-i)%12+12)%12;
    daivan[cell]=cuc+10*i;
  }
  var houses={};
  for(i=0;i<12;i++){houses[(menh+i)%12]=HOUSES[i];}
  return {lu:lu,yCan:yCan,yChi:yChi,menh:menh,than:than,cuc:cuc,napamNam:napAm(yCan,yChi),
    stars:stars,hoa:hoa,hoaNames:hoaNames,tuan:tuan,triet:triet,daivan:daivan,houses:houses,
    duong:duong,thuan:thuan,gender:gender,hourChi:hourChi};
}

/* ---------- Kinh Dịch ---------- */
function hexFromLines(lines){
  var lo=lines[0].v+lines[1].v*2+lines[2].v*4;
  var hi=lines[3].v+lines[4].v*2+lines[5].v*4;
  return {no:HEXMAP[lo][hi],lo:lo,hi:hi};
}
function tossLine(){
  var coins=[],sum=0;
  for(var i=0;i<3;i++){var c=rnd(2);coins.push(c);sum+=(c?3:2);}
  return {coins:coins,sum:sum,v:(sum===7||sum===9)?1:0,moving:(sum===6||sum===9)};
}

/* ---------- Chiêm tinh ---------- */
function jdWithTime(dd,mm,yy,hh,mi){
  return jdFromDate(dd,mm,yy)-0.5+(hh-TZ)/24+mi/1440;
}
function sunSign(jdt){
  var lon=getSunLongitudeDeg(jdt+0.5,0); /* độ hoàng kinh mặt trời */
  return INT(lon/30)%12;
}
function moonSign(jdt){
  var d=jdt-2451545.0,dr=Math.PI/180;
  var L=218.316+13.176396*d, M=134.963+13.064993*d;
  var lon=(L+6.289*Math.sin(M*dr))%360; if(lon<0)lon+=360;
  return INT(lon/30)%12;
}
/* getSunLongitudeDeg nhận jd nguyên + tz; viết lại cho jd thực */
function sunLongAt(jdReal){
  var T=(jdReal-2451545.0)/36525,T2=T*T,dr=Math.PI/180;
  var M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2;
  var L0=280.46645+36000.76983*T+0.0003032*T2;
  var DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M);
  DL+=(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.000290*Math.sin(dr*3*M);
  var L=(L0+DL)%360;if(L<0)L+=360;return L;
}

/* ================= GIAO DIỆN ================= */
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function go(name){
  document.querySelectorAll(".screen").forEach(function(s){s.classList.remove("active");});
  var scr=$("scr-"+name); if(scr)scr.classList.add("active");
  document.querySelectorAll("nav button").forEach(function(b){b.classList.toggle("on",b.dataset.go===name);});
  window.scrollTo(0,0);
  if(name==="lichsu")renderHistory();
}
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-go]");
  if(t){go(t.dataset.go);return;}
  var chip=e.target.closest(".chip");
  if(chip&&chip.parentElement.classList.contains("chips")){
    chip.parentElement.querySelectorAll(".chip").forEach(function(c){c.classList.remove("on");});
    chip.classList.add("on");
    if(chip.parentElement.id==="browseTabs")renderBrowse();
  }
});
function chipVal(groupId){var c=$(groupId).querySelector(".chip.on");return c?c.dataset.v:null;}

/* ---------- Lịch sử ---------- */
function saveHistory(mod,q,summary){
  try{
    var h=JSON.parse(localStorage.getItem("bt_history")||"[]");
    h.unshift({t:Date.now(),mod:mod,q:q||"",s:summary});
    if(h.length>100)h.length=100;
    localStorage.setItem("bt_history",JSON.stringify(h));
  }catch(e){}
}
function renderHistory(){
  var h=[];try{h=JSON.parse(localStorage.getItem("bt_history")||"[]");}catch(e){}
  $("histList").innerHTML=h.length?h.map(function(it){
    var d=new Date(it.t);
    return '<div class="hitem"><div class="hd">'+d.toLocaleString("vi-VN")+' · '+esc(it.mod)+'</div>'+
      (it.q?'<div class="hq">«'+esc(it.q)+'»</div>':'')+
      '<div>'+esc(it.s)+'</div></div>';
  }).join(""):'<p class="note center">Chưa có lần gieo nào.</p>';
}
$("histClear").addEventListener("click",function(){
  localStorage.removeItem("bt_history");renderHistory();
});

/* ---------- Thẻ bài ---------- */
function cardHTML(glyph,name,pos,rev){
  return '<div class="tcard'+(rev?' rev':'')+'">'+
    (pos?'<span class="pos">'+esc(pos)+'</span>':'')+
    '<span class="glyph">'+glyph+'</span><span class="nm">'+esc(name)+'</span>'+
    (rev?'<span class="rv">(ngược)</span>':'')+'</div>';
}
function meaningHTML(title,posLabel,body){
  return '<div class="meaning"><div class="mt">'+esc(title)+'</div>'+
    (posLabel?'<div class="mp">'+esc(posLabel)+'</div>':'')+
    '<div class="mb">'+esc(body)+'</div></div>';
}

/* ---------- TAROT ---------- */
var TAROT_POS={ "1":["Thông điệp"], "3":["Quá khứ","Hiện tại","Tương lai"],
  "cc":["1. Hiện trạng","2. Thách thức","3. Nền tảng","4. Quá khứ","5. Mục tiêu","6. Tương lai gần","7. Bản thân","8. Ngoại cảnh","9. Hy vọng / nỗi sợ","10. Kết quả"]};
$("tarotDraw").addEventListener("click",function(){
  var spread=chipVal("tarotSpread"),deckType=chipVal("tarotDeck");
  var deck=deckType==="major"?TAROT.slice(0,22):TAROT;
  var poss=TAROT_POS[spread],n=poss.length;
  var picks=shuffleDraw(deck,n);
  var q=$("tarotQ").value.trim();
  var html=q?'<p class="note center">Câu hỏi: «'+esc(q)+'»</p>':'';
  html+='<div class="cardrow">';
  var items=picks.map(function(ix,i){
    var c=deck[ix],rev=rnd(2)===1;
    html+=cardHTML(c.g,c.n,poss[i],rev);
    return {c:c,rev:rev,p:poss[i]};
  });
  html+='</div>';
  items.forEach(function(it){
    html+=meaningHTML(it.c.n+(it.rev?" — ngược":" — xuôi"),it.p,it.rev?it.c.r:it.c.u);
  });
  var nRev=items.filter(function(i){return i.rev;}).length;
  var tone=nRev===0?"Toàn bài xuôi: năng lượng thuận dòng, cứ mạnh dạn tiến hành.":
    nRev===items.length?"Toàn bài ngược: mọi thứ đang bị chặn hoặc hướng vào nội tâm — chậm lại, xem xét lại từ gốc.":
    "Bài có "+nRev+"/"+items.length+" lá ngược: có trở lực hoặc bài học nội tâm ở các vị trí ngược — chú ý các lá đó trước.";
  html+='<div class="panel"><h3>Tổng luận</h3><p style="font-size:.9rem">'+tone+' Hãy đọc các lá theo mạch vị trí: quá khứ tạo đà, hiện tại là điểm hành động, các lá cuối là xu hướng nếu bạn giữ nguyên cách hiện tại — tarot chỉ đường, lựa chọn vẫn ở bạn.</p></div>';
  $("tarotResult").innerHTML=html;
  saveHistory("Tarot",q,items.map(function(i){return i.c.n.split("(")[0].trim()+(i.rev?"(ng)":"");}).join(" · "));
});

/* ---------- LENORMAND ---------- */
$("lenDraw").addEventListener("click",function(){
  var n=parseInt(chipVal("lenSpread"),10);
  var poss=n===1?["Thông điệp"]:n===3?["Chủ đề","Diễn biến","Kết quả"]:
    ["Quá khứ ↑","Hiện tại ↑","Tương lai ↑","Quá khứ •","TÂM ĐIỂM","Tương lai •","Quá khứ ↓","Hiện tại ↓","Tương lai ↓"];
  var picks=shuffleDraw(LENORMAND,n);
  var q=$("lenQ").value.trim();
  var html=q?'<p class="note center">Câu hỏi: «'+esc(q)+'»</p>':'';
  html+='<div class="cardrow">';
  picks.forEach(function(ix,i){html+=cardHTML(LENORMAND[ix].g,LENORMAND[ix].i+". "+LENORMAND[ix].n,poss[i],false);});
  html+='</div>';
  picks.forEach(function(ix,i){
    var c=LENORMAND[ix];
    html+=meaningHTML(c.i+". "+c.n+" — "+c.k,poss[i],c.m);
  });
  if(n>1){
    var chain=picks.map(function(ix){return LENORMAND[ix].k.split(",")[0].trim();}).join(" → ");
    html+='<div class="panel"><h3>Tổng luận</h3><p style="font-size:.9rem">Chuỗi ý chính: <b>'+esc(chain)+'</b>. Lenormand đọc như một câu chuyện liền mạch: lá trước bổ nghĩa cho lá sau'+(n===9?'; hàng giữa là mạch chính, hàng trên là suy nghĩ, hàng dưới là nền tảng thực tế; lá trung tâm là trái tim của vấn đề':'')+'.</p></div>';
  }
  $("lenResult").innerHTML=html;
  saveHistory("Lenormand",q,picks.map(function(ix){return LENORMAND[ix].n.split("(")[0].trim();}).join(" · "));
});

/* ---------- BÀI TÂY ---------- */
$("btDraw").addEventListener("click",function(){
  var n=parseInt(chipVal("btSpread"),10);
  var poss=n===1?["Thông điệp"]:n===3?["Quá khứ","Hiện tại","Tương lai"]:
    ["Quá khứ","Hiện tại","Điều ẩn giấu","Trở ngại","Kết quả"];
  var picks=shuffleDraw(BAITAY,n);
  var q=$("btQ").value.trim();
  var html=q?'<p class="note center">Câu hỏi: «'+esc(q)+'»</p>':'';
  html+='<div class="cardrow">';
  picks.forEach(function(ix,i){
    var c=BAITAY[ix],red=c.g.indexOf("♥")>=0||c.g.indexOf("♦")>=0;
    html+='<div class="tcard"><span class="pos">'+esc(poss[i])+'</span><span class="glyph" style="color:'+(red?"#e0785a":"#e8e2f4")+'">'+c.g+'</span><span class="nm">'+esc(c.n)+'</span></div>';
  });
  html+='</div>';
  picks.forEach(function(ix,i){html+=meaningHTML(BAITAY[ix].n,poss[i],BAITAY[ix].m);});
  var suits={"♥":0,"♦":0,"♣":0,"♠":0};
  picks.forEach(function(ix){for(var s in suits){if(BAITAY[ix].g.indexOf(s)>=0)suits[s]++;}});
  var domi=Object.keys(suits).sort(function(a,b){return suits[b]-suits[a];})[0];
  var suitMsg={"♥":"Cơ chiếm ưu thế — trọng tâm nằm ở tình cảm, gia đình.","♦":"Rô chiếm ưu thế — trọng tâm là tiền bạc, giấy tờ, tin tức.","♣":"Chuồn chiếm ưu thế — trọng tâm là công việc, bạn bè, cơ hội.","♠":"Bích chiếm ưu thế — cần thận trọng: thử thách và bài học đang chờ."};
  if(n>1)html+='<div class="panel"><h3>Tổng luận</h3><p style="font-size:.9rem">'+suitMsg[domi]+'</p></div>';
  $("btResult").innerHTML=html;
  saveHistory("Bài Tây",q,picks.map(function(ix){return BAITAY[ix].n;}).join(" · "));
});

/* ---------- KINH DỊCH ---------- */
var kdLines=[];
function kdRender(final){
  var html="";
  if(kdLines.length===6&&final){
    var hx=hexFromLines(kdLines);
    var hex=KINHDICH[hx.no];
    var movingIdx=[];kdLines.forEach(function(l,i){if(l.moving)movingIdx.push(i+1);});
    html+='<div class="panel"><div class="hexbig">'+String.fromCodePoint(0x4DBF+hx.no)+'</div>';
    html+='<div class="hexname">Quẻ '+hx.no+' — '+esc(hex.n)+'</div>';
    html+='<div class="hexsub">'+TRIGRAMS[hx.hi]+' trên · '+TRIGRAMS[hx.lo]+' dưới</div>';
    html+='<div class="lines">'+kdLines.map(function(l,i){
      return '<div class="hline'+(l.moving?' moving':'')+'">'+
        (l.v?'<div class="bar"></div>':'<div class="bar"></div><div class="gap"></div><div class="bar"></div>')+
        (l.moving?'<span class="mark">động</span>':'')+'</div>';
    }).join("")+'</div>';
    html+=meaningHTML("Ý quẻ","",hex.y);
    html+=meaningHTML("Lời khuyên","",hex.a);
    if(movingIdx.length){
      var lines2=kdLines.map(function(l){return {v:l.moving?1-l.v:l.v};});
      var hx2=hexFromLines(lines2),hex2=KINHDICH[hx2.no];
      html+='<hr class="divider"><p class="center" style="font-size:.85rem;color:var(--ink-dim)">Hào động: '+movingIdx.join(", ")+' → quẻ biến:</p>';
      html+='<div class="hexbig" style="font-size:2.6rem">'+String.fromCodePoint(0x4DBF+hx2.no)+'</div>';
      html+='<div class="hexname">Quẻ '+hx2.no+' — '+esc(hex2.n)+'</div>';
      html+=meaningHTML("Xu hướng chuyển hoá","Quẻ chủ nói hiện tại, quẻ biến nói việc sẽ chuyển về hướng này",hex2.y);
    }else{
      html+='<p class="note center">Không có hào động — tình thế ổn định, đọc trọn ý quẻ chủ.</p>';
    }
    html+='</div>';
    var q=$("kdQ").value.trim();
    saveHistory("Kinh Dịch",q,"Quẻ "+hx.no+" "+hex.n+(movingIdx.length?" → biến: "+KINHDICH[hexFromLines(kdLines.map(function(l){return{v:l.moving?1-l.v:l.v};})).no].n:""));
  }
  $("kdResult").innerHTML=html;
}
$("kdToss").addEventListener("click",function(){
  if(kdLines.length>=6){kdLines=[];$("kdResult").innerHTML="";}
  var l=tossLine();kdLines.push(l);
  $("kdCoins").textContent=l.coins.map(function(c){return c?"🌕":"🌑";}).join(" ");
  var vi=["hào Sơ (dưới cùng)","hào Nhị","hào Tam","hào Tứ","hào Ngũ","hào Thượng (trên cùng)"][kdLines.length-1];
  $("kdStatus").textContent="Đã gieo "+kdLines.length+"/6 — "+vi+": "+(l.v?"dương":"âm")+(l.moving?" động":"")+
    (kdLines.length<6?". Bấm tiếp để gieo hào kế.":". Đủ 6 hào!");
  if(kdLines.length===6){kdRender(true);}
});
$("kdQuick").addEventListener("click",function(){
  kdLines=[];for(var i=0;i<6;i++)kdLines.push(tossLine());
  $("kdCoins").textContent="🌕 🌑 🌕";
  $("kdStatus").textContent="Đã gieo nhanh đủ 6 hào.";
  kdRender(true);
});

/* ---------- TỬ VI ---------- */
(function(){
  var sel=$("tvHour");
  GIO_LABEL.forEach(function(g,i){var o=document.createElement("option");o.value=i;o.textContent=g;sel.appendChild(o);});
})();
$("tvGo").addEventListener("click",function(){
  var dv=$("tvDate").value;
  if(!dv){$("tvResult").innerHTML='<p class="note center warntxt">Hãy chọn ngày sinh trước đã.</p>';return;}
  var p=dv.split("-"),yy=+p[0],mm=+p[1],dd=+p[2];
  var h=parseInt($("tvHour").value,10),g=chipVal("tvGender");
  var ls=lapLaSo(dd,mm,yy,h,g);
  var name=$("tvName").value.trim();
  var amduong=(ls.duong?"Dương":"Âm")+" "+(g==="nam"?"Nam":"Nữ");
  var html='<div class="panel"><h3>Lá số '+(name?"của "+esc(name):"")+'</h3>';
  html+='<div class="kv"><span class="k">Dương lịch</span><span class="v">'+dd+"/"+mm+"/"+yy+" · "+GIO_LABEL[h]+'</span></div>';
  html+='<div class="kv"><span class="k">Âm lịch</span><span class="v">'+ls.lu.d+"/"+ls.lu.m+(ls.lu.leap?" (nhuận)":"")+" năm "+canChiYear(ls.lu.y)+'</span></div>';
  html+='<div class="kv"><span class="k">Bản mệnh</span><span class="v">'+ls.napamNam+'</span></div>';
  html+='<div class="kv"><span class="k">Cục</span><span class="v">'+CUC_TEN[ls.cuc]+'</span></div>';
  html+='<div class="kv"><span class="k">Âm dương</span><span class="v">'+amduong+" — đại vận "+(ls.thuan?"thuận":"nghịch")+", khởi "+ls.cuc+" tuổi"+'</span></div>';
  html+='<div class="kv"><span class="k">Mệnh / Thân</span><span class="v">Mệnh tại '+CHI[ls.menh]+" · Thân tại "+CHI[ls.than]+'</span></div>';
  html+='</div>';
  /* Bàn 12 cung */
  var order=[5,6,7,8,4,-1,9,3,10,2,1,0,11];
  html+='<div class="tvgrid">';
  order.forEach(function(ci){
    if(ci===-1){
      html+='<div class="tvcenter"><div class="nm">'+(name?esc(name):"Lá số Tử Vi")+'</div>'+
        '<div>'+canChiYear(ls.lu.y)+' · '+ls.napamNam+'</div><div>'+CUC_TEN[ls.cuc]+' · '+amduong+'</div>'+
        '<div style="color:var(--ink-faint)">Tuần: '+CHI[ls.tuan[0]]+"–"+CHI[ls.tuan[1]]+' · Triệt: '+CHI[ls.triet[0]]+"–"+CHI[ls.triet[1]]+'</div></div>';
      return;
    }
    var st=ls.stars[ci],house=ls.houses[ci];
    var hoaHere=[];
    ls.hoa.forEach(function(sn,i){
      if(st.maj.indexOf(sn)>=0||st.min.indexOf(sn)>=0)hoaHere.push(ls.hoaNames[i].replace("Hóa ","")+"→"+sn);
    });
    html+='<div class="tvcell">';
    html+='<div class="cung'+(house==="Mệnh"?" menh":"")+'">'+house+(ci===ls.than?" (Thân)":"")+'</div>';
    if(st.maj.length)html+='<div class="maj">'+st.maj.join("· ")+'</div>';
    if(st.min.length)html+='<div class="min">'+st.min.join("· ")+'</div>';
    if(hoaHere.length)html+='<div class="hoa">'+hoaHere.join(" ")+'</div>';
    html+='<div class="van">ĐV '+ls.daivan[ci]+'</div>';
    html+='<div class="chi">'+CHI[ci]+'</div></div>';
  });
  html+='</div>';
  /* Luận cung mệnh */
  var mst=ls.stars[ls.menh];
  html+='<div class="panel"><h3>Luận cung Mệnh ('+CHI[ls.menh]+')</h3>';
  if(mst.maj.length===0){
    html+='<p style="font-size:.88rem">Mệnh <b>vô chính diệu</b> — không có chính tinh toạ thủ: cuộc đời linh hoạt, chịu ảnh hưởng mạnh của hoàn cảnh; mượn sao cung Thiên Di ('+CHI[(ls.menh+6)%12]+') mà luận: '+ls.stars[(ls.menh+6)%12].maj.join(", ")+'.</p>';
    ls.stars[(ls.menh+6)%12].maj.forEach(function(sn){html+=meaningHTML(sn,"chiếu từ Thiên Di",SAO_INFO[sn]||"");});
  }else{
    mst.maj.forEach(function(sn){html+=meaningHTML(sn,"chính tinh thủ Mệnh",SAO_INFO[sn]||"");});
  }
  if(mst.min.length)html+='<p class="note">Phụ tinh tại Mệnh: '+mst.min.join(", ")+'.</p>';
  html+='</div>';
  /* Tứ hóa */
  html+='<div class="panel"><h3>Tứ Hóa năm sinh ('+CAN[ls.yCan]+')</h3>';
  ls.hoa.forEach(function(sn,i){
    var where="";for(var ci2=0;ci2<12;ci2++){var s2=ls.stars[ci2];if(s2.maj.indexOf(sn)>=0||s2.min.indexOf(sn)>=0){where=ls.houses[ci2];break;}}
    html+='<div class="kv"><span class="k">'+ls.hoaNames[i]+'</span><span class="v">'+sn+(where?" — cung "+where:"")+'</span></div>';
  });
  html+='<p class="note">Hóa Lộc/Quyền/Khoa rơi vào cung nào thì lĩnh vực đó được kích hoạt tốt; Hóa Kỵ rơi vào đâu thì cần cẩn trọng lĩnh vực ấy.</p></div>';
  html+='<p class="note">Lá số an theo phép phổ thông (14 chính tinh, phụ tinh chính, tứ hóa, tuần–triệt, đại vận). Giờ sinh sát ranh giới hai giờ âm lịch nên lập cả hai lá để so.</p>';
  $("tvResult").innerHTML=html;
  saveHistory("Tử Vi",name,"Mệnh "+CHI[ls.menh]+": "+(mst.maj.join(", ")||"vô chính diệu")+" · "+CUC_TEN[ls.cuc]);
});

/* ---------- XEM NGÀY ---------- */
$("xnGo").addEventListener("click",function(){
  var dv=$("xnDate").value;
  if(!dv){$("xnResult").innerHTML='<p class="note center warntxt">Hãy chọn ngày cần xem.</p>';return;}
  var p=dv.split("-"),yy=+p[0],mm=+p[1],dd=+p[2];
  var by=parseInt($("xnBirth").value,10)||null;
  var r=xemNgay(dd,mm,yy,by);
  var good=r.sao[1]===1,trucIdx=TRUC.indexOf(r.truc);
  var html='<div class="panel"><div class="big-day">'+dd+"/"+mm+"/"+yy+'</div>';
  html+='<p class="center" style="color:var(--ink-dim);font-size:.88rem">Âm lịch: '+r.lu.d+"/"+r.lu.m+(r.lu.leap?" (nhuận)":"")+"/"+r.lu.y+'</p>';
  html+='<div class="kv"><span class="k">Ngày</span><span class="v">'+r.dayCC+" ("+r.napam+")"+'</span></div>';
  html+='<div class="kv"><span class="k">Tháng</span><span class="v">'+r.monthCC+'</span></div>';
  html+='<div class="kv"><span class="k">Năm</span><span class="v">'+r.yearCC+'</span></div>';
  html+='<div class="kv"><span class="k">Sao ngày</span><span class="v">'+r.sao[0]+' <span class="tag '+(good?"good":"bad")+'">'+(good?"Hoàng đạo":"Hắc đạo")+'</span></span></div>';
  html+='<div class="kv"><span class="k">Trực</span><span class="v">'+r.truc[0]+'</span></div>';
  html+='</div>';
  html+='<div class="panel"><h3>Trực '+r.truc[0]+'</h3><p style="font-size:.88rem">'+r.truc[1]+'</p></div>';
  html+='<div class="panel"><h3>Giờ hoàng đạo</h3><div>'+r.gio.map(function(g){return '<span class="tag good">'+GIO_LABEL[g]+'</span>';}).join("")+'</div>';
  html+='<p class="note">Ngày này xung với tuổi <b>'+CHI[r.xungChi]+'</b> (lục xung với chi ngày '+CHI[r.dayChi]+').</p>';
  if(by){
    html+=r.xungTuoi?'<p class="warntxt" style="font-size:.88rem">⚠ Tuổi '+r.birthCC+' của bạn XUNG với ngày này — nên tránh làm việc lớn.</p>'
      :'<p class="oktxt" style="font-size:.88rem">✓ Tuổi '+r.birthCC+' của bạn không xung với chi ngày.</p>';
  }
  html+='</div>';
  var verdict=(good?1:0)+([0,2,4,8,10].indexOf(trucIdx)>=0?1:0);
  html+='<div class="panel"><h3>Đánh giá chung</h3><p style="font-size:.9rem">'+
    (good&&verdict>1?"Ngày khá tốt cho các việc trọng đại (hợp với ghi chú của Trực ở trên). Chọn thêm giờ hoàng đạo để khởi sự.":
     good?"Ngày hoàng đạo nhưng Trực không thuận cho mọi việc — đối chiếu kỹ mục Trực trước khi quyết.":
     "Ngày hắc đạo — việc lớn (cưới hỏi, khai trương, động thổ, xuất hành xa) nên chọn ngày khác; việc thường vẫn làm được, ưu tiên giờ hoàng đạo.")+
    '</p><p class="note">Trực và sao ngày tính theo tháng âm lịch — sát ngày đầu/cuối tháng âm có thể lệch một bậc so với lịch tiết khí.</p></div>';
  $("xnResult").innerHTML=html;
});

/* ---------- CHIÊM TINH ---------- */
$("ctGo").addEventListener("click",function(){
  var dv=$("ctDate").value;
  if(!dv){$("ctResult").innerHTML='<p class="note center warntxt">Hãy chọn ngày sinh.</p>';return;}
  var p=dv.split("-"),yy=+p[0],mm=+p[1],dd=+p[2];
  var tv=($("ctTime").value||"12:00").split(":"),hh=+tv[0],mi=+tv[1];
  var jdt=jdFromDate(dd,mm,yy)-0.5+((hh-TZ)+mi/60)/24;
  var sunLon=sunLongAt(jdt);
  /* 0° Bạch Dương = xuân phân → cung = (kinh độ)/30 */
  var sIdx=INT(sunLon/30)%12;
  var mIdx=moonSign(jdt);
  var sz=ZODIAC[sIdx],mz=ZODIAC[mIdx];
  var html='<div class="panel"><h3>Cung Mặt Trời — con người bên ngoài</h3>';
  html+='<div class="center" style="font-size:2.6rem">'+sz.g+'</div>';
  html+='<div class="center goldtxt" style="font-size:1.1rem">'+sz.n+'</div>';
  html+='<p class="center" style="color:var(--ink-dim);font-size:.82rem">'+sz.d+" · Nguyên tố "+sz.e+" · "+sz.q+" · Chủ tinh: "+sz.p+'</p>';
  html+='<p style="font-size:.9rem;margin-top:8px">'+sz.m+'</p></div>';
  html+='<div class="panel"><h3>Cung Mặt Trăng — thế giới cảm xúc</h3>';
  html+='<div class="center" style="font-size:2rem">'+mz.g+'</div>';
  html+='<div class="center goldtxt">'+mz.n+'</div>';
  html+='<p style="font-size:.9rem;margin-top:8px">'+MOON_SIGN_NOTE[mz.e]+'</p>';
  html+='<p style="font-size:.88rem;margin-top:6px">Nét Trăng '+mz.n.split(" (")[0]+': '+mz.m+'</p>';
  html+='<p class="note">Vị trí Mặt Trăng tính gần đúng (±1°); nếu sinh lúc Trăng đổi cung trong ngày, kết quả có thể là cung kề bên.</p></div>';
  var same=sz.e===mz.e;
  html+='<div class="panel"><h3>Kết hợp Trời – Trăng</h3><p style="font-size:.9rem">'+
    (same?"Mặt Trời và Mặt Trăng cùng nguyên tố "+sz.e+": con người bên ngoài và cảm xúc bên trong khá nhất quán — bạn hành xử đúng như bạn cảm nhận.":
    "Mặt Trời "+sz.e+" nhưng Mặt Trăng "+mz.e+": vẻ ngoài và nội tâm vận hành theo hai chất liệu khác nhau — hiểu điều này giúp bạn bớt thấy mâu thuẫn với chính mình.")+'</p></div>';
  $("ctResult").innerHTML=html;
  saveHistory("Chiêm Tinh","","Mặt Trời "+sz.n+" · Mặt Trăng "+mz.n);
});

/* ---------- TRA CỨU ---------- */
function renderBrowse(){
  var tab=chipVal("browseTabs"),q=($("browseSearch").value||"").toLowerCase();
  var items=[];
  if(tab==="tarot"){items=TAROT.map(function(c){return {g:c.g,n:c.n,m:"Xuôi: "+c.u+" — Ngược: "+c.r};});}
  else if(tab==="lenormand"){items=LENORMAND.map(function(c){return {g:c.g,n:c.i+". "+c.n+" ("+c.k+")",m:c.m};});}
  else if(tab==="baitay"){items=BAITAY.map(function(c){return {g:c.g,n:c.n,m:c.m};});}
  else if(tab==="kinhdich"){items=Object.keys(KINHDICH).map(function(k){var h=KINHDICH[k];return {g:String.fromCodePoint(0x4DBF+ +k),n:k+". "+h.n,m:h.y+" — "+h.a};});}
  else if(tab==="sao"){items=Object.keys(SAO_INFO).map(function(k){return {g:"★",n:k,m:SAO_INFO[k]};});}
  else if(tab==="cung"){items=Object.keys(CUNG_INFO).map(function(k){return {g:"⌂",n:"Cung "+k,m:CUNG_INFO[k]};});}
  if(q){items=items.filter(function(it){return (it.n+" "+it.m).toLowerCase().indexOf(q)>=0;});}
  $("browseList").innerHTML=items.map(function(it){
    return '<div class="litem"><div class="lg">'+it.g+'</div><div><div class="ln">'+esc(it.n)+'</div><div class="lm">'+esc(it.m)+'</div></div></div>';
  }).join("")||'<p class="note center">Không tìm thấy.</p>';
}
$("browseSearch").addEventListener("input",renderBrowse);

/* ---------- TRANG CHỦ — HÔM NAY ---------- */
function renderToday(){
  var now=new Date(),dd=now.getDate(),mm=now.getMonth()+1,yy=now.getFullYear();
  var r=xemNgay(dd,mm,yy,null);
  var seed=yy*10000+mm*100+dd,rng=mulberry32(seed);
  var card=TAROT[Math.floor(rng()*TAROT.length)];
  var good=r.sao[1]===1;
  var weekday=["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"][now.getDay()];
  $("todayBox").innerHTML='<h3>☀️ Hôm nay — '+weekday+", "+dd+"/"+mm+"/"+yy+'</h3>'+
    '<div class="row"><span class="k">Âm lịch</span><span class="v">'+r.lu.d+"/"+r.lu.m+(r.lu.leap?" nhuận":"")+" · năm "+r.yearCC+'</span></div>'+
    '<div class="row"><span class="k">Ngày</span><span class="v">'+r.dayCC+' <span class="tag '+(good?"good":"bad")+'">'+(good?"Hoàng đạo":"Hắc đạo")+'</span></span></div>'+
    '<div class="row"><span class="k">Giờ tốt</span><span class="v">'+r.gio.map(function(g){return CHI[g];}).join(", ")+'</span></div>'+
    '<div class="row"><span class="k">Lá bài ngày</span><span class="v">'+card.g+" "+card.n.split("(")[0].split("—").pop().trim()+'</span></div>'+
    '<div style="font-size:.8rem;color:var(--ink-dim);margin-top:6px;font-style:italic">'+card.u+'</div>';
}
renderToday();
renderBrowse();
/* điền ngày mặc định cho các ô date */
(function(){
  var t=new Date(),s=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0");
  $("xnDate").value=s;
})();
