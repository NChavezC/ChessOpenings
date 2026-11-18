import { Chess, DEFAULT_POSITION } from './rules.js';
const $ = id => document.getElementById(id);
const make = (tag, text, cls) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
};
const button = (parent, text, fn, cls) => {
  const el = make('button', text, cls);
  el.onclick = fn;
  parent.append(el);
  return el;
};
const key = 'chessOpenings.repertoire.v1';
const sample = [{name:'Italian Game',lines:[
  {name:'Giuoco Piano',fen:DEFAULT_POSITION,moves:['e4','e5','Nf3','Nc6','Bc4','Bc5']},
  {name:'Two Knights Defense',fen:DEFAULT_POSITION,moves:['e4','e5','Nf3','Nc6','Bc4','Nf6']}
]}];
let db = JSON.parse(localStorage.getItem(key) || JSON.stringify(sample));
let oi=0, li=0, ply=0, practice=false, side='both', flipped=false, pick=null, mistakes=0;
let message='', game=new Chess();
const opening=()=>db[oi];
const line=()=>opening()?.lines[li];
const recording=()=>!practice;
const save=()=>{try{localStorage.setItem(key,JSON.stringify(db));}catch{message='Browser storage is full or unavailable. This edit is only in memory.';}};
function go(index){
  game=new Chess(line()?.fen || DEFAULT_POSITION);
  for(const san of line()?.moves.slice(0,index) || []) game.move(san);
  ply=index; pick=null;
}
function autoReply(){
  while(practice && side!=='both' && game.turn()!==side && ply<(line()?.moves.length || 0)){
    game.move(line().moves[ply++]);
  }
}
function reset(){
  message=''; mistakes=0; go(0); autoReply(); draw();
}
function field(tag,id,label,value=''){
  const title=make('label',label);title.htmlFor=id;
  const input=make(tag);input.id=id;input.value=value;
  $('fields').append(title,input);return input;
}
function dialog(title,setup,submit,ok='Save'){
  const dlg=$('dialog');$('fields').replaceChildren();$('dialogError').textContent='';
  $('dialogTitle').textContent=title;$('confirm').textContent=ok;setup();
  dlg.querySelector('form').onsubmit=e=>{
    if(e.submitter?.value==='cancel')return;
    e.preventDefault();
    try{submit();dlg.close();}catch(err){$('dialogError').textContent=err.message;}
  };
  dlg.showModal();
}
function nameField(){const input=field('input','entryName','Name');input.required=true;input.maxLength=100;}
function getName(){const name=$('entryName').value.trim();if(!name)throw Error('Enter a name.');return name;}
$('newOpening').onclick=()=>dialog('Create opening',nameField,()=>{
  db.push({name:getName(),lines:[]});oi=db.length-1;li=0;practice=false;save();reset();
});
function newLine(branch=false){
  dialog(branch?'Create variation':'Create line',()=>{
    nameField();
    if(!branch){field('textarea','fen','Starting FEN (optional)');field('textarea','pgn','Paste moves or PGN (optional)');}
  },()=>{
    const name=getName();
    let fen=branch?line().fen:($('fen').value.trim() || DEFAULT_POSITION);
    let moves=branch?line().moves.slice(0,ply):[];
    const board=new Chess(fen);
    if(!branch && $('pgn').value.trim()){
      const raw=$('pgn').value.trim();
      if(fen!==DEFAULT_POSITION && /^\s*\[/m.test(raw))throw Error('For a custom FEN, paste move text or include the FEN in the PGN headers.');
      board.loadPgn(fen===DEFAULT_POSITION?raw:'[SetUp "1"]\n[FEN "'+board.fen()+'"]\n\n'+raw);
      if(typeof board.getHeaders==='function')fen=board.getHeaders().FEN || fen;
      moves=board.history();
    }
    opening().lines.push({name,fen,moves});li=opening().lines.length-1;practice=false;save();go(moves.length);message='';draw();
  });
}
function changeMode(value){practice=value;reset();}
$('practice').onclick=()=>changeMode(true);$('record').onclick=()=>changeMode(false);
$('flip').onclick=()=>{flipped=!flipped;draw();};
const pieces={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
const names={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
function playMove(from,to,promotion){
  const move=game.move({from,to,promotion});
  if(practice && move.san!==line().moves[ply]){
    game.undo();pick=null;mistakes++;message='That move belongs to a different continuation. Try again.';draw();return;
  }
  if(recording() && ply===line().moves.length){line().moves.push(move.san);save();}
  ply++;pick=null;message='';autoReply();draw();
}
function attempt(from,to){
  const legal=game.moves({square:from,verbose:true}).filter(m=>m.to===to);
  if(!legal.length)return false;
  if(recording() && ply<line().moves.length && legal.every(m=>m.san!==line().moves[ply])){
    message='Choose Create variation to record a different move from this position.';pick=null;draw();return true;
  }
  if(legal.some(m=>m.promotion)){
    dialog('Promote pawn',()=>{
      const select=field('select','promotion','Piece');
      for(const p of ['q','r','b','n'])select.add(new Option(names[p],p));
    },()=>{
      const p=$('promotion').value;
      if(recording() && ply<line().moves.length && !legal.some(m=>m.promotion===p && m.san===line().moves[ply]))throw Error('Create a variation to change the recorded promotion.');
      playMove(from,to,p);
    },'Promote');
  }else playMove(from,to);
  return true;
}
function selectSquare(square){
  if(!line() || (practice && ply===line().moves.length))return;
  if(pick && pick!==square && attempt(pick,square))return;
  pick=pick!==square && game.get(square)?.color===game.turn()?square:null;drawBoard();
}
function drawBoard(){
  const board=$('board');board.replaceChildren();
  const files=Array.from(flipped?'hgfedcba':'abcdefgh');
  const ranks=Array.from(flipped?'12345678':'87654321');
  const last=game.history({verbose:true}).at(-1);
  const targets=pick?game.moves({square:pick,verbose:true}).map(m=>m.to):[];
  for(const [y,r] of ranks.entries())for(const [x,f] of files.entries()){
    const sq=f+r,p=game.get(sq),el=make('button');
    el.className=['sq',(x+y)%2?'dark':'',pick===sq?'pick':'',targets.includes(sq)?'target':'',[last?.from,last?.to].includes(sq)?'last':''].join(' ');
    el.dataset.square=sq;el.setAttribute('aria-label',sq+(p?' '+(p.color==='w'?'white':'black')+' '+names[p.type]:' empty'));
    if(p){const glyph=make('span',pieces[p.type],'glyph '+(p.color==='w'?'white':'black'));el.append(glyph);}
    if(x===0)el.append(make('span',r,'coord rank'));if(y===7)el.append(make('span',f,'coord file'));
    el.onclick=()=>selectSquare(sq);
    el.draggable=Boolean(line() && p?.color===game.turn() && !(practice && ply===line().moves.length));
    el.ondragstart=e=>e.dataTransfer.setData('text/plain',sq);
    el.ondragover=e=>e.preventDefault();el.ondrop=e=>{
      e.preventDefault();const from=e.dataTransfer.getData('text/plain');
      if(line() && !(practice && ply===line().moves.length) && /^[a-h][1-8]$/.test(from) && game.get(from)?.color===game.turn())attempt(from,sq);
    };board.append(el);
  }
}
function drawLibrary(){
  const nav=$('library');nav.replaceChildren();
  db.forEach((op,i)=>{
    button(nav,op.name,()=>{oi=i;li=0;reset();},'opening');
    if(i!==oi)return;
    op.lines.forEach((l,j)=>button(nav,l.name,()=>{li=j;reset();},'line '+(j===li?'selected':'')));
    button(nav,'+ Add line',()=>newLine(),'add');
  });
}
function nextLine(){
  const all=db.flatMap((op,i)=>op.lines.flatMap((l,j)=>l.moves.length?[[i,j]]:[]));
  if(!all.length)return;
  [oi,li]=all[(all.findIndex(([i,j])=>i===oi && j===li)+1)%all.length];reset();
}
function draw(){
  drawLibrary();drawBoard();
  const l=line(),count=l?.moves.length || 0;
  $('record').classList.toggle('active',recording());$('practice').classList.toggle('active',practice);
  $('boardTitle').textContent=l?.name || opening()?.name || 'Starting position';
  $('turn').textContent=game.turn()==='w'?'○ White to move':'● Black to move';
  $('position').textContent='Ply '+ply+' / '+count;
  $('editorTitle').textContent=practice?'Recall the line':'Line editor';
  const controls=$('controls'),actions=$('actions'),moves=$('moves');
  controls.replaceChildren();actions.replaceChildren();moves.replaceChildren();
  if(!l){$('feedback').textContent='Add a line to begin recording.';return;}
  if(practice){
    const label=make('label','Play as');label.htmlFor='side';
    const select=make('select');select.id='side';
    for(const [v,t] of [['both','Both colors'],['w','White'],['b','Black']])select.add(new Option(t,v));
    select.value=side;select.onchange=()=>{side=select.value;if(side!=='both')flipped=side==='b';reset();};controls.append(label,select);
    if(!count){$('feedback').textContent='Record at least one move to practice this line.';return;}
    $('feedback').textContent=ply===count?(mistakes?'Line complete after '+mistakes+' retries.':'Line complete. Perfect recall!'):(message || 'Play the next move from memory.');
    button(actions,'Restart line',reset);if(ply===count)button(actions,'Next line',nextLine,'primary');
  }else{
    controls.append(make('p','Move both colors to record. Select a move to revisit its position.'));
    button(actions,'Start position',()=>{go(0);message='';draw();});
    button(actions,'Create variation',()=>newLine(true));
    if(ply===count && count)button(actions,'Undo last move',()=>{l.moves.pop();save();go(count-1);message='';draw();});
    $('feedback').textContent=message || (count?'Moves saved in this browser.':'Play the first move on the board.');
  }
  const parts=l.fen.split(' ');let number=Number(parts[5]),turn=parts[1];
  l.moves.slice(0,practice?ply:count).forEach((san,i)=>{
    if(turn==='w' || !i)moves.append(make('span',number+(turn==='w'?'.':'…'),'num'));
    if(practice)moves.append(make('span',san));else button(moves,san,()=>{go(i+1);message='';draw();},ply===i+1?'selected':'');
    if(turn==='b')number++;turn=turn==='w'?'b':'w';
  });
}
reset();
