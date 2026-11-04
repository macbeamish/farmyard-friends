import { preloadVoices } from "./audio.js"
import { createGame } from "./game.js"
import { createMemory } from "./memory.js"
import { createFarm } from "./scene.js"

const stage = document.querySelector("#stage")
const overlay = document.querySelector("#overlay")
const playButton = document.querySelector("#play")
const overlayEn = document.querySelector("#overlay-en")
const overlayRu = document.querySelector("#overlay-ru")
const eyebrowEn = document.querySelector("#eyebrow-en")
const eyebrowRu = document.querySelector("#eyebrow-ru")
const overlayTitle = document.querySelector("#overlay-title")
const caption = document.querySelector("#caption")
const roundTitle = document.querySelector("#round-title")
const roundTitleRu = document.querySelector("#round-title-ru")
const roundHelp = document.querySelector("#round-help")
const roundHelpRu = document.querySelector("#round-help-ru")
const progress = document.querySelector("#progress")
const again = document.querySelector("#again")
const skip = document.querySelector("#skip")
const hud = document.querySelector("#hud")
const memory = createMemory(document.querySelector("#memory"))

function setCaption(text) {
  caption.textContent = text
}

function setButton(button, en, ru) {
  button.querySelector(".btn-en").textContent = en
  button.querySelector(".btn-ru").textContent = ru
  button.setAttribute("aria-label", `${en}. ${ru}`)
}

function setRound(round) {
  roundTitle.textContent = round.title
  roundTitleRu.textContent = round.titleRu
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
  },
  setReady(ready) {
    again.disabled = !ready
  },
  showEnd,
  memory,
  onAgain(handler) {
    again.addEventListener("click", handler)
  },
}

preloadVoices()

let game = null

createFarm(stage)
  .then((farm) => {
    game = createGame(farm, ui)
    hud.classList.add("is-hidden")
    playButton.disabled = false
    setButton(playButton, "Play", "Играть")
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
  screen.orientation?.lock?.("landscape").catch(() => {})
  overlay.hidden = true
  game.start()
})
