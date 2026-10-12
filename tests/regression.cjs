const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function createContext(values = {}, blocked = false) {
  class Element {
    constructor() { this.tagName = 'DIV'; this.style = {}; this.classList = {toggle() {}}; }
    blur() { this.tagName = 'BODY'; }
    closest() { return null; }
    addEventListener() {}
    getContext() { return new Proxy({}, {get: (_, key) => key === 'measureText' ? () => ({width: 20}) : key.startsWith('create') ? () => ({addColorStop() {}}) : () => {}}); }
  }
  const elements = new Map();
  const document = { activeElement: new Element(), getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); }, addEventListener() {} };
  const context = vm.createContext({ document, HTMLElement: Element, Image: class {}, performance: {now: () => 0}, requestAnimationFrame() {}, setTimeout() {},
    window: {devicePixelRatio: 1, innerWidth: 480, innerHeight: 720, addEventListener() {}, matchMedia: () => ({matches: false})},
    localStorage: {getItem(k) {if (blocked) throw Error('denied'); return values[k] ?? null;}, setItem(k, v) {if (blocked) throw Error('denied'); values[k] = String(v);}, removeItem(k) {if (blocked) throw Error('denied'); delete values[k];}}
  });
  vm.runInContext(source, context);
  return context;
}
const result = vm.runInContext(fs.readFileSync(path.join(__dirname, 'browser-regression.js'), 'utf8'), createContext());
console.log(`${result.passed} gameplay checks passed`);
const invalid = createContext({
  'milkyBreakout.best': 'NaN', 'milkyBreakout.bestLevel': '-5',
  'milkyBreakout.board': '[null,{"s":1,"l":2,"d":"<img onerror=alert(1)>"}]',
  'milkyBreakout.progress': '{"level":6.5,"score":10}'
});
if (!vm.runInContext('best === 0 && bestLevel === 1 && progress === null && board.length === 1 && board[0].d === "—"', invalid)) throw Error('malformed storage');
const blocked = createContext({}, true);
vm.runInContext('newGame(); state = S.PLAY; levelClear(); resumeGame(); gameOver(false)', blocked);
if (!vm.runInContext('!storage.available && level === 2 && progress.level === 2', blocked)) throw Error('blocked storage');
const saved = createContext({'milkyBreakout.progress': '{"level":6,"score":1200,"rescued":40,"stage":999,"endless":0}'});
vm.runInContext('resumeGame()', saved);
if (!vm.runInContext('level === 6 && !endless && stage === 2 && rescued === 40 && score === 1200', saved)) throw Error('reload checkpoint');
console.log('3 storage checks passed (invalid data, denied storage, reloaded checkpoint)');

const campaign = createContext();
const report = vm.runInContext(fs.readFileSync(path.join(__dirname, 'campaign-regression.js'), 'utf8'), campaign);
console.log(JSON.stringify(report));
