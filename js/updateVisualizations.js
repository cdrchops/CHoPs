function updateVisualizations(game) {
    $('#board .square-55d63').removeClass('highlight-green highlight-red highlight-orange highlight-yellow highlight-purple');

    // if (!$('.rule-toggle:checked').length) return;

    if (!game || typeof game.getFen !== 'function') return;

    console.log("Updating visualizations for game with FEN: " + game.getFen());

    var fen = game.getFen();
    var tempChess = game.getGame();
    var boardGrid = game.getBoard();

    tempChess.isAttacked('a3', "w");

    var squaresToHighlight = {
        'highlight-green': [],
        'highlight-red': [],
        'highlight-orange': [],
        'highlight-yellow': [],
        'highlight-purple': []
    };

    var fileNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    function getSquareName(r, c) {
        return fileNames[c] + (8 - r);
    }

    console.log("Board Grid:", boardGrid.fen());

    var toggleProtected = true;//$('#toggle-protected').is(':checked');
    // 1) Protected / Safe Pieces Logic (Green)
    // 2) Attacked / Threatened Pieces Logic (Red)
    if (toggleProtected) {
        console.log("toggleProtected is true");

        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var sqName = getSquareName(r, c);

                if (!tempChess.isAttacked(sqName, 'w')) {
                    // console.log("Square " + sqName + " is protected for color " + pieceColor);
                    squaresToHighlight['highlight-green'].push('.square-' + sqName);
                } else if (tempChess.isAttacked(sqName, 'b')) {
                    // console.log("Square " + sqName + " is protected for color " + pieceColor);
                    squaresToHighlight['highlight-red'].push('.square-' + sqName);
                }
            }
        }
    }

    // 5) Pawn Chains Logic (Purple)
    var toggleChains = true;//$('#toggle-chains').is(':checked');
    if (toggleChains) {
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var sqName = getSquareName(r, c);
                var piece = tempChess.get(sqName);
                if (piece !== undefined && piece.type === 'p' && piece.color === 'w') {
                    var color = piece.color;
                    var supportRow = (color === 'w') ? r + 1 : r - 1;

                    var hasChain = false;
                    var colOffsets = [-1, 1];
                    for (var i = 0; i < colOffsets.length; i++) {
                        var supportCol = c + colOffsets[i];
                        if (supportRow >= 0 && supportRow < 8 && supportCol >= 0 && supportCol < 8) {
                            var supportingPiece = tempChess.get(getSquareName(supportRow, supportCol));
                            if (supportingPiece && supportingPiece.type === 'p' && supportingPiece.color === color) {
                                hasChain = true;
                                break;
                            }
                        }
                    }

                    if (hasChain) {
                        var squareName = getSquareName(r, c);
                        squaresToHighlight['highlight-purple'].push('.square-' + squareName);
                    }
                }
            }
        }
    }



    //looks through the board and updates the highlighted squares based on the squaresToHighlight object
    for (var hlClass in squaresToHighlight) {
        if (squaresToHighlight[hlClass].length > 0) {
            $('#board ' + squaresToHighlight[hlClass].join(', ')).addClass(hlClass);
        }
    }
}