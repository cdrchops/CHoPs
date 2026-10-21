function updateVisualizations(game) {
    if (typeof $ === 'undefined') return;

    // Remove existing highlights and inline multi-highlight styling
    var $squares = $('#board .square-55d63');
    $squares.removeClass('highlight-green highlight-red highlight-orange highlight-yellow highlight-purple highlight-blue highlight-tan');
    $squares.css({
        'box-shadow': '',
        'background-color': '',
        'background-image': '',
        'background': ''
    });

    if (!game || typeof game.getFen !== 'function') return;

    var tempChess = typeof game.getGame === 'function' ? game.getGame() : null;
    if (!tempChess) return;

    var colorPalette = {
        'green': {
            rgba: 'rgba(40, 167, 69, 0.8)',
            bg: 'rgba(40, 167, 69, 0.25)',
            className: 'highlight-green'
        },
        'red': {
            rgba: 'rgba(220, 53, 69, 0.8)',
            bg: 'rgba(220, 53, 69, 0.25)',
            className: 'highlight-red'
        },
        'orange': {
            rgba: 'rgba(253, 126, 20, 0.85)',
            bg: 'rgba(253, 126, 20, 0.3)',
            className: 'highlight-orange'
        },
        'yellow': {
            rgba: 'rgba(255, 193, 7, 0.9)',
            bg: 'rgba(255, 193, 7, 0.35)',
            className: 'highlight-yellow'
        },
        'purple': {
            rgba: 'rgba(111, 66, 193, 0.85)',
            bg: 'rgba(111, 66, 193, 0.3)',
            className: 'highlight-purple'
        },
        'blue': {
            rgba: 'rgba(0, 123, 255, 0.85)',
            bg: 'rgba(0, 123, 255, 0.3)',
            className: 'highlight-blue'
        },
        'tan': {
            rgba: 'rgba(210, 180, 140, 0.85)',
            bg: 'rgba(210, 180, 140, 0.35)',
            className: 'highlight-tan'
        }
    };

    var fileNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    function getSquareName(r, c) {
        return fileNames[c] + (8 - r);
    }

    function getRowCol(square) {
        var c = fileNames.indexOf(square[0]);
        var r = 8 - parseInt(square[1], 10);
        return { r: r, c: c };
    }

    // Check toggles (if toggle checkboxes exist on the page; default to true if none present)
    var hasToggles = $('.rule-toggle').length > 0;
    var toggleProtected = hasToggles ? $('#toggle-protected').is(':checked') : true;
    var toggleAttacked = hasToggles ? $('#toggle-attacked').is(':checked') : true;
    var togglePinned = hasToggles ? $('#toggle-pinned').is(':checked') : true;
    var toggleSkewered = hasToggles ? $('#toggle-skewered').is(':checked') : true;
    var toggleChains = hasToggles ? $('#toggle-chains').is(':checked') : true;
    var toggleCastling = hasToggles ? $('#toggle-castling').is(':checked') : true;
    var toggleTan = hasToggles ? ($('#toggle-tan').length ? $('#toggle-tan').is(':checked') : ($('#toggle-defended').length ? $('#toggle-defended').is(':checked') : true)) : true;

    // Check side filter (both, white, black)
    var selectedSide = 'both';
    var $activeSideBtn = $('#visualization-side-group .btn.active, #side-filter-group .btn.active');
    if ($activeSideBtn.length > 0) {
        var activeId = $activeSideBtn.attr('id') || '';
        if (activeId.indexOf('white') !== -1) selectedSide = 'w';
        else if (activeId.indexOf('black') !== -1) selectedSide = 'b';
    }
    var sideRadioVal = $('input[name="visualization-side"]:checked').val() || $('input[name="side-filter"]:checked').val();
    if (sideRadioVal === 'w' || sideRadioVal === 'white') selectedSide = 'w';
    else if (sideRadioVal === 'b' || sideRadioVal === 'black') selectedSide = 'b';
    else if (sideRadioVal === 'both') selectedSide = 'both';

    var sideSelectVal = $('#visualization-side').val() || $('#side-filter').val();
    if (sideSelectVal === 'w' || sideSelectVal === 'white') selectedSide = 'w';
    else if (sideSelectVal === 'b' || sideSelectVal === 'black') selectedSide = 'b';
    else if (sideSelectVal === 'both') selectedSide = 'both';

    function shouldHighlightColor(color) {
        if (selectedSide === 'both') return true;
        return selectedSide === color;
    }

    // Track active highlight colors for each square
    var squareColors = {}; // squareName -> Array of color keys ['purple', 'green', ...]

    function addColorToSquare(sqName, colorKey) {
        if (!squareColors[sqName]) {
            squareColors[sqName] = [];
        }
        if (squareColors[sqName].indexOf(colorKey) === -1) {
            squareColors[sqName].push(colorKey);
        }
    }

    // 1) Protected pieces (Green / Tan) & 2) Attacked pieces (Red)
    if (toggleProtected || toggleAttacked || toggleTan) {
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var sqName = getSquareName(r, c);
                var piece = tempChess.get(sqName);
                if (piece && shouldHighlightColor(piece.color)) {
                    var oppColor = piece.color === 'w' ? 'b' : 'w';

                    if (toggleAttacked && tempChess.isAttacked(sqName, oppColor)) {
                        addColorToSquare(sqName, 'red');
                    }
                    if (toggleProtected && tempChess.isAttacked(sqName, piece.color)) {
                        addColorToSquare(sqName, 'green');
                    }
                    if (toggleTan && tempChess.isAttacked(sqName, piece.color)) {
                        addColorToSquare(sqName, 'tan');
                    }
                }
            }
        }
    }

    // 3) Pinned pieces (Orange) & 4) Skewered pieces (Yellow)
    if (togglePinned || toggleSkewered) {
        var PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
        var slidingAttackers = [];

        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var sqName = getSquareName(r, c);
                var piece = tempChess.get(sqName);
                if (piece && (piece.type === 'r' || piece.type === 'b' || piece.type === 'q')) {
                    slidingAttackers.push({ sq: sqName, piece: piece });
                }
            }
        }

        slidingAttackers.forEach(function(att) {
            var directions = [];
            if (att.piece.type === 'r' || att.piece.type === 'q') {
                directions.push({ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 });
            }
            if (att.piece.type === 'b' || att.piece.type === 'q') {
                directions.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 });
            }

            var attPos = getRowCol(att.sq);

            directions.forEach(function(dir) {
                var rayPieces = [];
                var currR = attPos.r + dir.dr;
                var currC = attPos.c + dir.dc;

                while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
                    var sq = getSquareName(currR, currC);
                    var p = tempChess.get(sq);
                    if (p) {
                        rayPieces.push({ sq: sq, piece: p });
                    }
                    currR += dir.dr;
                    currC += dir.dc;
                }

                if (rayPieces.length >= 2) {
                    var p1 = rayPieces[0];
                    var p2 = rayPieces[1];

                    // Attacker targets p1 (opposing piece), behind p1 is p2 (same color as p1)
                    if (p1.piece.color !== att.piece.color && p2.piece.color === p1.piece.color) {
                        if (shouldHighlightColor(p1.piece.color)) {
                            var v1 = PIECE_VALUES[p1.piece.type];
                            var v2 = PIECE_VALUES[p2.piece.type];

                            // Pin: p2 is more valuable than p1, or p2 is King
                            if (v2 > v1 || p2.piece.type === 'k') {
                                if (togglePinned) {
                                    addColorToSquare(p1.sq, 'orange');
                                }
                            } else if (v1 > v2 || p1.piece.type === 'k') {
                                // Skewer: p1 is more valuable than p2, or p1 is King (and attacked in check/ray)
                                if (toggleSkewered) {
                                    addColorToSquare(p1.sq, 'yellow');
                                }
                            }
                        }
                    }
                }
            });
        });
    }

    // 5) Pawn Chains Logic (Purple) - including base pawn
    if (toggleChains) {
        ['w', 'b'].forEach(function(color) {
            if (!shouldHighlightColor(color)) return;
            var pawns = [];
            for (var r = 0; r < 8; r++) {
                for (var c = 0; c < 8; c++) {
                    var sqName = getSquareName(r, c);
                    var piece = tempChess.get(sqName);
                    if (piece && piece.type === 'p' && piece.color === color) {
                        pawns.push({ sq: sqName, r: r, c: c });
                    }
                }
            }

            pawns.forEach(function(pawn) {
                var defRow = (color === 'w') ? pawn.r + 1 : pawn.r - 1;
                var colOffsets = [-1, 1];
                for (var i = 0; i < colOffsets.length; i++) {
                    var defCol = pawn.c + colOffsets[i];
                    if (defRow >= 0 && defRow < 8 && defCol >= 0 && defCol < 8) {
                        var defSq = getSquareName(defRow, defCol);
                        var defPiece = tempChess.get(defSq);
                        if (defPiece && defPiece.type === 'p' && defPiece.color === color) {
                            // Both the supported pawn and base/supporting pawn belong to the chain
                            addColorToSquare(pawn.sq, 'purple');
                            addColorToSquare(defSq, 'purple');
                        }
                    }
                }
            });
        });
    }

    // 6) Castling Availability (Blue)
    if (toggleCastling) {
        ['w', 'b'].forEach(function(color) {
            if (!shouldHighlightColor(color)) return;
            var isWhite = (color === 'w');
            var oppColor = isWhite ? 'b' : 'w';
            var kingSquare = isWhite ? 'e1' : 'e8';
            var kingPiece = tempChess.get(kingSquare);

            // Verify King is on starting square
            if (!kingPiece || kingPiece.type !== 'k' || kingPiece.color !== color) {
                return;
            }

            // Get castling rights from FEN or chess.js API
            var fen = typeof tempChess.fen === 'function' ? tempChess.fen() : '';
            var fenCastling = (fen && fen.split(' ')[2]) || '';
            var canK = isWhite ? (fenCastling.indexOf('K') !== -1) : (fenCastling.indexOf('k') !== -1);
            var canQ = isWhite ? (fenCastling.indexOf('Q') !== -1) : (fenCastling.indexOf('q') !== -1);

            if (typeof tempChess.getCastlingRights === 'function') {
                var rights = tempChess.getCastlingRights(color);
                if (rights) {
                    if (typeof rights.k === 'boolean') canK = rights.k;
                    if (typeof rights.q === 'boolean') canQ = rights.q;
                }
            }

            var kingInCheck = tempChess.isAttacked(kingSquare, oppColor);
            if (kingInCheck) {
                // Cannot castle out of check
                return;
            }

            // Kingside castling
            if (canK) {
                var kRookSquare = isWhite ? 'h1' : 'h8';
                var kRook = tempChess.get(kRookSquare);
                if (kRook && kRook.type === 'r' && kRook.color === color) {
                    var fSq = isWhite ? 'f1' : 'f8';
                    var gSq = isWhite ? 'g1' : 'g8';
                    // Squares between king and rook must be empty
                    var emptyK = !tempChess.get(fSq) && !tempChess.get(gSq);
                    // Squares king moves through / lands on must not be attacked
                    var safeK = !tempChess.isAttacked(fSq, oppColor) && !tempChess.isAttacked(gSq, oppColor);

                    if (emptyK && safeK) {
                        addColorToSquare(kingSquare, 'blue');
                        addColorToSquare(kRookSquare, 'blue');
                    }
                }
            }

            // Queenside castling
            if (canQ) {
                var qRookSquare = isWhite ? 'a1' : 'a8';
                var qRook = tempChess.get(qRookSquare);
                if (qRook && qRook.type === 'r' && qRook.color === color) {
                    var dSq = isWhite ? 'd1' : 'd8';
                    var cSq = isWhite ? 'c1' : 'c8';
                    var bSq = isWhite ? 'b1' : 'b8';
                    // Squares between king and rook must be empty
                    var emptyQ = !tempChess.get(dSq) && !tempChess.get(cSq) && !tempChess.get(bSq);
                    // Squares king moves through / lands on must not be attacked
                    var safeQ = !tempChess.isAttacked(dSq, oppColor) && !tempChess.isAttacked(cSq, oppColor);

                    if (emptyQ && safeQ) {
                        addColorToSquare(kingSquare, 'blue');
                        addColorToSquare(qRookSquare, 'blue');
                    }
                }
            }
        });
    }

    // Render highlights on squares
    for (var sqName in squareColors) {
        var colors = squareColors[sqName];
        if (!colors || colors.length === 0) continue;

        var $el = $('#board .square-' + sqName);
        if ($el.length === 0) continue;

        if (colors.length === 1) {
            var cKey = colors[0];
            $el.addClass(colorPalette[cKey].className);
        } else {
            // Multiple colors on this square:
            // 1. Concentric inset box-shadow borders
            var shadows = [];
            var borderStep = 3; // pixels per color ring
            for (var i = 0; i < colors.length; i++) {
                var c = colorPalette[colors[i]].rgba;
                var spread = (i + 1) * borderStep;
                shadows.push('inset 0 0 0 ' + spread + 'px ' + c);
            }

            // 2. Striped diagonal linear gradient for background
            var gradientStops = [];
            var segmentPct = 100 / colors.length;
            for (var i = 0; i < colors.length; i++) {
                var bgCol = colorPalette[colors[i]].bg;
                var start = (i * segmentPct).toFixed(1) + '%';
                var end = ((i + 1) * segmentPct).toFixed(1) + '%';
                gradientStops.push(bgCol + ' ' + start);
                gradientStops.push(bgCol + ' ' + end);
            }

            var gradientStr = 'linear-gradient(135deg, ' + gradientStops.join(', ') + ')';

            $el.css({
                'box-shadow': shadows.join(', '),
                'background': gradientStr
            });
        }
    }
}

// Export for node testing if module is present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { updateVisualizations: updateVisualizations };
}
