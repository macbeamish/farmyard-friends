"""Record the narrator with a mild British voice, a little warm and bright."""

import asyncio
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"
VOICE = "en-GB-LibbyNeural"
RATE = "+6%"
PITCH = "+8Hz"

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
}

for name in ANIMALS:
    spoken = name[0].upper() + name[1:]
    LINES[f"name-{name}"] = f"{spoken}."
    LINES[f"find-{name}"] = f"Find the {name}."
    LINES[f"yes-{name}"] = f"Yes. It's a {name}."
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
