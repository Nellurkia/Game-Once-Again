export const illustration=name=>`${import.meta.env.BASE_URL}assets/illustrations/${name}`;
const suppliedStoryImages={
 prologue:[[0,2,1],[3,6,2]],
 ch1_w1:[[3,5,3],[6,8,4],[9,10,5]],
 p1_03:[[0,4,6],[5,7,7],[8,9,8]],
 p1_04:[[0,4,9],[5,9,10],[10,11,11]],
 p1_05_pre:[[0,5,12],[6,11,13]],p1_05_post:[[0,0,14]],p1_07:[[0,3,15]],
 p1_08:[[0,8,16]],p1_09:[[0,6,17],[7,9,18]],p1_10:[[0,9,19],[10,12,20]],p1_11:[[0,8,21]],
 p1_12_pre:[[0,3,22]],p1_14:[[9,13,23]],
 ch1_w2:[[0,11,24]],p2_03:[[8,10,25]],
 p2_04:[[0,2,26],[3,5,27],[6,14,28]],p2_05_post:[[3,10,29]],
 p2_08:[[0,3,30],[4,7,31],[8,11,32],[12,13,33]],p2_09:[[0,10,34]],
 p2_10:[[0,3,35]],p2_11:[[0,7,36]],p2_12:[[0,13,37]],
 p2_15:[[0,2,38],[3,7,28]],p2_17:[[0,7,39]],p2_18:[[0,5,37]]
};
function suppliedImage(key,index){
 const range=suppliedStoryImages[key]?.find(([from,to])=>index>=from&&index<=to);
 return range?`story-replace-${String(range[2]).padStart(2,'0')}.webp`:null;
}
// Match illustrations to the active chapter and its outcome.
export function narrativeIllustration(key,index,state){
 const revisit=state.playthrough!==1;
 const sequences={
  prologue:['shot1-console-found.jpg','shot3-press-button.png'],
  p1_03:['C7-morning-asleep.png'],
  p1_04:['T15-teen-sketchbook-classroom.png','T15-teen-sketchbook-classroom.png','T15-teen-sketchbook-classroom.png','T16-teen-classroom-bullying.png','T16-teen-classroom-bullying.png','T16-teen-classroom-bullying.png','T16-teen-classroom-bullying.png','T17-teen-scattered-drawings.png','T18-teen-friend-helps.png','T18-teen-friend-helps.png','T17-teen-scattered-drawings.png','T17-teen-scattered-drawings.png'],
  p1_05_pre:['T15-teen-sketchbook-classroom.png','T15-teen-sketchbook-classroom.png','T15-teen-sketchbook-classroom.png','T15-teen-sketchbook-classroom.png','T15-teen-sketchbook-classroom.png','T15-teen-sketchbook-classroom.png','T19-teen-hallway-goodbye.png','T19-teen-hallway-goodbye.png','T19-teen-hallway-goodbye.png','T19-teen-hallway-goodbye.png','T19-teen-hallway-goodbye.png','T14-teen-console-stairs.png'],
  p1_05_post:['T19-teen-hallway-goodbye.png'],
  p1_06:['Y1-rental-night.png','Y4-door-hesitation.png'],p1_07:['Y6-empty-platform.png'],
  p1_08:['A5-empty-child-room.png'],p1_09:['A5-empty-child-room.png'],p1_10:['A5-empty-child-room.png'],p1_11:['A5-empty-child-room.png'],p1_12_pre:['A5-empty-child-room.png'],p1_12_post:['Y6-empty-platform.png'],
  p2_01:['C1-bedroom-night.png'],p2_03:['NG1-mother-enters.png'],p2_04:['T7-chapter-card.png'],p2_05_pre:['T6-stairwell-console.png'],p2_05_post:['T13-minigame-week2.png'],
  p2_07:['Y11-ng-platform-reunion.png'],p2_08:['Y12-ng-side-by-side.png'],p2_09:['A5-empty-child-room.png'],p2_10:['A5-empty-child-room.png'],p2_11:['A5-empty-child-room.png'],p2_12:['Y12-ng-side-by-side.png'],p2_13:['Y12-ng-side-by-side.png'],p2_14:['Y1-rental-night.png'],p2_15:['C7-morning-asleep.png'],p2_16:['Y6-empty-platform.png'],p2_17:['Y12-ng-side-by-side.png'],p2_18:['Y1-rental-night.png'],
  'E-B-01':['E1-save-menu.png'],'E-B-02':['C1-bedroom-night.png'],'E-B-03':['E5-phone-final.png'],
  'E-A-01':['E3-save-current-life.png'],'E-A-02':['Y12-ng-side-by-side.png'],'E-A-03':['E3-save-current-life.png'],
  'E-T-01':['E4-restore-save.png'],'E-T-02':['shot1-console-found.jpg'],'E-T-03':['E5-phone-final.png'],
  ch1_w1:['C1-bedroom-night.png'],ch1_w2:['C3-hand-on-door.png'],
  ch2_w1:['T6-stairwell-console.png','T7-chapter-card.png'],
  ch2_w2:['T6-stairwell-console.png','T13-minigame-week2.png'],
  ch3_departure_w1:['Y1-rental-night.png','Y4-door-hesitation.png'],
  ch3_departure_w2:['Y1-rental-night.png','Y10-ng-running-corridor.png'],
  ch3_departure_missed:['Y6-empty-platform.png'],ch3_departure_late:['Y4-door-hesitation.png'],ch3_departure_success:['Y11-ng-platform-reunion.png','Y12-ng-side-by-side.png'],
  ch4_w1:['A5-empty-child-room.png'],ch4_w2:['A5-empty-child-room.png'],
  NE:['E3-save-current-life.png'],TE:['E4-restore-save.png']
 };
 if(key==='outro'){
  if(state.scene==='ch3')return state.flags.youthOutcome==='SUCCESS_AT_STATION'?'Y11-ng-platform-reunion.png':'Y6-empty-platform.png';
  return state.scene==='ch4'?'A5-empty-child-room.png':state.scene==='ch2'?'T7-chapter-card.png':revisit?'NG1-mother-enters.png':'C7-morning-asleep.png';
 }
 const supplied=suppliedImage(key,index);if(supplied)return supplied;
 const list=sequences[key];return list?.[Math.min(index,list.length-1)]||'shot2-screen-glow.png';
}
export function menuIllustration(kind,index){
 const isIcon=kind==='icon';const box=isIcon?`${[140,605,1050,1505][index]} 370 410 405`:`${[58,550,1038,1520][index]} 395 485 350`;
 const filterId=`paper-${kind}-${index}`;
 return `<svg class="${isIcon?'menu-kit-icon':'menu-kit-button'}" viewBox="${box}" preserveAspectRatio="${isIcon?'xMidYMid meet':'none'}" aria-hidden="true"><defs><filter id="${filterId}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -6 -6 -6 0 17.8"/></filter></defs><image filter="url(#${filterId})" href="${illustration(isIcon?'M6-icon-kit.png':'M5-button-kit.png')}" width="2048" height="1152"/></svg>`;
}

export function narrativePortrait(state){
 const child=state.scene==='ch1',teen=state.scene==='ch2',youth=state.scene==='ch3';
 if(!child&&!teen&&!youth)return '';
 const name=child?'child-char-sheet.png':teen?'teen-char-sheet.png':'youth-char-sheet.png';
 const box=child?'85 870 210 440':teen?'112 835 195 460':'368 10 159 330';
 return `<svg class="narrative-portrait" viewBox="${box}" role="img" aria-label="${child?'童年':teen?'少年':'青年'}的我"><image href="${illustration(name)}" width="${youth?1280:1024}" height="${youth?720:1360}"/></svg>`;
}
