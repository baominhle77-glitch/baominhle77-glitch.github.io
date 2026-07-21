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
    napam:napAm((jd+9)%10,(jd+1)%12),sao:sao,truc:truc,gio:gio,dayChi:dayChi,dayCan:dayCan,xungChi:xungChi,xungTuoi:null};
  /* Tiết khí: ngày mặt trời đạt mốc 15° nào trong ngày (tính đến hết ngày) thì thuộc tiết đó */
  res.tietkhi=TIETKHI[INT(getSunLongitudeDeg(jd+1,TZ)/15)%24];
  /* Hỷ thần / Tài thần theo can ngày */
  res.hythan=HY_THAN[dayCan]; res.taithan=TAI_THAN[dayCan];
  /* Ngày âm kỵ */
  res.tamnuong=TAM_NUONG.indexOf(lu.d)>=0;
  res.nguyetky=NGUYET_KY.indexOf(lu.d)>=0;
  /* Sao từng giờ (khởi Thanh Long theo nhóm chi ngày) + lục diệu Lý Thuần Phong */
  var hstart=((dayChi%6)*2+8)%12;
  res.hours=[];
  for(var h=0;h<12;h++){
    var hsao=SAO_NGAY[(h-hstart+24)%12];
    var ld=LUCDIEU[(lu.m+lu.d+h+1)%6];
    res.hours.push({chi:h,sao:hsao[0],good:hsao[1]===1,luc:ld[0],lucGood:ld[1]==="tốt",lucInfo:ld[2]});
  }
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
var DOM_LABEL={ty:"Tình yêu",cv:"Công việc",tc:"Tài chính",sk:"Sức khoẻ"};
function firstClause(s){return s.split(/[;,.—]/)[0].trim();}
$("tarotDraw").addEventListener("click",function(){
  var spread=chipVal("tarotSpread"),deckType=chipVal("tarotDeck"),domain=chipVal("tarotDomain");
  var deck=deckType==="major"?TAROT.slice(0,22):TAROT;
  var poss=TAROT_POS[spread],n=poss.length;
  var picks=shuffleDraw(deck,n);
  var q=$("tarotQ").value.trim();
  var html=q?'<p class="note center">Câu hỏi: «'+esc(q)+'»'+(domain!=="all"?' — lĩnh vực: '+DOM_LABEL[domain]:'')+'</p>':'';
  html+='<div class="cardrow">';
  var items=picks.map(function(ix,i){
    var c=deck[ix],rev=rnd(2)===1,gi=TAROT.indexOf(c);
    html+=cardHTML(c.g,c.n,poss[i],rev);
    return {c:c,ext:TAROT_EXT[gi],rev:rev,p:poss[i],gi:gi};
  });
  html+='</div>';
  items.forEach(function(it){
    var body=it.rev?it.c.r:it.c.u;
    var block='<div class="meaning"><div class="mt">'+esc(it.c.n)+(it.rev?' — <span class="warntxt">ngược</span>':' — xuôi')+'</div>'+
      '<div class="mp">'+esc(it.p)+'</div><div class="mb">'+esc(body)+'</div>';
    var doms=n<=3?["ty","cv","tc","sk"]:(domain!=="all"?[domain]:[]);
    doms.forEach(function(d){
      if(it.ext&&it.ext[d])block+='<div class="mb" style="margin-top:6px"><span class="goldtxt">'+DOM_LABEL[d]+':</span> '+esc(it.ext[d])+'</div>';
    });
    if(it.rev&&doms.length)block+='<div class="mb" style="margin-top:6px;color:var(--ink-dim);font-style:italic">Lá ngược: các nghĩa lĩnh vực trên đang bị chặn, chậm trễ hoặc vận hành ngầm — đọc như tiềm năng chưa thông thay vì kết quả sẵn có.</div>';
    block+='</div>';
    html+=block;
  });
  /* ---- Tổng luận phối hợp ---- */
  var nRev=items.filter(function(i){return i.rev;}).length;
  var nMajor=items.filter(function(i){return i.gi<22;}).length;
  var suitOf=function(gi){return gi<22?"major":gi<36?"Gậy":gi<50?"Cốc":gi<64?"Kiếm":"Tiền";};
  var suitCount={"Gậy":0,"Cốc":0,"Kiếm":0,"Tiền":0};
  items.forEach(function(i){var s=suitOf(i.gi);if(suitCount[s]!==undefined)suitCount[s]++;});
  var paras=[];
  if(n>1){
    if(nMajor>=Math.ceil(n/2))paras.push("Có "+nMajor+"/"+n+" lá Ẩn chính — vấn đề bạn hỏi mang tính bước ngoặt lớn của cả giai đoạn, ít phụ thuộc vào tiểu tiết hằng ngày; các lực đang vận hành sâu hơn ý muốn nhất thời.");
    else if(nMajor===0)paras.push("Không có lá Ẩn chính nào — chuyện này nằm trong tầm tay bạn, xoay chuyển được bằng hành động cụ thể hằng ngày, không phải 'số phận an bài'.");
    var domSuit=null,domMax=0;
    for(var s in suitCount){if(suitCount[s]>domMax){domMax=suitCount[s];domSuit=s;}}
    var suitMsg={"Gậy":"chất Gậy (Lửa) trội: động lực, hành động và đam mê là trục chính — câu trả lời nằm ở việc DÁM LÀM.","Cốc":"chất Cốc (Nước) trội: cảm xúc và các mối quan hệ là trục chính — câu trả lời nằm ở TRÁI TIM và cách kết nối.","Kiếm":"chất Kiếm (Khí) trội: suy nghĩ, sự thật và xung đột là trục chính — câu trả lời nằm ở sự RÕ RÀNG trong tư duy và lời nói.","Tiền":"chất Tiền (Đất) trội: vật chất, sức khoẻ, nền tảng thực tế là trục chính — câu trả lời nằm ở sự KIÊN TRÌ xây từng viên gạch."};
    if(domSuit&&domMax>=2)paras.push("Về chất liệu: "+suitMsg[domSuit]);
    if(nRev===0)paras.push("Toàn bộ lá đều xuôi: năng lượng thuận dòng, ngoại cảnh ủng hộ — thời điểm hành động đã chín.");
    else if(nRev===n)paras.push("Toàn bộ lá đều ngược: mọi lực đang hướng vào trong hoặc bị chặn — đây là kỳ nhìn lại nội tâm và tháo gỡ từ gốc, chưa phải kỳ bung ra ngoài.");
    else paras.push("Có "+nRev+"/"+n+" lá ngược: trở lực tập trung ở đúng các vị trí ấy — nơi cần bạn chú tâm gỡ trước khi phần còn lại tự chảy.");
  }
  if(spread==="3"){
    paras.push("Mạch chuyện: «"+firstClause(items[0].rev?items[0].c.r:items[0].c.u)+"» (quá khứ tạo đà) → «"+firstClause(items[1].rev?items[1].c.r:items[1].c.u)+"» (hiện tại — điểm hành động) → «"+firstClause(items[2].rev?items[2].c.r:items[2].c.u)+"» (xu hướng nếu giữ nguyên hướng đi). Tương lai trong tarot là dòng chảy, không phải bản án: đổi cách hành động ở lá giữa sẽ đổi lá cuối.");
  }
  if(spread==="cc"){
    paras.push("Trục chính Celtic Cross: lá 1 (hiện trạng) bị lá 2 cắt ngang (thách thức) — đây là nút thắt trung tâm. Lá 10 («"+firstClause(items[9].rev?items[9].c.r:items[9].c.u)+"») là kết quả nếu mọi thứ giữ nhịp hiện tại; đối chiếu lá 7 (con người bạn) với lá 8 (ngoại cảnh) để biết mình đang thuận hay nghịch dòng; lá 9 nói hộ điều bạn vừa mong vừa sợ.");
  }
  if(n===1)paras.push("Một lá là một tấm gương soi thẳng vào câu hỏi: đọc cả nghĩa chính lẫn nghĩa lĩnh vực, và để ý cảm giác đầu tiên khi lật lá — trực giác của bạn là một nửa của quẻ bài.");
  html+='<div class="panel"><h3>Tổng luận phối hợp</h3>'+paras.map(function(p){return '<p style="font-size:.9rem;margin-bottom:8px">'+esc(p)+'</p>';}).join("")+'</div>';
  $("tarotResult").innerHTML=html;
  saveHistory("Tarot",q,items.map(function(i){return i.c.n.split("(")[0].trim()+(i.rev?"(ng)":"");}).join(" · "));
});

/* ---------- LENORMAND ---------- */
$("lenDraw").addEventListener("click",function(){
  var n=parseInt(chipVal("lenSpread"),10),domain=chipVal("lenDomain");
  var poss=n===1?["Thông điệp"]:n===3?["Chủ đề","Diễn biến","Kết quả"]:
    ["Quá khứ ↑","Hiện tại ↑","Tương lai ↑","Quá khứ •","TÂM ĐIỂM","Tương lai •","Quá khứ ↓","Hiện tại ↓","Tương lai ↓"];
  var picks=shuffleDraw(LENORMAND,n);
  var q=$("lenQ").value.trim();
  var html=q?'<p class="note center">Câu hỏi: «'+esc(q)+'»'+(domain!=="all"?' — lĩnh vực: '+DOM_LABEL[domain]:'')+'</p>':'';
  html+='<div class="cardrow">';
  picks.forEach(function(ix,i){html+=cardHTML(LENORMAND[ix].g,LENORMAND[ix].i+". "+LENORMAND[ix].n,poss[i],false);});
  html+='</div>';
  picks.forEach(function(ix,i){
    var c=LENORMAND[ix],ext=LEN_EXT[ix];
    var block='<div class="meaning"><div class="mt">'+c.i+". "+esc(c.n)+' — '+esc(c.k)+'</div>'+
      '<div class="mp">'+esc(poss[i])+'</div><div class="mb">'+esc(c.m)+'</div>';
    var doms=n<=3?["ty","cv","tc"]:(domain!=="all"?[domain]:[]);
    doms.forEach(function(d){
      if(ext&&ext[d])block+='<div class="mb" style="margin-top:6px"><span class="goldtxt">'+DOM_LABEL[d]+':</span> '+esc(ext[d])+'</div>';
    });
    block+='</div>';
    html+=block;
  });
  var kw=function(ix){return LENORMAND[ix].k.split(",")[0].trim();};
  var paras=[];
  if(n===3){
    paras.push("Đọc thành câu chuyện: chủ đề mang năng lượng «"+kw(picks[0])+"», đang diễn biến qua «"+kw(picks[1])+"», và chảy về «"+kw(picks[2])+"». Trong Lenormand, lá giữa là trục — hai lá hai bên bổ nghĩa cho nó: hãy tự ghép thành một câu duy nhất mô tả tình huống của bạn.");
    paras.push("Cặp mở («"+kw(picks[0])+"» + «"+kw(picks[1])+"») cho biết việc đã và đang xảy ra thế nào; cặp đóng («"+kw(picks[1])+"» + «"+kw(picks[2])+"») cho biết chiều hướng sắp tới. Nếu lá cuối thuộc nhóm khó (Mây, Rắn, Quan Tài, Lưỡi Hái, Roi, Chuột, Núi, Thập Giá) — đó là lời nhắc phòng bị, không phải phán quyết.");
  }
  if(n===9){
    var rows=[[0,1,2,"Hàng trên — tầng suy nghĩ, điều đang lởn vởn trong tâm trí"],[3,4,5,"Hàng giữa — mạch chính của sự việc, diễn tiến thực tế"],[6,7,8,"Hàng dưới — tầng nền tảng, điều đang diễn ra ngầm bên dưới"]];
    rows.forEach(function(r){
      paras.push(r[3]+": «"+kw(picks[r[0]])+" → "+kw(picks[r[1]])+" → "+kw(picks[r[2]])+"» (đọc trái sang phải là quá khứ → tương lai).");
    });
    paras.push("Lá TÂM ĐIỂM «"+LENORMAND[picks[4]].n+"» là trái tim của cả bàn: mọi lá khác xoay quanh nó. Cột giữa (trên–tâm–dưới: "+kw(picks[1])+" / "+kw(picks[4])+" / "+kw(picks[7])+") cho thấy trạng thái hiện tại từ suy nghĩ đến gốc rễ.");
  }
  if(n===1)paras.push("Một lá Lenormand trả lời trực diện và cụ thể — đối chiếu nghĩa lá với đúng câu hỏi bạn đặt; nếu cần thêm ngữ cảnh, rút thêm trải 3 lá.");
  if(paras.length)html+='<div class="panel"><h3>Tổng luận phối hợp</h3>'+paras.map(function(p){return '<p style="font-size:.9rem;margin-bottom:8px">'+esc(p)+'</p>';}).join("")+'</div>';
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
  var domain=chipVal("btDomain");
  picks.forEach(function(ix,i){
    var ext=BT_EXT[ix];
    var block='<div class="meaning"><div class="mt">'+esc(BAITAY[ix].n)+'</div><div class="mp">'+esc(poss[i])+'</div><div class="mb">'+esc(BAITAY[ix].m)+'</div>';
    var doms=n<=3?["ty","cv","tc"]:(domain!=="all"?[domain]:[]);
    doms.forEach(function(d){
      if(ext&&ext[d])block+='<div class="mb" style="margin-top:6px"><span class="goldtxt">'+DOM_LABEL[d]+':</span> '+esc(ext[d])+'</div>';
    });
    block+='</div>';
    html+=block;
  });
  var suits={"♥":0,"♦":0,"♣":0,"♠":0};
  picks.forEach(function(ix){for(var s in suits){if(BAITAY[ix].g.indexOf(s)>=0)suits[s]++;}});
  var domi=Object.keys(suits).sort(function(a,b){return suits[b]-suits[a];})[0];
  var suitMsg={"♥":"Chất Cơ chiếm ưu thế — trọng tâm câu chuyện nằm ở tình cảm, gia đình, những người thân yêu; quyết định nên nghiêng về phía giữ ấm các mối quan hệ.","♦":"Chất Rô chiếm ưu thế — trọng tâm là tiền bạc, giấy tờ, tin tức; mọi thoả thuận nên rõ ràng trên văn bản, tài chính là chìa khoá của tình huống.","♣":"Chất Chuồn chiếm ưu thế — trọng tâm là công việc, bạn bè, cơ hội làm ăn; quý nhân của bạn nằm trong vòng quan hệ, hãy chủ động kết nối.","♠":"Chất Bích chiếm ưu thế — giai đoạn thử thách: đi chậm, kiểm tra kỹ, tránh quyết định lớn lúc dao động; bài học qua rồi sẽ thành kinh nghiệm quý."};
  var courts=picks.filter(function(ix){return /^(Bồi|Đầm|Già)/.test(BAITAY[ix].n);}).length;
  if(n>1){
    var extra=courts>=2?" Có "+courts+" lá người (Bồi/Đầm/Già): sự việc xoay quanh những con người cụ thể nhiều hơn hoàn cảnh — xem kỹ các nhân vật được mô tả ở trên, họ là chìa khoá.":"";
    html+='<div class="panel"><h3>Tổng luận phối hợp</h3><p style="font-size:.9rem">'+suitMsg[domi]+extra+'</p>'+
      (n===5?'<p style="font-size:.9rem;margin-top:6px">Trải móng ngựa đọc theo cung: quá khứ đẩy vào hiện tại, lá «Điều ẩn giấu» là yếu tố bạn chưa thấy — thường quan trọng nhất bàn; «Trở ngại» cho biết phải vượt gì, và «Kết quả» là hướng đến nếu bạn xử lý được trở ngại đó.</p>':'')+'</div>';
  }
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
    var ext=KD_EXT[hx.no];
    if(ext)html+=meaningHTML("Thoán từ (lời kinh)","nguyên văn dịch nghĩa",ext.tf);
    html+=meaningHTML("Ý quẻ","",hex.y);
    html+=meaningHTML("Lời khuyên","",hex.a);
    if(ext){
      html+='<hr class="divider">';
      [["ty","Tình cảm"],["cv","Công việc"],["tc","Tài lộc"],["sk","Sức khoẻ"]].forEach(function(d){
        if(ext[d[0]])html+=meaningHTML(d[1],"",ext[d[0]]);
      });
    }
    if(movingIdx.length){
      var lines2=kdLines.map(function(l){return {v:l.moving?1-l.v:l.v};});
      var hx2=hexFromLines(lines2),hex2=KINHDICH[hx2.no];
      html+='<hr class="divider"><p class="center" style="font-size:.85rem;color:var(--ink-dim)">Có '+movingIdx.length+' hào động (hào '+movingIdx.join(", ")+'):</p>';
      movingIdx.forEach(function(mi){
        html+=meaningHTML("Hào "+mi+" động","",HAO_Y[mi-1]);
      });
      html+='<p class="center" style="font-size:.85rem;color:var(--ink-dim);margin-top:8px">Quẻ biến (hướng chuyển hoá của sự việc):</p>';
      html+='<div class="hexbig" style="font-size:2.6rem">'+String.fromCodePoint(0x4DBF+hx2.no)+'</div>';
      html+='<div class="hexname">Quẻ '+hx2.no+' — '+esc(hex2.n)+'</div>';
      html+=meaningHTML("Xu hướng chuyển hoá","quẻ chủ nói hiện tại, quẻ biến nói việc sẽ chuyển về hướng này",hex2.y);
      if(KD_EXT[hx2.no])html+=meaningHTML("Thoán từ quẻ biến","",KD_EXT[hx2.no].tf);
      var mvNote=movingIdx.length===1?"Một hào động: trọng tâm lời giải nằm ở chính hào ấy — vị trí của nó (xem trên) cho biết biến động rơi vào tầng nào của sự việc.":
        movingIdx.length>=4?"Nhiều hào động ("+movingIdx.length+"): thời cuộc đang chuyển mạnh — nên đọc quẻ biến làm chính, quẻ chủ chỉ là điểm xuất phát.":
        "Vài hào động: đọc quẻ chủ làm nền, các hào động là điểm nút, quẻ biến là hướng đến; ba tầng ấy hợp lại thành lời giải trọn vẹn.";
      html+='<p class="note">'+mvNote+'</p>';
    }else{
      html+='<p class="note center">Không có hào động — tình thế ổn định trong thời của quẻ; đọc trọn thoán từ và ý quẻ chủ.</p>';
    }
    /* Quẻ hỗ — bối cảnh ẩn bên trong (hào 2-3-4 làm hạ quái, 3-4-5 làm thượng quái) */
    var holo=kdLines[1].v+kdLines[2].v*2+kdLines[3].v*4;
    var hohi=kdLines[2].v+kdLines[3].v*2+kdLines[4].v*4;
    var hoNo=HEXMAP[holo][hohi];
    if(hoNo!==hx.no){
      html+='<hr class="divider">';
      html+=meaningHTML("Quẻ hỗ: "+String.fromCodePoint(0x4DBF+hoNo)+" "+KINHDICH[hoNo].n,"bối cảnh ẩn bên trong sự việc",KINHDICH[hoNo].y);
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
function renderDayDetail(dd,mm,yy,by){
  var r=xemNgay(dd,mm,yy,by);
  var good=r.sao[1]===1,trucIdx=TRUC.indexOf(r.truc);
  var html='<div class="panel"><div class="big-day">'+dd+"/"+mm+"/"+yy+'</div>';
  html+='<p class="center" style="color:var(--ink-dim);font-size:.88rem">Âm lịch: <b>'+r.lu.d+"/"+r.lu.m+(r.lu.leap?" (nhuận)":"")+"/"+r.lu.y+'</b> · Tiết '+r.tietkhi+'</p>';
  html+='<div class="kv"><span class="k">Ngày</span><span class="v">'+r.dayCC+" ("+r.napam+")"+'</span></div>';
  html+='<div class="kv"><span class="k">Tháng</span><span class="v">'+r.monthCC+'</span></div>';
  html+='<div class="kv"><span class="k">Năm</span><span class="v">'+r.yearCC+'</span></div>';
  html+='<div class="kv"><span class="k">Sao ngày</span><span class="v">'+r.sao[0]+' <span class="tag '+(good?"good":"bad")+'">'+(good?"Hoàng đạo":"Hắc đạo")+'</span></span></div>';
  html+='<div class="kv"><span class="k">Trực</span><span class="v">'+r.truc[0]+'</span></div>';
  html+='<div class="kv"><span class="k">Hỷ thần</span><span class="v">hướng '+r.hythan+'</span></div>';
  html+='<div class="kv"><span class="k">Tài thần</span><span class="v">hướng '+r.taithan+'</span></div>';
  html+='</div>';
  if(r.tamnuong||r.nguyetky){
    html+='<div class="panel"><h3 class="warntxt">⚠ Ngày kỵ dân gian</h3><p style="font-size:.88rem">'+
      (r.tamnuong?"Ngày <b>Tam nương</b> (mùng "+r.lu.d+" âm) — dân gian kiêng khởi công, cưới hỏi, xuất hành, khai trương. ":"")+
      (r.nguyetky?"Ngày <b>Nguyệt kỵ</b> (mùng "+r.lu.d+" âm — «mùng năm, mười bốn, hai ba; đi chơi cũng lỗ nữa là đi buôn») — kiêng xuất hành, giao dịch lớn.":"")+
      '</p></div>';
  }
  html+='<div class="panel"><h3>Sao '+r.sao[0]+'</h3><p style="font-size:.88rem">'+(SAO_NGAY_INFO[r.sao[0]]||"")+'</p></div>';
  html+='<div class="panel"><h3>Trực '+r.truc[0]+'</h3><p style="font-size:.88rem">'+r.truc[1]+'</p></div>';
  /* Bảng 12 giờ */
  html+='<div class="panel"><h3>Giờ tốt xấu trong ngày</h3><table class="hrtable"><tr><th>Giờ</th><th>Sao</th><th>Lục diệu</th></tr>';
  r.hours.forEach(function(h){
    html+='<tr><td>'+GIO_LABEL[h.chi]+'</td><td class="'+(h.good?"g":"b")+'">'+h.sao+(h.good?" ✓":"")+'</td><td class="'+(h.lucGood?"g":"b")+'">'+h.luc+'</td></tr>';
  });
  html+='</table><p class="note">Sao giờ: ✓ = giờ hoàng đạo. Lục diệu (phép Lý Thuần Phong) dùng chọn giờ xuất hành: Đại An – Tốc Hỷ – Tiểu Cát là tốt; giờ vừa hoàng đạo vừa lục diệu tốt là giờ đẹp nhất.</p></div>';
  html+='<div class="panel"><h3>Xung tuổi</h3><p class="note" style="margin-top:0">Chi ngày là '+CHI[r.dayChi]+' — lục xung với tuổi <b>'+CHI[r.xungChi]+'</b>: người tuổi '+CHI[r.xungChi]+' nên tránh làm việc trọng đại trong ngày này.</p>';
  if(by){
    html+=r.xungTuoi?'<p class="warntxt" style="font-size:.88rem">⚠ Tuổi '+r.birthCC+' của bạn XUNG với ngày này — nên tránh cưới hỏi, khai trương, ký kết, xuất hành xa.</p>'
      :'<p class="oktxt" style="font-size:.88rem">✓ Tuổi '+r.birthCC+' của bạn không xung với chi ngày.</p>';
  }
  html+='</div>';
  var trucGood=[0,2,4,8,10].indexOf(trucIdx)>=0;
  var score=(good?2:0)+(trucGood?1:0)-((r.tamnuong||r.nguyetky)?2:0)-(by&&r.xungTuoi?2:0);
  html+='<div class="panel"><h3>Đánh giá chung</h3><p style="font-size:.9rem">'+
    (score>=3?"Ngày tốt cho các việc trọng đại — sao hoàng đạo, trực thuận. Chọn thêm giờ vừa hoàng đạo vừa lục diệu tốt (bảng trên) để khởi sự là đẹp trọn vẹn.":
     score>=1?"Ngày khá: có yếu tố thuận (xem sao và trực ở trên) nhưng không trọn vẹn — hợp việc vừa và nhỏ; việc đại sự nên đối chiếu kỹ mục Trực hoặc chọn ngày khác tốt hơn.":
     "Ngày kém thuận — việc lớn (cưới hỏi, khai trương, động thổ, xuất hành xa, ký kết quan trọng) nên chọn ngày khác; việc thường vẫn làm được, ưu tiên khung giờ hoàng đạo.")+
    '</p><p class="note">Phép tính theo lịch vạn sự cổ truyền: sao ngày – trực tính theo tháng âm lịch (sát ngày chuyển tháng âm có thể lệch một bậc so với phép tính theo tiết khí); tiết khí tính theo kinh độ mặt trời thực (thiên văn).</p></div>';
  return html;
}
$("xnGo").addEventListener("click",function(){
  var dv=$("xnDate").value;
  if(!dv){$("xnResult").innerHTML='<p class="note center warntxt">Hãy chọn ngày cần xem.</p>';return;}
  var p=dv.split("-"),yy=+p[0],mm=+p[1],dd=+p[2];
  var by=parseInt($("xnBirth").value,10)||null;
  $("xnResult").innerHTML=renderDayDetail(dd,mm,yy,by);
});

/* ---------- LỊCH ÂM DƯƠNG ---------- */
var calY,calM; /* tháng đang xem */
function renderCal(){
  var first=new Date(calY,calM-1,1);
  var startDow=(first.getDay()+6)%7; /* Thứ 2 = 0 */
  var days=new Date(calY,calM,0).getDate();
  var today=new Date(),isThisMonth=(today.getFullYear()===calY&&today.getMonth()+1===calM);
  var luFirst=solar2lunar(1,calM,calY),luLast=solar2lunar(days,calM,calY);
  $("calTitle").innerHTML="Tháng "+calM+"/"+calY+"<small>ÂL: "+luFirst.d+"/"+luFirst.m+(luFirst.leap?"n":"")+" – "+luLast.d+"/"+luLast.m+(luLast.leap?"n":"")+" · "+canChiYear(luLast.y)+"</small>";
  var html="";
  ["T2","T3","T4","T5","T6","T7","CN"].forEach(function(w){html+='<div class="wd">'+w+'</div>';});
  for(var i=0;i<startDow;i++)html+='<div class="calcell empty"></div>';
  for(var d=1;d<=days;d++){
    var lu=solar2lunar(d,calM,calY);
    var jd=lu.jd,dayChi=(jd+1)%12,monthChi=(lu.m+1)%12;
    var startChi=((monthChi-2+12)*2)%12;
    var sao=SAO_NGAY[(dayChi-startChi+24)%12];
    var bad=TAM_NUONG.indexOf(lu.d)>=0||NGUYET_KY.indexOf(lu.d)>=0;
    html+='<div class="calcell'+(sao[1]===1?" hd":"")+(isThisMonth&&d===today.getDate()?" today":"")+'" data-d="'+d+'">'+
      (bad?'<span class="bad">•</span>':'')+
      '<div class="sd">'+d+'</div><div class="ld">'+(lu.d===1?lu.d+"/"+lu.m+(lu.leap?"n":""):lu.d)+'</div></div>';
  }
  $("calGrid").innerHTML=html;
}
$("calPrev").addEventListener("click",function(){calM--;if(calM<1){calM=12;calY--;}$("calDetail").innerHTML="";renderCal();});
$("calNext").addEventListener("click",function(){calM++;if(calM>12){calM=1;calY++;}$("calDetail").innerHTML="";renderCal();});
$("calGrid").addEventListener("click",function(e){
  var cell=e.target.closest(".calcell");
  if(!cell||cell.classList.contains("empty"))return;
  var d=parseInt(cell.dataset.d,10);
  $("calDetail").innerHTML=renderDayDetail(d,calM,calY,null);
  $("calDetail").scrollIntoView({behavior:"smooth",block:"start"});
});
(function(){var t=new Date();calY=t.getFullYear();calM=t.getMonth()+1;renderCal();})();

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
