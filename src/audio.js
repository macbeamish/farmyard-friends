let current = null
let finishCurrent = () => {}
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
        utterance.rate = 0.92
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
      }),
  )
}

export function stopSpeaking() {
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

export function speak(line) {
  stopSpeaking()
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    finishCurrent = finish

    const audio = new Audio(line.src)
    current = audio
    audio.onended = finish
    audio.onerror = () => {
      browserSpeak(line.text).then(finish)
    }
    audio.play().catch(() => {
      browserSpeak(line.text).then(finish)
    })
  })
}

export function preloadVoices() {
  return loadVoices()
}
