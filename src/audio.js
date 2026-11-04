let current = null
let finishCurrent = () => {}
let cancelPause = () => {}
let generation = 0
let replayToken = 0
let active = null
let voicesReady = null

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
  if (!window.speechSynthesis) return Promise.resolve()
  return loadVoices().then(
    (voices) =>
      new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        const voice = pickBritishVoice(voices)
        if (voice) utterance.voice = voice
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
  haltAudio()
  return new Promise((resolve) => {
    let settled = false
    const finish = (completed) => {
      if (settled) return
      settled = true
      resolve(completed && mine === generation)
    }
    finishCurrent = () => finish(false)

    const audio = new Audio(line.src)
    current = audio
    audio.onended = () => finish(true)
    audio.onerror = () => {
      browserSpeak(line.text).then(() => finish(true))
    }
    audio.play().catch(() => {
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
        const ok = part.pause ? await waitUnlessStopped(part.pause, mine) : await playOne(part, mine)
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
