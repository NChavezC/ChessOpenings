import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../public/rules.js';
test('rejects illegal moves and invalid FEN',()=>{
  const game=new Chess();
  assert.throws(()=>game.move('e5'));
  assert.throws(()=>new Chess('invalid'));
  assert.equal(game.moves().length,20);
});
test('imports PGN and can replay or undo the line',()=>{
  const game=new Chess(); game.loadPgn('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O');
  const copy=new Chess(); for(const move of game.history())copy.move(move);
  assert.equal(copy.fen(),game.fen());
  assert.equal(copy.undo().san,'O-O');
});
test('reads a black-to-move FEN from PGN',()=>{
  const game=new Chess(),fen='8/8/6k1/8/8/8/1p6/6K1 b - - 0 38';
  game.loadPgn('[SetUp "1"]\n[FEN "'+fen+'"]\n\n38... b1=N');
  assert.equal(game.getHeaders().FEN,fen);
  assert.equal(game.history()[0],'b1=N');
});
