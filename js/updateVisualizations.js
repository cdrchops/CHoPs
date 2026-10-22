var ARROW_COLORS = ['grey', 'red', 'blue', 'yellow', 'orange', 'purple'];
var ARROW_COLOR_HEX = {
    'grey': '#6c757d',
    'red': '#dc3545',
    'blue': '#007bff',
    'yellow': '#ffc107',
    'orange': '#fd7e14',
    'purple': '#6f42c1'
};

function formatPvMovesToSan(startFen, pvMoves) {
    if (!pvMoves || !Array.isArray(pvMoves) || pvMoves.length === 0) return '';
    if (typeof Chess === 'undefined') return pvMoves.join(' ');

    try {
        var tempEngine = new Chess();
        if (startFen) {
            tempEngine.load(startFen);
        }
        var formatted = [];
        var maxMoves = Math.min(pvMoves.length, 12);
        for (var i = 0; i < maxMoves; i++) {
            var rawMove = pvMoves[i];
            if (!rawMove || rawMove.length < 4) continue;
            var from = rawMove.substring(0, 2);
            var to = rawMove.substring(2, 4);
            var promo = rawMove.length > 4 ? rawMove.substring(4, 5) : undefined;

            var turn = tempEngine.turn();
            var fenParts = tempEngine.fen().split(/\s+/);
            var moveNum = fenParts[5] || '1';
            var prefix = '';
            if (turn === 'w') {
                prefix = moveNum + '. ';
            } else if (i === 0) {
                prefix = moveNum + '... ';
            }

            var moveObj = tempEngine.move({ from: from, to: to, promotion: promo });
            if (moveObj) {
                formatted.push(prefix + moveObj.san);
            } else {
                formatted.push(prefix + rawMove);
                break;
            }
        }
        return formatted.join(' ');
    } catch (e) {
        return pvMoves.join(' ');
    }
}

function renderStockfishLines(lines, fen) {
    if (typeof $ === 'undefined') return;
    var $container = $('#stockfish-lines-container');
    if ($container.length === 0) return;

    if (!lines || lines.length === 0) {
        $container.empty();
        return;
    }

    var html = '';
    var maxLines = Math.min(lines.length, 5);

    for (var i = 0; i < maxLines; i++) {
        var lineObj = lines[i];
        if (!lineObj) continue;

        var lineNum = lineObj.pvIndex || (i + 1);
        var colorIndex = (lineNum - 1) % ARROW_COLORS.length;
        var colorName = ARROW_COLORS[colorIndex] || 'grey';

        var moveText = '';
        if (lineObj.pvMoves && lineObj.pvMoves.length > 0) {
            moveText = formatPvMovesToSan(fen, lineObj.pvMoves);
        } else if (lineObj.from && lineObj.to) {
            moveText = lineObj.from + lineObj.to + (lineObj.promotion || '');
        } else if (lineObj.raw) {
            moveText = lineObj.raw;
        }

        var hex = ARROW_COLOR_HEX[colorName] || colorName;
        var coloredNumber = '<span style="color: ' + hex + '; font-weight: bold;">' + lineNum + '</span>';

        html += coloredNumber + ' ' + moveText + '<br/>';
    }

    $container.html(html);
}

function clearArrows() {
    if (typeof $ === 'undefined') return;
    var $svg = $('#board-arrows-svg');
    if ($svg.length > 0) {
        $svg.find('polygon, path, line, g').remove();
    }
}

function renderArrow(fromSq, toSq, options) {
    if (typeof $ === 'undefined') return;
    if (!fromSq || !toSq || fromSq === toSq) return;

    var fill = 'rgba(108, 117, 125, 0.85)';
    var stroke = 'rgba(255, 255, 255, 0.5)';
    var strokeWidth = 1;
    var opacity = 0.9;

    if (typeof options === 'string') {
        fill = options;
    } else if (options && typeof options === 'object') {
        if (options.fill !== undefined) fill = options.fill;
        if (options.stroke !== undefined) stroke = options.stroke;
        if (options.strokeWidth !== undefined) strokeWidth = options.strokeWidth;
        if (options.opacity !== undefined) opacity = options.opacity;
    }

    var $board = $('#board');
    if ($board.length === 0) return;

    var $container = $('#board .chessboard-63f37');
    if ($container.length === 0) $container = $board;
    if ($container.css('position') === 'static') {
        $container.css('position', 'relative');
    }

    var $svg = $container.find('#board-arrows-svg');
    if ($svg.length === 0) {
        $svg = $('<svg id="board-arrows-svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100; overflow: visible;"><defs><filter id="arrow-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.4"/></filter></defs></svg>');
        $container.append($svg);
    }

    var $from = $('#board .square-' + fromSq);
    var $to = $('#board .square-' + toSq);
    if ($from.length === 0 || $to.length === 0) return;

    var containerOffset = $container.offset() || { top: 0, left: 0 };
    var fromOffset = $from.offset() || { top: 0, left: 0 };
    var toOffset = $to.offset() || { top: 0, left: 0 };

    var sqW = $from.outerWidth() || 50;
    var sqH = $from.outerHeight() || 50;

    var x1 = (fromOffset.left - containerOffset.left) + sqW / 2;
    var y1 = (fromOffset.top - containerOffset.top) + sqH / 2;
    var x2 = (toOffset.left - containerOffset.left) + sqW / 2;
    var y2 = (toOffset.top - containerOffset.top) + sqH / 2;

    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    var ux = dx / len;
    var uy = dy / len;
    var px = -uy;
    var py = ux;

    var shaftWidth = Math.max(6, sqW * 0.20);
    var headWidth = shaftWidth * 2.3;
    var headLength = Math.max(14, sqW * 0.35);

    var startX = x1 + ux * (sqW * 0.15);
    var startY = y1 + uy * (sqH * 0.15);
    var tipX = x2 - ux * (sqW * 0.1);
    var tipY = y2 - uy * (sqH * 0.1);

    var hbcX = tipX - ux * headLength;
    var hbcY = tipY - uy * headLength;

    var p1 = [startX - px * (shaftWidth / 2), startY - py * (shaftWidth / 2)];
    var p2 = [hbcX - px * (shaftWidth / 2), hbcY - py * (shaftWidth / 2)];
    var p3 = [hbcX - px * (headWidth / 2), hbcY - py * (headWidth / 2)];
    var p4 = [tipX, tipY];
    var p5 = [hbcX + px * (headWidth / 2), hbcY + py * (headWidth / 2)];
    var p6 = [hbcX + px * (shaftWidth / 2), hbcY + py * (shaftWidth / 2)];
    var p7 = [startX + px * (shaftWidth / 2), startY + py * (shaftWidth / 2)];

    var pointsStr = [p1, p2, p3, p4, p5, p6, p7].map(function(pt) {
        return pt[0].toFixed(1) + ',' + pt[1].toFixed(1);
    }).join(' ');

    if (typeof document !== 'undefined' && document.createElementNS) {
        var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', pointsStr);
        polygon.setAttribute('fill', fill);
        polygon.setAttribute('stroke', stroke);
        polygon.setAttribute('stroke-width', strokeWidth);
        polygon.setAttribute('opacity', opacity);
        polygon.setAttribute('filter', 'url(#arrow-shadow)');
        polygon.setAttribute('data-from', fromSq);
        polygon.setAttribute('data-to', toSq);
        $svg[0].appendChild(polygon);
    } else {
        $svg.append('<polygon points="' + pointsStr + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" opacity="' + opacity + '" data-from="' + fromSq + '" data-to="' + toSq + '"></polygon>');
    }
}

function updateVisualizations(game) {
    if (typeof $ === 'undefined') return;

    // Clear existing arrows
    clearArrows();

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

    // 8) Stockfish lines toggle & multi-line arrow rendering & line list display
    var toggleStockfishLines = hasToggles ? ($('#toggle-stockfish-lines').length ? $('#toggle-stockfish-lines').is(':checked') : true) : true;
    var fen = (tempChess && typeof tempChess.fen === 'function') ? tempChess.fen() : (game && typeof game.getFen === 'function' ? game.getFen() : null);

    if (toggleStockfishLines && game) {
        var turnColor = (tempChess && typeof tempChess.turn === 'function') ? tempChess.turn() : null;
        if (!turnColor || shouldHighlightColor(turnColor)) {
            var lines = [];
            if (typeof game.getBestMoves === 'function') {
                lines = game.getBestMoves() || [];
            } else if (typeof game.getBestMove === 'function') {
                var single = game.getBestMove();
                if (single) lines = [single];
            }

            // Arrow line color styles up to 5 lines:
            // 1st option: grey arrow
            // 2nd option: outlined in red
            // 3rd option: outlined in blue
            // 4th option: outlined in yellow
            // 5th option: outlined in orange (or purple)
            var lineStyles = [
                { fill: 'rgba(108, 117, 125, 0.85)', stroke: 'rgba(255, 255, 255, 0.6)', strokeWidth: 1.5, opacity: 0.95 },   // Line 1: Grey
                { fill: 'rgba(220, 53, 69, 0.25)',   stroke: '#dc3545',                   strokeWidth: 2.5, opacity: 0.90 },   // Line 2: Red outline
                { fill: 'rgba(0, 123, 255, 0.25)',   stroke: '#007bff',                   strokeWidth: 2.5, opacity: 0.90 },   // Line 3: Blue outline
                { fill: 'rgba(255, 193, 7, 0.25)',   stroke: '#ffc107',                   strokeWidth: 2.5, opacity: 0.90 },   // Line 4: Yellow outline
                { fill: 'rgba(253, 126, 20, 0.25)',  stroke: '#fd7e14',                   strokeWidth: 2.5, opacity: 0.90 }    // Line 5: Orange outline
            ];

            // Render in reverse order (5 down to 1) so Line 1 appears on top
            var maxLines = Math.min(lines.length, 5);
            for (var lIdx = maxLines - 1; lIdx >= 0; lIdx--) {
                var moveObj = lines[lIdx];
                if (moveObj && moveObj.from && moveObj.to) {
                    var style = lineStyles[lIdx] || lineStyles[0];
                    renderArrow(moveObj.from, moveObj.to, style);
                }
            }

            // Render Stockfish lines in format: <number> <color of arrow> SL<br/>
            renderStockfishLines(lines, fen);
        } else {
            renderStockfishLines([], fen);
        }
    } else {
        renderStockfishLines([], fen);
    }
}

// Export for node testing if module is present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateVisualizations: updateVisualizations,
        renderArrow: renderArrow,
        clearArrows: clearArrows,
        renderStockfishLines: renderStockfishLines,
        formatPvMovesToSan: formatPvMovesToSan,
        ARROW_COLORS: ARROW_COLORS,
        ARROW_COLOR_HEX: ARROW_COLOR_HEX
    };
}
