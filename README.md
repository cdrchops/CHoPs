# CHoPs
Chess Openings

## ECO opening starts

The project includes ECO opening start data in `/home/runner/work/CHoPs/CHoPs/eco_openings.py`.

Use `select_opening("random")` to choose a random ECO opening and start from the final position of that opening line (`final_fen`).

Example:

```python
from eco_openings import select_opening

opening = select_opening("random")
print(opening["code"], opening["name"])
print(opening["moves"])
print(opening["final_fen"])
```
