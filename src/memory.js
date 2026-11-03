import { ANIMALS } from "./animals.js"
import { GOOD_JOB, nameLine } from "./lines.js"

const base = import.meta.env.BASE_URL

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function createMemory(root) {
  const board = root.querySelector("#memory-board")
  let finish = () => {}
  let locked = false
  let open = []
  let matched = 0
  let handlers = null

  function hide() {
    root.hidden = true
    board.replaceChildren()
    const done = finish
    finish = () => {}
    handlers = null
    open = []
    locked = false
    matched = 0
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

  async function reveal(entry) {
    if (!handlers || locked || entry.up || entry.matched) return
    if (!handlers.isCurrent()) return
    entry.up = true
    entry.button.classList.add("is-up")
    entry.button.setAttribute("aria-label", titleCase(entry.animal.name))
    open.push(entry)

    if (entry.kind === "word") {
      locked = true
      await handlers.onLine(nameLine(entry.animal))
      locked = false
      if (!handlers || !handlers.isCurrent()) return
    }

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
      await handlers.onLine(GOOD_JOB)
      if (matched === ANIMALS.length) {
        const done = finish
        finish = () => {}
        done()
      }
    } else {
      first.button.classList.add("is-shake")
      second.button.classList.add("is-shake")
      await wait(420)
      if (!handlers || !handlers.isCurrent()) return
      first.up = false
      second.up = false
      first.button.classList.remove("is-up", "is-shake")
      second.button.classList.remove("is-up", "is-shake")
      first.button.setAttribute("aria-label", "Hidden card")
      second.button.setAttribute("aria-label", "Hidden card")
    }
    locked = false
  }

  function play(nextHandlers) {
    hide()
    handlers = nextHandlers
    const cards = ANIMALS.flatMap((animal) => [
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
