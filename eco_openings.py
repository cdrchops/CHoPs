"""ECO opening selection helpers.

This module provides a small ECO opening catalog and helpers to start a game
from the final position of an opening line.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
import random
from typing import Iterable


@dataclass(frozen=True)
class ECOOpening:
    code: str
    name: str
    moves: tuple[str, ...]
    final_fen: str


# Final FEN values represent the board position after the move list is played.
ECO_OPENINGS: tuple[ECOOpening, ...] = (
    ECOOpening(
        code="B01",
        name="Scandinavian Defense",
        moves=("e4", "d5", "exd5", "Qxd5", "Nc3"),
        final_fen="rnb1kbnr/ppp1pppp/8/3q4/8/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 3",
    ),
    ECOOpening(
        code="B20",
        name="Sicilian Defense",
        moves=("e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"),
        final_fen="rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
    ),
    ECOOpening(
        code="C50",
        name="Italian Game",
        moves=("e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"),
        final_fen="r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    ),
    ECOOpening(
        code="C60",
        name="Ruy Lopez",
        moves=("e4", "e5", "Nf3", "Nc6", "Bb5"),
        final_fen="r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    ),
    ECOOpening(
        code="D30",
        name="Queen's Gambit Declined",
        moves=("d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7"),
        final_fen="rnbqk2r/ppp1bppp/4pn2/3p2B1/2PP4/2N5/PP2PPPP/R2QKBNR w KQkq - 4 5",
    ),
)


def list_openings() -> Iterable[ECOOpening]:
    return ECO_OPENINGS


def get_opening_by_code(code: str) -> ECOOpening:
    normalized = code.strip().upper()
    for opening in ECO_OPENINGS:
        if opening.code == normalized:
            return opening
    raise ValueError(f"Unknown ECO code: {code}")


def select_opening(opening: str = "random", rng: random.Random | None = None) -> dict[str, str | tuple[str, ...]]:
    if rng is None:
        rng = random

    selected = rng.choice(ECO_OPENINGS) if opening.lower() == "random" else get_opening_by_code(opening)

    return asdict(selected)
