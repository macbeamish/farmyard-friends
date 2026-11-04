"""Record the narrator with a mild British voice, a little warm and bright."""

import asyncio
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"
VOICE = "en-GB-LibbyNeural"
RATE = "-8%"
PITCH = "+18Hz"

ANIMALS = [
    "cow",
    "pig",
    "duck",
    "horse",
    "bunny",
    "chicken",
    "turkey",
    "sheep",
]

LINES = {
    "hop-hop": "Which animal goes hop hop?",
    "good-job": "Good job.",
    "well-done": "Well done.",
    "praise-yes": "Yes!",
    "praise-great": "Great!",
    "where-is-the": "Where is the",
    "yes-its-a": "Yes. It's a",
    "which-says": "Which animal says",
}

for name in ANIMALS:
    spoken = name[0].upper() + name[1:]
    LINES[f"name-{name}"] = f"{spoken}."
    LINES[f"ask-{name}"] = f"{spoken}?"
    LINES[f"save-{name}"] = f"Save the {name}."


async def render(name: str, text: str) -> None:
    dest = OUT / f"{name}.mp3"
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
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
