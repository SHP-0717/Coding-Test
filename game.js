const screen = document.getElementById("game");
const game = screen.getContext("2d");
game.imageSmoothingEnabled=false;
const air = new Item();
let now = "alive";
function Player(name="Technoblade"){
  return new Character(name, "player", 10, 5, 0, 0);
}
function Dino(x, y){
  return new Character("", "dino", 20, 10, x, y);
}
function put(block, x, y){
  return new Block(block, x, y);
}
function check(x,y){
  return Block.check(x, y).concat(Character.check(x,y));
}
class Character {
  static characters = [];
  constructor(name, type, hp, atk, x, y, inventory=Array(10).fill(air)){
    this.name=name;
    this.type=type;
    this.hp=hp;
    this.defaultAtk=atk;
    this.x=x;
    this.y=y;
    this.inventory=inventory;
    this.hand=1;
    this.constructor.characters.push(this);
    this.front="right";
    this.item=this.inventory[this.hand-1];
  }
  walk(dx, dy){
    this.x+=dx?dx:0;
    this.y+=dy?dy:0;
    if(this.impact().length>0){this.x-=dx;this.y-=dy;}
  }
  get(item){
    let i =this.inventory.indexOf(air);
    if (i!==-1) this.inventory[i]=item;
  }
  remove(){
    this.inventory[this.hand-1]=air;
  }
  hurt(hurt){
    this.hp-=hurt;
    if (this.hp<=0) this.die();
  }
  attack(target){
    if (target instanceof Character) {
      target.hurt(this.atk);
      this.item.use();
    }
  }
  die(){die(this);}
  setup(){
    this.item=this.inventory[this.hand-1];
    this.atk=this.defaultAtk+this.item.atk;
  }
  impact(){
    return Block.check(this.x, this.y).concat(Character.check(this.x,this.y).filter(n=>n!==this));
  }
  static check(x, y){
    return this.characters.filter(c=>c.x===x&&c.y===y]);
  }
  touch(dx, dy){
    return check(this.x+dx, this.y+dy).length>0;
  }
  static touch(x, y){
    return check(x,y).length>0;
  }
  navigation(target){
    const angs=[[1,0],[-1,0],[0,1],[0,-1]];
    let x=this.x;
    let y=this.y;
    let tx=target.x;
    let ty=target.y;
    let dists,pos,d,choice;
    function dist(){
      return Math.abs(dx-tx)+Math.abs(dy-ty);
    }
    let bestDist=Infinity;
    let bestWalk;
    for (let i of angs){
      let dx=x+i[0];
      let dy=y+i[1];
      d=Character.touch(dx,dy)?Infinity:dist();
      if (d<bestDist) {
        bestDist=d;
        bestWalk=i;
      }
    }
    this.walk(...bestWalk);
    if (dists[choice]>0) navigation(target);
  }
}
class Item {
  static data=itemData();
  constructor(id="air", count=1){
    this.id=id;
    this.count=count;
    this.hp=100;
    this.atk=0;
    
  }
  use(onuse=function(this){}){
    this.hp--;
    if (this.hp<=0){
      this.hp=100;
      this.trash(1);
    }
    onuse(this);
  }
  trash(c=Infinity){
    this.count-=c;
    if(this.count<=0){
      this.replace(air);
    }
  }
  replace(item){
    this.id=item.id;
    this.count=item.count;
    this.hp=item.hp;
    this.atk=item.atk;
  }
  
}
class Block {
  static data=blockData();
  static blocks=[];
  constructor(id="air", x=0, y=0){
    let blk=Block.check(x,y).length>0?Block.check(x,y)[0]:this;
    blk.id=id;
    blk.constructor.blocks.push(this);
    blk.drop=air;
  }
  static check(x, y){
    return this.blocks.filter(b=>b.id!=="air").filter(b=>b.x===x&&b.y===y]);
  }
  destroy(target){
    blk.id="air";
    blk.x=-1;
    blk.y=-1;
    target.get(this.drop);
  }
}
class Random {
  #seed;
  constructor(){
    this.#seed=Date.now();
  }
  seed(s){
    if (typeof(s)!=="number")s=hashCode(String(s));
    this.#seed=s;
  }
  random(){
    let s=(this.#seed+16383)%524287**2*4095+65535;
    s = (s%2147483647+2147483647)%2147483647/2147483647;
    this.#seed=s**0.5*2147483647;
    return s;
  }
  uniform(a,b){
    return this.random()*(b-a)+a;
  }
  randint(a,b){
    return Math.floor(this.uniform(a,b+1));
  }
  choice(args){
    args=Array.from(args);
    return args[this.randint(0,args.length-1)];
  }
  choices(args, n){
    let result = [];
    for (let i=0; i<n; i++){
      result.push(this.choice(args));
    }
    return result;
  }
  sample(args, n){
    let result = []
    for (let i=0; i<Math.min(args, n); i++){
      c=this.choice(args);
      result.push(c);
      args=remove(args, c);
    }
    return result;
  }
  shuffle(array){
    return this.sample(array, array.length);
  }
}
const random = new Random()
class Camera{
  constructor(){
    this.x=0;
    this.y=0;
    this.target=this;
  }
  binding(target){
    if (isinstance(target, [Character, Block, Camera])) this.target=target;
  }
  update(){
    this.x=this.target.x;
    this.y=this.target.y;
  }
}
const camera = new Camera();
class Canvas{
  constructor(obj){
    this.target=obj;
    this.weight=obj.lineWeight;
    this.color=obj.fillStyle;
  }
  image(url, x, y){
    const img = new Image();
    img.src=url;
    img.onload=function () {this.target.drawImage(img, x, y)}
  }
  line(startx, starty, endx, endy){
    ctx = this.target;
    ctx.lineWeight=this.weight;
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.moveTo(startx, starty);
    ctx.lineTo(endx, endy);
    ctx.stroke();
  }
  rectangle(startx, starty, endx, endy, border="#000"){
    x1=Math.min(startx, endx);
    x2=Math.max(startx, endx);
    y1=Math.min(starty, endy);
    y2=Math.max(starty, endy);
    ctx=this.target;
    ctx.lineWeight=this.weight;
    ctx.fillStyle=this.color;
    ctx.fillRect(x1, y1, x2-x1+1, y2-y1+1);
    ctx.save();
    ctx.fillStyle=border;
    ctx.strokeRect(x1, y1, x2-x1+1, y2-y1+1);
    ctx.restore();
  }
  clear(){
    ctx=this.target;
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  }
  resize(width, height){
    this.target.width=width;
    this.target.height=height;
  }
  type(text, x, y){
    ctx=this.target;
    ctx.textBaseline="top";
    ctx.font="12px Pigrun";
    ctx.fillText(text, x, y);
  }
}
const canvas=Canvas(game);
class DummyBlock{
  constructor(solid, x, y, parent, real=air){
    this.real=real;
    this.solid=solid;
    this.x=x;
    this.y=y;
    this.parent=parent;
    this.cost=Infinity;
  }
}
class Navmap{
  constructor(){
    this.map=[];
  }
  append(block){
    this.map.push(new DummyBlock(block.id!==air,block.x,block.y,NaN,block));
  }
  navigation(start, target) {
    target = new Pos(target.x, target.y);
    start = new Pos(start.x, start.y);
    const final = [];

    // 初始化每格的屬性
    for (let blk of this.map) {
      blk.g = Infinity;
      blk.h = 0;
      blk.f = Infinity;
      blk.parent = null;
    }

    const find = (x, y) => {
      return this.map.find(b => b.x === x && b.y === y);
    };

    const heuristic = (a, b) => {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // 曼哈頓距離
    };

    const open = [];
    const closed = new Set();

    const startBlock = find(start.x, start.y);
    const targetBlock = find(target.x, target.y);
    if (!startBlock || !targetBlock) return [];

    startBlock.g = 0;
    startBlock.h = heuristic(startBlock, targetBlock);
    startBlock.f = startBlock.g + startBlock.h;
    open.push(startBlock);

    while (open.length > 0) {
      // 找出 f 值最小的格子
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();

      if (current === targetBlock) {
        // 回溯路徑
        let blk = current;
        while (blk && blk !== startBlock) {
          final.push(blk);
          blk = blk.parent;
        }
        final.reverse();
        return final;
      }

      closed.add(current);

      for (let [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const neighbor = find(current.x + dx, current.y + dy);
        if (!neighbor || neighbor.solid || closed.has(neighbor)) continue;

        const tentative_g = current.g + 1;
        if (tentative_g < neighbor.g) {
          neighbor.parent = current;
          neighbor.g = tentative_g;
          neighbor.h = heuristic(neighbor, targetBlock);
          neighbor.f = neighbor.g + neighbor.h;

          if (!open.includes(neighbor)) {
            open.push(neighbor);
          }
        }
      }
    }

    return []; // 找不到路徑
  }
}
class Position{
  constructor(x, y){
    this.x=x;
    this.y=y;
  }
}
function hashCode(str){
  let hash = 0;
  for (let i of str){
    hash = (31*hash+i.charCodeAt(0)) | 0;
  }
  return hash;
}
function clear(array, item){
  array=array.filter(x => x!==item);
  return array;
}
function remove(array, item, n=1){
  let index = array.indexOf(item);
  if (index!==-1){
    array.splice(index, n);
  }
}
function isinstance(target, types){
  let n = false;
  for (let i of types){
    n=n||(target instanceof i)
  }
  return n;
}
async function itemData(){
  let data={}
  try{
    const res=await fetch("data/item.json");
    data=await res.json();
  }catch(e){
    console.error(e);
    alert("SERVER ERROR")
  }finally{
    return data;
  }
}
async function blockData(){
  let data={}
  try{
    const res=await fetch("data/block.json");
    data=await res.json();
  }catch(e){
    console.error(e);
    alert("SERVER ERROR")
  }finally{
    return data;
  }
}
let gametime = 0;
function die(ch){now="dead";}
let now = Date.now();
let fps=0
let go = true;
const player=Player();
camera.target=player;
function mainloop(){
  go?update():undefined;
  draw();
  fps=1000/(Date.now()-now);
  now=Date.now();
  gametime+=go?1000/fps:0;
  requestAnimationFrame(mainloop)
}
let key = ""
document.addEventListener("keydown", function (e){
  e.key=e.key.toLowerCase();
  key=e.key in ["w","a","s","d"]? e.key:key;
  go=e.key==="Escape"?!go:go;
});
document.addEventListener("keyup", e=>{key="";})
lastmove=-Infinity;
function update(){
  if (gametime-lastmove>100&&key){
    player.walk(...{w:[0,1],a:[-1,0],s:[0,-1],d:[1,0],"":[0,0]}[key]);
    lastmove=gametime;
  }
  player.front=key?{w:"up",a:"left",s:"down",d:"right"}[key]:player.front;
}
function position(x,y){
  return [(x-camera.x+3)*16, (camera.y-y+3)*16]
}
function draw(){
  camera.update();
  canvas.type(`${fps} FPS`, 0, 0)
  canvas.type(`${player.x}, ${player.y}`)
  canvas.drawImage(`textures/player_${player.front}.png`, ...position(player.x, player.y));
  for (let i of Block.blocks){
    canvas.drawImage(`textures/${i.type}.png`, ...position(i.x, i.y));
  }
}
function main(){
  for (let _ = 0; _ < random.randint(10,25)){
    put("ruby_block", random.randint(-10, 10), random.randint(-10, 10));
  }
  mainloop();
}