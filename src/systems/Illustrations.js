export const illustration=name=>`${import.meta.env.BASE_URL}assets/illustrations/${name}`;
// Match illustrations to the active chapter and its outcome.
export function narrativeIllustration(key,index,state){
 const revisit=state.playthrough!==1;
 const sequences={
  prologue:['shot1-console-found.jpg','shot3-press-button.png'],
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
