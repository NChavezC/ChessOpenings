# ChessOpenings

Record named opening lines by moving both colors, starting from FEN, or importing main-line PGN. Select a recorded position and use **Create variation** to branch. Practice as White, Black, or both colors. An incorrect move leaves the position available for another try.

Repertoires are stored in localStorage for the current browser and site address. The two Italian Game lines are editable examples.

## Run locally

With Node.js 20 or newer, run `npm run dev` and open http://127.0.0.1:4173. Reload the server after source edits. Run `npm test` for the chess rules checks.

## Vercel

Import this repository with the root directory set to the repository root. The included configuration runs `npm run build` and serves `dist`. No database or environment variables are required.

The bundled chess.js v0.13.4 rules engine retains its BSD license in public/vendor/chess.js.
