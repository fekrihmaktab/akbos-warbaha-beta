const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const DEFAULT_MATCH_DURATION=5, P=process.env.PORT||3000, PUB=path.join(__dirname,"public"), users=new Map(),clients=new Map(),rooms=new Map(),invites=new Map();

// One canonical question bank. Each question has a stable ID; the UI translation
// layer chooses the requested language at render time. No separate DB per language.
const Q=[
['q001','ما هي عاصمة فرنسا؟',['باريس','روما','مدريد','برلين'],0,'جغرافيا'],['q002','كم عدد قارات العالم؟',['5','6','7','8'],2,'معلومات عامة'],['q003','أي كوكب يُعرف بالكوكب الأحمر؟',['الزهرة','المريخ','المشتري','عطارد'],1,'علوم'],['q004','كم دقيقة في الساعة؟',['50','60','70','90'],1,'معلومات عامة'],['q005','ما رمز عنصر الذهب؟',['Ag','Au','Fe','Go'],1,'علوم'],['q006','ما أكبر محيط على الأرض؟',['الأطلسي','الهندي','الهادئ','المتجمد الشمالي'],2,'جغرافيا'],['q007','من مؤلف روميو وجولييت؟',['شكسبير','ديكنز','تولستوي','هوميروس'],0,'أدب'],['q008','كم لونًا في قوس قزح التقليدي؟',['5','6','7','8'],2,'معلومات عامة'],['q009','ما هي عاصمة إيطاليا؟',['روما','باريس','برلين','مدريد'],0,'جغرافيا'],['q010','ما هو أكبر كوكب في المجموعة الشمسية؟',['الأرض','المريخ','المشتري','الزهرة'],2,'علوم'],['q011','كم يومًا في الأسبوع؟',['5','6','7','8'],2,'معلومات عامة'],['q012','ما الحيوان المعروف بأنه ملك الغابة؟',['النمر','الأسد','الفيل','الذئب'],1,'معلومات عامة'],['q013','ما لون الموز الناضج غالبًا؟',['أزرق','أخضر','أصفر','بنفسجي'],2,'معلومات عامة'],['q014','كم شهرًا في السنة؟',['10','11','12','13'],2,'معلومات عامة'],['q015','ما الغاز الذي يحتاجه الإنسان للتنفس؟',['الأكسجين','الهيليوم','النيتروجين فقط','الهيدروجين'],0,'علوم'],['q016','ما عاصمة مصر؟',['القاهرة','الإسكندرية','أسوان','الأقصر'],0,'جغرافيا'],['q017','أي حيوان يضع البيض؟',['القطة','الدجاجة','الحصان','الأرنب'],1,'معلومات عامة'],['q018','كم ساعة في اليوم؟',['12','18','24','30'],2,'معلومات عامة'],['q019','ما الكوكب الأقرب إلى الشمس؟',['الأرض','عطارد','المريخ','زحل'],1,'علوم'],['q020','ما أكبر قارة من حيث المساحة؟',['أفريقيا','أوروبا','آسيا','أستراليا'],2,'جغرافيا'],['q021','كم ضلعًا للمثلث؟',['2','3','4','5'],1,'رياضيات'],['q022','ما ناتج 5 + 5؟',['8','9','10','11'],2,'رياضيات'],['q023','ما ناتج 10 - 3؟',['5','6','7','8'],2,'رياضيات'],['q024','أي لون ينتج من مزج الأزرق والأصفر؟',['أخضر','برتقالي','بنفسجي','أحمر'],0,'معلومات عامة'],['q025','ما عاصمة اليابان؟',['طوكيو','سيول','بكين','بانكوك'],0,'جغرافيا'],['q026','ما الحيوان الذي يُعرف بسفينة الصحراء؟',['الحصان','الجمل','الفيل','الغزال'],1,'معلومات عامة'],['q027','ما اسم القمر الطبيعي للأرض؟',['الشمس','القمر','المريخ','الزهرة'],1,'علوم'],['q028','كم دقيقة في نصف ساعة؟',['15','20','30','45'],2,'رياضيات'],['q029','أي محيط يفصل تقريبًا بين أفريقيا وأستراليا؟',['الأطلسي','الهندي','الهادئ','المتجمد'],1,'جغرافيا'],['q030','ما المعدن الذي رمزه Fe؟',['الذهب','الفضة','الحديد','النحاس'],2,'علوم'],['q031','ما أول حرف في الأبجدية العربية؟',['ب','ت','ا','م'],2,'لغة'],['q032','ما عكس كلمة كبير؟',['طويل','صغير','سريع','قديم'],1,'لغة'],
['q033','إذا كان محيط دائرة يساوي 20π، فما نصف قطرها؟',['5','10','20','40'],0,'رياضيات'],
['q034','أي طبقة من الغلاف الجوي تحتوي على معظم طبقة الأوزون؟',['التروبوسفير','الستراتوسفير','الميزوسفير','الإكسوسفير'],1,'علوم'],
['q035','ما العدد الأولي التالي بعد 50؟',['51','52','53','55'],2,'رياضيات'],
['q036','ما العنصر الذي عدده الذري 26؟',['النحاس','الحديد','الزنك','الكالسيوم'],1,'علوم'],
['q037','ما المعاهدة التي أنهت الحرب العالمية الأولى رسميًا مع ألمانيا؟',['معاهدة باريس','معاهدة فرساي','معاهدة روما','معاهدة فيينا'],1,'تاريخ'],
['q038','ما العملية التي تستخدمها النباتات لتحويل الضوء إلى طاقة كيميائية؟',['التنفس','التخمر','البناء الضوئي','الانتشار'],2,'علوم'],
['q039','ما اسم العاصمة الحالية لكازاخستان؟',['ألماتي','أستانا','طشقند','بيشكيك'],1,'جغرافيا'],
['q040','ما قيمة الجذر التربيعي للعدد 144؟',['10','11','12','14'],2,'رياضيات'],
['q041','ما الوحدة الدولية لقياس المقاومة الكهربائية؟',['فولت','أمبير','أوم','واط'],2,'فيزياء'],
['q042','إذا رميت نردين عادلين، فما احتمال ظهور الرقم 6 على كليهما؟',['1/6','1/12','1/18','1/36'],3,'احتمالات'],
['q043','ما أعمق خندق محيطي معروف على الأرض؟',['خندق بورتوريكو','خندق ماريانا','خندق بيرو-تشيلي','خندق اليابان'],1,'جغرافيا'],
['q044','ما الإنزيم الذي يفك التفاف شريطي DNA أثناء تضاعفه؟',['الأميليز','الهيليكاز','الليباز','اللاكتاز'],1,'أحياء'],
['q045','ما مشتقة الدالة x² بالنسبة إلى x؟',['x','2x','x²','2'],1,'رياضيات'],
['q046','من مؤلف رواية مدينتان؟',['تولستوي','تشارلز ديكنز','فيكتور هوغو','إرنست همنغواي'],1,'أدب'],
['q047','ما سرعة الهروب التقريبية من سطح الأرض؟',['5.6 كم/ث','8.4 كم/ث','11.2 كم/ث','22.4 كم/ث'],2,'فيزياء'],
['q048','ما الجسيم الذي ينقل القوة الكهرومغناطيسية؟',['البروتون','النيوترون','الفوتون','الإلكترون'],2,'فيزياء']
].map(x=>({id:x[0],q:x[1],a:x[2],correct:x[3],category:x[4],difficulty:(+x[0].slice(1)<=12?'easy':(+x[0].slice(1)<=32?'medium':(+x[0].slice(1)<=40?'hard':'expert')))}));

const id=p=>p+crypto.randomBytes(5).toString("hex");
const send=(r,c,o)=>{r.writeHead(c,{"Content-Type":"application/json;charset=utf-8","Cache-Control":"no-store"});r.end(JSON.stringify(o))};
function wsFrame(data){
  const payload=Buffer.from(typeof data==='string'?data:JSON.stringify(data));
  const len=payload.length;
  if(len<126)return Buffer.concat([Buffer.from([0x81,len]),payload]);
  if(len<65536){const h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(len,2);return Buffer.concat([h,payload]);}
  const h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(len),2);return Buffer.concat([h,payload]);
}
function wsSend(socket,eventName,data){if(!socket||socket.destroyed)return false;try{socket.write(wsFrame(JSON.stringify({event:eventName,data})));return true}catch(e){return false}}
function wsClose(socket){try{if(socket&&!socket.destroyed){socket.write(Buffer.from([0x88,0]));socket.end()}}catch(e){}}
function parseWsFrames(buffer){
  const out=[];let offset=0;
  while(offset+2<=buffer.length){
    const b0=buffer[offset],b1=buffer[offset+1];const fin=!!(b0&0x80),opcode=b0&0x0f;let len=b1&0x7f;let pos=offset+2;
    if(len===126){if(pos+2>buffer.length)break;len=buffer.readUInt16BE(pos);pos+=2}
    else if(len===127){if(pos+8>buffer.length)break;const n=buffer.readBigUInt64BE(pos);if(n>BigInt(Number.MAX_SAFE_INTEGER))break;len=Number(n);pos+=8}
    const masked=!!(b1&0x80);let mask;if(mask){if(pos+4>buffer.length)break;mask=buffer.subarray(pos,pos+4);pos+=4}
    if(pos+len>buffer.length)break;
    let payload=Buffer.from(buffer.subarray(pos,pos+len));if(mask)for(let i=0;i<payload.length;i++)payload[i]^=mask[i%4];
    out.push({fin,opcode,payload});offset=pos+len;
  }
  return {frames:out,rest:buffer.subarray(offset)};
}
function upgradeWebSocket(req,socket){
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`),uid=u.searchParams.get('userId');
  if(!uid||!users.has(uid)){socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');return}
  const key=req.headers['sec-websocket-key'];if(!key){socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');return}
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const old=clients.get(uid);if(old)wsClose(old.socket);
  const client={uid,socket,buffer:Buffer.alloc(0)};clients.set(uid,client);users.get(uid).online=true;pushUsers();
  wsSend(socket,'connected',{userId:uid});
  for(const r of rooms.values())if(r.players.includes(uid))wsSend(socket,'room',snap(r,uid));
  socket.on('data',chunk=>{
    client.buffer=Buffer.concat([client.buffer,chunk]);const parsed=parseWsFrames(client.buffer);client.buffer=parsed.rest;
    for(const f of parsed.frames){
      if(f.opcode===0x8){wsClose(socket);return}
      if(f.opcode===0x9){const p=f.payload;const h=p.length<126?Buffer.from([0x8a,p.length]):null;if(h)socket.write(Buffer.concat([h,p]));continue}
      if(f.opcode===0x1){try{const msg=JSON.parse(f.payload.toString());if(msg.type==='ping')wsSend(socket,'pong',{})}catch(e){}}
    }
  });
  const cleanup=()=>{if(clients.get(uid)===client){clients.delete(uid);if(users.has(uid))users.get(uid).online=false;pushUsers()}};
  socket.on('close',cleanup);socket.on('error',cleanup);
}
const event=(r,e,d)=>{if(r&&!r.destroyed)wsSend(r,e,d)};
function body(req){return new Promise(ok=>{let s="";req.on("data",d=>s+=d);req.on("end",()=>ok(s?JSON.parse(s):{}))})}
function usersList(){return [...users.values()].filter(u=>u.online)}
function notify(uid,e,d){const c=clients.get(uid);return c&&event(c.socket,e,d)?1:0}
function pushUsers(){for(const c of clients.values())event(c.socket,"users",usersList())}
function capacity(mode){return mode==='2v2'?4:mode==='3v3'?6:2}
function isTeamMode(r){return r.mode==='2v2'||r.mode==='3v3'}
function teamCounts(r){const c=[0,0];for(const uid of r.players){const tm=teamOf(r,uid);if(tm===0||tm===1)c[tm]++;}return c}
function teamsReady(r){if(!isTeamMode(r)||r.players.length!==capacity(r.mode))return false;const c=teamCounts(r);return c[0]===capacity(r.mode)/2&&c[1]===capacity(r.mode)/2}
function activeTeamRooms(userId,mode){return [...rooms.values()].filter(r=>r.status==='lobby'&&r.mode===mode&&r.players.includes(userId)&&r.players.length<capacity(mode))}
function canonicalTeamRoom(userId,mode){
  const list=activeTeamRooms(userId,mode);
  if(!list.length)return null;
  list.sort((a,b)=>((b.owner===userId)-(a.owner===userId))||b.players.length-a.players.length);
  const keep=list[0];
  for(const extra of list.slice(1)){
    for(const uid of extra.players){
      if(keep.players.length>=capacity(mode))break;
      if(keep.players.includes(uid))continue;
      keep.players.push(uid); keep.scores[uid]=0;
      const counts=[0,0], max=capacity(mode)/2;
      for(const x of keep.players){const tm=keep.teams?.[x];if(tm===0||tm===1)counts[tm]++;}
      const oldTeam=extra.teams?.[uid];
      keep.teams[uid]=Number.isInteger(oldTeam)&&counts[oldTeam]<max?oldTeam:(counts[0]<=counts[1]?0:1);
    }
    for(const uid of extra.players)notify(uid,'roomLeft',{roomId:extra.id,mergedInto:keep.id});
    rooms.delete(extra.id);
  }
  broadcast(keep);
  return keep;
}
function teamOf(r,uid){const i=r.players.indexOf(uid);if(i<0)return null;return isTeamMode(r)?(Number.isInteger(r.teams?.[uid])?r.teams[uid]:null):(i===0?0:1)}
function teamScore(r,team){return isTeamMode(r)?(r.teamScores?.[team]||0):(r.scores?.[r.players[team]]||0)}
function snap(r,viewer){
  const team=teamOf(r,viewer);
  return {
    id:r.id,mode:r.mode,status:r.status,players:r.players.map(x=>users.get(x)).filter(Boolean),
    scores:r.scores||{},teamScores:{0:teamScore(r,0),1:teamScore(r,1)},teams:r.teams||{},capacity:capacity(r.mode),number:r.number||0,difficulty:r.difficulty||"easy",winner:r.winner||null,winnerTeam:r.winnerTeam??null,endReason:r.endReason||null,owner:r.owner||r.players[0]||null,
    deadline:r.deadline||null,lockedBy:r.lockedBy||null,stealBy:r.stealBy||null,stealTeam:r.stealTeam??null,buzzTurn:r.buzzTurn||null,
    matchEndsAt:r.matchEndsAt||null,matchDuration:r.matchDuration||DEFAULT_MATCH_DURATION,
    restartRequested:[...(r.restartRequested||new Set())],
    chat:(r.chat||[]).filter(m=>m.scope!=="team"||m.team===team),
    current:r.current&&{id:r.current.id,q:r.current.q,answers:r.current.a,category:r.current.category,number:r.number,deadline:r.deadline,lockedBy:r.lockedBy,stealBy:r.stealBy}
  }
}
function broadcast(r){for(const c of clients.values())if(r.players.includes(c.uid))event(c.socket,"room",snap(r,c.uid))}
function winCheck(r){
 if(isTeamMode(r)){const a=teamScore(r,0),b=teamScore(r,1);if(a>=10)return 0;if(b>=10)return 1;return null}
 return r.players.find(uid=>(r.scores[uid]||0)>=10)||null
}
function finish(r,winner,outcome,reason){r.status=outcome||"finished";r.endReason=reason||"score";r.winner=isTeamMode(r)?null:(winner||null);r.winnerTeam=isTeamMode(r)?(winner??null):null;r.deadline=null;if(r.matchTimer){clearTimeout(r.matchTimer);r.matchTimer=null}broadcast(r)}
function endByMatchTime(r){if(!r||!r.players?.length||r.status==="finished"||r.status==="draw")return;const a=teamScore(r,0),b=teamScore(r,1);if(a===b)finish(r,null,"draw","time");else if(isTeamMode(r))finish(r,a>b?0:1,"finished","time");else finish(r,a>b?r.players[0]:r.players[1],"finished","time")}
function startMatchTimer(r){
  if(r.matchTimer)clearTimeout(r.matchTimer);
  const token=r.runId;
  const durationMinutes=Math.max(2,Math.min(5,Number(r.matchDuration)||DEFAULT_MATCH_DURATION));
  r.matchDuration=durationMinutes;
  const durationMs=durationMinutes*60*1000;
  r.matchEndsAt=Date.now()+durationMs;
  r.matchTimer=setTimeout(()=>{if(r.runId===token)endByMatchTime(r)},durationMs+50)
}

function pickQuestion(r){
  // Prefer never-used questions. Once exhausted, recycle only questions that
  // were answered incorrectly, timed out, or passed. Correct answers are retired.
  const rank={easy:1,medium:2,hard:3,expert:4};
  const wanted=rank[r.difficulty]||1;
  let pool=Q.filter(q=>!r.retired.has(q.id)&&!r.recycle.has(q.id)&&q.id!==r.current?.id&&rank[q.difficulty]===wanted);
  if(!pool.length && wanted>1) pool=Q.filter(q=>!r.retired.has(q.id)&&!r.recycle.has(q.id)&&q.id!==r.current?.id&&rank[q.difficulty]===wanted-1);
  if(pool.length)return pool[Math.floor(Math.random()*pool.length)];
  const retry=[...r.recycle].map(id=>Q.find(q=>q.id===id)).filter(Boolean).filter(q=>q.id!==r.current?.id);
  const retryWanted=retry.filter(q=>rank[q.difficulty]===wanted);
  if(retryWanted.length)return retryWanted[Math.floor(Math.random()*retryWanted.length)];
  if(retry.length)return retry[Math.floor(Math.random()*retry.length)];
  return null;
}
function markRecycle(r,id){if(id&&!r.retired.has(id))r.recycle.add(id)}
function retireCurrent(r){if(r.current){r.retired.add(r.current.id);r.recycle.delete(r.current.id)}}
function next(r){
  r.attempts={};r.lockedBy=null;r.stealBy=null;r.stealTeam=null;
  const q=pickQuestion(r);
  if(!q){
    // This should only happen when every known question is retired. In a real
    // DB this is a data-exhaustion condition, not a win condition.
    r.status="question-bank-empty";broadcast(r);return;
  }
  r.number++;r.current={...q,difficulty:r.difficulty||"easy"};r.status="question";
  // IMPORTANT: the answer timer does not start until someone buzzes.
  // The initial question/buzz phase has no deadline.
  r.deadline=null;
  broadcast(r);
}
function openSteal(r,firstUser){
  if(r.status!=="question"&&r.status!=="locked")return;
  const reference=firstUser||r.lockedBy||r.buzzTurn||r.players[0];
  const refTeam=teamOf(r,reference);const other=r.players.find(x=>teamOf(r,x)!==refTeam)||r.players[0];
  if(!other){
    // Nobody buzzed: recycle the question and move to a fresh/retry question.
    markRecycle(r,r.current?.id);r.status="timeout";broadcast(r);const token=r.runId;setTimeout(()=>{if(r.runId===token)next(r)},700);return;
  }
  r.lockedBy=null;r.stealBy=isTeamMode(r)?null:other;r.stealTeam=isTeamMode(r)?(refTeam===0?1:0):null;r.status="steal";
  const seconds={easy:10,medium:12,hard:15,expert:18}[r.difficulty]||10;
  r.deadline=Date.now()+seconds*1000;broadcast(r);
  const token=r.runId;
  setTimeout(()=>{if(r.runId===token&&r.status==="steal"&&Date.now()>=r.deadline){if(isTeamMode(r))r.teamScores[r.stealTeam]=(r.teamScores[r.stealTeam]||0)-1;else r.scores[r.stealBy]=(r.scores[r.stealBy]||0)-1;markRecycle(r,r.current?.id);r.status="timeout";broadcast(r);const followToken=r.runId;setTimeout(()=>{if(r.runId===followToken)next(r)},900)}},seconds*1000+100);
}
function resetRoom(r){
  if(r.matchTimer)clearTimeout(r.matchTimer);
  r.runId=(r.runId||0)+1;
  r.matchTimer=null;r.matchEndsAt=null;r.status="lobby";r.scores={};r.players.forEach(x=>r.scores[x]=0);
  r.number=0;r.current=null;r.endReason=null;r.lockedBy=null;r.stealBy=null;r.stealTeam=null;r.deadline=null;r.winner=null;r.winnerTeam=null;
  r.retired=new Set();r.recycle=new Set();r.attempts={};r.buzzTurn=null;r.restartRequested=new Set();r.restartRequester=null;r.teamScores={0:0,1:0};
  broadcast(r)
}
function start(r){
  r.runId=(r.runId||0)+1;
  const token=r.runId;
  r.status="starting";r.winner=null;r.winnerTeam=null;r.matchEndsAt=null;r.scores=r.scores||{};r.players.forEach(x=>r.scores[x]=r.scores[x]||0);r.teamScores=r.teamScores||{0:0,1:0};
  broadcast(r);
  setTimeout(()=>{if(r.runId!==token)return;startMatchTimer(r);next(r)},1800)
}

const server=http.createServer(async(req,res)=>{const u=new URL(req.url,`http://${req.headers.host}`);try{
if(u.pathname==="/health"&&req.method==="GET"){return send(res,200,{ok:true,service:"akbos-warbaha",realtime:"websocket"})}
if(u.pathname==="/api/join"&&req.method==="POST"){let b=await body(req),name=(b.name||"لاعب").trim().slice(0,24)||"لاعب",existing=b.userId&&users.get(b.userId);if(existing&&existing.name===name){existing.avatar=b.avatar||existing.avatar||"😎";existing.language=b.language||existing.language||"ar";existing.online=true;pushUsers();return send(res,200,{user:existing})}let x={id:id("u_"),name,avatar:b.avatar||"😎",language:b.language||"ar",online:true};users.set(x.id,x);pushUsers();return send(res,200,{user:x})}
if(u.pathname==="/api/invites"&&req.method==="GET"){
 let uid=u.searchParams.get("userId");
 if(!users.has(uid))return send(res,401,{});
 res.setHeader("Cache-Control","no-store, no-cache, must-revalidate");
 return send(res,200,{invites:[...invites.values()].filter(i=>i.status==="pending"&&i.to===uid)});
}
if(u.pathname==="/api/team-challenge"&&req.method==="POST"){
 let b=await body(req),mode=["2v2","3v3"].includes(b.mode)?b.mode:null;
 if(!mode||!users.has(b.from)||!users.has(b.to)||b.from===b.to)return send(res,400,{ok:false,error:"invalid_team_challenge"});
 let r=null;
 if(b.roomId){
   const candidate=rooms.get(b.roomId);
   if(candidate&&candidate.status==="lobby"&&candidate.mode===mode&&candidate.owner===b.from&&candidate.players.length<capacity(mode))r=candidate;
 }
 if(!r){
   const list=activeTeamRooms(b.from,mode);
   r=list.find(x=>x.owner===b.from)||list[0]||null;
 }
 if(!r){
   r={id:id("r_"),mode,status:"lobby",owner:b.from,players:[b.from],scores:{[b.from]:0},teamScores:{0:0,1:0},teams:{[b.from]:0},number:0,current:null,lockedBy:null,stealBy:null,stealTeam:null,deadline:null,winner:null,winnerTeam:null,endReason:null,chat:[],retired:new Set(),recycle:new Set(),attempts:{},buzzTurn:null,restartRequested:new Set(),restartRequester:null,runId:0,matchTimer:null,matchEndsAt:null,matchDuration:DEFAULT_MATCH_DURATION};
   rooms.set(r.id,r);
 }
 if(r.players.includes(b.to))return send(res,409,{ok:false,error:"already_in_room",roomId:r.id});
 if(r.players.length>=capacity(mode))return send(res,409,{ok:false,error:"team_full",roomId:r.id});
 let inv=[...invites.values()].find(x=>x.status==="pending"&&x.from===b.from&&x.to===b.to&&x.roomId===r.id);
 if(!inv){inv={id:id("i_"),from:b.from,to:b.to,status:"pending",roomId:r.id,mode};invites.set(inv.id,inv)}
 const delivered=notify(inv.to,"invite",inv);
 return send(res,200,{...inv,ok:true,delivered,roomId:r.id});
}
if(u.pathname==="/api/challenge"&&req.method==="POST"){
 let b=await body(req),mode=["1v1","2v2","3v3"].includes(b.mode)?b.mode:"1v1";
 if(!users.has(b.from)||!users.has(b.to)||b.from===b.to)return send(res,400,{ok:false,error:"invalid_users"});
 // Challenge flow: keep the original one-click invite behavior, but if the
 // sender already owns/is in an open team lobby, attach the invite to that
 // same room so accepting the challenge joins the existing team match.
 let targetRoom=null;
 if(b.roomId){
   const candidate=rooms.get(b.roomId);
   if(candidate&&candidate.status==="lobby"&&candidate.players.includes(b.from)&&isTeamMode(candidate)&&candidate.mode===mode&&candidate.players.length<capacity(candidate.mode)) targetRoom=candidate;
 }
 if(!targetRoom&&isTeamMode({mode})){
   // Team mode: create one shared lobby as soon as the captain sends the
   // first teammate invite. This keeps every later invite for 2v2/3v3 tied
   // to the same room, even before the first invite is accepted.
   targetRoom=canonicalTeamRoom(b.from,mode);
   if(!targetRoom){
     targetRoom={id:id("r_"),mode,status:"lobby",owner:b.from,players:[b.from],scores:{[b.from]:0},teamScores:{0:0,1:0},teams:{[b.from]:0},number:0,current:null,lockedBy:null,stealBy:null,stealTeam:null,deadline:null,winner:null,winnerTeam:null,endReason:null,chat:[],retired:new Set(),recycle:new Set(),attempts:{},buzzTurn:null,restartRequested:new Set(),restartRequester:null,runId:0,matchTimer:null,matchEndsAt:null,matchDuration:DEFAULT_MATCH_DURATION};
     rooms.set(targetRoom.id,targetRoom);
   }
 }
 if(targetRoom){
   if(targetRoom.players.includes(b.to))return send(res,409,{ok:false,error:"already_in_room"});
   // Avoid duplicate pending invites while still notifying the target again.
   let existing=[...invites.values()].find(i=>i.status==="pending"&&i.from===b.from&&i.to===b.to&&i.roomId===targetRoom.id);
   if(!existing){
     existing={id:id("i_"),from:b.from,to:b.to,status:"pending",roomId:targetRoom.id,mode:targetRoom.mode};
     invites.set(existing.id,existing);
   }
   const delivered=notify(existing.to,"invite",existing);
   return send(res,200,{...existing,ok:true,delivered});
 }
 // No existing team room: preserve the normal challenge behavior and let the
 // recipient accept it to create a room.
 let x=[...invites.values()].find(i=>i.status==="pending"&&i.from===b.from&&i.to===b.to&&!i.roomId);
 if(!x){x={id:id("i_"),from:b.from,to:b.to,status:"pending",mode};invites.set(x.id,x)}
 const delivered=notify(x.to,"invite",x);
 return send(res,200,{...x,ok:true,delivered});
}
if(u.pathname==="/api/invite/respond"&&req.method==="POST"){
 let b=await body(req),i=invites.get(b.id);if(!i||i.to!==b.userId)return send(res,403,{});if(!b.accept){i.status="declined";notify(i.from,"inviteResult",i);return send(res,200,i)}i.status="accepted";
 if(i.roomId){const r=rooms.get(i.roomId);if(!r||r.status!=="lobby"||r.players.length>=capacity(r.mode))return send(res,409,{ok:false});if(!r.players.includes(i.to)){
   r.players.push(i.to);r.scores[i.to]=0;
   // Keep the captain on blue and let invited teammates fill red first.
   // This makes repeated invites from the captain land in the same opposing
   // team by default; players can still move teams with the visible buttons.
   const max=capacity(r.mode)/2;
   const counts=[0,0];
   for(const uid of r.players.slice(0,-1)){const tm=teamOf(r,uid);if(tm===0||tm===1)counts[tm]++;}
   r.teams[i.to]=counts[1]<max?1:0;
   broadcast(r)
 }return send(res,200,{...i,roomId:r.id})}
 const mode=["1v1","2v2","3v3"].includes(i.mode)?i.mode:"1v1";
 if(isTeamMode({mode})){
   const existing=canonicalTeamRoom(i.from,mode);
   if(existing&&existing.players.length<capacity(mode)){
     if(!existing.players.includes(i.to)){
       existing.players.push(i.to); existing.scores[i.to]=0;
       const max=capacity(mode)/2,counts=[0,0];
       for(const uid of existing.players){const tm=existing.teams?.[uid];if(tm===0||tm===1)counts[tm]++;}
       existing.teams[i.to]=counts[1]<max?1:0;
       broadcast(existing);
     }
     return send(res,200,{...i,roomId:existing.id});
   }
 }
 let r={id:id("r_"),mode,status:"lobby",owner:i.from,players:[i.from,i.to],scores:{[i.from]:0,[i.to]:0},teamScores:{0:0,1:0},teams:{[i.from]:0,[i.to]:1},number:0,current:null,lockedBy:null,stealBy:null,stealTeam:null,deadline:null,winner:null,winnerTeam:null,endReason:null,chat:[],retired:new Set(),recycle:new Set(),attempts:{},buzzTurn:null,restartRequested:new Set(),restartRequester:null,runId:0,matchTimer:null,matchEndsAt:null,matchDuration:DEFAULT_MATCH_DURATION};rooms.set(r.id,r);notify(i.from,"roomCreated",{roomId:r.id});notify(i.to,"roomCreated",{roomId:r.id});return send(res,200,{...i,roomId:r.id})
}
if(u.pathname==="/api/room/team"&&req.method==="POST"){let b=await body(req),r=rooms.get(b.roomId),team=Number(b.team);if(!r||r.status!=="lobby"||!r.players.includes(b.userId)||!isTeamMode(r)||![0,1].includes(team))return send(res,400,{ok:false});const max=capacity(r.mode)/2;const count=r.players.filter(uid=>r.teams?.[uid]===team).length;if(r.teams?.[b.userId]===team)return send(res,200,{ok:true,team});if(count>=max)return send(res,409,{ok:false,error:"team_full"});r.teams[b.userId]=team;broadcast(r);return send(res,200,{ok:true,team})}
if(u.pathname==="/api/room/team/swap"&&req.method==="POST"){let b=await body(req),r=rooms.get(b.roomId);if(!r||r.status!=="lobby"||!r.players.includes(b.userId)||!r.players.includes(b.otherUserId)||!isTeamMode(r)||b.userId===b.otherUserId)return send(res,400,{ok:false});const a=r.teams?.[b.userId],z=r.teams?.[b.otherUserId];if(![0,1].includes(a)||![0,1].includes(z)||a===z)return send(res,400,{ok:false});r.teams[b.userId]=z;r.teams[b.otherUserId]=a;broadcast(r);return send(res,200,{ok:true})}
if(u.pathname==="/api/room/start"&&req.method==="POST"){let b=await body(req),r=rooms.get(b.roomId);if(r&&r.status==="lobby"&&r.owner===b.userId){if(r.players.length!==capacity(r.mode))return send(res,409,{ok:false,error:"players_not_ready",count:r.players.length,capacity:capacity(r.mode)});if(isTeamMode(r)&&!teamsReady(r))return send(res,409,{ok:false,error:"teams_not_ready",counts:teamCounts(r)});r.difficulty=["easy","medium","hard","expert"].includes(b.difficulty)?b.difficulty:"easy";r.matchDuration=[2,3,4,5].includes(Number(b.matchDuration))?Number(b.matchDuration):DEFAULT_MATCH_DURATION;start(r)}return send(res,200,{ok:true})}
if(u.pathname==="/api/room/press"&&req.method==="POST"){
 let b=await body(req),r=rooms.get(b.roomId);if(!r||!r.players.includes(b.userId)||!['question'].includes(r.status)||r.lockedBy)return send(res,200,{ok:false});
 // During the initial buzz phase both players may press. The server's first accepted request wins.
 if(r.status==='question'){
   r.lockedBy=b.userId;
   r.status='locked';
   const seconds={easy:10,medium:12,hard:15,expert:18}[r.difficulty]||10;
   r.deadline=Date.now()+seconds*1000;
   broadcast(r);
   const token=r.runId;
   setTimeout(()=>{
     if(r.runId===token&&r.status==='locked'&&r.lockedBy===b.userId&&r.deadline&&Date.now()>=r.deadline){
       markRecycle(r,r.current?.id);
       openSteal(r,b.userId);
     }
   },seconds*1000+100);
   return send(res,200,{ok:true})
 }
 return send(res,200,{ok:false})}
if(u.pathname==="/api/room/pass"&&req.method==="POST"){let b=await body(req),r=rooms.get(b.roomId);if(!r||!r.players.includes(b.userId)||r.status!=="steal"||(isTeamMode(r)?teamOf(r,b.userId)!==r.stealTeam:r.stealBy!==b.userId))return send(res,200,{ok:false});markRecycle(r,r.current?.id);r.buzzTurn=r.players.find(x=>x!==b.userId)||r.players[0];r.status="timeout";broadcast(r);const token=r.runId;setTimeout(()=>{if(r.runId===token)next(r)},700);return send(res,200,{ok:true})}
if(u.pathname==="/api/room/answer"&&req.method==="POST"){
 let b=await body(req),r=rooms.get(b.roomId);if(!r||!r.players.includes(b.userId))return send(res,403,{});
 const myTeam=teamOf(r,b.userId);const answeringSteal=r.status==='steal'&&(isTeamMode(r)?myTeam===r.stealTeam:r.stealBy===b.userId), answeringLocked=r.status==='locked'&&r.lockedBy===b.userId;if(!answeringSteal&&!answeringLocked)return send(res,400,{});
 if(!r.deadline||Date.now()>r.deadline)return send(res,200,{ok:false,expired:true});
 let good=+b.answer===r.current.correct;
 if(good){if(isTeamMode(r))r.teamScores[myTeam]=(r.teamScores[myTeam]||0)+1;else r.scores[b.userId]=(r.scores[b.userId]||0)+1;retireCurrent(r);let winner=winCheck(r);if(winner!==null){finish(r,winner,"finished")}else{r.status='correct';broadcast(r);const token=r.runId;setTimeout(()=>{if(r.runId===token)next(r)},900)}}
 else if(answeringSteal){if(isTeamMode(r))r.teamScores[myTeam]=(r.teamScores[myTeam]||0)-1;else r.scores[b.userId]=(r.scores[b.userId]||0)-1;markRecycle(r,r.current?.id);r.status='wrong';broadcast(r);const token=r.runId;setTimeout(()=>{if(r.runId===token)next(r)},900)}
 else{if(isTeamMode(r))r.teamScores[myTeam]=(r.teamScores[myTeam]||0)-1;else r.scores[b.userId]=(r.scores[b.userId]||0)-1;markRecycle(r,r.current?.id);broadcast(r);const token=r.runId;setTimeout(()=>{if(r.runId===token)openSteal(r,b.userId)},250)}
 return send(res,200,{correct:good,steal:answeringSteal})}
if(u.pathname==="/api/room/restart"&&req.method==="POST"){
 let b=await body(req),r=rooms.get(b.roomId);if(!r||!r.players.includes(b.userId))return send(res,403,{});
 if(!r.restartRequested)r.restartRequested=new Set();
 if(r.restartRequested.has(b.userId))return send(res,200,{ok:true,status:"waiting"});
 const fromName=users.get(b.userId)?.name||"اللاعب";
 if(isTeamMode(r)){
   if(!r.restartRequester)r.restartRequester=b.userId;
   const requester=r.restartRequester;
   if(requester===r.owner){
     r.restartRequested.add(r.owner);
     for(const uid of r.players)if(uid!==r.owner)notify(uid,"restartRequest",{roomId:r.id,from:r.owner,fromName:users.get(r.owner)?.name||"القائد",teamBroadcast:true});
   }else{
     r.restartRequested.add(b.userId);
     if(r.owner)notify(r.owner,"restartRequest",{roomId:r.id,from:b.userId,fromName,teamBroadcast:false});
   }
   broadcast(r);return send(res,200,{ok:true,status:"waiting"});
 }
 r.restartRequester=b.userId;r.restartRequested.add(b.userId);const other=r.players.find(x=>x!==b.userId);if(other)notify(other,"restartRequest",{roomId:r.id,from:b.userId,fromName});broadcast(r);return send(res,200,{ok:true,status:"waiting"})}
if(u.pathname==="/api/room/restart/respond"&&req.method==="POST"){
 let b=await body(req),r=rooms.get(b.roomId);if(!r||!r.players.includes(b.userId))return send(res,403,{});
 const requester=r.restartRequester||r.players.find(x=>r.restartRequested?.has(x));if(!requester)return send(res,200,{ok:false});
 if(!b.accept){r.restartRequested=new Set();r.restartRequester=null;for(const uid of r.players)notify(uid,"restartResponse",{accepted:false,fromName:users.get(b.userId)?.name||"اللاعب"});broadcast(r);return send(res,200,{ok:true,status:"rejected"})}
 if(isTeamMode(r)){
   if(requester!==r.owner){if(b.userId!==r.owner)return send(res,403,{});r.restartRequested.add(r.owner)}
   else r.restartRequested.add(b.userId);
 }else r.restartRequested.add(b.userId);
 if(r.players.every(uid=>r.restartRequested.has(uid)) || (isTeamMode(r)&&requester!==r.owner&&b.userId===r.owner)){
   resetRoom(r);for(const uid of r.players)notify(uid,"restartResponse",{accepted:true,fromName:users.get(b.userId)?.name||"اللاعب"});setTimeout(()=>{if(r.status==="lobby"&&r.players.length===capacity(r.mode))start(r)},450);return send(res,200,{ok:true,status:"restarted"})
 }
 broadcast(r);return send(res,200,{ok:true,status:"waiting"})}
if(u.pathname==="/api/room/leave"&&req.method==="POST"){let b=await body(req),r=rooms.get(b.roomId);if(!r||!r.players.includes(b.userId))return send(res,200,{ok:true});const remaining=r.players.filter(x=>x!==b.userId);for(const [iid,inv] of invites){if(inv.from===b.userId||inv.to===b.userId)invites.delete(iid)};if(remaining.length===0){rooms.delete(r.id);return send(res,200,{ok:true})}for(const uid of remaining)notify(uid,"roomLeft",{roomId:r.id,playerId:b.userId});rooms.delete(r.id);return send(res,200,{ok:true})}
if(u.pathname==="/api/room/chat"&&req.method==="POST"){let b=await body(req),r=rooms.get(b.roomId);if(r&&r.players.includes(b.userId)){let scope=b.scope==='team'?'team':'all';r.chat.push({name:users.get(b.userId)?.name||'لاعب',text:(b.text||'').slice(0,180),scope,team:teamOf(r,b.userId)});broadcast(r)}return send(res,200,{ok:true})}
if(u.pathname==="/api/room"){let r=rooms.get(u.searchParams.get('id'));return r?send(res,200,snap(r)):send(res,404,{})}
let f=u.pathname==='/'?path.join(PUB,'index.html'):path.join(PUB,u.pathname);if(!f.startsWith(PUB)||!fs.existsSync(f))return send(res,404,{});let t={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'}[path.extname(f)]||'application/octet-stream';res.writeHead(200,{'Content-Type':t,'Cache-Control':'no-cache'});fs.createReadStream(f).pipe(res)
}catch(e){console.error(e);send(res,500,{error:'server'})}});
server.on("upgrade",(req,socket)=>{if(req.url?.startsWith("/ws"))return upgradeWebSocket(req,socket);socket.destroy()});
const heartbeat=setInterval(()=>{for(const c of clients.values()){try{c.socket.write(Buffer.from([0x89,0x00]))}catch(e){try{c.socket.destroy()}catch(_){}}}},30000);
server.listen(P,'0.0.0.0',()=>console.log(`اكبس واربح — FEKRI GAMES: http://localhost:${P} (WebSocket realtime)`));
process.on("SIGTERM",()=>{clearInterval(heartbeat);for(const c of clients.values()){try{wsClose(c.socket,1001,"server shutdown")}catch(e){}}server.close(()=>process.exit(0));});
