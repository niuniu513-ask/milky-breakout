(() => {
  const checks=[];
  function check(value, name) { if(!value) throw Error(name); checks.push(name); }
  settings.sound=false; settings.motion=false;
  const unlocks = {wide:2,slow:4,catch:12,multi:22,laser:32,pierce:52};
  for(let lv=1; lv<=100; lv++) {
    startLevel(lv); state=S.PLAY;
    const cfg=LEVEL_CONFIGS[lv-1];
    check(cfg.cardPool.every(t=>lv>=unlocks[t]) && cfg.cardPool.length===Object.keys(unlocks).filter(t=>lv>=unlocks[t]).length, 'unlock pool '+lv);
    check(cfg.rhythm===RHYTHM[(lv-1)%10] && cfg.lesson===CHAPTER_LESSONS[Math.floor((lv-1)/10)], 'chapter lesson '+lv);
    for(let i=0;i<30;i++) dropCard(240,300);
    check(powers.every(p=>cfg.cardPool.includes(p.type)) && dropsUsed<=cfg.dropBudget, 'budget and eligible cards '+lv);
    const lessonBrick=bricks.find(k=>k.guaranteedCard);
    if(lessonBrick) {
      check(dropsUsed===cfg.dropBudget-1, 'teaching slot reserved '+lv);
      damageBrick(lessonBrick,99);
      check(powers.some(p=>p.type===cfg.lessonCard) && dropsUsed===cfg.dropBudget, 'teaching card guaranteed '+lv);
    }
    const before=dropsUsed; dropCard(240,300);
    check(dropsUsed===before, 'no extra drop beyond budget '+lv);
    const hits=cfg.rows.join('').split('').reduce((sum,ch)=>sum+(ch==='.'?0:ch==='B'?1:Number(ch)),0);
    if(lv>1 && (lv-1)%10===0) {
      const prev=LEVEL_CONFIGS[lv-2].rows.join('').split('').reduce((sum,ch)=>sum+(ch==='.'?0:ch==='B'?1:Number(ch)),0);
      check(hits<=prev*1.15, 'chapter boundary workload '+lv);
    }
  }
  startLevel(60); state=S.PLAY;
  applyPower('laser'); applyPower('pierce');
  check(effects.pierce===5 && effects.laser===0 && bullets.length===0, 'pierce replaces laser');
  applyPower('laser'); check(effects.laser===6 && effects.pierce===0, 'laser replaces pierce');
  applyPower('wide'); applyPower('wide'); check(Math.abs(paddle.w-paddle.baseW*1.35)<0.001 && effects.wide===10, 'wide refresh without stacking');
  effects.wide=0.001; update(1/120); check(paddle.w===paddle.baseW, 'wide expiry');
  launch(); applyPower('slow'); const speed=Math.hypot(balls[0].vx,balls[0].vy);
  applyPower('slow'); check(Math.abs(Math.hypot(balls[0].vx,balls[0].vy)-speed)<0.001, 'slow refresh without compounding');
  effects.slow=0.001; update(1/120); check(Math.abs(Math.hypot(balls[0].vx,balls[0].vy)-currentSpeed())<0.001, 'slow restores level speed');
  effects={wide:0,slow:0,pierce:5,laser:0,catch:0};
  const k={x:200,y:200,w:52,h:22,hp:3,maxHp:3}; bricks=[k];
  const b={x:220,y:229,vx:0,vy:-100,stuck:false};
  stepBall(b,0); stepBall(b,0); check(k.hp===2, 'pierce single contact single damage');
  b.y=250; stepBall(b,0); b.y=229; stepBall(b,0); check(k.hp===1, 'pierce reentry damages again');
  startLevel(60); effects.wide=0; applyPower('shrink'); effects.wide=0.001; update(1/120);
  check(paddle.w===paddle.baseW, 'risk shrink is temporary');
  startLevel(60); const initial=dropsUsed; launched=true; update(100);
  check(dropsUsed===initial && !effects.laser && !effects.pierce, 'no automatic assistance');
  return {passed:checks.length};
})()
