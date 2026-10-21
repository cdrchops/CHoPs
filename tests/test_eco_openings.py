import random
import unittest

from eco_openings import ECO_OPENINGS, select_opening


class ECOOpeningsTests(unittest.TestCase):
    def test_random_selects_known_opening(self):
        opening = select_opening("random", rng=random.Random(1))
        self.assertIn(opening["code"], {entry.code for entry in ECO_OPENINGS})
        self.assertTrue(opening["final_fen"])
        self.assertGreater(len(opening["moves"]), 0)

    def test_select_specific_code(self):
        opening = select_opening("c60")
        self.assertEqual(opening["code"], "C60")
        self.assertEqual(opening["name"], "Ruy Lopez")


if __name__ == "__main__":
    unittest.main()
