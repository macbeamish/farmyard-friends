let current = null
let finishCurrent = () => {}
let cancelPause = () => {}
let generation = 0
let replayToken = 0
let active = null
let voicesReady = null
let voice = null
let chime = null
let primed = false
let chimeToken = 0
let chimeUrl = ""
let blockedSrc = ""
let blockedText = ""

const localUrl = new Map()
const warming = new Set()
const warmQueue = []
let warmActive = 0

function loadVoices() {
  if (voicesReady) return voicesReady
  voicesReady = new Promise((resolve) => {
    const voices = window.speechSynthesis?.getVoices?.() ?? []
    if (voices.length || !window.speechSynthesis) {
      resolve(voices)
      return
    }
    const done = () => {
      window.speechSynthesis.onvoiceschanged = null
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.onvoiceschanged = done
    window.setTimeout(done, 700)
  })
  return voicesReady
}

function pickBritishVoice(voices) {
  return (
    voices.find((voice) => /en-GB/i.test(voice.lang) && /female|libby|sonia|hazel/i.test(voice.name)) ||
    voices.find((voice) => /en-GB/i.test(voice.lang)) ||
    voices.find((voice) => /^en/i.test(voice.lang)) ||
    null
  )
}

function browserSpeak(text) {
  if (!window.speechSynthesis || !text) return Promise.resolve()
  return loadVoices().then(
    (voices) =>
      new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        const picked = pickBritishVoice(voices)
        if (picked) utterance.voice = picked
        utterance.lang = "en-GB"
        utterance.rate = 0.9
        utterance.pitch = 1.08
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
      }),
  )
}

function mountAudio(id) {
  const audio = document.createElement("audio")
  audio.id = id
  audio.playsInline = true
  audio.setAttribute("playsinline", "")
  audio.setAttribute("webkit-playsinline", "")
  audio.preload = "auto"
  audio.hidden = true
  document.body.append(audio)
  return audio
}

function silentUrl() {
  return "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
}

function makeChimeUrl() {
  const rate = 22050
  const count = Math.floor(rate * 0.62)
  const pcm = new Int16Array(count)
  ;[784, 1046.5, 1318.5].forEach((freq, index) => {
    const start = Math.floor(rate * index * 0.07)
    for (let i = start; i < count; i += 1) {
      const t = (i - start) / rate
      const env = Math.exp(-3.8 * t) * (1 - Math.exp(-t * 90))
      const mixed = pcm[i] / 32767 + Math.sin(2 * Math.PI * freq * t) * env * 0.55
      pcm[i] = Math.max(-1, Math.min(1, mixed)) * 32767
    }
  })
  const buffer = new ArrayBuffer(44 + pcm.length * 2)
  const view = new DataView(buffer)
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, "RIFF")
  view.setUint32(4, 36 + pcm.length * 2, true)
  write(8, "WAVE")
  write(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, "data")
  view.setUint32(40, pcm.length * 2, true)
  pcm.forEach((sample, index) => view.setInt16(44 + index * 2, sample, true))
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }))
}

function ensureElements() {
  if (voice) return
  voice = mountAudio("voice")
  chime = mountAudio("chime")
  chimeUrl = makeChimeUrl()
  chime.src = chimeUrl
  chime.load()
}

function pumpWarm() {
  while (warmActive < 4 && warmQueue.length) {
    const src = warmQueue.shift()
    warmActive += 1
    fetch(src)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("missing audio"))))
      .then((blob) => {
        const typed = blob.type ? blob : new Blob([blob], { type: "audio/mpeg" })
        localUrl.set(src, URL.createObjectURL(typed))
      })
      .catch(() => {})
      .finally(() => {
        warmActive -= 1
        pumpWarm()
      })
  }
}

export function warmClip(src) {
  if (!src || warming.has(src)) return
  warming.add(src)
  warmQueue.push(src)
  pumpWarm()
}

function clipSrc(src) {
  return localUrl.get(src) || src
}

function useSrc(audio, src) {
  const next =
    src.startsWith("blob:") || src.startsWith("data:") ? src : new URL(src, window.location.href).href
  if (audio.src !== next) audio.src = next
}

export function unlockAudio() {
  ensureElements()
  if (!primed) {
    primed = true
    const token = chimeToken
    voice.src = silentUrl()
    const primedSrc = voice.src
    voice.play().catch(() => {
      if (voice.src === primedSrc) primed = false
    })
    chime.volume = 0
    chime.play()
      .then(() => {
        if (token !== chimeToken) return
        chime.pause()
        try {
          chime.currentTime = 0
        } catch {
          /* the clip may not be seekable yet */
        }
        chime.volume = 1
      })
      .catch(() => {
        chime.volume = 1
      })
    return
  }
  if (!blockedSrc || !voice.paused) return
  const src = blockedSrc
  const text = blockedText
  blockedSrc = ""
  blockedText = ""
  voice.src = src
  voice.play().catch(() => {
    browserSpeak(text)
  })
}

function haltAudio() {
  finishCurrent()
  finishCurrent = () => {}
  if (current) {
    current.onended = null
    current.onerror = null
    current.pause()
    current = null
  }
  window.speechSynthesis?.cancel?.()
}

export function stopSpeaking() {
  generation += 1
  replayToken += 1
  active = null
  blockedSrc = ""
  blockedText = ""
  cancelPause()
  cancelPause = () => {}
  haltAudio()
}

export function hearAgain() {
  if (!active) return
  if (!active.running) {
    speakLine(active.line)
    return
  }
  replayToken += 1
  cancelPause()
  cancelPause = () => {}
  haltAudio()
}

function playOne(line, mine) {
  ensureElements()
  haltAudio()
  return new Promise((resolve) => {
    let settled = false
    const finish = (completed) => {
      if (settled) return
      settled = true
      resolve(completed && mine === generation)
    }
    finishCurrent = () => finish(false)
    const src = clipSrc(line.src)
    current = voice
    voice.onended = () => finish(true)
    voice.onerror = () => {
      browserSpeak(line.text).then(() => finish(true))
    }
    useSrc(voice, src)
    try {
      voice.currentTime = 0
    } catch {
      /* a fresh clip may not be seekable until it starts */
    }
    const pending = voice.play()
    if (!pending) return
    pending.catch(() => {
      blockedSrc = src
      blockedText = line.text
      browserSpeak(line.text).then(() => finish(true))
    })
  })
}

function waitUnlessStopped(ms, mine) {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      cancelPause = () => {}
      resolve(mine === generation)
    }, ms)
    cancelPause = () => {
      window.clearTimeout(timer)
      resolve(false)
    }
  })
}

function partsOf(line) {
  return line.parts ?? [line]
}

export async function speakLine(line) {
  stopSpeaking()
  const mine = generation
  const run = { line, running: true }
  active = run
  let pass = replayToken
  try {
    while (generation === mine) {
      let restarted = false
      for (const part of partsOf(line)) {
        if (generation !== mine) return false
        if (replayToken !== pass) {
          restarted = true
          break
        }
        const ok = Number.isFinite(part.pause)
          ? await waitUnlessStopped(part.pause, mine)
          : await playOne(part, mine)
        if (generation !== mine) return false
        if (replayToken !== pass) {
          restarted = true
          break
        }
        if (!ok) return false
      }
      if (!restarted) return generation === mine
      pass = replayToken
    }
    return false
  } finally {
    if (active === run) run.running = false
  }
}

export function preloadVoices() {
  return loadVoices()
}

export function playChime() {
  ensureElements()
  chimeToken += 1
  chime.volume = 1
  useSrc(chime, chimeUrl)
  try {
    chime.currentTime = 0
  } catch {
    /* replay from the start once the clip can seek */
  }
  const pending = chime.play()
  pending?.catch(() => {})
  return new Promise((resolve) => {
    window.setTimeout(resolve, 700)
  })
}
