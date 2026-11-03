import { preloadVoices } from "./audio.js"
import { createGame } from "./game.js"
import { createMemory } from "./memory.js"
import { createFarm } from "./scene.js"

const stage = document.querySelector("#stage")
const overlay = document.querySelector("#overlay")
const playButton = document.querySelector("#play")
const overlayCopy = document.querySelector("#overlay-copy")
const caption = document.querySelector("#caption")
const roundLabel = document.querySelector("#round-label")
const progress = document.querySelector("#progress")
const again = document.querySelector("#again")
const hud = document.querySelector("#hud")
const memory = createMemory(document.querySelector("#memory"))

function setCaption(text) {
  caption.textContent = text
}

function setRound(text) {
  roundLabel.textContent = text
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
  overlay.querySelector(".eyebrow").textContent = "You did it"
  overlay.querySelector("h1").textContent = "The animals win"
  overlayCopy.textContent =
    "Every friend is safe. The little monsters waved goodbye and went home for cocoa."
  playButton.textContent = "Play again"
  playButton.disabled = false
  again.disabled = true
}

const ui = {
  setCaption,
  setRound,
  setProgress,
  showHud() {
    hud.classList.remove("is-hidden")
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
    playButton.textContent = "Play"
  })
  .catch((error) => {
    console.error(error)
    overlayCopy.textContent = "The farm pictures did not load. Please refresh the page."
    playButton.textContent = "Try again"
    playButton.disabled = false
    playButton.addEventListener("click", () => window.location.reload(), { once: true })
  })

playButton.addEventListener("click", () => {
  if (!game || playButton.disabled) return
  overlay.hidden = true
  game.start()
})
