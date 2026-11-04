"""Join narrator pieces into one file so a phone does not add a gap between them."""

import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "public" / "audio"
RAW = ROOT / "raw-sounds"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
RATE = 22050
PAUSE = 0.5
ANIMALS = ["cow", "pig", "duck", "horse", "bunny", "chicken", "turkey", "sheep"]


def decode(name):
    dest = RAW / f"_splice_{name}.wav"
    subprocess.run(
        [FFMPEG, "-y", "-i", str(AUDIO / f"{name}.mp3"), "-ac", "1", "-ar", str(RATE), str(dest)],
        check=True,
        capture_output=True,
    )
    with wave.open(str(dest), "rb") as handle:
        samples = np.frombuffer(handle.readframes(handle.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    dest.unlink()
    return samples


def speech_end(samples):
    idx = np.flatnonzero(np.abs(samples) > 0.015)
    return int(idx[-1]) if len(idx) else len(samples) - 1


def speech_start(samples):
    idx = np.flatnonzero(np.abs(samples) > 0.015)
    return int(idx[0]) if len(idx) else 0


def fade(samples, edge):
    shaped = samples.copy()
    count = min(edge, len(shaped) // 2)
    if count:
        shaped[:count] *= np.linspace(0, 1, count)
        shaped[-count:] *= np.linspace(1, 0, count)
    return shaped


def join(head, tail, pause):
    left = fade(head[: speech_end(head) + 1], int(RATE * 0.012))
    right = fade(tail[speech_start(tail) :], int(RATE * 0.012))
    gap = np.zeros(int(RATE * pause), dtype=np.float32)
    return np.concatenate([left, gap, right])


def write_mp3(name, samples):
    peak = float(np.max(np.abs(samples))) or 1
    shaped = np.clip(samples / peak * 0.9, -1, 1)
    pcm = (shaped * 32767).astype(np.int16)
    wav = RAW / f"_splice_out_{name}.wav"
    with wave.open(str(wav), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(pcm.tobytes())
    dest = AUDIO / f"{name}.mp3"
    subprocess.run(
        [FFMPEG, "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-q:a", "5", str(dest)],
        check=True,
        capture_output=True,
    )
    wav.unlink()
    print(f"{name}: {len(samples) / RATE:.2f}s")


def main():
    RAW.mkdir(exist_ok=True)
    where = decode("where-is-the")
    yes = decode("yes-its-a")
    which = decode("which-says")
    for animal in ANIMALS:
        write_mp3(f"where-{animal}", join(where, decode(f"ask-{animal}"), PAUSE))
        write_mp3(f"yes-{animal}", join(yes, decode(f"name-{animal}"), 0))
        if animal != "bunny":
            write_mp3(f"says-{animal}", join(which, decode(f"sound-{animal}"), 0))


if __name__ == "__main__":
    main()
