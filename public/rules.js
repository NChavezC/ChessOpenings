import { Chess as Rules } from './vendor/chess.js';
export const DEFAULT_POSITION = new Rules().fen();
export class Chess {
  constructor(fen=DEFAULT_POSITION){
    this.rules=new Rules();
    const check=this.rules.validate_fen(fen);
    if(!check.valid)throw Error(check.error);
    if(!this.rules.load(fen))throw Error('Invalid starting position.');
    const ranks=fen.split(' ')[0].split('/');
    if((fen.split(' ')[0].match(/k/g)||[]).length!==1 || (fen.split(' ')[0].match(/K/g)||[]).length!==1)throw Error('Each side needs one king.');
    if(/[pP]/.test(ranks[0]+ranks[7]))throw Error('A pawn cannot start on the first or eighth rank.');
  }
  fen(){return this.rules.fen();}
  turn(){return this.rules.turn();}
  get(square){return this.rules.get(square);}
  moves(options){return this.rules.moves(options);}
  history(options){return this.rules.history(options);}
  move(move){const result=this.rules.move(move);if(!result)throw Error('Illegal move.');return result;}
  undo(){return this.rules.undo();}
  loadPgn(text){if(!this.rules.load_pgn(text))throw Error('Invalid PGN or illegal move in sequence.');}
  getHeaders(){return this.rules.header();}
}
