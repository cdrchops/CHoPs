function engineGame(options) {
    options = options || {};

    // console.log("options pgn " + options.pgn);
    var game = new Chess();

    if (options.pgn) {
        game.loadPgn(options.pgn);
    }

    // game.load("rnb1kb1r/ppp2p1p/3p3n/4N3/2BPPppq/8/PPP3PP/RNBQ1K1R");
    // game.loadPgn('1. b4 Nh6');
    // game.loadPgn(randomOpening.moves);
    var board;
    /// We can load Stockfish via Web Workers or via STOCKFISH() if loaded from a <script> tag.
    function createEngineWorker(scriptPath) {
        if (typeof STOCKFISH === "function") {
            try {
                return STOCKFISH();
            } catch (e) {
                console.warn("STOCKFISH() initialization failed:", e);
            }
        }
        var path = scriptPath || 'js/stockfish.js';
        if (typeof Worker !== "undefined" && (typeof location === "undefined" || location.protocol !== "file:")) {
            try {
                return new Worker(path);
            } catch (e) {
                console.warn("Worker creation failed for " + path + ":", e);
            }
        }
        return {
            postMessage: function(cmd) {},
            onmessage: null,
            terminate: function() {}
        };
    }

    var engine = createEngineWorker(options.stockfishjs);
    var evaler = createEngineWorker(options.stockfishjs);
    var engineStatus = {};
    var displayScore = false;
    var time = { wtime: 300000, btime: 300000, winc: 2000, binc: 2000 };
    var playerColor = 'white';
    var clockTimeoutID = null;
    var isEngineRunning = false;
    var evaluation_el = document.getElementById("evaluation");
    var announced_game_over;
    var currentBestMove = null;
    var currentBestMovesMap = {};
    var isAnalysisMode = false;
    var analysisGame = null;

    // do not pick up pieces if the game is over
    // in normal mode: only pick up pieces for playerColor
    // in analysis mode: pick up pieces for the active turn color in analysisGame
    var onDragStart = function(source, piece, position, orientation) {
        if (isAnalysisMode && analysisGame) {
            if (analysisGame.isGameOver()) return false;
            var turnColor = analysisGame.turn();
            var pieceColor = piece.charAt(0);
            if (pieceColor !== turnColor) return false;
            return true;
        }

        var re = playerColor === 'white' ? /^b/ : /^w/;
        if (game.isGameOver() ||
            piece.search(re) !== -1) {
            return false;
        }
    };

    setInterval(function ()
    {
        if (announced_game_over) {
            return;
        }

        if (game.isGameOver()) {
            announced_game_over = true;
            alert("Game Over");
        }
    }, 1000);

    function uciCmd(cmd, which) {
        // console.log("UCI: " + cmd);
        var target = which || engine;
        if (target && typeof target.postMessage === 'function') {
            try {
                target.postMessage(cmd);
            } catch (e) {
                console.warn("uciCmd error:", e);
            }
        }
    }
    uciCmd('uci');
    uciCmd('uci', evaler);
    uciCmd('setoption name MultiPV value 5', evaler);

    ///TODO: Eval starting posistions. I suppose the starting positions could be different in different chess varients.

    function displayStatus() {
        var status = 'Engine: ';
        if(!engineStatus.engineLoaded) {
            status += 'loading...';
        } else if(!engineStatus.engineReady) {
            status += 'loaded...';
        } else {
            status += 'ready.';
        }

        if(engineStatus.search) {
            status += '<br>' + engineStatus.search;
            if(engineStatus.score && displayScore) {
                status += (engineStatus.score.substr(0, 4) === "Mate" ? " " : ' Score: ') + engineStatus.score;
            }
        }
        $('#engineStatus').html(status);
    }

    function displayClock(color, t) {
        var isRunning = false;
        if(time.startTime > 0 && color === time.clockColor) {
            t = Math.max(0, t + time.startTime - Date.now());
            isRunning = true;
        }
        var id = color === playerColor ? '#time2' : '#time1';
        var sec = Math.ceil(t / 1000);
        var min = Math.floor(sec / 60);
        sec -= min * 60;
        var hours = Math.floor(min / 60);
        min -= hours * 60;
        var display = hours + ':' + ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2);
        if(isRunning) {
            display += sec & 1 ? ' <--' : ' <-';
        }
        $(id).text(display);
    }

    function updateClock() {
        displayClock('white', time.wtime);
        displayClock('black', time.btime);
    }

    function clockTick() {
        updateClock();
        var t = (time.clockColor === 'white' ? time.wtime : time.btime) + time.startTime - Date.now();
        var timeToNextSecond = (t % 1000) + 1;
        clockTimeoutID = setTimeout(clockTick, timeToNextSecond);
    }

    function stopClock() {
        if(clockTimeoutID !== null) {
            clearTimeout(clockTimeoutID);
            clockTimeoutID = null;
        }
        if(time.startTime > 0) {
            var elapsed = Date.now() - time.startTime;
            time.startTime = null;
            if(time.clockColor === 'white') {
                time.wtime = Math.max(0, time.wtime - elapsed);
            } else {
                time.btime = Math.max(0, time.btime - elapsed);
            }
        }
    }

    function startClock() {
        if(game.turn() === 'w') {
            time.wtime += time.winc;
            time.clockColor = 'white';
        } else {
            time.btime += time.binc;
            time.clockColor = 'black';
        }
        time.startTime = Date.now();
        clockTick();
    }

    function get_moves()
    {
        var moves = '';
        var history = game.history({verbose: true});

        for(var i = 0; i < history.length; ++i) {
            var move = history[i];
            moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '');
        }

        return moves;
    }

    function requestAnalysis(fen) {
        if (!evaler) return;
        uciCmd('stop', evaler);
        currentBestMovesMap = {};
        currentBestMove = null;
        var targetFen = fen || (isAnalysisMode && analysisGame ? analysisGame.fen() : game.fen());
        uciCmd('position fen ' + targetFen, evaler);
        uciCmd('go depth 12', evaler);
    }

    function prepareMove() {
        stopClock();
        $('#pgn').text(game.pgn());
        board.position(game.fen());
        updateClock();
        currentBestMove = null;
        currentBestMovesMap = {};
        if (typeof updateVisualizations === 'function') {
            updateVisualizations(engineGameController);
        }
        var turn = game.turn() === 'w' ? 'white' : 'black';
        if(!game.isGameOver()) {
            if(turn !== playerColor) {
                uciCmd('position startpos moves' + get_moves());
                uciCmd('position startpos moves' + get_moves(), evaler);
                if (evaluation_el) evaluation_el.textContent = "";
                uciCmd("eval", evaler);

                if (time && time.wtime) {
                    uciCmd("go " + (time.depth ? "depth " + time.depth : "") + " wtime " + time.wtime + " winc " + time.winc + " btime " + time.btime + " binc " + time.binc);
                } else {
                    uciCmd("go " + (time.depth ? "depth " + time.depth : ""));
                }
                isEngineRunning = true;
            } else {
                requestAnalysis(game.fen());
            }
            if(game.history().length >= 2 && !time.depth && !time.nodes) {
                startClock();
            }
        }
    }

    evaler.onmessage = function(event) {
        var line;

        if (event && typeof event === "object") {
            line = event.data;
        } else {
            line = event;
        }

        // console.log("evaler: " + line);

        if (typeof line !== 'string') {
            return;
        }

        /// Ignore some output.
        if (line === "uciok" || line === "readyok" || line.substr(0, 11) === "option name") {
            return;
        }

        var pvMatch = line.match(/^info .*\bpv\s+(.*)$/);
        if (pvMatch) {
            var multipvMatch = line.match(/\bmultipv\s+(\d+)/);
            var multipvNum = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
            var pvString = pvMatch[1].trim();
            var pvMoves = pvString.split(/\s+/);
            var firstMove = pvMoves[0] || '';
            var from = firstMove.substring(0, 2);
            var to = firstMove.substring(2, 4);
            var promo = firstMove.length > 4 ? firstMove.substring(4, 5) : undefined;

            var depthMatch = line.match(/\bdepth\s+(\d+)/);
            var scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
            var scoreFormatted = '';
            var activeChess = (isAnalysisMode && analysisGame) ? analysisGame : game;
            var turnMultiplier = (activeChess.turn() === 'w') ? 1 : -1;
            if (scoreMatch) {
                var sType = scoreMatch[1];
                var sVal = parseInt(scoreMatch[2], 10);
                if (sType === 'cp') {
                    var cpVal = (sVal / 100.0) * turnMultiplier;
                    scoreFormatted = (cpVal > 0 ? '+' : '') + cpVal.toFixed(2);
                } else if (sType === 'mate') {
                    scoreFormatted = '#' + (sVal * turnMultiplier);
                }
            }

            var moveData = {
                from: from,
                to: to,
                promotion: promo,
                raw: from + to,
                pvIndex: multipvNum,
                pvMoves: pvMoves,
                depth: depthMatch ? parseInt(depthMatch[1], 10) : null,
                score: scoreFormatted
            };
            currentBestMovesMap[multipvNum] = moveData;
            if (multipvNum === 1) {
                currentBestMove = moveData;
            }
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(engineGameController);
            }
        }
        var bestMatch = line.match(/^bestmove\s+([a-h][1-8])([a-h][1-8])([qrbn])?/);
        if (bestMatch && bestMatch[1] !== '(none)') {
            var bestMoveData = currentBestMovesMap[1] || { from: bestMatch[1], to: bestMatch[2], promotion: bestMatch[3], raw: bestMatch[1] + bestMatch[2], pvIndex: 1, pvMoves: [bestMatch[1] + bestMatch[2] + (bestMatch[3] || '')] };
            bestMoveData.from = bestMatch[1];
            bestMoveData.to = bestMatch[2];
            bestMoveData.promotion = bestMatch[3];
            currentBestMove = bestMoveData;
            currentBestMovesMap[1] = bestMoveData;
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(engineGameController);
            }
        }

        if (evaluation_el) {
            if (evaluation_el.textContent) {
                evaluation_el.textContent += "\n";
            }
            evaluation_el.textContent += line;
        }
    };

    engine.onmessage = function(event) {
        var line;

        if (event && typeof event === "object") {
            line = event.data;
        } else {
            line = event;
        }
        // console.log("Reply: " + line)
        if (typeof line !== 'string') {
            return;
        }
        if(line === 'uciok') {
            engineStatus.engineLoaded = true;
        } else if(line === 'readyok') {
            engineStatus.engineReady = true;
        } else {
            var match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
            /// Did the AI move?
            if(match) {
                isEngineRunning = false;
                try {
                    game.move({from: match[1], to: match[2], promotion: match[3]});
                } catch (e) {
                    return 'snapback';
                }
                prepareMove();
                uciCmd("eval", evaler)
                if (evaluation_el) {
                    evaluation_el.textContent = "";
                }
                //uciCmd("eval");
            /// Is it sending feedback?
            } else if(match = line.match(/^info .*\bdepth (\d+) .*\bnps (\d+)/)) {
                engineStatus.search = 'Depth: ' + match[1] + ' Nps: ' + match[2];
            }

            /// Is it sending feed back with a score?
            if(match = line.match(/^info .*\bscore (\w+) (-?\d+)/)) {
                var score = parseInt(match[2]) * (game.turn() === 'w' ? 1 : -1);
                /// Is it measuring in centipawns?
                if(match[1] === 'cp') {
                    engineStatus.score = (score / 100.0).toFixed(2);
                /// Did it find a mate?
                } else if(match[1] === 'mate') {
                    engineStatus.score = 'Mate in ' + Math.abs(score);
                }

                /// Is the score bounded?
                if(match = line.match(/\b(upper|lower)bound\b/)) {
                    engineStatus.score = ((match[1] === 'upper') === (game.turn() === 'w') ? '<= ' : '>= ') + engineStatus.score;
                }
            }
        }
        displayStatus();
    };

    var onDrop = function(source, target) {
        var promoteEl = document.getElementById("promote");
        var promoVal = promoteEl ? promoteEl.value : 'q';

        if (isAnalysisMode && analysisGame) {
            var move = null;
            try {
                move = analysisGame.move({
                    from: source,
                    to: target,
                    promotion: promoVal
                });
            } catch (e) {
                return 'snapback';
            }

            if (move === null) return 'snapback';

            currentBestMove = null;
            currentBestMovesMap = {};
            board.position(analysisGame.fen());
            $('#pgn').text('[Analysis] ' + analysisGame.pgn());
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(engineGameController);
            }
            requestAnalysis(analysisGame.fen());
            return;
        }

        // see if the move is legal
        var move = null;
        try {
            move = game.move({
                from: source,
                to: target,
                promotion: promoVal
            });
        } catch (e) {
            return 'snapback';
        }

        // illegal move
        if (move === null) return 'snapback';

        prepareMove();
    };

    if (typeof $ !== 'undefined') {
        $(document).off('keydown.enginegame').on('keydown.enginegame', function(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                $(window).trigger($.Event('mouseup', { pageX: -1000, pageY: -1000 }));
            }
        });
    }

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    var onSnapEnd = function() {
        if (isAnalysisMode && analysisGame) {
            board.position(analysisGame.fen());
        } else {
            board.position(game.fen());
        }
        if (typeof updateVisualizations === 'function') {
            updateVisualizations(engineGameController);
        }
    };

    var cfg = {
        showErrors: true,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    board = new ChessBoard('board', cfg);

    var engineGameController = {
        reset: function() {
            if (isAnalysisMode) this.exitAnalysis();
            game.reset();
            uciCmd('setoption name Contempt value 0');
            //uciCmd('setoption name Skill Level value 20');
            this.setSkillLevel(0);
            uciCmd('setoption name King Safety value 0'); /// Agressive 100 (it's now symetric)
        },
        loadPgn: function(pgn) {
            if (isAnalysisMode) this.exitAnalysis();
            game.loadPgn(pgn);
        },
        setPlayerColor: function(color) {
            playerColor = color;
            board.orientation(playerColor);
        },
        setSkillLevel: function(skill) {
            var max_err,
                err_prob,
                difficulty_slider;

            if (skill < 0) {
                skill = 0;
            }
            if (skill > 20) {
                skill = 20;
            }

            time.level = skill;

            /// Change thinking depth allowance.
            if (skill < 5) {
                time.depth = "1";
            } else if (skill < 10) {
                time.depth = "2";
            } else if (skill < 15) {
                time.depth = "3";
            } else {
                /// Let the engine decide.
                time.depth = "";
            }

            uciCmd('setoption name Skill Level value ' + skill);

            ///NOTE: Stockfish level 20 does not make errors (intentially), so these numbers have no effect on level 20.
            /// Level 0 starts at 1
            err_prob = Math.round((skill * 6.35) + 1);
            /// Level 0 starts at 10
            max_err = Math.round((skill * -0.5) + 10);

            uciCmd('setoption name Skill Level Maximum Error value ' + max_err);
            uciCmd('setoption name Skill Level Probability value ' + err_prob);
        },
        setTime: function(baseTime, inc) {
            time = { wtime: baseTime * 1000, btime: baseTime * 1000, winc: inc * 1000, binc: inc * 1000 };
        },
        setDepth: function(depth) {
            time = { depth: depth };
        },
        setNodes: function(nodes) {
            time = { nodes: nodes };
        },
        setContempt: function(contempt) {
            uciCmd('setoption name Contempt value ' + contempt);
        },
        setAggressiveness: function(value) {
            uciCmd('setoption name Aggressiveness value ' + value);
        },
        setDisplayScore: function(flag) {
            displayScore = flag;
            displayStatus();
        },
        start: function() {
            if (isAnalysisMode) this.exitAnalysis();
            uciCmd('ucinewgame');
            uciCmd('isready');
            engineStatus.engineReady = false;
            engineStatus.search = null;
            displayStatus();
            prepareMove();
            announced_game_over = false;
        },
        undo: function() {
            if (isAnalysisMode) {
                return this.undoAnalysis();
            }
            if(isEngineRunning)
                return false;
            game.undo();
            game.undo();
            engineStatus.search = null;
            displayStatus();
            prepareMove();
            return true;
        },
        getFen: function() {
            return isAnalysisMode && analysisGame ? analysisGame.fen() : game.fen();
        },
        getGame: function() {
            return isAnalysisMode && analysisGame ? analysisGame : game;
        },
        getBoard: function() {
            return board;
        },
        isAttacked: function(square, color) {
            var active = isAnalysisMode && analysisGame ? analysisGame : game;
            return active.isAttacked(square, color);
        },
        getBestMove: function() {
            return currentBestMove;
        },
        getBestMoves: function() {
            var moves = [];
            for (var i = 1; i <= 5; i++) {
                if (currentBestMovesMap[i]) {
                    moves.push(currentBestMovesMap[i]);
                }
            }
            if (moves.length === 0 && currentBestMove) {
                moves.push(currentBestMove);
            }
            return moves;
        },
        setBestMove: function(from, to, promotion) {
            var moveData = { from: from, to: to, promotion: promotion, raw: from + to, pvIndex: 1 };
            currentBestMove = moveData;
            currentBestMovesMap = { 1: moveData };
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(this);
            }
        },
        setBestMoves: function(movesArray) {
            currentBestMovesMap = {};
            currentBestMove = null;
            if (Array.isArray(movesArray)) {
                for (var i = 0; i < movesArray.length; i++) {
                    var m = movesArray[i];
                    var idx = i + 1;
                    var moveData = {
                        from: m.from,
                        to: m.to,
                        promotion: m.promotion,
                        raw: (m.from && m.to) ? (m.from + m.to) : '',
                        pvIndex: idx
                    };
                    currentBestMovesMap[idx] = moveData;
                    if (idx === 1) currentBestMove = moveData;
                }
            }
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(this);
            }
        },
        isAnalysisMode: function() {
            return isAnalysisMode;
        },
        startAnalysis: function() {
            if (isAnalysisMode) return;
            isAnalysisMode = true;
            stopClock();
            uciCmd('stop');
            uciCmd('stop', evaler);
            analysisGame = new Chess();
            analysisGame.load(game.fen());
            currentBestMove = null;
            currentBestMovesMap = {};
            $('#analysis-alert').show();
            $('#btn-try-moves').addClass('active btn-warning').removeClass('btn-info').text('🔬 Exit Try Moves');
            $('#pgn').text('[Analysis] ' + (analysisGame.pgn() || 'Position ready - try any moves for either side'));
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(this);
            }
            requestAnalysis(analysisGame.fen());
        },
        exitAnalysis: function() {
            if (!isAnalysisMode) return;
            isAnalysisMode = false;
            analysisGame = null;
            currentBestMove = null;
            currentBestMovesMap = {};
            $('#analysis-alert').hide();
            $('#btn-try-moves').removeClass('active btn-warning').addClass('btn-info').text('🔬 Try Moves');
            board.position(game.fen());
            $('#pgn').text(game.pgn());
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(this);
            }
            requestAnalysis(game.fen());
            var turn = game.turn() === 'w' ? 'white' : 'black';
            if (!game.isGameOver()) {
                if (turn !== playerColor) {
                    prepareMove();
                } else if (game.history().length >= 2 && !time.depth && !time.nodes) {
                    startClock();
                }
            }
        },
        toggleAnalysis: function() {
            if (isAnalysisMode) {
                this.exitAnalysis();
            } else {
                this.startAnalysis();
            }
        },
        undoAnalysis: function() {
            if (!isAnalysisMode || !analysisGame) return false;
            analysisGame.undo();
            currentBestMove = null;
            currentBestMovesMap = {};
            board.position(analysisGame.fen());
            $('#pgn').text('[Analysis] ' + (analysisGame.pgn() || 'Starting analysis position'));
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(this);
            }
            requestAnalysis(analysisGame.fen());
            return true;
        },
        resetAnalysis: function() {
            if (!isAnalysisMode) return;
            analysisGame = new Chess();
            analysisGame.load(game.fen());
            currentBestMove = null;
            currentBestMovesMap = {};
            board.position(analysisGame.fen());
            $('#pgn').text('[Analysis] ' + (analysisGame.pgn() || 'Position reset to game state'));
            if (typeof updateVisualizations === 'function') {
                updateVisualizations(this);
            }
            requestAnalysis(analysisGame.fen());
        },
        requestAnalysis: function(fen) {
            requestAnalysis(fen);
        }
    };

    return engineGameController;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = engineGame;
}
