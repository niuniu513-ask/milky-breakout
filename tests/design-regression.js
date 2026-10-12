(() => {
  const checks=[];
  function check(value, name) { if(!value) throw Error(name); checks.push(name); }
  settings.sound=false; settings.motion=false;
  const unlocks = {wide:2,slow:4,attract:8,catch:12,heavy:18,multi:22,laser:32,nova:42,pierce:52};
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
  applyPower('wide'); applyPower('wide'); check(Math.abs(paddle.w-paddle.baseW*1.25)<0.001 && effects.wide===8, 'wide refresh without stacking');
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
  startLevel(60); state=S.PLAY;
  applyPower('laser'); bullets.push({x:240,y:300}); applyPower('heavy');
  check(effects.heavy===7 && !effects.laser && !effects.pierce && bullets.length===0, 'heavy replaces attack and clears old laser');
  applyPower('heavy'); check(effects.heavy===7, 'heavy refreshes without stacking');
  const armor={x:200,y:200,w:52,h:22,hp:3,maxHp:3}; bricks=[armor];
  stepBall({x:220,y:229,vx:0,vy:-100,stuck:false},0);
  check(armor.hp===1, 'heavy collision deals two damage');
  effects.heavy=0.001; update(1/120);
  const plain={x:200,y:200,w:52,h:22,hp:3,maxHp:3}; bricks=[plain];
  stepBall({x:220,y:229,vx:0,vy:-100,stuck:false},0);
  check(plain.hp===2 && effects.heavy<=0, 'heavy expiry restores normal damage');
  applyPower('heavy'); applyPower('pierce'); check(!effects.heavy && effects.pierce>0, 'pierce replaces heavy');
  applyPower('heavy'); applyPower('laser'); check(!effects.heavy && effects.laser>0, 'laser replaces heavy');
  startLevel(60); state=S.PLAY; applyPower('attract'); applyPower('attract');
  powers=[{x:100,y:PADDLE_Y-100,vy:120,type:'wide'}, {x:100,y:PADDLE_Y-100,vy:120,type:'shrink'}, {x:100,y:PADDLE_Y-250,vy:120,type:'slow'}];
  update(0.1);
  check(effects.attract>7 && powers[0].x>100 && powers[0].x<=118.001, 'attract moves beneficial nearby cards with bounded speed');
  check(powers[1].x===100 && powers[2].x===100, 'attract ignores risk cards and distant cards');
  const px=powers[0].x;togglePause();update(0.1);
  check(powers[0].x===px, 'attraction pauses with game');togglePause();
  effects.attract=0.001; update(0.1); const expiredX=powers[0].x; update(0.1);
  check(powers[0].x===expiredX, 'attract expiry stops horizontal pull');
  applyPower('attract'); applyPower('heavy'); startLevel(61);
  check(!effects.attract && !effects.heavy, 'new cards reset across levels');
  state=S.PLAY; applyPower('attract'); applyPower('heavy'); loseLife();
  check(!effects.attract && !effects.heavy, 'new cards reset on ball loss');
  startLevel(60); state=S.PLAY; launched=true;
  const nearby={x:100,y:160,w:52,h:22,hp:3,maxHp:3};
  const adjacent={x:158,y:160,w:52,h:22,hp:3,maxHp:3};
  const far={x:350,y:160,w:52,h:22,hp:3,maxHp:3};
  const steel={x:100,y:190,w:52,h:22,hp:9999,maxHp:9999,steel:true};
  bricks=[nearby,adjacent,far,steel]; balls=[{x:126,y:230,vx:0,vy:-300,stuck:false}]; applyPower('laser');
  applyPower('nova');
  check(nearby.hp===2 && adjacent.hp===2 && far.hp===3 && steel.hp===9999, 'nova area damage excludes distant and steel bricks');
  check(effects.laser===6, 'instant nova leaves timed attack unchanged');
  bricks=[{x:100,y:160,w:52,h:22,hp:1,maxHp:1}];applyPower('nova');
  check(bricks.length===0, 'nova can clear final brick'); slowmoT=0;update(1/120);
  check(state===S.LEVELUP && progress.level===61, 'nova final brick saves next checkpoint');
  startLevel(60); state=S.PLAY; bricks=[]; const beforeEmpty=score; applyPower('nova');
  check(score===beforeEmpty, 'nova tolerates empty board');
  return {passed:checks.length};
})()
