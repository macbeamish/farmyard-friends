import { FEED_ANIMALS, MEMORY_ANIMALS } from "./animals.js"
import { preloadVoices, unlockAudio, warmClip } from "./audio.js"
import { createFeed } from "./feed.js"
import { FRUITS } from "./fruits.js"
import { createGame } from "./game.js"
import { clip } from "./lines.js"
import { createMemory } from "./memory.js"
import { createFarm } from "./scene.js"

const base = import.meta.env.BASE_URL
for (const fruit of FRUITS) warmClip(`${base}audio/name-${fruit.id}.mp3`)
for (const animal of MEMORY_ANIMALS) warmClip(`${base}audio/name-${animal.id}.mp3`)

const stage = document.querySelector("#stage")
const overlay = document.querySelector("#overlay")
const playButton = document.querySelector("#play")
const overlayEn = document.querySelector("#overlay-en")
const overlayRu = document.querySelector("#overlay-ru")
const eyebrowEn = document.querySelector("#eyebrow-en")
const eyebrowRu = document.querySelector("#eyebrow-ru")
const overlayTitle = document.querySelector("#overlay-title")
const caption = document.querySelector("#caption")
const roundHelp = document.querySelector("#round-help")
const roundHelpRu = document.querySelector("#round-help-ru")
const progress = document.querySelector("#progress")
const again = document.querySelector("#again")
const skip = document.querySelector("#skip")
const full = document.querySelector("#full")
const fullStart = document.querySelector("#full-start")
const hud = document.querySelector("#hud")
const memory = createMemory(document.querySelector("#memory"))
const feed = createFeed(document.querySelector("#feed"))

function setCaption(text) {
  caption.textContent = text
}

function setButton(button, en, ru) {
  button.querySelector(".btn-en").textContent = en
  button.querySelector(".btn-ru").textContent = ru
  button.setAttribute("aria-label", `${en}. ${ru}`)
}

function setRound(round) {
  roundHelp.textContent = round.help
  roundHelpRu.textContent = round.helpRu
}

function setProgress(done, total) {
  progress.replaceChildren(
    ...Array.from({ length: total }, (_, index) => {
      const dot = document.createElement("span")
      dot.className = index < done ? "dot on" : "dot"
      return dot
    }),
  )
}

function showEnd() {
  overlay.hidden = false
  eyebrowEn.textContent = "You did it"
  eyebrowRu.textContent = "Получилось"
  overlayTitle.textContent = "The animals win"
  overlayEn.textContent = ""
  overlayRu.textContent = "Животные победили."
  setButton(playButton, "Play again", "Играть снова")
  playButton.disabled = false
  again.disabled = true
  skip.hidden = true
}

const ui = {
  setCaption,
  setRound,
  setProgress,
  showHud() {
    hud.classList.remove("is-hidden")
    skip.hidden = false
    again.disabled = false
  },
  setReady() {},
  showEnd,
  memory,
  feed,
  onAgain(handler) {
    again.addEventListener("click", handler)
  },
}

preloadVoices()

function fitViewport() {
  const height = window.visualViewport?.height || window.innerHeight
  document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`)
}

fitViewport()
window.visualViewport?.addEventListener("resize", fitViewport)
window.visualViewport?.addEventListener("scroll", fitViewport)
window.addEventListener("resize", fitViewport)
document.addEventListener("pointerdown", () => unlockAudio(), { capture: true })

function fullscreenActive() {
  return Boolean(
    document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement,
  )
}

function tuckBrowserBars() {
  const html = document.documentElement
  const body = document.body
  const htmlOverflow = html.style.overflow
  const bodyOverflow = body.style.overflow
  html.style.overflow = "auto"
  body.style.overflow = "auto"
  const tall = Math.max(window.screen?.height || 0, window.innerHeight + 160)
  body.style.minHeight = `${tall}px`
  window.scrollTo(0, tall)
  window.setTimeout(() => {
    fitViewport()
    body.style.minHeight = ""
    html.style.overflow = htmlOverflow
    body.style.overflow = bodyOverflow
    window.scrollTo(0, 0)
  }, 350)
}

function labelFull(on) {
  const en = on ? "Exit" : "Full"
  const ru = on ? "Выйти" : "Экран"
  full.querySelector(".btn-en").textContent = en
  full.querySelector(".btn-ru").textContent = ru
  full.setAttribute("aria-label", on ? "Exit full screen. Выйти" : "Full screen. На весь экран")
  fullStart.querySelector(".btn-en").textContent = on ? "Exit full screen" : "Full screen"
  fullStart.querySelector(".btn-ru").textContent = on ? "Выйти" : "На весь экран"
  fullStart.setAttribute("aria-label", full.getAttribute("aria-label"))
}

function requestFullscreenNow(target) {
  if (typeof target.requestFullscreen === "function") return target.requestFullscreen()
  const legacy = target.webkitRequestFullscreen || target.mozRequestFullScreen
  if (typeof legacy === "function") return legacy.call(target)
  return Promise.reject(new Error("unavailable"))
}

function phoneFallback() {
  if (!window.matchMedia("(pointer: coarse)").matches) return
  document.documentElement.classList.add("is-filled")
  labelFull(true)
  tuckBrowserBars()
  fitViewport()
}

function toggleFull() {
  const root = document.documentElement
  if (fullscreenActive()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen
    if (exit) {
      const done = exit.call(document)
      if (done && typeof done.catch === "function") done.catch(() => {})
    }
    return
  }
  if (root.classList.contains("is-filled")) {
    root.classList.remove("is-filled")
    labelFull(false)
    fitViewport()
    return
  }
  let pending
  try {
    pending = requestFullscreenNow(root)
  } catch {
    phoneFallback()
    return
  }
  if (pending && typeof pending.then === "function") {
    pending.then(() => {
      root.classList.remove("is-filled")
      labelFull(true)
      fitViewport()
    }, phoneFallback)
    return
  }
  window.setTimeout(() => {
    if (fullscreenActive()) {
      root.classList.remove("is-filled")
      labelFull(true)
    } else {
      phoneFallback()
    }
    fitViewport()
  }, 300)
}

full.setAttribute("aria-label", "Full screen. На весь экран")
fullStart.setAttribute("aria-label", "Full screen. На весь экран")
full.addEventListener("click", toggleFull)
fullStart.addEventListener("click", toggleFull)
function onFullscreenChange() {
  if (fullscreenActive()) document.documentElement.classList.remove("is-filled")
  labelFull(fullscreenActive() || document.documentElement.classList.contains("is-filled"))
  fitViewport()
}

document.addEventListener("fullscreenchange", onFullscreenChange)
document.addEventListener("webkitfullscreenchange", onFullscreenChange)

let game = null

createFarm(stage)
  .then((farm) => {
    game = createGame(farm, ui)
    hud.classList.add("is-hidden")
    playButton.disabled = false
    setButton(playButton, "Play", "Играть")
    for (const animal of FEED_ANIMALS) {
      for (const fruit of FRUITS) warmClip(`${base}audio/eat-${animal.id}-${fruit.id}.mp3`)
      warmClip(clip(`where-${animal.id}`, "").src)
      warmClip(`${base}audio/yes-${animal.id}.mp3`)
      warmClip(`${base}audio/save-${animal.id}.mp3`)
      if (animal.id !== "bunny") warmClip(clip(`says-${animal.id}`, "").src)
    }
    warmClip(`${base}audio/hop-hop.mp3`)
  })
  .catch((error) => {
    console.error(error)
    overlayEn.textContent = "The farm pictures did not load. Please refresh the page."
    overlayRu.textContent = "Картинки фермы не загрузились. Обновите страницу."
    setButton(playButton, "Try again", "Ещё раз")
    playButton.disabled = false
    playButton.addEventListener("click", () => window.location.reload(), { once: true })
  })

skip.addEventListener("click", () => {
  game?.skip()
})

playButton.addEventListener("click", () => {
  if (!game || playButton.disabled) return
  unlockAudio()
  screen.orientation?.lock?.("landscape").catch(() => {})
  overlay.hidden = true
  game.start()
})
