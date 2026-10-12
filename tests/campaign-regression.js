(() => {
  const checks = [];
  function check(ok, label) { if (!ok) throw Error(label); checks.push(label); }
  settings.sound = false; settings.motion = false;
  check(LEVELS.length === 100, '100 campaign levels');
  check(new Set(LEVELS.map(rows => rows.join('/'))).size === 100, 'layout variety');
  for (let lv = 1; lv <= 100; lv++) {
    startLevel(lv); state = S.PLAY;
    check(!endless && lives === START_LIVES && bricks.length > 0 && !bricks.some(b => b.steel), 'valid friendly level ' + lv);
    check(currentSpeed() >= 280 && currentSpeed() <= 450, 'bounded speed ' + lv);
    const signature = JSON.stringify(bricks); buildBricks(lv);
    check(JSON.stringify(bricks) === signature, 'deterministic retry ' + lv);
    const checkpointScore = score, checkpointRescue = rescued;
    score += 100; rescued += 2; resumeGame(); state = S.PLAY;
    check(score === checkpointScore && rescued === checkpointRescue && level === lv, 'checkpoint restores ' + lv);
    // 使用真实奶珠碰撞逐次削减耐久，验证不依靠助阵也能通过每一关。
    let hits = 0;
    while (bricks.length && hits < 200) {
      const target = bricks[bricks.length - 1];
      stepBall({ x: target.x + target.w / 2, y: target.y + target.h + BALL_R, vx: 0, vy: -currentSpeed(), stuck: false }, 0);
      hits++;
    }
    slowmoT = 0; update(1 / 120);
    check(state === S.LEVELUP && bricks.length === 0, 'ball collisions clear level ' + lv);
    check(progress.level === lv + 1 && progress.endless === (lv === 100 ? 1 : 0), 'next checkpoint ' + lv);
    $('btnNext').onclick();
    check(level === lv + 1 && state === S.PLAY && lives === START_LIVES, 'next level button ' + lv);
  }
  check(endless && level === 101 && bricks.some(b => !b.steel), 'post-campaign endless');
  for (const type of ['wide','slow','pierce','laser','catch']) { applyPower(type); check(effects[type] > 0, type + ' power'); }
  effects.wide = 0.001; update(1 / 120); check(paddle.w === paddle.baseW, 'wide expiration');
  resetBall(); applyPower('multi'); check(balls.length === 1, 'multi does not launch stuck ball');
  launch(); applyPower('multi'); check(balls.length === 3, 'multi splits moving balls');
  for (let i = 0; i < 10; i++) applyPower('multi'); check(balls.length <= 7, 'ball count bounded');
  lives = 1; loseLife();
  check(state === S.OVER && board.length > 0, 'death leaderboard');
  $('btnRetry').onclick(); check(state === S.PLAY && level === progress.level && lives === START_LIVES, 'death retry');
  togglePause(); check(state === S.PAUSE, 'pause');
  $('btnQuit').onclick(); check(state === S.MENU && hasProgress(), 'quit retains progress');
  $('btnStart').onclick(); check(state === S.PLAY && lives === START_LIVES, 'menu resume');
  lastPointer.y = H; const b = balls[0]; check(Math.abs(aimAngleFor(b) + Math.PI / 2) < 0.001, 'touch near paddle launches upward');
  newGame(); state = S.PLAY;
  let testBall = { x: 2, y: 350, vx: -200, vy: -100, stuck: false };
  stepBall(testBall, 1 / 120); check(testBall.x >= BALL_R && testBall.vx > 0, 'left wall rebound');
  testBall = { x: W - 2, y: 350, vx: 200, vy: -100, stuck: false };
  stepBall(testBall, 1 / 120); check(testBall.x <= W - BALL_R && testBall.vx < 0, 'right wall rebound');
  testBall = { x: 240, y: 2, vx: 0, vy: -200, stuck: false };
  stepBall(testBall, 1 / 120); check(testBall.vy > 0, 'top wall rebound');
  testBall = { x: paddle.x, y: PADDLE_Y - BALL_R, vx: 0, vy: 240, stuck: false };
  stepBall(testBall, 0); check(testBall.vy < 0, 'paddle rebound');
  effects.catch = 1; testBall.vy = 240; stepBall(testBall, 0);
  balls = [testBall]; check(testBall.stuck && testBall.held, 'magnet catch');
  releaseHeld(); check(!testBall.stuck && !testBall.held && testBall.vy < 0, 'magnet release');
  newGame(); state = S.PLAY;
  const brick = bricks[0], oldScore = score;
  testBall = { x: brick.x + brick.w / 2, y: brick.y + brick.h + BALL_R, vx: 0, vy: -240, stuck: false };
  bricks = [brick];
  stepBall(testBall, 0); check(!bricks.includes(brick) && score > oldScore && testBall.vy > 0, 'ball brick damage and rebound');
  newGame(); state = S.PLAY;
  const target = bricks[0]; bullets = [{ x: target.x + target.w / 2, y: target.y + 10 }];
  update(1 / 120); check(!bricks.includes(target) && bullets.length === 0, 'laser brick collision');
  powers = [{type: 'wide', x:paddle.x, y:PADDLE_Y, vy:0}]; update(1 / 120);
  check(powers.length === 0 && paddle.w > paddle.baseW, 'falling power pickup');
  newGame(); state = S.PLAY; powers = [];
  for (let i = 0; i < 2000; i++) maybeDrop(240, 200);
  check(powers.length > 0 && powers.every(p => !['fast', 'shrink'].includes(p.type)), 'campaign beneficial drops only');
  check(bricks.every(k => k.hp === 1), 'gentle first level durability');
  playTime = 10000; level = 100; check(currentSpeed() <= 450, 'no time acceleration');
  memeBag = []; const cycle = Array.from({length: MEME_QUOTES.length}, () => nextMeme());
  check(new Set(cycle).size === MEME_QUOTES.length && !cycle.includes('city不city啊'), 'fresh meme cycle without repetitions');
  return { passed: checks.length, uniqueLayouts: new Set(LEVELS.map(r => r.join('/'))).size };
})()
