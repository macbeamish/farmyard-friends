"""Record the narrator with a mild British voice."""

import asyncio
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"
VOICE = "en-GB-LibbyNeural"
RATE = "-10%"

ANIMALS = [
    ("cow", "moo"),
    ("pig", "oink"),
    ("duck", "quack"),
    ("horse", "neigh"),
    ("bunny", "squeak"),
    ("chicken", "cluck"),
    ("turkey", "gobble"),
    ("sheep", "baa"),
]

LINES = {
    "welcome": "Welcome to the farm. Listen carefully, then tap the animal.",
    "round1": "First, let's find each animal.",
    "round2": "Now listen. Which animal makes this sound?",
    "memory": "Now a memory game. Turn over two cards. Match each animal with its name.",
    "memory-done": "Well done. You matched every animal.",
    "round3": (
        "Some little pillow monsters have come to the farm. "
        "They are soft and friendly, but they are in the way. "
        "Save each animal. The animals are going to win."
    ),
    "round1-done": "Lovely. You found every animal.",
    "round2-done": "Well done. You know all the animal sounds.",
    "end": (
        "All the animals are safe. The little monsters waved goodbye "
        "and went home for cocoa. The animals win. Well done."
    ),
    "try-again": "Not that one. Have another try.",
    "safe-already": "That friend is already safe. Listen again.",
}

for name, sound in ANIMALS:
    spoken = sound[0].upper() + sound[1:]
    LINES[f"sound-{name}"] = f"{spoken}."
    LINES[f"find-{name}"] = f"Find the {name}."
    LINES[f"says-{name}"] = f"Which animal says {sound}?"
    LINES[f"yes-{name}"] = f"Yes. It's a {name}."
    LINES[f"save-{name}"] = f"Save the {name}."
    LINES[f"saved-{name}"] = f"You saved the {name}. The little monster waved goodbye."


async def render(name: str, text: str) -> None:
    dest = OUT / f"{name}.mp3"
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(str(dest))
    print(name)


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    names = list(LINES)
    for start in range(0, len(names), 6):
        batch = names[start : start + 6]
        await asyncio.gather(*(render(name, LINES[name]) for name in batch))


if __name__ == "__main__":
    asyncio.run(main())
