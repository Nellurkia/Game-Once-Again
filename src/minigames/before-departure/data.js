export const CLOCK={start:1050,leaveHome:1140,departure:1170,minutesPerSecond:.15,actionMinutesPerSecond:.75};
export const AREAS={room:'出租屋',hall:'客厅 / 门口',landing:'楼道',street:'雨后的街道',store:'街角小店',entrance:'车站入口',platform:'站台'};
export const ROUTES={
 stairs:{id:'stairs',name:'楼梯 · 直达',cost:18,target:'entrance',description:'最近的路。稍累，但行动让迟疑慢慢下降。'},
 elevator:{id:'elevator',name:'电梯 · 主路',cost:26,target:'entrance',description:'更舒适、稳定。交通卡可省下 3 分钟。'},
 store:{id:'store',name:'绕行 · 小店',cost:18,target:'store',onward:14,description:'先到小店，可补给；之后到站还需 14 分钟。'}
};
export const ITEMS={coat:'外套',photo:'旧照片',charger:'充电器',notebook:'创作本',card:'交通卡'};
export const OBJECTS=[
 {id:'phone',area:'room',x:670,y:220,name:'A 的消息',type:'message',cost:0},
 {id:'key',area:'room',x:250,y:235,name:'拿钥匙',type:'key',cost:2},
 {id:'wallet',area:'room',x:930,y:235,name:'钱包 / 交通凭证',type:'wallet',cost:2},
 {id:'bag',area:'room',x:505,y:440,name:'确认背包',type:'inspect',cost:3,text:'真正必须带走的，只有钥匙与钱包。剩下两格不需要填满。'},
 {id:'photo',area:'room',x:215,y:425,name:'旧照片',type:'item',item:'photo',cost:6,text:'照片里的那个人说：有机会的话，我们一起去看看。'},
 {id:'notebook',area:'room',x:845,y:440,name:'创作本',type:'item',item:'notebook',cost:5,text:'本子上有许多未完成的想法。不用等它们全都完成才出发。'},
 {id:'coat',area:'room',x:1095,y:410,name:'挑选外套',type:'item',item:'coat',cost:8,text:'外套可以挡一点雨。准备有价值，但不必等到万事俱备。'},
 {id:'to_hall',area:'room',x:650,y:535,name:'去门口',type:'portal',target:'hall',cost:0},
 {id:'door',area:'hall',x:1090,y:295,name:'住所的门',type:'door',cost:0},
 {id:'window',area:'hall',x:220,y:220,name:'看看路线',type:'preview',cost:0},
 {id:'write',area:'hall',x:390,y:430,name:'写一句话给 A',type:'write',cost:5},
 {id:'wait',area:'hall',x:770,y:410,name:'再想一会儿',type:'wait',cost:5},
 {id:'to_room',area:'hall',x:180,y:490,name:'回房间',type:'portal',target:'room',cost:0},
 {id:'routes',area:'landing',x:690,y:245,name:'选择去车站的路线',type:'route',cost:0},
 {id:'home',area:'landing',x:205,y:485,name:'回到门口',type:'portal',target:'hall',cost:0},
 {id:'shop',area:'store',x:720,y:250,name:'补给 / 捎点东西',type:'shop',cost:0},
 {id:'store_exit',area:'store',x:1075,y:500,name:'继续去车站',type:'onward',cost:14},
 {id:'store_back',area:'store',x:195,y:505,name:'折返楼道',type:'return',cost:8},
 {id:'timetable',area:'entrance',x:285,y:245,name:'查看时刻表',type:'inspect',cost:1,text:'19:30，今天这班车会准时出发。19:00 前出门，才是那次同行的窗口。'},
 {id:'detail',area:'entrance',x:690,y:225,name:'查看 A 的详细消息',type:'detail',cost:1},
 {id:'gate',area:'entrance',x:1080,y:375,name:'检票，走向站台',type:'portal',target:'platform',cost:0},
 {id:'entrance_back',area:'entrance',x:170,y:515,name:'回到楼道',type:'return',cost:18},
 {id:'a',area:'platform',x:925,y:320,name:'走近 A',type:'meet',cost:0},
 {id:'seat',area:'platform',x:320,y:405,name:'再等一会儿',type:'wait',cost:5},
 {id:'platform_back',area:'platform',x:180,y:520,name:'回车站入口',type:'portal',target:'entrance',cost:0}
];
export const HESITATION=['平静','犹豫','拖延','慌乱','逃避'];
export const REPLIES={go:{text:'我来。',cost:1,hesitation:-8},wait:{text:'我再看看。',cost:5,hesitation:12},silent:{text:'先不回。',cost:0,hesitation:2}};
export const formatTime=minutes=>{const rounded=Math.floor(minutes);return `${String(Math.floor(rounded/60)).padStart(2,'0')}:${String(rounded%60).padStart(2,'0')}`;};
