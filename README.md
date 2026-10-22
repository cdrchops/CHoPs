# CHoPs
Chess Openings 

Many years ago I had an idea for a chess trainer that would allow a learning player to visualize pieces better with regards to whether they were attacked, safe, protected by another piece, etc.

I lost track of the project for almost 7 years when I found it yesterday and decided to complete it.  Rest assured it's not done.  However, it is playable.

This was made for one person to learn against a computer.  It was also made to use a random opening based on the ECO.

Select Random Opening will give you a random ECO opening playing both sides to the end where the players will then start.

Features:
 1) Protected pieces are green - if your pieces are not attacked - then they'll show green * I need to change this so it reads not attacked or something
 2) Attacked pieces are red - pieces attacked will show red
 3) Pinned pieces are orange - if your piece is pinned it'll show orange
 4) Skewered pieces are yellow - if your piece is skewered it'll show yellow
 5) Pawn chains are purple - if your pawn is part of a pawn chain it'll show purple
 6) Castling availability is blue - when the pieces are set so you can castle (either side) then the king and rook will show blue
 7) Protected by another piece is tan - if your piece is protected by another piece then it'll show tan.
 8) Stockfish lines (up to 5 arrows)

With number 7, I added this because IM Eric Rosen once said something like "many beginner chess players would do far better if they would ensure that when they move a piece it's protected by another piece" or something like that.  It's helped me a lot while playing and I thought I'd put it in here.

You can also Try Moves to test lines - I use this where I'm thinking "I'll move here and see what's going on" I can also evaluate my position from there and see if my piece is truly protected or if my board vision was off.

I have much more to add just for my own fun.
a) Finding tactics - the idea being that it'll evaluate the board and then based on possible moves determine if there's a tactic to be found in the current game play
b) Endgames - the idea being that at some point the engine can evaluate the pieces and determine the endgame variant that's available.  If it's not one of the "normal" endgames then it won't do anything.
c) Mating nets - the idea being that it can evaluate a position and see a potential mating net then suggest a strategy to get to that point (within like 2-3 moves ahead or whatever the user determines)

I hope you enjoy this beginning.
