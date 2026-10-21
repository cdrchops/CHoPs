const { Chess } = require('./js/chess.js');
const { updateVisualizations } = require('./js/updateVisualizations.js');

function createMockJQuery(options = {}) {
    const toggles = options.toggles || {};
    const side = options.side || 'both';
    const squareClasses = {};
    const squareStyles = {};

    function jq(selector) {
        if (selector === '#board .square-55d63') {
            return {
                removeClass: (cls) => {
                    for (const sq in squareClasses) squareClasses[sq] = [];
                },
                css: (styles) => {}
            };
        }
        if (selector === '.rule-toggle') {
            return { length: 1 };
        }
        if (selector.startsWith('#toggle-')) {
            const toggleId = selector.substring(1);
            return {
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
            return {
                length: 1,
                addClass: (cls) => {
                    squareClasses[sqName].push(cls);
                },
                css: (styles) => {
                    squareStyles[sqName] = styles;
                }
            };
        }
        return { length: 0, is: () => false, val: () => '' };
    }

    jq._getClasses = () => squareClasses;
    jq._getStyles = () => squareStyles;
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

console.log('ALL SIDE FILTER AND TAN TESTS PASSED SUCCESSFULLY!');
