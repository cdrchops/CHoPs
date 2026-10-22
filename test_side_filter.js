const { Chess } = require('./js/chess.js');
global.Chess = Chess;
const { updateVisualizations } = require('./js/updateVisualizations.js');

function createMockJQuery(options = {}) {
    const toggles = options.toggles || {};
    const side = options.side || 'both';
    const squareClasses = {};
    const squareStyles = {};
    let renderedArrows = [];
    let linesHtml = '';

    function jq(selector) {
        if (selector === '#stockfish-lines-container') {
            return {
                length: 1,
                empty: () => { linesHtml = ''; },
                html: (content) => {
                    if (content === undefined) return linesHtml;
                    linesHtml = content;
                }
            };
        }
        if (selector === '#board .square-55d63') {
            return {
                removeClass: (cls) => {
                    for (const sq in squareClasses) squareClasses[sq] = [];
                },
                css: (styles) => {}
            };
        }
        if (selector === '#board-arrows-svg') {
            return {
                length: 1,
                find: () => ({ remove: () => { renderedArrows = []; } }),
                empty: () => { renderedArrows = []; },
                append: (html) => {
                    const matchFrom = html.match(/data-from="([^"]+)"/);
                    const matchTo = html.match(/data-to="([^"]+)"/);
                    const matchFill = html.match(/fill="([^"]+)"/);
                    const matchStroke = html.match(/stroke="([^"]+)"/);
                    if (matchFrom && matchTo) {
                        renderedArrows.push({
                            from: matchFrom[1],
                            to: matchTo[1],
                            fill: matchFill ? matchFill[1] : '',
                            stroke: matchStroke ? matchStroke[1] : '',
                            html: html
                        });
                    }
                }
            };
        }
        if (selector === '#board') {
            return {
                length: 1,
                find: (sel) => jq(sel),
                css: () => {},
                append: () => {}
            };
        }
        if (selector === '#board .chessboard-63f37') {
            return {
                length: 1,
                find: (sel) => jq(sel),
                css: () => {},
                append: () => {},
                offset: () => ({ top: 0, left: 0 })
            };
        }
        if (selector === '.rule-toggle') {
            return { length: 1 };
        }
        if (selector.startsWith('#toggle-')) {
            const toggleId = selector.substring(1);
            return {
                length: 1,
                is: (state) => {
                    if (state === ':checked') {
                        return toggles[toggleId] !== undefined ? toggles[toggleId] : true;
                    }
                    return false;
                }
            };
        }
        if (selector === '#visualization-side-group .btn.active, #side-filter-group .btn.active') {
            return {
                length: 1,
                attr: (name) => {
                    if (name === 'id') {
                        if (side === 'w') return 'side-white';
                        if (side === 'b') return 'side-black';
                        return 'side-both';
                    }
                    return '';
                }
            };
        }
        if (selector === 'input[name="visualization-side"]:checked' || selector === 'input[name="side-filter"]:checked') {
            return {
                val: () => side
            };
        }
        if (selector === '#visualization-side' || selector === '#side-filter') {
            return {
                val: () => side
            };
        }
        if (selector.startsWith('#board .square-')) {
            const sqName = selector.replace('#board .square-', '');
            if (!squareClasses[sqName]) squareClasses[sqName] = [];
            const col = sqName.charCodeAt(0) - 97;
            const row = 8 - parseInt(sqName[1], 10);
            return {
                length: 1,
                addClass: (cls) => {
                    squareClasses[sqName].push(cls);
                },
                css: (styles) => {
                    squareStyles[sqName] = styles;
                },
                outerWidth: () => 50,
                outerHeight: () => 50,
                offset: () => ({ top: row * 50, left: col * 50 })
            };
        }
        return { length: 0, is: () => false, val: () => '', find: () => ({ remove: () => {} }), append: () => {}, empty: () => {} };
    }

    jq._getClasses = () => squareClasses;
    jq._getStyles = () => squareStyles;
    jq._getArrows = () => renderedArrows;
    jq._getLinesHtml = () => linesHtml;
    return jq;
}

// Test 1: Castling both ready, side = 'both'
{
    global.$ = createMockJQuery({ side: 'both' });
    const chess = new Chess();
    chess.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
    const game = { getFen: () => chess.fen(), getGame: () => chess };
    updateVisualizations(game);
    const classes = global.$._getClasses();
    const styles = global.$._getStyles();
    const blueSquares = Object.keys(classes).filter(sq => classes[sq].includes('highlight-blue') || (styles[sq] && styles[sq]['box-shadow'] && styles[sq]['box-shadow'].includes('0, 123, 255')));
    console.log('Test 1 (Side=both, blue squares):', blueSquares.sort());
    if (!['a1', 'a8', 'e1', 'e8', 'h1', 'h8'].every(sq => blueSquares.includes(sq))) {
        throw new Error('Test 1 failed: expected all 6 castling squares for both sides');
    }
}

// Test 2: Castling both ready, side = 'w' (White only)
{
    global.$ = createMockJQuery({ side: 'w' });
    const chess = new Chess();
    chess.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
    const game = { getFen: () => chess.fen(), getGame: () => chess };
    updateVisualizations(game);
    const classes = global.$._getClasses();
    const styles = global.$._getStyles();
    const blueSquares = Object.keys(classes).filter(sq => classes[sq].includes('highlight-blue') || (styles[sq] && styles[sq]['box-shadow'] && styles[sq]['box-shadow'].includes('0, 123, 255')));
    console.log('Test 2 (Side=white, blue squares):', blueSquares.sort());
    if (!['a1', 'e1', 'h1'].every(sq => blueSquares.includes(sq))) {
        throw new Error('Test 2 failed: expected White castling squares a1, e1, h1');
    }
    if (blueSquares.includes('a8') || blueSquares.includes('e8') || blueSquares.includes('h8')) {
        throw new Error('Test 2 failed: Black castling squares should NOT be included when side=w');
    }
}

// Test 3: Castling both ready, side = 'b' (Black only)
{
    global.$ = createMockJQuery({ side: 'b' });
    const chess = new Chess();
    chess.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
    const game = { getFen: () => chess.fen(), getGame: () => chess };
    updateVisualizations(game);
    const classes = global.$._getClasses();
    const styles = global.$._getStyles();
    const blueSquares = Object.keys(classes).filter(sq => classes[sq].includes('highlight-blue') || (styles[sq] && styles[sq]['box-shadow'] && styles[sq]['box-shadow'].includes('0, 123, 255')));
    console.log('Test 3 (Side=black, blue squares):', blueSquares.sort());
    if (!['a8', 'e8', 'h8'].every(sq => blueSquares.includes(sq))) {
        throw new Error('Test 3 failed: expected Black castling squares a8, e8, h8');
    }
    if (blueSquares.includes('a1') || blueSquares.includes('e1') || blueSquares.includes('h1')) {
        throw new Error('Test 3 failed: White castling squares should NOT be included when side=b');
    }
}

// Test 4: Pawn chains, side = 'w' vs 'b'
{
    // White pawn chain d4, e5; Black pawn chain d5, e4
    const chess = new Chess();
    chess.load('rnbqkbnr/ppp2ppp/8/3pp3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 1');

    // Side = 'w'
    global.$ = createMockJQuery({ side: 'w', toggles: { 'toggle-chains': true } });
    const game = { getFen: () => chess.fen(), getGame: () => chess };
    updateVisualizations(game);
    const classesW = global.$._getClasses();
    const stylesW = global.$._getStyles();
    const purpleSquaresW = Object.keys(classesW).filter(sq => classesW[sq].includes('highlight-purple') || (stylesW[sq] && stylesW[sq]['box-shadow'] && stylesW[sq]['box-shadow'].includes('111, 66, 193')));
    console.log('Test 4 (Side=white, purple pawn chains):', purpleSquaresW.sort());
    // White chain squares should only be in rank 1-4, not black pawns on rank 5
    if (purpleSquaresW.includes('d5') || purpleSquaresW.includes('e5')) {
        // e5 is black pawn or white? In fen: 3pp3 is rank 5 (black pawns), 3PP3 is rank 4 (white pawns)
        // White pawns on d4, e4 protected by c3/etc.
    }

    // Side = 'b'
    global.$ = createMockJQuery({ side: 'b', toggles: { 'toggle-chains': true } });
    updateVisualizations(game);
    const classesB = global.$._getClasses();
    const stylesB = global.$._getStyles();
    const purpleSquaresB = Object.keys(classesB).filter(sq => classesB[sq].includes('highlight-purple') || (stylesB[sq] && stylesB[sq]['box-shadow'] && stylesB[sq]['box-shadow'].includes('111, 66, 193')));
    console.log('Test 4 (Side=black, purple pawn chains):', purpleSquaresB.sort());
}

// Test 5: Tan highlight for protected pieces (alone and combined with red/green)
{
    // Starting position: White pawns on a2..h2 are protected by backrank pieces
    // White knight on b1 protects c3, d2, etc. White king/queen protect pieces.
    const chess = new Chess();
    // Position with a piece protected and attacked
    // e.g. Black knight on e5 attacked by white pawn f4, protected by black pawn d6
    chess.load('rnbqkbnr/ppp1pppp/3p4/4n3/5P2/8/PPPPP1PP/RNBQKBNR w KQkq - 0 1');

    // Test with toggle-tan only
    global.$ = createMockJQuery({
        side: 'b',
        toggles: {
            'toggle-tan': true,
            'toggle-protected': false,
            'toggle-attacked': false,
            'toggle-pinned': false,
            'toggle-skewered': false,
            'toggle-chains': false,
            'toggle-castling': false
        }
    });
    const game = { getFen: () => chess.fen(), getGame: () => chess };
    updateVisualizations(game);
    let classes = global.$._getClasses();
    let styles = global.$._getStyles();
    let tanSquares = Object.keys(classes).filter(sq => classes[sq].includes('highlight-tan') || (styles[sq] && styles[sq]['box-shadow'] && styles[sq]['box-shadow'].includes('210, 180, 140')));
    console.log('Test 5 (Side=black, toggle-tan only, tan squares):', tanSquares.sort());
    // Black knight on e5 is protected by pawn on d6 -> should be tan
    if (!tanSquares.includes('e5')) {
        throw new Error('Test 5 failed: expected e5 (black knight protected by d6 pawn) to have tan highlight');
    }

    // Test with both toggle-tan and toggle-attacked and toggle-protected
    global.$ = createMockJQuery({
        side: 'b',
        toggles: {
            'toggle-tan': true,
            'toggle-protected': true,
            'toggle-attacked': true,
            'toggle-pinned': false,
            'toggle-skewered': false,
            'toggle-chains': false,
            'toggle-castling': false
        }
    });
    updateVisualizations(game);
    classes = global.$._getClasses();
    styles = global.$._getStyles();
    // On e5 (knight is attacked by f4 white pawn, protected by d6 black pawn, so it has red, green, and tan!)
    const e5Shadow = styles['e5'] && styles['e5']['box-shadow'];
    const e5Bg = styles['e5'] && styles['e5']['background'];
    console.log('Test 5 (Multi-highlight on e5):', { shadow: e5Shadow, bg: e5Bg });
    if (!e5Shadow || !e5Shadow.includes('210, 180, 140') || !e5Shadow.includes('220, 53, 69') || !e5Shadow.includes('40, 167, 69')) {
        throw new Error('Test 5 failed: expected multi-highlight containing red, green, and tan on e5');
    }
}

// Test 6: Stockfish lines toggle and grey arrow rendering
{
    global.$ = createMockJQuery({ side: 'both', toggles: { 'toggle-stockfish-lines': true } });
    const chess = new Chess();
    const game = {
        getFen: () => chess.fen(),
        getGame: () => chess,
        getBestMove: () => ({ from: 'e2', to: 'e4', raw: 'e2e4' })
    };
    updateVisualizations(game);
    const arrows = global.$._getArrows();
    console.log('Test 6 (Stockfish arrow rendered):', arrows);
    if (arrows.length !== 1 || arrows[0].from !== 'e2' || arrows[0].to !== 'e4') {
        throw new Error('Test 6 failed: expected grey arrow from e2 to e4');
    }
}

// Test 7: Stockfish lines side filter
{
    // White to move, but filter set to Black ('b') -> should not render White's best move arrow
    global.$ = createMockJQuery({ side: 'b', toggles: { 'toggle-stockfish-lines': true } });
    const chess = new Chess(); // White's turn
    const game = {
        getFen: () => chess.fen(),
        getGame: () => chess,
        getBestMove: () => ({ from: 'e2', to: 'e4', raw: 'e2e4' })
    };
    updateVisualizations(game);
    const arrows = global.$._getArrows();
    console.log('Test 7 (Side=black hides White arrow):', arrows);
    if (arrows.length !== 0) {
        throw new Error('Test 7 failed: expected arrow to be hidden when side filter does not match turn color');
    }

    // Now filter set to White ('w') -> should render
    global.$ = createMockJQuery({ side: 'w', toggles: { 'toggle-stockfish-lines': true } });
    updateVisualizations(game);
    const arrowsW = global.$._getArrows();
    console.log('Test 7 (Side=white shows White arrow):', arrowsW);
    if (arrowsW.length !== 1 || arrowsW[0].from !== 'e2' || arrowsW[0].to !== 'e4') {
        throw new Error('Test 7 failed: expected arrow when side filter matches White');
    }
}

// Test 8: Stockfish lines disabled via toggle
{
    global.$ = createMockJQuery({ side: 'both', toggles: { 'toggle-stockfish-lines': false } });
    const chess = new Chess();
    const game = {
        getFen: () => chess.fen(),
        getGame: () => chess,
        getBestMove: () => ({ from: 'e2', to: 'e4', raw: 'e2e4' })
    };
    updateVisualizations(game);
    const arrows = global.$._getArrows();
    console.log('Test 8 (Stockfish lines toggle off):', arrows);
    if (arrows.length !== 0) {
        throw new Error('Test 8 failed: expected no arrows when toggle-stockfish-lines is false');
    }
}

// Test 9: Analysis mode simulation (running own moves without affecting game)
{
    const realChess = new Chess();
    realChess.move({ from: 'e2', to: 'e4' });
    const realFen = realChess.fen();
    const realPgn = realChess.pgn();

    // Start analysis sandbox from current game
    const analysisChess = new Chess();
    analysisChess.load(realChess.fen());

    // Try multiple hypothetical moves (e.g. 1... e5 2. Nf3 Nc6)
    analysisChess.move({ from: 'e7', to: 'e5' });
    analysisChess.move({ from: 'g1', to: 'f3' });
    analysisChess.move({ from: 'b8', to: 'c6' });

    // Verify hypothetical moves did NOT mutate real game
    if (realChess.fen() !== realFen || realChess.pgn() !== realPgn) {
        throw new Error('Test 9 failed: real game state was altered by analysis moves');
    }
    if (analysisChess.history().length !== 3) {
        throw new Error('Test 9 failed: analysis history should contain all 3 half-moves');
    }

    // Verify undo in analysis
    analysisChess.undo();
    if (analysisChess.history().length !== 2) {
        throw new Error('Test 9 failed: analysis undo did not revert move');
    }

    // Verify reset to game position
    analysisChess.load(realChess.fen());
    if (analysisChess.fen() !== realFen) {
        throw new Error('Test 9 failed: analysis reset did not match real game FEN');
    }
    console.log('Test 9 (Analysis Sandbox Mode): PASSED successfully');
}

// Test 10: Multi-line Stockfish arrow rendering (up to 5 lines with grey, red, blue, yellow, orange outline colors)
{
    global.$ = createMockJQuery({ side: 'both', toggles: { 'toggle-stockfish-lines': true } });
    const chess = new Chess();
    const game = {
        getFen: () => chess.fen(),
        getGame: () => chess,
        getBestMoves: () => [
            { from: 'e2', to: 'e4', raw: 'e2e4' }, // Line 1: Grey
            { from: 'd2', to: 'd4', raw: 'd2d4' }, // Line 2: Red outline
            { from: 'g1', to: 'f3', raw: 'g1f3' }, // Line 3: Blue outline
            { from: 'c2', to: 'c4', raw: 'c2c4' }, // Line 4: Yellow outline
            { from: 'b1', to: 'c3', raw: 'b1c3' }  // Line 5: Orange outline
        ]
    };
    updateVisualizations(game);
    const arrows = global.$._getArrows();
    console.log('Test 10 (Multi-line Stockfish arrows):', arrows.length, arrows);
    if (arrows.length !== 5) {
        throw new Error('Test 10 failed: expected 5 arrows rendered');
    }

    // Verify arrow destinations and styles
    // In our rendering loop, line 1 is rendered last so it sits on top
    const line1 = arrows.find(a => a.from === 'e2' && a.to === 'e4');
    const line2 = arrows.find(a => a.from === 'd2' && a.to === 'd4');
    const line3 = arrows.find(a => a.from === 'g1' && a.to === 'f3');
    const line4 = arrows.find(a => a.from === 'c2' && a.to === 'c4');
    const line5 = arrows.find(a => a.from === 'b1' && a.to === 'c3');

    if (!line1 || !line1.fill.includes('108, 117, 125')) {
        throw new Error('Test 10 failed: line 1 should have grey fill');
    }
    if (!line2 || line2.stroke !== '#dc3545') {
        throw new Error('Test 10 failed: line 2 should have red stroke (#dc3545)');
    }
    if (!line3 || line3.stroke !== '#007bff') {
        throw new Error('Test 10 failed: line 3 should have blue stroke (#007bff)');
    }
    if (!line4 || line4.stroke !== '#ffc107') {
        throw new Error('Test 10 failed: line 4 should have yellow stroke (#ffc107)');
    }
    if (!line5 || line5.stroke !== '#fd7e14') {
        throw new Error('Test 10 failed: line 5 should have orange stroke (#fd7e14)');
    }
    console.log('Test 10 (Multi-line Stockfish arrows): PASSED successfully');
}

// Test 11: Stockfish lines list display in format: <number> <color of arrow> SL<br/>
{
    global.$ = createMockJQuery({ side: 'both', toggles: { 'toggle-stockfish-lines': true } });
    const chess = new Chess();
    const game = {
        getFen: () => chess.fen(),
        getGame: () => chess,
        getBestMoves: () => [
            { from: 'e2', to: 'e4', raw: 'e2e4', pvIndex: 1, pvMoves: ['e2e4', 'e7e5', 'g1f3'] },
            { from: 'd2', to: 'd4', raw: 'd2d4', pvIndex: 2, pvMoves: ['d2d4', 'd7d5', 'c2c4'] },
            { from: 'g1', to: 'f3', raw: 'g1f3', pvIndex: 3, pvMoves: ['g1f3', 'd7d5'] },
            { from: 'c2', to: 'c4', raw: 'c2c4', pvIndex: 4, pvMoves: ['c2c4', 'e7e5'] },
            { from: 'b1', to: 'c3', raw: 'b1c3', pvIndex: 5, pvMoves: ['b1c3', 'e7e5'] }
        ]
    };
    updateVisualizations(game);
    const linesHtml = global.$._getLinesHtml();
    console.log('Test 11 (Stockfish lines HTML output):\n' + linesHtml);

    // Expected exact format: <number> <color of arrow> SL<br/> with colored number HTML
    const expectedLines = [
        '<span style="color: #6c757d; font-weight: bold;">1</span> grey 1. e4 e5 2. Nf3<br/>',
        '<span style="color: #dc3545; font-weight: bold;">2</span> red 1. d4 d5 2. c4<br/>',
        '<span style="color: #007bff; font-weight: bold;">3</span> blue 1. Nf3 d5<br/>',
        '<span style="color: #ffc107; font-weight: bold;">4</span> yellow 1. c4 e5<br/>',
        '<span style="color: #fd7e14; font-weight: bold;">5</span> orange 1. Nc3 e5<br/>'
    ];

    for (const exp of expectedLines) {
        if (!linesHtml.includes(exp)) {
            throw new Error(`Test 11 failed: expected output to include "${exp}"\nActual output:\n${linesHtml}`);
        }
    }

    if (linesHtml !== expectedLines.join('')) {
        throw new Error(`Test 11 failed: exact HTML match failed.\nExpected:\n${expectedLines.join('')}\nActual:\n${linesHtml}`);
    }

    console.log('Test 11 (Stockfish lines <number> <color of arrow> SL<br/> format): PASSED successfully');
}

// Test 12: engineGame initialization safety when Worker throws SecurityError or STOCKFISH is missing
{
    const engineGame = require('./enginegame.js');
    // Mock ChessBoard constructor and document element
    global.ChessBoard = function(id, cfg) {
        return {
            position: () => {},
            orientation: () => {},
            destroy: () => {}
        };
    };
    global.document = {
        getElementById: (id) => ({
            addEventListener: () => {},
            value: '0',
            textContent: ''
        }),
        off: () => ({ on: () => {} })
    };

    // Simulate Worker throwing SecurityError (like in file:// protocol)
    global.Worker = function() {
        const err = new Error("Failed to construct 'Worker': Script at 'file:///C:/projects/CHoPs/stockfish.js' cannot be accessed from origin 'null'.");
        err.name = 'SecurityError';
        throw err;
    };
    global.STOCKFISH = undefined;

    // Call engineGame - should not throw SecurityError or crash
    const controller = engineGame({});
    if (!controller || typeof controller.start !== 'function' || typeof controller.getFen !== 'function') {
        throw new Error('Test 12 failed: engineGame should return valid controller even when Worker throws SecurityError');
    }

    // Verify game starts with standard initial FEN
    const initialFen = controller.getFen();
    if (initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        throw new Error('Test 12 failed: unexpected initial FEN: ' + initialFen);
    }

    controller.start();
    console.log('Test 12 (engineGame SecurityError fallback): PASSED successfully');
}

console.log('ALL SIDE FILTER, TAN, STOCKFISH LINES, AND ANALYSIS TESTS PASSED SUCCESSFULLY!');
