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
  /* Sao từng giờ (khởi Thanh Long theo nhóm chi ngày) + lục diệu Khổng Minh */
  var hstart=((dayChi%6)*2+8)%12;
  var lucDayIdx=((lu.m-1)+(lu.d-1))%6;
  res.lucDay=LUCDIEU[lucDayIdx];
  res.hours=[];
  for(var h=0;h<12;h++){
    var hsao=SAO_NGAY[(h-hstart+24)%12];
    var ld=LUCDIEU[(lucDayIdx+h)%6];
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
var DEG=Math.PI/180;
function norm360(x){x=x%360;return x<0?x+360:x;}
/* Phần tử quỹ đạo Kepler J2000 (Standish/JPL) + biến thiên/thế kỷ:
   [a, e, I(°), L(°), ϖ(°), Ω(°)] và tốc độ tương ứng */
var KEP={
  mercury:[[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593],
           [0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081]],
  venus:  [[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255],
           [0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418]],
  earth:  [[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0],
           [0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0]],
  mars:   [[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],
           [0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343]]
};
/* Toạ độ nhật tâm sinh thái (x,y,z) của một hành tinh tại thời điểm T (thế kỷ Julian) */
function helioXYZ(pl,T){
  var e0=KEP[pl][0],r=KEP[pl][1];
  var a=e0[0]+r[0]*T, e=e0[1]+r[1]*T, I=(e0[2]+r[2]*T)*DEG;
  var L=e0[3]+r[3]*T, wbar=e0[4]+r[4]*T, Om=(e0[5]+r[5]*T)*DEG;
  var w=(wbar-(e0[5]+r[5]*T))*DEG; /* argument cận điểm */
  var M=norm360(L-wbar); if(M>180)M-=360; M*=DEG;
  /* Giải phương trình Kepler */
  var E=M+e*Math.sin(M);
  for(var it=0;it<8;it++){var dE=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=dE;if(Math.abs(dE)<1e-8)break;}
  var xp=a*(Math.cos(E)-e), yp=a*Math.sqrt(1-e*e)*Math.sin(E);
  var cw=Math.cos(w),sw=Math.sin(w),cO=Math.cos(Om),sO=Math.sin(Om),cI=Math.cos(I),sI=Math.sin(I);
  var x=(cw*cO-sw*sO*cI)*xp+(-sw*cO-cw*sO*cI)*yp;
  var y=(cw*sO+sw*cO*cI)*xp+(-sw*sO+cw*cO*cI)*yp;
  var z=(sw*sI)*xp+(cw*sI)*yp;
  return [x,y,z];
}
/* Hoàng kinh địa tâm (0–360°, 0=Bạch Dương) của hành tinh trong (thuỷ/kim/hoả) */
function planetLon(pl,jdReal){
  var T=(jdReal-2451545.0)/36525;
  var p=helioXYZ(pl,T), earth=helioXYZ("earth",T);
  var gx=p[0]-earth[0], gy=p[1]-earth[1];
  return norm360(Math.atan2(gy,gx)/DEG);
}
/* Điểm Mọc (Ascendant) & Thiên đỉnh (MC), cần jd thực (UT), vĩ độ, kinh độ đông */
function ascMc(jdReal,latDeg,lonEastDeg){
  var T=(jdReal-2451545.0)/36525;
  /* GMST (Meeus 12.4) theo độ */
  var gmst=280.46061837+360.98564736629*(jdReal-2451545.0)+0.000387933*T*T-T*T*T/38710000.0;
  var lst=norm360(gmst+lonEastDeg);
  var ramc=lst*DEG;
  var eps=(23.4392911-0.0130042*T)*DEG; /* độ nghiêng hoàng đạo */
  var phi=latDeg*DEG;
  /* MC */
  var mc=norm360(Math.atan2(Math.sin(ramc),Math.cos(ramc)*Math.cos(eps))/DEG);
  /* Ascendant */
  var asc=Math.atan2(Math.cos(ramc), -(Math.sin(ramc)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps)));
  asc=norm360(asc/DEG);
  return {asc:asc,mc:mc};
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
  /* ---- Máy luận trả lời câu hỏi ---- */
  var domainUsed=domain!=="all"?domain:(analyzeQuestion(q).domain||null);
  var wsum=0,wtot=0;
  var evid=items.map(function(it,i){
    var s=TAROT_SCORE[it.gi];
    if(it.rev)s=-s*0.7;
    var w=(i===items.length-1&&items.length>1)?1.5:1;
    wsum+=s*w;wtot+=w;
    var clause=domainUsed&&it.ext&&it.ext[domainUsed]?firstClause(it.ext[domainUsed]):firstClause(it.rev?it.c.r:it.c.u);
    return {pos:it.p,name:it.c.n.split("(")[0].split("—").pop().trim()+(it.rev?" (ngược)":""),clause:clause,score:s,gi:it.gi};
  });
  html+=buildAnswerPanel({q:q,kind:"các lá bài",items:evid,avg:wsum/wtot,
    domainLabel:domainUsed?DOM_LABEL[domainUsed]:null,
    storyMode:spread==="3"?"qkhttl":null,
    timing:estimateTimingCards(evid)});
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
  /* ---- Máy luận trả lời câu hỏi ---- */
  var domainUsed=domain!=="all"?domain:(analyzeQuestion(q).domain||null);
  var wsum=0,wtot=0;
  var evid=picks.map(function(ix,i){
    var s=LEN_SCORE[ix];
    var w=(n===3&&i===2)||(n===9&&i===5)?1.5:(n===9&&i===4)?1.4:1;
    wsum+=s*w;wtot+=w;
    var ext=LEN_EXT[ix];
    var clause=domainUsed&&ext&&ext[domainUsed]?firstClause(ext[domainUsed]):firstClause(LENORMAND[ix].m);
    return {pos:poss[i],name:LENORMAND[ix].n.split("(")[0].trim(),clause:clause,score:s};
  });
  html+=buildAnswerPanel({q:q,kind:"bàn bài Lenormand",items:n===9?[evid[3],evid[4],evid[5]]:evid,avg:wsum/wtot,
    domainLabel:domainUsed?DOM_LABEL[domainUsed]:null,
    storyMode:n===3?"qkhttl":null,
    timing:"Lenormand vốn trả lời việc gần: khung thời gian mặc định là vài ngày đến vài tuần; lá "+(LEN_SCORE[picks[n-1]]>=0?"kết thuận — tin đến sớm":"kết nghịch — sẽ chậm hơn dự tính")+"."});
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
  /* ---- Máy luận trả lời câu hỏi ---- */
  var domainUsed=domain!=="all"?domain:(analyzeQuestion(q).domain||null);
  var wsum=0,wtot=0;
  var evid=picks.map(function(ix,i){
    var s=BT_SCORE[ix];
    var w=(i===picks.length-1&&picks.length>1)?1.5:1;
    wsum+=s*w;wtot+=w;
    var ext=BT_EXT[ix];
    var clause=domainUsed&&ext&&ext[domainUsed]?firstClause(ext[domainUsed]):firstClause(BAITAY[ix].m);
    return {pos:poss[i],name:BAITAY[ix].n,clause:clause,score:s};
  });
  html+=buildAnswerPanel({q:q,kind:"bài Tây",items:evid,avg:wsum/wtot,
    domainLabel:domainUsed?DOM_LABEL[domainUsed]:null,
    storyMode:n===3?"qkhttl":null,
    timing:"Bói bài Tây nói việc trong tầm vài tuần tới vài tháng; nếu bài nhiều Rô/Chuồn thì tin đến qua giấy tờ, người quen — thường nhanh."});
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
    /* ---- Máy luận trả lời câu hỏi + Thể Dụng Mai Hoa ---- */
    var q0=$("kdQ").value.trim(),qa0=analyzeQuestion(q0);
    var hx2b=null;
    if(movingIdx.length){
      hx2b=hexFromLines(kdLines.map(function(l){return {v:l.moving?1-l.v:l.v};}));
    }
    var TRIG_HANH=["Thổ","Mộc","Thủy","Kim","Thổ","Hỏa","Mộc","Kim"];
    var SINH5={"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
    var KHAC5={"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"};
    var maiHtml="",maiAdj=0;
    if(movingIdx.length){
      var allLow=movingIdx.every(function(i){return i<=3;}),allHi=movingIdx.every(function(i){return i>=4;});
      if(allLow||allHi){
        var dungTri=allLow?hx.lo:hx.hi,theTri=allLow?hx.hi:hx.lo;
        var dh=TRIG_HANH[dungTri],th=TRIG_HANH[theTri],rel;
        if(dh===th){rel="Thể – Dụng tỵ hoà (cùng hành "+dh+"): hai bên đồng khí, việc tiến triển êm thuận.";maiAdj=0.4;}
        else if(SINH5[dh]===th){rel="Dụng sinh Thể — cách ĐẠI CÁT của phép Mai Hoa: sự việc/đối phương chủ động mang lợi đến cho bạn, gần như không phải gắng.";maiAdj=0.8;}
        else if(SINH5[th]===dh){rel="Thể sinh Dụng — cách hao tổn: bạn phải bỏ công sức, tiền của, cảm xúc ra nuôi việc; có thể được việc nhưng hao mình — tính giới hạn đầu tư trước.";maiAdj=-0.3;}
        else if(KHAC5[dh]===th){rel="Dụng khắc Thể — cách bất lợi: sự việc/đối phương đang ở thế đè lên bạn; nên phòng thủ, lùi một nhịp, chưa tiến vội.";maiAdj=-0.8;}
        else{rel="Thể khắc Dụng — bạn nắm thế chủ động và có thể thắng việc, nhưng thắng kiểu tốn lực; liệu sức mà đánh, thắng nhanh gọn là đẹp nhất.";maiAdj=0.3;}
        maiHtml=meaningHTML("Thể – Dụng (phép Mai Hoa Dịch Số)","Thể "+TRIGRAMS[theTri]+" ("+th+") là MÌNH · Dụng "+TRIGRAMS[dungTri]+" ("+dh+") là VIỆC — quái có hào động là Dụng",rel);
      }else{
        maiHtml='<p class="note">Hào động rơi ở cả hai quái nên phép Thể–Dụng Mai Hoa không tách được; đọc theo ý các hào động và quẻ biến bên dưới.</p>';
      }
    }
    var kdAvg=(hx2b?0.6*KD_SCORE[hx.no]+0.4*KD_SCORE[hx2b.no]:KD_SCORE[hx.no])+maiAdj;
    var kdTiming;
    if(!movingIdx.length)kdTiming="Quẻ tĩnh (không hào động): tình thế chưa chuyển trong ngắn hạn — thời điểm phụ thuộc bạn chủ động khởi sự, và nên theo thời của quẻ ("+hex.n+").";
    else{
      var avgPos=movingIdx.reduce(function(a,b){return a+b;},0)/movingIdx.length;
      kdTiming=avgPos<=2?"Hào động ở tầng dưới (Sơ–Nhị): sự việc mới nhen — cần thêm thời gian, thường tính bằng tháng.":
        avgPos<=4?"Hào động ở tầng giữa (Tam–Tứ): sự việc đang giữa dòng — biến chuyển trong vài tuần tới vài tháng.":
        "Hào động ở tầng trên (Ngũ–Thượng): sự việc đã chín — biến chuyển gần kề, thường trong vài tuần.";
    }
    var kdEvid=[{pos:"Quẻ chủ",name:hex.n,score:KD_SCORE[hx.no],
      clause:qa0.domain&&ext&&ext[qa0.domain]?firstClause(ext[qa0.domain]):firstClause(hex.y)}];
    if(hx2b)kdEvid.push({pos:"Quẻ biến",name:KINHDICH[hx2b.no].n,score:KD_SCORE[hx2b.no],
      clause:qa0.domain&&KD_EXT[hx2b.no]&&KD_EXT[hx2b.no][qa0.domain]?firstClause(KD_EXT[hx2b.no][qa0.domain]):firstClause(KINHDICH[hx2b.no].y)});
    html+=buildAnswerPanel({q:q0,kind:"quẻ dịch",items:kdEvid,avg:kdAvg,
      domainLabel:qa0.domain?DOM_LABEL[qa0.domain]:null,timing:kdTiming});
    if(ext)html+=meaningHTML("Thoán từ (lời kinh)","nguyên văn dịch nghĩa",ext.tf);
    html+=meaningHTML("Ý quẻ","",hex.y);
    html+=meaningHTML("Lời khuyên","",hex.a);
    if(ext){
      html+='<hr class="divider">';
      var kdDoms=[["ty","Tình cảm"],["cv","Công việc"],["tc","Tài lộc"],["sk","Sức khoẻ"]];
      if(qa0.domain)kdDoms.sort(function(a,b){return (b[0]===qa0.domain?1:0)-(a[0]===qa0.domain?1:0);});
      kdDoms.forEach(function(d){
        if(ext[d[0]])html+=meaningHTML(d[1]+(d[0]===qa0.domain?" ★ (lĩnh vực bạn hỏi)":""),"",ext[d[0]]);
      });
    }
    if(movingIdx.length){
      var lines2=kdLines.map(function(l){return {v:l.moving?1-l.v:l.v};});
      var hx2=hexFromLines(lines2),hex2=KINHDICH[hx2.no];
      html+='<hr class="divider"><p class="center" style="font-size:.85rem;color:var(--ink-dim)">Có '+movingIdx.length+' hào động (hào '+movingIdx.join(", ")+'):</p>';
      movingIdx.forEach(function(mi){
        html+=meaningHTML("Hào "+mi+" động","",HAO_Y[mi-1]);
      });
      html+=maiHtml;
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
  /* ---- Cách cục tam hợp chiếu Mệnh ---- */
  var tamhop=[ls.menh,(ls.menh+4)%12,(ls.menh+8)%12,(ls.menh+6)%12];
  var hoiSao=[];
  tamhop.forEach(function(ci3){ls.stars[ci3].maj.forEach(function(s3){if(hoiSao.indexOf(s3)<0)hoiSao.push(s3);});});
  var has=function(arr){return arr.every(function(s3){return hoiSao.indexOf(s3)>=0;});};
  html+='<div class="panel"><h3>Cách cục hội chiếu về Mệnh</h3>';
  html+='<p class="note" style="margin-top:0">Mệnh không đứng một mình: nó nhận sao từ tam hợp (Quan Lộc '+CHI[(ls.menh+4)%12]+', Tài Bạch '+CHI[(ls.menh+8)%12]+') và xung chiếu (Thiên Di '+CHI[(ls.menh+6)%12]+'). Bộ sao hội về: <b>'+hoiSao.join(", ")+'</b>.</p>';
  var cachs=[];
  if(has(["Tử Vi","Thiên Phủ","Vũ Khúc","Thiên Tướng"]))cachs.push(["Tử Phủ Vũ Tướng","Bộ đế tinh trọn vẹn hội về Mệnh — cách của người có uy, có của, có người phò tá; đường công danh tài lộc vững vàng bậc nhất, phát về quản trị, lãnh đạo. Điều kiện phát trọn: giữ đức khiêm, có Tả Hữu Xương Khúc trợ."]);
  if(has(["Thất Sát","Phá Quân","Tham Lang"]))cachs.push(["Sát Phá Tham","Bộ tướng tinh xung phong — đời nhiều phen dựng nghiệp lớn từ biến động: dám phá dám lập, thành công qua thử thách chứ không qua đường êm. Hợp kinh doanh mạo hiểm, kỹ nghệ, quân – cảnh; kỵ sự trì trệ. Tuổi trẻ lận đận thì trung vận bùng nổ."]);
  if(has(["Thiên Cơ","Thái Âm","Thiên Đồng","Thiên Lương"]))cachs.push(["Cơ Nguyệt Đồng Lương","Bộ văn tinh mưu sĩ — cách của người làm việc bằng đầu óc, ngòi bút, sự tận tâm: công chức, cố vấn, giáo dục, y dược, nghiên cứu. Đời sống thiên về an ổn, phúc thọ; giàu chậm mà bền, quý ở chữ thanh nhàn."]);
  if(!cachs.length&&has(["Cự Môn","Thái Dương"]))cachs.push(["Cự Nhật","Cự Môn gặp Thái Dương — sống bằng lời nói dưới ánh sáng: luật sư, giảng dạy, truyền thông, ngoại giao. Danh tiếng đến từ cái miệng có mặt trời soi; kỵ dùng khẩu tài vào thị phi."]);
  if(!cachs.length&&has(["Thái Dương","Thái Âm"]))cachs.push(["Nhật Nguyệt","Mặt trời mặt trăng cùng chiếu Mệnh — âm dương song toàn: vừa quyết đoán vừa tinh tế, được cả cha lẫn mẹ (hoặc hai nguồn lực trái tính) nâng đỡ; đời thường có hai giai đoạn, hai sự nghiệp rõ rệt."]);
  if(cachs.length)cachs.forEach(function(c3){html+=meaningHTML("Cách «"+c3[0]+"»","",c3[1]);});
  else html+='<p style="font-size:.88rem">Bộ sao hội chiếu không rơi trọn vào một cách kinh điển — lá số thuộc dạng phối hợp: đọc từng chính tinh tại Mệnh làm gốc, các sao hội chiếu làm bổ trợ.</p>';
  if(ls.tuan.indexOf(ls.menh)>=0||ls.triet.indexOf(ls.menh)>=0){
    html+='<p class="warntxt" style="font-size:.88rem;margin-top:6px">⚠ Mệnh bị '+(ls.tuan.indexOf(ls.menh)>=0?"TUẦN":"")+(ls.triet.indexOf(ls.menh)>=0?(ls.tuan.indexOf(ls.menh)>=0?" và ":"")+"TRIỆT":"")+' án ngữ: sao tốt bị giảm lực, sao xấu cũng bị chặn bớt — đời thường phát muộn, thành công sau tuổi trung niên, đầu đời hay đổi hướng. Không phải dấu xấu tuyệt đối: là "cửa ải" phải qua.</p>';
  }
  html+='</div>';
  /* ---- Luận 12 cung ---- */
  html+='<div class="panel"><h3>Luận đủ 12 cung</h3>';
  for(var hi2=1;hi2<12;hi2++){
    var ci4=(ls.menh+hi2)%12,hname=HOUSES[hi2],st4=ls.stars[ci4];
    var body="";
    if(st4.maj.length===0){
      body="Vô chính diệu — mượn sao cung xung chiếu ("+CHI[(ci4+6)%12]+": "+(ls.stars[(ci4+6)%12].maj.join(", ")||"cũng trống")+") mà luận; lĩnh vực này chịu ảnh hưởng ngoại cảnh nhiều, nên chủ động tạo khung thay vì chờ ổn định tự đến.";
    }else{
      body=st4.maj.map(function(s4){
        var base=(SAO_INFO[s4]||"").split(".")[0];
        if(s4==="Thái Dương")base+=(ci4>=2&&ci4<=6?" — tại "+CHI[ci4]+" là đất ban ngày, mặt trời SÁNG: phát huy trọn vẹn":" — tại "+CHI[ci4]+" là đất ban đêm, mặt trời kém sáng: thành công đến muộn hơn, cần bền chí");
        if(s4==="Thái Âm")base+=(ci4>=8||ci4<=1?" — tại "+CHI[ci4]+" là đất ban đêm, mặt trăng SÁNG: phát huy trọn vẹn":" — tại "+CHI[ci4]+" là đất ban ngày, mặt trăng kém sáng: tài lộc điền sản tích lũy chậm hơn");
        return s4+": "+base+".";
      }).join(" ");
    }
    if(st4.min.length)body+=" (Phụ tinh: "+st4.min.join(", ")+".)";
    var hoaTag=[];
    ls.hoa.forEach(function(sn4,i4){if(st4.maj.indexOf(sn4)>=0||st4.min.indexOf(sn4)>=0)hoaTag.push(ls.hoaNames[i4]);});
    if(hoaTag.length)body+=" ✦ Cung này có "+hoaTag.join(", ")+(hoaTag.indexOf("Hóa Kỵ")>=0?" — lĩnh vực cần cẩn trọng nhất của cả lá số.":" — lĩnh vực được kích hoạt mạnh của lá số.");
    html+=meaningHTML(hname+" ("+CHI[ci4]+")"+(ci4===ls.than?" — kiêm cung Thân":""),CUNG_INFO[hname],body);
  }
  html+='<p class="note">Cung có Thân đóng là lĩnh vực nửa sau cuộc đời bạn dồn về; cung Tật Ách và cung có Hóa Kỵ là hai nơi cần phòng hơn tránh.</p></div>';
  /* ---- Đại vận hiện tại ---- */
  var nowY=new Date().getFullYear();
  var luNow=solar2lunar(new Date().getDate(),new Date().getMonth()+1,nowY);
  var tuoiMu=luNow.y-ls.lu.y+1;
  if(tuoiMu>=1){
    var dvCell=null;
    for(var ci5=0;ci5<12;ci5++){if(ls.daivan[ci5]<=tuoiMu&&tuoiMu<ls.daivan[ci5]+10){dvCell=ci5;break;}}
    if(dvCell===null){dvCell=ls.menh;}
    var stDV=ls.stars[dvCell];
    html+='<div class="panel"><h3>Đại vận hiện tại (tuổi mụ '+tuoiMu+')</h3>';
    html+='<p style="font-size:.9rem">Bạn đang đi đại vận 10 năm tại cung <b>'+HOUSES[((dvCell-ls.menh)%12+12)%12]+' ('+CHI[dvCell]+')</b>, từ '+ls.daivan[dvCell]+' đến '+(ls.daivan[dvCell]+9)+' tuổi: chủ đề 10 năm này xoay quanh «'+(CUNG_INFO[HOUSES[((dvCell-ls.menh)%12+12)%12]]||"").toLowerCase()+'»</p>';
    html+='<p style="font-size:.88rem;margin-top:6px">Sao tại cung đại vận: <b>'+(stDV.maj.join(", ")||"vô chính diệu")+'</b>'+(stDV.maj.length?" — "+stDV.maj.map(function(s5){return (SAO_INFO[s5]||"").split(".")[0];}).join("; ")+".":" — vận mượn khí cung xung chiếu, 10 năm linh hoạt biến hoá.")+'</p>';
    html+='<p class="note">Phép đọc: lấy cung đại vận làm "Mệnh tạm" 10 năm — sao tốt thì thập niên hanh thông theo nghĩa sao; đối chiếu thêm cung xung chiếu nó để biết lực cản.</p></div>';
  }
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
  html+='<div class="kv"><span class="k">Lục diệu ngày</span><span class="v">'+r.lucDay[0]+' <span class="tag '+(r.lucDay[1]==="tốt"?"good":"bad")+'">'+r.lucDay[1]+'</span></span></div>';
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
(function(){var sel=$("ctCity");if(sel)CITIES.forEach(function(c,i){var o=document.createElement("option");o.value=i;o.textContent=c[0];o.disabled=(c[3]===99);sel.appendChild(o);});sel.value="0";})();
function signName(idx){return ZODIAC[idx].n.split(" (")[0];}
function elemPair(a,b){/* 0 hợp nếu cùng cực (Hỏa-Khí dương, Đất-Nước âm), xung nếu khác */
  var yang=[0,2],ok=(yang.indexOf(a)>=0)===(yang.indexOf(b)>=0);return a===b?"same":(ok?"harmony":"tension");}
$("ctGo").addEventListener("click",function(){
  var dv=$("ctDate").value;
  if(!dv){$("ctResult").innerHTML='<p class="note center warntxt">Hãy chọn ngày sinh.</p>';return;}
  var p=dv.split("-"),yy=+p[0],mm=+p[1],dd=+p[2];
  var tv=($("ctTime").value||"12:00").split(":"),hh=+tv[0],mi=+tv[1];
  var hasTime=!!$("ctTime").value;
  var city=CITIES[parseInt($("ctCity").value,10)||0];
  var tz=(city&&city[3]!==99)?city[3]:7;
  var jdUT=jdFromDate(dd,mm,yy)-0.5+((hh-tz)+mi/60)/24;
  /* Vị trí các điểm (chỉ số cung 0–11) */
  var P={
    sun:INT(sunLongAt(jdUT)/30)%12,
    moon:moonSign(jdUT),
    mercury:INT(planetLon("mercury",jdUT)/30)%12,
    venus:INT(planetLon("venus",jdUT)/30)%12,
    mars:INT(planetLon("mars",jdUT)/30)%12
  };
  var ascObj=null;
  if(hasTime&&city&&city[3]!==99){var am=ascMc(jdUT,city[1],city[2]);ascObj=am;P.asc=INT(am.asc/30)%12;}
  var order=ascObj?["sun","moon","asc","mercury","venus","mars"]:["sun","moon","mercury","venus","mars"];
  var GL={sun:"☉",moon:"☽",asc:"↑",mercury:"☿",venus:"♀",mars:"♂"};
  var SIGNTXT={mercury:MERCURY_SIGN,venus:VENUS_SIGN,mars:MARS_SIGN,asc:ASC_SIGN};

  var html='<div class="panel"><h3>Bản đồ sao — '+(dd+"/"+mm+"/"+yy)+(hasTime?" "+$("ctTime").value:"")+(ascObj?" · "+city[0]:"")+'</h3>';
  html+='<div class="pillars" style="grid-template-columns:repeat(3,1fr)">';
  order.forEach(function(k){
    var z=ZODIAC[P[k]];
    html+='<div class="pillar"><div class="pt">'+GL[k]+' '+POINT_ROLE[k].split("—")[0].trim()+'</div>'+
      '<div class="pc" style="font-size:1.4rem">'+z.g+'</div><div class="pn" style="color:var(--gold)">'+signName(P[k])+'</div>'+
      '<div class="ps">'+ELEM_NAME[SIGN_ELEM[P[k]]]+'</div></div>';
  });
  html+='</div>';
  if(!ascObj)html+='<p class="note">Chưa có Điểm Mọc: hãy nhập giờ sinh và chọn nơi sinh (thành phố VN hoặc nước ngoài) để tính. Điểm Mọc đổi ~2 giờ một cung nên cần giờ càng chính xác càng tốt.</p>';
  html+='<p class="note">Vị trí hành tinh tính bằng cơ học quỹ đạo Kepler (chính xác cỡ cung); nếu sinh sát ngày/giờ một hành tinh đổi cung, hãy lập thêm lá kề bên để so.</p></div>';

  /* ---- BỘ BA CỐT LÕI ---- */
  var sz=ZODIAC[P.sun],mz=ZODIAC[P.moon];
  html+='<div class="answer"><h3>❖ Bộ ba cốt lõi — bạn là ai</h3>';
  var triad="Về bản chất (Mặt Trời) bạn là một <b>"+signName(P.sun)+"</b> — "+sz.m.split(".")[0].toLowerCase()+". ";
  triad+="Nhưng thế giới cảm xúc bên trong (Mặt Trăng ở <b>"+signName(P.moon)+"</b>) lại vận hành theo chất "+ELEM_NAME[SIGN_ELEM[P.moon]]+": khi không phòng bị, bạn "+
    (["cần được truyền lửa, phản ứng nhanh và bốc","cần sự ổn định vật chất và chỗ dựa chắc chắn","xử lý cảm xúc bằng lý trí, cần được trò chuyện","cảm nhận sâu, thấm lâu và cần không gian riêng để lắng"][SIGN_ELEM[P.moon]])+". ";
  if(ascObj)triad+="Còn lớp vỏ người khác gặp đầu tiên (Điểm Mọc <b>"+signName(P.asc)+"</b>) khiến bạn "+ASC_SIGN[P.asc].split(";")[0]+".";
  else triad+="(Thêm giờ &amp; nơi sinh để biết lớp vỏ Điểm Mọc — mảnh ghép thứ ba của bộ ba.)";
  html+='<p>'+triad+'</p>';
  /* Mặt Trời vs Mặt Trăng: nội tâm nhất quán hay giằng xé */
  var smRel=elemPair(SIGN_ELEM[P.sun],SIGN_ELEM[P.moon]);
  html+='<p><b>Ý chí và cảm xúc:</b> '+
    (smRel==="same"?"Mặt Trời và Mặt Trăng cùng chất "+ELEM_NAME[SIGN_ELEM[P.sun]]+" — con người bạn muốn trở thành và con người bạn thật sự cảm nhận rất thống nhất; bạn hành xử đúng như bạn cảm, ít giằng xé nội tâm (mặt trái: thiếu góc nhìn phản biện về chính mình).":
     smRel==="harmony"?"Mặt Trời ("+ELEM_NAME[SIGN_ELEM[P.sun]]+") và Mặt Trăng ("+ELEM_NAME[SIGN_ELEM[P.moon]]+") là hai chất hỗ trợ nhau — lý trí và cảm xúc phối hợp khá ăn ý, cho bạn sự linh hoạt tự nhiên.":
     "Mặt Trời chất "+ELEM_NAME[SIGN_ELEM[P.sun]]+" nhưng Mặt Trăng chất "+ELEM_NAME[SIGN_ELEM[P.moon]]+" — hai chất liệu nghịch nhau: điều bạn MUỐN và điều bạn CẦN thường kéo về hai phía. Đây chính là nguồn giằng co nội tâm của bạn, nhưng cũng là động cơ khiến bạn sâu sắc và luôn tự vấn.")+'</p>';
  /* Góc Mặt Trời - Mặt Trăng chính xác */
  var sunDeg=sunLongAt(jdUT),moonDeg=(function(){var d=jdUT-2451545.0;var L=218.316+13.176396*d,M=134.963+13.064993*d;var lon=(L+6.289*Math.sin(M*DEG))%360;return lon<0?lon+360:lon;})();
  var sep=Math.abs(sunDeg-moonDeg);if(sep>180)sep=360-sep;
  var asp=null;SUNMOON_ASPECT.forEach(function(a){if(Math.abs(sep-a[0])<=a[1]&&!asp)asp=a;});
  if(asp)html+='<p><b>Góc Mặt Trời–Mặt Trăng ('+Math.round(sep)+'°, '+asp[2]+'):</b> '+asp[3]+'</p>';
  html+='</div>';

  /* ---- CÂN BẰNG NGUYÊN TỐ & THỂ ---- */
  var ecount=[0,0,0,0],mcount=[0,0,0],pcount=[0,0];
  var wmap={sun:3,moon:3,asc:3,mercury:1,venus:1,mars:1};
  order.forEach(function(k){var w=wmap[k];ecount[SIGN_ELEM[P[k]]]+=w;mcount[SIGN_MODE[P[k]]]+=w;pcount[SIGN_POL[P[k]]]+=w;});
  var domE=0,lowE=0;for(var i=1;i<4;i++){if(ecount[i]>ecount[domE])domE=i;if(ecount[i]<ecount[lowE])lowE=i;}
  var domM=0;for(i=1;i<3;i++)if(mcount[i]>mcount[domM])domM=i;
  var colE=["#e0785a","#d4a94e","#8bd0c0","#6f9fd8"];
  html+='<div class="panel"><h3>Cân bằng nguyên tố trong bản đồ</h3>';
  for(i=0;i<4;i++)html+='<div class="nhrow"><span class="lb">'+ELEM_NAME[i]+'</span><div class="track"><div class="fill" style="width:'+(ecount[i]/order.length/3*100)+'%;background:'+colE[i]+'"></div></div><span class="ct">'+ecount[i]+'</span></div>';
  html+='<p style="font-size:.9rem;margin-top:8px"><b>Chất trội: '+ELEM_NAME[domE]+'.</b> '+ELEM_DESC[domE]+'</p>';
  if(ecount[lowE]===0)html+='<p style="font-size:.9rem;margin-top:6px"><b>Khuyết hẳn chất '+ELEM_NAME[lowE]+'.</b> Đây là "vùng mù" bẩm sinh của bạn: '+
    (["thiếu Hỏa nên đôi khi thiếu lửa hành động và sự tự khẳng định — cần chủ động nuôi đam mê và dám bắt đầu.","thiếu Đất nên dễ xa rời thực tế, hay quên chi tiết vật chất — cần kỷ luật và bám mặt đất.","thiếu Khí nên đôi khi khó lùi lại phân tích khách quan, dễ bị cảm xúc/thói quen cuốn — cần rèn tư duy phản biện và giao tiếp.","thiếu Nước nên có thể khó chạm và diễn đạt cảm xúc, hơi khô khan — cần học lắng nghe trái tim mình và người khác."][lowE])+' Người ta thường vô thức bị hút về người/việc mang chất mình thiếu.</p>';
  html+='<p style="font-size:.9rem;margin-top:6px"><b>Cách vận hành trội: '+MODE_NAME[domM]+'.</b> '+MODE_DESC[domM]+'</p>';
  html+='<p style="font-size:.88rem;margin-top:6px">Xu hướng '+(pcount[0]>pcount[1]?"HƯỚNG NGOẠI (dương) trội — bạn nghiêng về chủ động, biểu lộ, hành động ra bên ngoài":pcount[1]>pcount[0]?"HƯỚNG NỘI (âm) trội — bạn nghiêng về tiếp nhận, chiêm nghiệm, đời sống bên trong":"cân bằng âm–dương — bạn linh hoạt giữa chủ động và tiếp nhận")+'.</p></div>';

  /* ---- TÂM TRÍ · TÌNH YÊU · ĐỘNG LỰC ---- */
  html+='<div class="panel"><h3>Ba mảng đời sống</h3>';
  html+=meaningHTML("☿ Tâm trí (Sao Thuỷ ở "+signName(P.mercury)+")","cách nghĩ, học và nói","Bạn "+MERCURY_SIGN[P.mercury]+".");
  html+=meaningHTML("♀ Tình yêu (Sao Kim ở "+signName(P.venus)+")","cách yêu và điều bạn trân trọng","Trong tình cảm, bạn "+VENUS_SIGN[P.venus]+".");
  html+=meaningHTML("♂ Động lực (Sao Hoả ở "+signName(P.mars)+")","cách hành động và biểu lộ cơn giận","Khi hành động, bạn "+MARS_SIGN[P.mars]+".");
  /* Tổng hợp Kim–Hoả: phong cách yêu vs phong cách theo đuổi */
  var vmRel=elemPair(SIGN_ELEM[P.venus],SIGN_ELEM[P.mars]);
  html+='<p style="font-size:.9rem;margin-top:4px"><b>Sao Kim ↔ Sao Hoả (bạn muốn gì vs bạn theo đuổi thế nào trong tình yêu):</b> '+
    (vmRel==="tension"?"hai sao lệch chất — thứ bạn bị thu hút (Kim "+ELEM_NAME[SIGN_ELEM[P.venus]]+") và cách bạn chủ động chinh phục (Hoả "+ELEM_NAME[SIGN_ELEM[P.mars]]+") không cùng nhịp; bạn có thể mê kiểu người này nhưng lại hành xử theo kiểu khác, dễ tự mâu thuẫn trong chuyện tình cảm — nhận ra điều này giúp bạn bớt tự phá.":
     "hai sao hoà nhịp — điều bạn mê và cách bạn theo đuổi khá thống nhất, nên trong tình yêu bạn hành động đúng với mong muốn thật của mình, ít giằng xé.")+'</p></div>';

  /* ---- CHÂN DUNG TỔNG HỢP CÁ NHÂN HOÁ ---- */
  html+='<div class="answer"><h3>❖ Chân dung tổng hợp — con người riêng của bạn</h3>';
  var por="Ghép tất cả lại: bạn tiếp cận cuộc đời "+(ascObj?"với vẻ ngoài "+ASC_SIGN[P.asc].split(";")[0]:"bằng bản chất "+signName(P.sun))+", nhưng động cơ sâu xa là một "+signName(P.sun)+" "+ELEM_NAME[SIGN_ELEM[P.sun]].toLowerCase()+" — "+
    (["khát khao hành động và ý nghĩa","cần xây điều gì vững chắc và thực","sống bằng ý tưởng và kết nối","đi theo tiếng gọi của cảm xúc và chiều sâu"][SIGN_ELEM[P.sun]])+". ";
  por+="Trội chất "+ELEM_NAME[domE]+" và cách vận hành "+MODE_NAME[domM].split(" ")[0].toLowerCase()+" khiến điểm mạnh lớn nhất của bạn là "+
    (["dám khởi xướng và truyền lửa","kiên trì tạo ra kết quả bền","linh hoạt xoay chuyển và kết nối"][domM])+", còn "+ELEM_DESC[domE].split("điểm mù là ")[1]+" ";
  if(ecount[lowE]===0)por+="Vùng cần bồi đắp cả đời là chất "+ELEM_NAME[lowE]+". ";
  por+="Trong tình yêu bạn "+VENUS_SIGN[P.venus].split(";")[0]+", và khi cần bảo vệ mình bạn "+MARS_SIGN[P.mars].split(";")[0]+".";
  html+='<p>'+por+'</p>';
  if(smRel==="tension")html+='<p><b>Nút thắt trung tâm của bạn</b> là căng thẳng giữa lý trí ('+signName(P.sun)+') và cảm xúc ('+signName(P.moon)+'): học cách để hai phần này thương lượng thay vì lấn át nhau chính là hành trình trưởng thành lớn nhất của đời bạn.</p>';
  html+='<p class="note">Bản đọc được suy ra bằng logic tổng hợp các vị trí thật trong bản đồ của riêng bạn — không phải mô tả chung của một cung. Đây là công cụ soi chiếu bản thân, không phải định mệnh cố định.</p></div>';

  $("ctResult").innerHTML=html;
  saveHistory("Chiêm Tinh","","☉"+signName(P.sun)+" ☽"+signName(P.moon)+(ascObj?" ↑"+signName(P.asc):"")+" ☿"+signName(P.mercury)+" ♀"+signName(P.venus)+" ♂"+signName(P.mars));
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
  else if(tab==="canchi"){
    items=Object.keys(CAN_INFO).map(function(k){return {g:"天",n:"Thiên can "+k,m:CAN_INFO[k]};})
      .concat(Object.keys(CHI_INFO).map(function(k){return {g:"地",n:"Địa chi "+k,m:CHI_INFO[k]};}));
  }
  else if(tab==="nguhanh"){
    items=Object.keys(NGUHANH_INFO).map(function(k){return {g:{"Mộc":"🌳","Hỏa":"🔥","Thổ":"⛰️","Kim":"⚙️","Thủy":"💧"}[k],n:"Hành "+k,m:NGUHANH_INFO[k]};});
    items.push({g:"♻️",n:"Vòng tương sinh",m:"Mộc sinh Hỏa (cây nuôi lửa) → Hỏa sinh Thổ (tro thành đất) → Thổ sinh Kim (đất kết khoáng) → Kim sinh Thủy (kim loại chảy/ngưng nước) → Thủy sinh Mộc (nước nuôi cây). Được sinh là được nuôi dưỡng; đi sinh là hao lực nuôi người."});
    items.push({g:"⚔️",n:"Vòng tương khắc",m:"Mộc khắc Thổ (rễ xuyên đất) → Thổ khắc Thủy (đê ngăn nước) → Thủy khắc Hỏa (nước dập lửa) → Hỏa khắc Kim (lửa nung chảy kim) → Kim khắc Mộc (dao chặt cây). Khắc không hẳn xấu: khắc có chừng mực là chế hoá, tạo trật tự."});
  }
  else if(tab==="batquai"){items=Object.keys(BATQUAI_INFO).map(function(k){return {g:k.split(" ")[1],n:k,m:BATQUAI_INFO[k]};});}
  else if(tab==="thapthan"){items=Object.keys(THAPTHAN_INFO).map(function(k){return {g:"⚖",n:k,m:THAPTHAN_INFO[k]};});}
  else if(tab==="so"){
    items=Object.keys(SO_INFO).map(function(k){return {g:k,n:"Số "+k+(+k>9?" (số vua)":""),m:SO_INFO[k]};});
    Object.keys(PY_INFO).forEach(function(k){items.push({g:"📅",n:"Năm cá nhân "+k,m:PY_INFO[k]});});
  }
  else if(tab==="lenpairs"){items=LEN_PAIRS.map(function(p2){return {g:"🃟",n:p2[0],m:p2[1]};});}
  else if(tab==="tarotnum"){items=Object.keys(TAROT_NUM).map(function(k){return {g:"🔢",n:k,m:TAROT_NUM[k]};});}
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

/* ================= MÁY LUẬN GIẢI THEO CÂU HỎI ================= */
function analyzeQuestion(q){
  var s=(q||"").toLowerCase();
  var domain=null;
  if(/(yêu|tình|crush|người ấy|anh ấy|cô ấy|chồng|vợ|hẹn hò|cưới|hôn nhân|ly hôn|chia tay|tỏ tình|quay lại|phản bội|ngoại tình|độc thân|người yêu|thích mình|có bồ|duyên)/.test(s))domain="ty";
  else if(/(công việc|việc làm|nhận việc|xin việc|tìm việc|nghỉ việc|chuyển việc|việc mới|nghề|sếp|công ty|dự án|thi cử|kỳ thi|thi đậu|đi thi|học hành|đi học|du học|phỏng vấn|thăng chức|thăng tiến|đồng nghiệp|kinh doanh|khởi nghiệp|hợp tác|khách hàng|sự nghiệp|buôn bán|cửa hàng)/.test(s))domain="cv";
  else if(/(tiền|đầu tư|nợ|mua nhà|mua xe|mua đất|bán nhà|bán đất|lương|vốn|chứng khoán|coin|vàng|tài chính|thu nhập|vay|lãi|trúng|cho vay|đòi nợ|góp vốn)/.test(s))domain="tc";
  else if(/(bệnh|sức khoẻ|sức khỏe|khám|mổ|phẫu thuật|thuốc|đau|ốm|mang thai|sinh con|điều trị)/.test(s))domain="sk";
  var qtype="outcome";
  if(/(khi nào|bao giờ|bao lâu|lúc nào|tháng nào|năm nào|thời điểm nào|chừng nào)/.test(s))qtype="timing";
  else if(/(làm sao|làm thế nào|cách nào|nên làm gì|phải làm gì|làm gì để)/.test(s))qtype="how";
  else if(/(có nên|nên không|nên chăng|có được không|được không|có thành không|có đậu|có trúng|hay không|không\s*\?)/.test(s)||/^(có |nên |liệu )/.test(s.trim()))qtype="yesno";
  return {domain:domain,qtype:qtype,has:!!s.trim()};
}
function verdictPhrase(avg,qtype){
  if(qtype==="yesno"){
    if(avg>=0.9)return ["CÓ — NÊN LÀM","các dấu hiệu ủng hộ rõ rệt, thời điểm đã chín"];
    if(avg>=0.3)return ["NGHIÊNG VỀ CÓ","nhưng kèm điều kiện — xem phần rào cản bên dưới trước khi bước"];
    if(avg>-0.3)return ["50/50 — TUỲ CÁCH BẠN LÀM","cán cân đang cân bằng: chính hành động của bạn ở điểm nút sẽ quyết định kết quả"];
    if(avg>-0.9)return ["NGHIÊNG VỀ KHÔNG / CHƯA PHẢI LÚC","lực cản đang lớn hơn lực đẩy — hoãn lại hoặc đổi cách tiếp cận"];
    return ["KHÔNG NÊN LÚC NÀY","các dấu hiệu cảnh báo dồn dập; làm bây giờ dễ trả giá"];
  }
  if(avg>=0.9)return ["RẤT THUẬN LỢI","mọi dòng chảy đang xuôi theo bạn"];
  if(avg>=0.3)return ["THUẬN LỢI CÓ ĐIỀU KIỆN","kết quả tốt nằm trong tầm tay nếu xử lý được điểm vướng nêu dưới"];
  if(avg>-0.3)return ["ĐAN XEN — DO BẠN ĐỊNH ĐOẠT","tốt xấu đang giằng co; đây là thế cục 'người quyết chứ không phải số quyết'"];
  if(avg>-0.9)return ["NHIỀU TRẮC TRỞ","cần kiên nhẫn và phòng bị; chưa phải hồi kết nhưng là chặng khó"];
  return ["BẤT LỢI RÕ","nên phòng thủ, tránh quyết định lớn trong giai đoạn này"];
}
function estimateTimingCards(items){
  var fast=0,mid=0,slow=0,major=0;
  items.forEach(function(it){
    if(it.gi===undefined){mid++;return;}
    if(it.gi<22){major++;}
    else if(it.gi<36||(it.gi>=50&&it.gi<64)){fast++;}
    else if(it.gi<50){mid++;}
    else{slow++;}
  });
  if(major>=Math.ceil(items.length/2))return "Thời điểm gắn với một bước ngoặt bên trong bạn hơn là lịch bên ngoài — thường 1–3 tháng, và sẽ nhanh hơn ngay khi bạn thật sự đổi cách nhìn.";
  if(fast>=mid&&fast>=slow)return "Nhịp bài nhanh (nhiều Gậy/Kiếm): tính bằng ngày đến vài tuần — trong vòng một tháng có tin.";
  if(slow>fast&&slow>=mid)return "Nhịp bài chậm mà chắc (nhiều Tiền): tính bằng tháng — khoảng 1–6 tháng, kết quả bền.";
  return "Nhịp bài trung bình (nhiều Cốc): vài tuần đến 1–2 tháng, chín dần theo cảm xúc các bên.";
}
function buildAnswerPanel(opt){
  /* opt: {q, kind, items:[{pos,name,clause,score,gi}], avg, domainLabel, storyMode, extra} */
  var qa=analyzeQuestion(opt.q);
  var v=verdictPhrase(opt.avg,qa.qtype);
  var best=null,worst=null;
  opt.items.forEach(function(it){
    if(best===null||it.score>best.score)best=it;
    if(worst===null||it.score<worst.score)worst=it;
  });
  var html='<div class="answer"><h3>❖ Trả lời câu hỏi của bạn</h3>';
  if(qa.has){
    html+='<p>Với câu hỏi <i>«'+esc(opt.q)+'»</i>'+(opt.domainLabel?' (lĩnh vực '+opt.domainLabel+')':'')+', '+opt.kind+' trả lời: <b class="goldtxt">'+v[0]+'</b> — '+v[1]+'.</p>';
  }else{
    html+='<p>Thông điệp chung: <b class="goldtxt">'+v[0]+'</b> — '+v[1]+'. <span class="note">(Nhập câu hỏi cụ thể trước khi rút/gieo để phần trả lời bám sát việc của bạn hơn.)</span></p>';
  }
  /* Câu chuyện nối các vị trí */
  if(opt.items.length===1){
    html+='<p>'+esc(opt.items[0].name)+' nói thẳng vào việc này: '+esc(opt.items[0].clause)+'.</p>';
  }else if(opt.storyMode==="qkhttl"){
    html+='<p>Ghép các vị trí thành một mạch: chuyện này khởi nguồn từ việc <b>'+esc(opt.items[0].clause)+'</b>; hiện tại bạn đang đứng ở thế <b>'+esc(opt.items[1].clause)+'</b>; nếu giữ nguyên cách hiện nay, mọi thứ sẽ chảy về <b>'+esc(opt.items[2].clause)+'</b>.</p>';
  }else{
    var chunks=opt.items.map(function(it){return esc(it.pos)+" — "+esc(it.clause);});
    html+='<p>Ghép các vị trí: '+chunks.join("; ")+'.</p>';
  }
  /* Trả lời theo dạng câu hỏi */
  if(qa.qtype==="timing"&&opt.timing){
    html+='<p><b>Về thời điểm:</b> '+opt.timing+'</p>';
  }
  if(worst&&worst.score<0){
    html+='<p><b>Rào cản chính cần xử lý:</b> '+esc(worst.name)+' ('+esc(worst.pos)+') — '+esc(worst.clause)+'. Đây là nút thắt: gỡ được nó thì phần còn lại tự chảy.</p>';
  }
  if(best&&best.score>0){
    html+='<p><b>Điểm tựa mạnh nhất:</b> '+esc(best.name)+' ('+esc(best.pos)+') — '+esc(best.clause)+'. Hãy khai thác thế mạnh này trước.</p>';
  }
  if(qa.qtype==="how"){
    html+='<p><b>Việc nên làm:</b> tựa vào «'+(best?esc(best.clause):"điểm mạnh của bàn bài")+'», đồng thời chủ động hoá giải «'+(worst?esc(worst.clause):"điểm yếu của bàn bài")+'» — làm theo thứ tự đó, không làm ngược.</p>';
  }
  if(opt.extra)html+=opt.extra;
  html+='</div>';
  return html;
}

/* ================= HỒ SƠ NGÀY SINH ================= */
function getProfiles(){try{return JSON.parse(localStorage.getItem("bt_profiles")||"[]");}catch(e){return [];}}
function setProfiles(p){localStorage.setItem("bt_profiles",JSON.stringify(p));}
function fillProfileSelects(){
  var profs=getProfiles();
  ["tvProfile","ctProfile","btpProfile","tsProfile"].forEach(function(id){
    var sel=$(id);if(!sel)return;
    var cur=sel.value;
    sel.innerHTML='<option value="">— chọn hồ sơ —</option>'+profs.map(function(p,i){
      return '<option value="'+i+'">'+esc(p.name)+' ('+p.date.split("-").reverse().join("/")+')</option>';
    }).join("");
    sel.value=cur;
  });
}
function renderProfiles(){
  var profs=getProfiles();
  $("hsList").innerHTML=profs.length?profs.map(function(p,i){
    return '<div class="panel"><div class="kv"><span class="k">'+esc(p.name)+'</span><span class="v">'+p.date.split("-").reverse().join("/")+' · '+GIO_LABEL[p.hour]+' · '+(p.gender==="nam"?"Nam":"Nữ")+'</span></div>'+
      '<button class="btn ghost" data-delprof="'+i+'">Xoá hồ sơ này</button></div>';
  }).join(""):'<p class="note center">Chưa có hồ sơ nào. Lưu hồ sơ để dùng nhanh ở Tử Vi, Bát Tự, Thần Số, Chiêm Tinh.</p>';
  fillProfileSelects();
}
(function(){
  var sel=$("hsHour");GIO_LABEL.forEach(function(g,i){var o=document.createElement("option");o.value=i;o.textContent=g;sel.appendChild(o);});
  var sel2=$("btpHour");GIO_LABEL.forEach(function(g,i){var o=document.createElement("option");o.value=i;o.textContent=g;sel2.appendChild(o);});
  var sel3=$("hsCity");if(sel3&&typeof CITIES!=="undefined")CITIES.forEach(function(c,i){var o=document.createElement("option");o.value=i;o.textContent=c[0];o.disabled=(c[3]===99);sel3.appendChild(o);});
})();
$("hsSave").addEventListener("click",function(){
  var name=$("hsName").value.trim(),date=$("hsDate").value;
  if(!name||!date){alert("Cần nhập tên và ngày sinh.");return;}
  var profs=getProfiles();
  profs.push({name:name,date:date,hour:parseInt($("hsHour").value,10),gender:chipVal("hsGender"),city:parseInt($("hsCity").value,10)||0});
  setProfiles(profs);
  $("hsName").value="";
  renderProfiles();
});
document.addEventListener("click",function(e){
  var del=e.target.closest("[data-delprof]");
  if(del){var profs=getProfiles();profs.splice(parseInt(del.dataset.delprof,10),1);setProfiles(profs);renderProfiles();}
});
function bindProfileSelect(selId,fill){
  var sel=$(selId);if(!sel)return;
  sel.addEventListener("change",function(){
    var p=getProfiles()[parseInt(sel.value,10)];
    if(p)fill(p);
  });
}
bindProfileSelect("tvProfile",function(p){$("tvName").value=p.name;$("tvDate").value=p.date;$("tvHour").value=p.hour;
  $("tvGender").querySelectorAll(".chip").forEach(function(c){c.classList.toggle("on",c.dataset.v===p.gender);});});
bindProfileSelect("ctProfile",function(p){$("ctDate").value=p.date;var hh=(p.hour*2+23)%24;$("ctTime").value=(hh<10?"0":"")+hh+":00";if(p.city!==undefined&&$("ctCity"))$("ctCity").value=p.city;});
bindProfileSelect("btpProfile",function(p){$("btpDate").value=p.date;$("btpHour").value=p.hour;
  $("btpGender").querySelectorAll(".chip").forEach(function(c){c.classList.toggle("on",c.dataset.v===p.gender);});});
bindProfileSelect("tsProfile",function(p){$("tsName").value=p.name;$("tsDate").value=p.date;});
renderProfiles();

/* ================= BÁT TỰ (TỨ TRỤ) ================= */
function jdLapXuan(yy){
  for(var d=2;d<=7;d++){
    var jd=jdFromDate(d,2,yy);
    if(getSunLongitudeDeg(jd+1,TZ)>=315&&getSunLongitudeDeg(jd,TZ)<315)return jd;
  }
  return jdFromDate(4,2,yy);
}
function lapBatTu(dd,mm,yy,h){
  var jd=jdFromDate(dd,mm,yy);
  /* Trụ năm: đổi tại Lập xuân */
  var effY=yy;
  if(jd<jdLapXuan(yy))effY=yy-1;
  var yCan=(effY+6)%10,yChi=(effY+8)%12;
  /* Trụ tháng: theo tiết khí (kinh độ mặt trời) */
  var lon=getSunLongitudeDeg(jd+1,TZ);
  var mChi=(INT(((lon-315+360)%360)/30)+2)%12;
  var canDan=((yCan%5)*2+2)%10;
  var mCan=(canDan+((mChi-2+12)%12))%10;
  /* Trụ ngày */
  var dCan=(jd+9)%10,dChi=(jd+1)%12;
  /* Trụ giờ */
  var hCan=((dCan%5)*2+h)%10,hChi=h;
  var pillars=[
    {t:"Giờ",can:hCan,chi:hChi},
    {t:"Ngày",can:dCan,chi:dChi},
    {t:"Tháng",can:mCan,chi:mChi},
    {t:"Năm",can:yCan,chi:yChi}
  ];
  return {pillars:pillars,dayCan:dCan,jd:jd};
}
function thapThan(dayCan,otherCan){
  if(otherCan===null)return "";
  var dh=CAN_HANH[dayCan],oh=CAN_HANH[otherCan];
  var samePol=(dayCan%2)===(otherCan%2);
  var SINH={"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
  var KHAC={"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"};
  if(dh===oh)return samePol?"Tỷ Kiên":"Kiếp Tài";
  if(SINH[dh]===oh)return samePol?"Thực Thần":"Thương Quan";
  if(KHAC[dh]===oh)return samePol?"Thiên Tài":"Chính Tài";
  if(KHAC[oh]===dh)return samePol?"Thất Sát":"Chính Quan";
  if(SINH[oh]===dh)return samePol?"Thiên Ấn":"Chính Ấn";
  return "";
}
$("btpGo").addEventListener("click",function(){
  var dv=$("btpDate").value;
  if(!dv){$("btpResult").innerHTML='<p class="note center warntxt">Hãy chọn ngày sinh.</p>';return;}
  var p=dv.split("-"),yy=+p[0],mm=+p[1],dd=+p[2];
  var h=parseInt($("btpHour").value,10);
  var bt=lapBatTu(dd,mm,yy,h);
  var html='<div class="panel"><h3>Tứ trụ — bát tự</h3><div class="pillars">';
  bt.pillars.forEach(function(pl){
    var tt=pl.t==="Ngày"?"Nhật chủ":thapThan(bt.dayCan,pl.can);
    html+='<div class="pillar"><div class="pt">Trụ '+pl.t+'</div>'+
      '<div class="pc">'+CAN[pl.can]+'<br>'+CHI[pl.chi]+'</div>'+
      '<div class="pn">'+CAN_HANH[pl.can]+' / '+CHI_HANH[pl.chi]+'<br>'+napAm(pl.can,pl.chi)+'</div>'+
      '<div class="ps">'+tt+'</div>'+
      '<div class="pn">tàng: '+TANG_CAN[pl.chi].map(function(c){return CAN[c];}).join(" ")+'</div>'+
      '</div>';
  });
  html+='</div><p class="note">Trụ năm đổi tại Lập xuân, trụ tháng theo tiết khí (tính bằng kinh độ mặt trời thực) — đúng phép bát tự, không dùng tháng âm lịch. Sinh 23h–24h thuộc giờ Tý ngày hôm sau: nếu bạn sinh khung này, lập thêm lá cho ngày kế để so.</p></div>';
  /* Ngũ hành */
  var count={"Mộc":0,"Hỏa":0,"Thổ":0,"Kim":0,"Thủy":0};
  bt.pillars.forEach(function(pl){count[CAN_HANH[pl.can]]++;count[CHI_HANH[pl.chi]]++;});
  var colors={"Mộc":"#5fbf8a","Hỏa":"#e0785a","Thổ":"#d4a94e","Kim":"#cfcfd6","Thủy":"#6f9fd8"};
  html+='<div class="panel"><h3>Cân bằng ngũ hành (8 chữ)</h3>';
  var missing=[];
  ["Mộc","Hỏa","Thổ","Kim","Thủy"].forEach(function(hh){
    if(count[hh]===0)missing.push(hh);
    html+='<div class="nhrow"><span class="lb">'+hh+'</span><div class="track"><div class="fill" style="width:'+(count[hh]*12.5)+'%;background:'+colors[hh]+'"></div></div><span class="ct">'+count[hh]+'</span></div>';
  });
  if(missing.length)html+='<p class="note">Khuyết hành: <b>'+missing.join(", ")+'</b> — theo phép bổ khuyết dân gian, có thể bù bằng màu sắc, phương vị, nghề nghiệp thuộc hành đó (xem mục Ngũ Hành trong Tra Cứu).</p>';
  html+='</div>';
  /* Nhật chủ + cường nhược */
  var dCan=bt.dayCan,dh=CAN_HANH[dCan];
  var SINH={"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
  var help=0,drain=0;
  bt.pillars.forEach(function(pl,idx){
    if(pl.t==="Ngày")return;
    [CAN_HANH[pl.can],CHI_HANH[pl.chi]].forEach(function(hh,k){
      var w=(pl.t==="Tháng"&&k===1)?2:1; /* lệnh tháng nặng nhất */
      if(hh===dh||SINH[hh]===dh)help+=w;else drain+=w;
    });
  });
  var vuong=help>=drain;
  html+='<div class="panel"><h3>Nhật chủ '+CAN[dCan]+' ('+dh+' '+(dCan%2===0?"dương":"âm")+')</h3>';
  html+='<p style="font-size:.9rem">'+CAN_INFO[CAN[dCan]]+'</p>';
  html+='<p style="font-size:.9rem;margin-top:8px">Sơ bộ cường nhược: sinh trợ '+help+' — khắc tiết '+drain+' → thân <b>'+(vuong?"vượng":"nhược")+'</b> (đã nhân đôi trọng số lệnh tháng). '+
    (vuong?"Thân vượng ưa được TIẾT – KHẮC: dụng thần nghiêng về Thực Thương (sáng tạo, thể hiện), Tài (kinh doanh, quản lý tiền), Quan Sát (kỷ luật, chức trách).":
    "Thân nhược ưa được SINH – TRỢ: dụng thần nghiêng về Ấn (học vấn, quý nhân, bằng cấp) và Tỷ Kiếp (đồng đội, cộng sự, tự cường).")+
    '</p><p class="note">Đây là phép định cường nhược giản lược (đếm trọng số); cân dụng thần chuẩn mực còn xét vị trí, hợp xung, thấu tàng — kết quả trên mang tính định hướng.</p></div>';
  /* Thập thần chi tiết */
  html+='<div class="panel"><h3>Thập thần trong lá số</h3>';
  var seen={};
  bt.pillars.forEach(function(pl){
    if(pl.t==="Ngày")return;
    var tt=thapThan(dCan,pl.can);
    if(tt&&!seen[tt]){seen[tt]=1;html+=meaningHTML(tt+" (can trụ "+pl.t+" — "+CAN[pl.can]+")","",THAPTHAN_INFO[tt]);}
  });
  bt.pillars.forEach(function(pl){
    var main=TANG_CAN[pl.chi][0];
    if(pl.t==="Ngày"&&main===dCan)return;
    var tt=thapThan(dCan,main);
    if(tt&&!seen[tt]){seen[tt]=1;html+=meaningHTML(tt+" (tàng trong chi "+CHI[pl.chi]+" — "+CAN[main]+")","",THAPTHAN_INFO[tt]);}
  });
  html+='<p class="note">Thập thần cho biết «vai diễn» của từng ngũ hành quanh nhật chủ: xem đủ 10 thần ở mục Tra Cứu → Thập Thần.</p></div>';
  $("btpResult").innerHTML=html;
  saveHistory("Bát Tự","",bt.pillars.map(function(pl){return CAN[pl.can]+" "+CHI[pl.chi];}).join(" · "));
});

/* ================= THẦN SỐ HỌC ================= */
function reduceNum(n,keepMaster){
  while(n>9){
    if(keepMaster&&(n===11||n===22||n===33))return n;
    var s=0;String(n).split("").forEach(function(c){s+=+c;});
    n=s;
  }
  return n;
}
function stripVN(s){
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toUpperCase().replace(/[^A-Z]/g,"");
}
function letterVal(ch){return ((ch.charCodeAt(0)-65)%9)+1;}
$("tsGo").addEventListener("click",function(){
  var dv=$("tsDate").value,name=$("tsName").value.trim();
  if(!dv){$("tsResult").innerHTML='<p class="note center warntxt">Hãy chọn ngày sinh.</p>';return;}
  var p=dv.split("-"),yy=+p[0],mm=+p[1],dd=+p[2];
  /* Số chủ đạo: rút gọn từng phần rồi cộng — giữ số vua */
  var dpart=reduceNum(dd,true),mpart=reduceNum(mm,true),ypart=reduceNum(String(yy).split("").reduce(function(a,c){return a+ +c;},0),true);
  var lifePath=reduceNum(dpart+mpart+ypart,true);
  var birthday=reduceNum(dd,true);
  var now=new Date();
  var py=reduceNum(reduceNum(dd,false)+reduceNum(mm,false)+reduceNum(String(now.getFullYear()).split("").reduce(function(a,c){return a+ +c;},0),false),false);
  var html='<div class="panel"><h3>Số chủ đạo (Life Path)</h3><div class="numbig">'+lifePath+'</div>';
  html+='<p style="font-size:.9rem;margin-top:8px">'+SO_INFO[lifePath]+'</p>';
  html+='<p class="note">Cách tính: ngày '+dd+'→'+dpart+', tháng '+mm+'→'+mpart+', năm '+yy+'→'+ypart+'; tổng '+(dpart+mpart+ypart)+' → '+lifePath+' (giữ nguyên số vua 11/22/33 theo phép Pythagoras).</p></div>';
  html+='<div class="panel"><h3>Số ngày sinh: '+birthday+'</h3><p style="font-size:.88rem">'+(SO_INFO[birthday]?SO_INFO[birthday].split(".")[0]+" — năng khiếu bẩm sinh bạn mang theo, bổ trợ cho số chủ đạo.":"")+'</p></div>';
  if(name){
    var st=stripVN(name);
    var all=0,vow=0,con=0;
    var VOWELS="AEIOU";
    st.split("").forEach(function(ch){
      var v=letterVal(ch);all+=v;
      if(VOWELS.indexOf(ch)>=0)vow+=v;else con+=v;
    });
    var expr=reduceNum(all,true),soul=reduceNum(vow,true),pers=reduceNum(con,true);
    html+='<div class="panel"><h3>Bộ số theo tên «'+esc(name)+'»</h3>';
    html+='<div class="kv"><span class="k">Số sứ mệnh (toàn tên)</span><span class="v goldtxt" style="font-size:1.15rem">'+expr+'</span></div>';
    html+='<p style="font-size:.85rem;margin:4px 0 10px">'+(SO_INFO[expr]||"").split("Nghề hợp")[0]+'</p>';
    html+='<div class="kv"><span class="k">Số linh hồn (nguyên âm) — khát khao bên trong</span><span class="v goldtxt" style="font-size:1.15rem">'+soul+'</span></div>';
    html+='<p style="font-size:.85rem;margin:4px 0 10px">'+(SO_INFO[soul]||"").split(".")[0]+'.</p>';
    html+='<div class="kv"><span class="k">Số nhân cách (phụ âm) — vẻ ngoài người khác thấy</span><span class="v goldtxt" style="font-size:1.15rem">'+pers+'</span></div>';
    html+='<p style="font-size:.85rem;margin:4px 0 0">'+(SO_INFO[pers]||"").split(".")[0]+'.</p></div>';
  }else{
    html+='<p class="note center">Nhập họ tên để xem thêm Số sứ mệnh, Số linh hồn, Số nhân cách.</p>';
  }
  /* Số trưởng thành + cầu nối + nghiệp số + đam mê ẩn — chỉ khi có tên */
  var expr2=null,soul2=null,pers2=null,maturity=null,hidden=null,karmic=[];
  if(name){
    var st2=stripVN(name),all2=0,vow2=0,con2=0,freq={};
    "AEIOU".length;
    st2.split("").forEach(function(ch){var v=letterVal(ch);all2+=v;freq[v]=(freq[v]||0)+1;if("AEIOU".indexOf(ch)>=0)vow2+=v;else con2+=v;});
    expr2=reduceNum(all2,true);soul2=reduceNum(vow2,true);pers2=reduceNum(con2,true);
    maturity=reduceNum(reduceNum(lifePath,false)+reduceNum(expr2,false),true);
    var mx=0;for(var d in freq){if(freq[d]>mx){mx=freq[d];hidden=+d;}}
    /* nghiệp số: kiểm tra tổng hai chữ số trước khi rút của các phần cốt lõi */
    [all2,vow2,con2].forEach(function(t){var tt=t;while(tt>19)tt=String(tt).split("").reduce(function(a,c){return a+ +c;},0);if([13,14,16,19].indexOf(tt)>=0&&karmic.indexOf(tt)<0)karmic.push(tt);});
    var lpTotal=dpart+mpart+ypart;if([13,14,16,19].indexOf(lpTotal)>=0&&karmic.indexOf(lpTotal)<0)karmic.push(lpTotal);
  }
  html+='<div class="panel"><h3>Năm cá nhân '+now.getFullYear()+': số '+py+'</h3><p style="font-size:.9rem">'+PY_INFO[py]+'</p>';
  var pm=reduceNum(reduceNum(dd,false)+reduceNum(mm,false)+py+ (now.getMonth()+1),false);
  html+='<p style="font-size:.88rem;margin-top:6px"><b>Tháng cá nhân này (số '+pm+'):</b> '+PERSONAL_MONTH_HINT[pm]+'.</p>';
  html+='<p class="note">Năm cá nhân = ngày + tháng sinh + năm hiện tại (rút gọn 1–9); chu kỳ lặp 9 năm.</p></div>';

  /* ---- MÁY TỔNG HỢP CHÂN DUNG THẦN SỐ ---- */
  if(name){
    if(maturity!==null)html+='<div class="panel"><h3>Số trưởng thành: '+maturity+'</h3><p style="font-size:.88rem">Mục tiêu chín muồi nửa sau cuộc đời (rõ dần sau tuổi 35), khi số chủ đạo và số sứ mệnh hoà làm một: '+(SO_INFO[maturity]||"").split(".")[0]+'. Đây là "phiên bản trưởng thành" mà cả đời bạn đang hướng tới.</p></div>';
    if(karmic.length)html+='<div class="panel"><h3 class="warntxt">Nợ nghiệp số</h3>'+karmic.map(function(k){return '<p style="font-size:.88rem;margin-bottom:8px">'+KARMIC_DEBT[k]+'</p>';}).join("")+'</div>';
    if(hidden!==null)html+='<div class="panel"><h3>Đam mê tiềm ẩn: số '+hidden+'</h3><p style="font-size:.88rem">Con số xuất hiện nhiều nhất trong tên bạn — một tài năng/khát khao trội bạn mang theo và dễ bị cuốn vào: '+(SO_INFO[hidden]||"").split(".")[0]+'.</p></div>';

    html+='<div class="answer"><h3>❖ Chân dung tổng hợp — con người riêng của bạn</h3>';
    var fLP=NUM_FAMILY[lifePath],fEX=NUM_FAMILY[expr2];
    var por="Hành trình đời bạn (số chủ đạo <b>"+lifePath+"</b>) là con đường của "+FAMILY_DESC[fLP].split(":")[0].toLowerCase()+", cụ thể: "+(SO_INFO[lifePath]||"").split(".")[0].replace(/^[^.]*\. /,"")+". ";
    por+="Trong khi đó, bộ công cụ tự nhiên bạn sinh ra đã có (số sứ mệnh <b>"+expr2+"</b>) thuộc "+FAMILY_DESC[fEX].split(":")[0].toLowerCase()+". ";
    var rel=familyRelation(fLP,fEX);
    por+="Con đường và năng lực của bạn "+rel[0].toUpperCase()+": "+rel[1]+". ";
    html+='<p>'+por+'</p>';
    /* Nội tâm vs vẻ ngoài */
    var gap=Math.abs((soul2>9?soul2-9:soul2)-(pers2>9?pers2-9:pers2));
    html+='<p><b>Bên trong vs bên ngoài:</b> Trái tim bạn khát khao sâu kín (số linh hồn '+soul2+') là '+(SO_INFO[soul2]||"").split(".")[0].toLowerCase()+', nhưng vẻ ngoài người khác thấy (số nhân cách '+pers2+') lại là '+(SO_INFO[pers2]||"").split(".")[0].toLowerCase()+'. '+
      (soul2===pers2?"Hai mặt này trùng khớp — bạn sống rất thật, trong sao ngoài vậy, người khác nhìn bạn đúng như con người thật.":
       gap<=1?"Hai mặt khá gần nhau — bạn thể hiện ra ngoài tương đối đúng với lòng mình.":
       "Có một khoảng cách rõ giữa điều bạn thật sự muốn và hình ảnh bạn phóng ra — người ngoài dễ hiểu lầm bạn; thu hẹp khoảng này bằng cách để hành động khớp hơn với khát khao thật sẽ khiến bạn nhẹ nhõm hơn nhiều.")+'</p>';
    /* Cầu nối chủ đạo - sứ mệnh */
    var bridge=Math.min(4,Math.abs(reduceNum(lifePath,false)-reduceNum(expr2,false)));
    html+='<p><b>Cầu nối chủ đạo–sứ mệnh:</b> '+BRIDGE_DESC[bridge]+'. '+
      (rel[0].indexOf("căng")>=0?"Vì con đường và năng lực của bạn hơi nghịch nhau, đây là chỗ cần ý thức dung hoà: đừng ép mình chỉ sống theo một cực.":"Đây là lợi thế: hãy để năng lực tự nhiên phục vụ thẳng cho con đường đời bạn.")+'</p>';
    html+='<p><b>Số ngày sinh '+birthday+'</b> là món quà bẩm sinh tô điểm thêm: '+(SO_INFO[birthday]||"").split(".")[0].toLowerCase()+' — dùng nó như "vũ khí phụ" hỗ trợ con đường chính.</p>';
    html+='<p class="note">Chân dung này được suy ra bằng cách kết hợp năm con số cốt lõi của riêng bạn theo logic nhóm bản chất số — không phải mô tả chung của một con số đơn lẻ.</p></div>';
  }
  $("tsResult").innerHTML=html;
  saveHistory("Thần Số",name,"Chủ đạo "+lifePath+(expr2?" · Sứ mệnh "+expr2+" · Linh hồn "+soul2:"")+" · Năm "+py);
});
