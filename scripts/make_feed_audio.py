"""Record fruit names, rabbit lines, and every feeding sentence."""

import asyncio
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio"
VOICE = "en-GB-LibbyNeural"
RATE = "-8%"
PITCH = "+18Hz"

FRUITS = {
    "apple": "an apple",
    "banana": "a banana",
    "orange": "an orange",
    "grapes": "grapes",
    "strawberry": "a strawberry",
    "pear": "a pear",
    "kiwi": "a kiwi",
    "watermelon": "a watermelon",
    "pineapple": "a pineapple",
    "lemon": "a lemon",
    "mango": "a mango",
    "avocado": "an avocado",
    "cherries": "cherries",
}

ANIMALS = {
    "cow": "cow",
    "pig": "pig",
    "duck": "duck",
    "horse": "horse",
    "bunny": "rabbit",
    "chicken": "chicken",
    "turkey": "turkey",
    "sheep": "sheep",
    "mouse": "mouse",
    "goat": "goat",
    "rooster": "rooster",
    "goose": "goose",
}

LINES = {
    "name-bunny": "Rabbit.",
    "ask-bunny": "Rabbit?",
    "save-bunny": "Save the rabbit.",
}

for fruit, phrase in FRUITS.items():
    spoken = fruit[0].upper() + fruit[1:]
    LINES[f"name-{fruit}"] = f"{spoken}."
    for animal, name in ANIMALS.items():
        LINES[f"eat-{animal}-{fruit}"] = f"The {name} is eating {phrase}."


async def render(name: str, text: str) -> None:
    dest = OUT / f"{name}.mp3"
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(str(dest))
    print(name, flush=True)


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    names = list(LINES)
    for start in range(0, len(names), 8):
        batch = names[start : start + 8]
        await asyncio.gather(*(render(name, LINES[name]) for name in batch))


if __name__ == "__main__":
    asyncio.run(main())
