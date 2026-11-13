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

CHEERS = {
    "good-job": "Good job!",
    "well-done": "Well done!",
    "praise-yes": "Yes!",
    "praise-great": "Great!",
    "praise-yay": "Yay!",
    "praise-hooray": "Hooray!",
    "great-job": "Great job!",
    "praise-awesome": "Awesome!",
}
CHEER_RATE = "+18%"
CHEER_PITCH = "+38Hz"

LINES = {
    "hop-hop": "Which animal goes hop hop?",
    "where-is-the": "Where is the",
    "yes-its-a": "Yes. It's a",
    "which-says": "Which animal says",
}

SPOKEN = {"bunny": "rabbit"}

for name in ANIMALS:
    word = SPOKEN.get(name, name)
    spoken = word[0].upper() + word[1:]
    LINES[f"name-{name}"] = f"{spoken}."
    LINES[f"ask-{name}"] = f"{spoken}?"
    LINES[f"save-{name}"] = f"Save the {word}."


async def render(
    name: str,
    text: str,
    rate: str = RATE,
    pitch: str = PITCH,
    volume: str = "+0%",
) -> None:
    dest = OUT / f"{name}.mp3"
    communicate = edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch, volume=volume)
    await communicate.save(str(dest))
    print(name)


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    names = list(LINES)
    for start in range(0, len(names), 6):
        batch = names[start : start + 6]
        await asyncio.gather(*(render(name, LINES[name]) for name in batch))
    cheers = list(CHEERS)
    for start in range(0, len(cheers), 4):
        batch = cheers[start : start + 4]
        await asyncio.gather(
            *(
                render(name, CHEERS[name], CHEER_RATE, CHEER_PITCH, "+18%")
                for name in batch
            )
        )


if __name__ == "__main__":
    asyncio.run(main())
