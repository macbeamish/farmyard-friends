import { playChime } from "./audio.js"
import { nameLine } from "./lines.js"
import { burstStars } from "./stars.js"

const base = import.meta.env.BASE_URL

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function celebratePair(first, second) {
  burstStars(first)
  burstStars(second)
  return playChime()
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function createMemory(root) {
  const board = root.querySelector("#memory-board")
  let finish = () => {}
  let locked = false
  let open = []
  let held = []
  let matched = 0
  let pairCount = 0
  let handlers = null

  function hide() {
    root.hidden = true
    board.replaceChildren()
    const done = finish
    finish = () => {}
    handlers = null
    open = []
    held = []
    locked = false
    matched = 0
    pairCount = 0
    root.classList.remove("is-fruit")
    done()
  }

  function face(entry) {
    const side = document.createElement("span")
    side.className = "mem-face mem-up"
    if (entry.kind === "picture") {
      const image = document.createElement("img")
      image.src = `${base}art/${entry.animal.id}.png`
      image.alt = ""
      image.draggable = false
      side.append(image)
      return side
    }
    const name = document.createElement("span")
    name.className = "mem-name"
    name.textContent = titleCase(entry.animal.name)
    side.append(name)
    return side
  }

  function makeButton(entry) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "mem-card"
    button.setAttribute("aria-label", "Hidden card")
    const inner = document.createElement("span")
    inner.className = "mem-inner"
    const down = document.createElement("span")
    down.className = "mem-face mem-down"
    down.setAttribute("aria-hidden", "true")
    inner.append(down, face(entry))
    button.append(inner)
    button.addEventListener("click", () => {
      reveal(entry)
    })
    entry.button = button
    return button
  }

  function putBack(cards) {
    for (const card of cards) {
      card.up = false
      card.button.classList.remove("is-up", "is-shake")
      card.button.setAttribute("aria-label", "Hidden card")
    }
  }

  async function reveal(entry) {
    if (!handlers || locked || entry.up || entry.matched) return
    if (!handlers.isCurrent()) return
    if (held.length) {
      putBack(held)
      held = []
    }
    entry.up = true
    entry.button.classList.add("is-up")
    entry.button.setAttribute("aria-label", titleCase(entry.animal.name))
    open.push(entry)

    if (entry.kind === "word") handlers.onLine(nameLine(entry.animal))

    if (open.length < 2) return
    const [first, second] = open
    open = []
    locked = true
    const pair = first.animal.id === second.animal.id && first.kind !== second.kind
    if (pair) {
      first.matched = true
      second.matched = true
      first.button.classList.add("is-matched")
      second.button.classList.add("is-matched")
      matched += 1
      handlers.onProgress(matched)
      const cheer = celebratePair(first.button, second.button)
      locked = false
      if (matched === pairCount) {
        await cheer
        if (!handlers || !handlers.isCurrent()) return
        const done = finish
        finish = () => {}
        done()
      }
      return
    }

    first.button.classList.add("is-shake")
    second.button.classList.add("is-shake")
    held = [first, second]
    locked = false
  }

  function play(items, nextHandlers) {
    hide()
    handlers = nextHandlers
    pairCount = items.length
    root.classList.toggle("is-fruit", items.length > 8)
    const cards = items.flatMap((animal) => [
      { animal, kind: "picture", up: false, matched: false },
      { animal, kind: "word", up: false, matched: false },
    ])
    shuffle(cards).forEach((entry) => {
      board.append(makeButton(entry))
    })
    root.hidden = false
    return new Promise((resolve) => {
      finish = resolve
    })
  }

  return { play, hide }
}
