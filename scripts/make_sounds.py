"""Download short open animal recordings and trim them to one call."""

import subprocess
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw-sounds"
OUT = ROOT / "public" / "audio"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# Direct Wikimedia uploads. Licenses are recorded in README.md.
SOURCES = {
    "cow": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Single_Cow_Moo.ogg",
    "pig": "https://upload.wikimedia.org/wikipedia/commons/7/73/Mudchute_pig_1.ogg",
    "duck": "https://upload.wikimedia.org/wikipedia/commons/3/39/Pekin_duck_%26_mallard.ogg",
    "horse": "https://upload.wikimedia.org/wikipedia/commons/d/db/Wiehern.ogg",
    "sheep": "https://upload.wikimedia.org/wikipedia/commons/1/13/Sheep_bleating.ogg",
    "chicken": "https://upload.wikimedia.org/wikipedia/commons/4/44/Hen_announcing_shes_lain_an_egg.ogg",
    "turkey": "https://upload.wikimedia.org/wikipedia/commons/1/11/Gobbler.ogg",
    "bunny": "https://upload.wikimedia.org/wikipedia/commons/4/49/Rabbit_oinks_and_squeaks.wav",
}

# One clear call, taken from the loudest burst in each recording.
SLICES = {
    "cow": (1.15, 2.65),
    "pig": (0.0, None),
    "duck": (79.05, 79.88),
    "horse": (0.12, 1.65),
    "sheep": (0.45, 1.65),
    "chicken": (4.35, 5.55),
    "turkey": (0.02, 0.98),
    "bunny": (11.80, 12.12),
}


def download(url, dest):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "FarmyardFriends/1.0 (educational game; local trim)"},
    )
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
            break
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code != 429 or attempt == 3:
                raise
            time.sleep(8 * (attempt + 1))
    else:
        raise last_error
    if data[:15].lstrip().lower().startswith(b"<!doctype") or data[:6].lower().startswith(b"<html"):
        raise SystemExit(f"{url} returned HTML, not audio")
    dest.write_bytes(data)
    print(f"downloaded {dest.name} {len(data)} bytes")
    time.sleep(2)


def to_wav(src, wav_path):
    subprocess.run(
        [FFMPEG, "-y", "-i", str(src), "-ac", "1", "-ar", "22050", str(wav_path)],
        check=True,
        capture_output=True,
    )


def load_wav(path):
    with wave.open(str(path), "rb") as handle:
        rate = handle.getframerate()
        frames = handle.readframes(handle.getnframes())
        samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768
    return rate, samples


def write_wav(path, rate, samples):
    fade_in = int(rate * 0.015)
    fade_out = int(rate * 0.07)
    shaped = samples.copy()
    if fade_in:
        shaped[:fade_in] *= np.linspace(0, 1, fade_in)
    if fade_out and len(shaped) > fade_out:
        shaped[-fade_out:] *= np.linspace(1, 0, fade_out)
    peak = float(np.max(np.abs(shaped))) or 1
    shaped = np.clip(shaped / peak * 0.9, -1, 1)
    pcm = (shaped * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes(pcm.tobytes())


def to_mp3(wav_path, mp3_path):
    subprocess.run(
        [FFMPEG, "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-q:a", "6", str(mp3_path)],
        check=True,
        capture_output=True,
    )


def main():
    RAW.mkdir(exist_ok=True)
    for animal, url in SOURCES.items():
        suffix = Path(url.split("?")[0]).suffix or ".bin"
        src = RAW / f"{animal}{suffix}"
        if not src.exists() or src.stat().st_size < 1000:
            download(url, src)
        full = RAW / f"{animal}-full.wav"
        to_wav(src, full)
        rate, samples = load_wav(full)
        start_s, end_s = SLICES[animal]
        start = int(start_s * rate)
        end = len(samples) if end_s is None else int(end_s * rate)
        clip = samples[start:end]
        trimmed = RAW / f"{animal}-trim.wav"
        write_wav(trimmed, rate, clip)
        dest = OUT / f"sound-{animal}.mp3"
        to_mp3(trimmed, dest)
        print(f"{animal}: {len(samples) / rate:.2f}s source -> {len(clip) / rate:.2f}s, {dest.stat().st_size} bytes")


if __name__ == "__main__":
    main()
