/* 分层关卡 v0.2。所有坐标为世界像素；周目只由总游戏传入。 */
(() => {
  const platform=(x,y,width)=>({x,y,width,height:16,oneWay:true});
  const zones=[
    {id:'room',name:'旧书房与阁楼',shortName:'阁楼',x:0,width:1120,caption:'有些记忆，藏在刚刚接回的楼梯上。',partial:'书架上面，原来还有一间阁楼。',complete:'旧相框的另一半，也从阁楼里找回来了。'},
    {id:'station',name:'钟楼下的小车站',shortName:'车站',x:1120,width:1120,caption:'站牌上的符号，或许能让沉默的灯重新亮起。',partial:'灯，月亮，星星。站牌像是在提醒什么。',complete:'那张旧车票也回来了。站台的另一边，还有人等过。'},
    {id:'home',name:'回廊尽头的灯室',shortName:'灯室',x:2240,width:1200,caption:'绕过高处的回廊，才看见那盏一直亮着的灯。',partial:'绕过回廊，终于又看见那盏灯。',complete:'最后一张合照回来了。记忆有了完整的轮廓。'}
  ];
  const pieces=[];
  function add(id,segmentId,label,target,pickup,requires,addedColliders,clue,optional=false,inside=null){pieces.push({id,segmentId,label,targetId:'target-'+id,target,pickup,requires,addedColliders,clue,optional,inside,index:pieces.length});}
  const t=(x,y,width,height)=>({x,y,width,height}),q=(x,y)=>({x,y});
  add('room-stairs','room','断开的楼梯',t(240,960,220,220),q(180,1152),[],[platform(250,1100,90),platform(340,1020,100)],'楼梯原本通向书架上面。');
  add('room-attic','room','阁楼房间',t(510,700,270,220),q(380,992),['room-stairs'],[platform(510,900,270),platform(540,860,90),platform(640,780,130)],'接回楼梯后，登上第二级台阶寻找新碎片。',false,'room-stairs');
  add('room-bridge','room','两段悬空栈道',t(840,680,250,135),q(696,752),['room-attic'],[platform(848,780,72),platform(1006,730,84)],'阁楼最上层藏着通往车站的栈道。',false,'room-attic');
  add('room-photo','room','相框与侧架',t(70,780,160,200),q(554,872),['room-attic'],[platform(80,950,90),platform(160,870,65)],'把阁楼里的相框带回旧书房左侧。',true,'room-attic');
  add('station-stairs','station','下行站台',t(1290,740,230,240),q(1210,702),[],[platform(1350,820,65),platform(1450,900,70)],'候车亭藏在站台下面，先往下走。');
  add('station-waiting','station','候车亭与钟梯',t(1620,700,250,300),q(1400,792),['station-stairs'],[platform(1620,980,250),platform(1630,900,75),platform(1720,820,75),platform(1800,750,70)],'下行站台恢复后，第一级台阶上出现了候车亭碎片。',false,'station-stairs');
  add('station-beam','station','钟楼高处的横梁',t(1900,590,180,180),q(1835,722),['station-waiting'],[platform(1920,700,70),platform(2020,620,60)],'沿候车亭的钟梯登高，取回高处的横梁。',false,'station-waiting');
  add('station-sign','station','缺失的旧站牌',t(1420,530,230,130),q(1700,952),['station-waiting'],[],'候车亭底层有一块旧站牌；图案是信号灯的线索。',false,'station-waiting');
  add('station-ticket','station','旧车票与侧窗',t(1150,490,150,180),q(1780,952),['station-waiting'],[platform(1170,640,95)],'候车亭的旧车票，要放回车站入口上方的侧窗。',true,'station-waiting');
  add('home-shelf','home','书架台阶',t(2420,420,230,260),q(2330,592),[],[platform(2420,540,80),platform(2530,460,80)],'书架的高低层板，可以变成登上阁楼的路。');
  add('home-window','home','阁楼窗与内室',t(2660,240,220,250),q(2570,432),['home-shelf'],[platform(2660,460,220),platform(2690,390,80),platform(2790,310,80)],'书架顶层藏着一扇阁楼窗。',false,'home-shelf');
  add('home-bridge','home','回廊的转折',t(2890,250,220,190),q(2830,282),['home-window'],[platform(2910,340,68),platform(3030,280,80)],'内室的高台上，还有一段通往灯室的回廊。',false,'home-window');
  add('home-floor','home','灯室与最后的门',t(3140,180,180,170),q(2750,432),['home-window'],[platform(3140,300,180)],'窗后的内室下层，藏着最后一间灯室。',false,'home-window');
  add('home-photo','home','灯室里的合照',t(2280,320,120,160),q(3250,272),['home-floor'],[platform(2290,420,90)],'把灯室里的合照带回回廊入口，补全最后一角。',true,'home-floor');
  const first=pieces.filter(p=>!p.optional).map(p=>p.id),second=pieces.map(p=>p.id);
  window.MEMORY_LEVEL={id:'elder-memory',worldWidth:3440,worldHeight:1400,fallY:1370,zones,pieces,
    baseColliders:[{x:0,y:1180,width:280,height:100},platform(420,940,170),platform(780,780,100),platform(1120,730,150),platform(1120,1100,250),platform(1180,1000,95),platform(1270,900,80),platform(1160,810,95),platform(1480,980,180),platform(2100,620,150),platform(2260,620,150)],
    checkpoints:[{id:'room',x:80,y:1128,requires:[]},{id:'station',x:1140,y:678,requires:['room-bridge']},{id:'home',x:2280,y:568,requires:['station-beam'],flag:'stationSignal'}],
    signal:{order:['lamp','moon','star'],gate:{x:2130,y:450,width:24,height:170},switches:[{id:'lamp',name:'灯',x:1644,y:952,requires:['station-waiting']},{id:'moon',name:'月',x:1840,y:722,requires:['station-waiting']},{id:'star',name:'星',x:2045,y:592,requires:['station-beam']}]},
    key:{id:'exit-key',x:3200,y:272,requires:['home-floor'],flag:'stationSignal'},exit:{x:3290,y:248},
    variants:{first:{id:'first',availablePieceIds:first,completionPieceIds:first},second:{id:'second',availablePieceIds:second,completionPieceIds:second}}
  };
})();
