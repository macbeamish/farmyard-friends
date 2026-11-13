import { FEED_ANIMALS } from "./animals.js"
import { playChime } from "./audio.js"
import { FRUITS } from "./fruits.js"
import { eatLine } from "./lines.js"

const base = import.meta.env.BASE_URL

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function questions() {
  const fruits = shuffle(FRUITS)
  return shuffle(FEED_ANIMALS).map((animal, index) => ({
    animal,
    fruit: fruits[index],
  }))
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function celebrate(card) {
  card.classList.add("is-fed")
  const joy = document.createElement("div")
  joy.className = "feed-joy"
  joy.setAttribute("aria-hidden", "true")
  for (const mark of ["♥", "★", "♥", "★", "♥"]) {
    const spark = document.createElement("span")
    spark.textContent = mark
    joy.append(spark)
  }
  card.append(joy)
}

export function createFeed(root) {
  const animals = root.querySelector("#feed-animals")
  const fruits = root.querySelector("#feed-fruits")
  let finish = () => {}
  let handlers = null
  let queue = []
  let index = 0
  let waiting = false
  let drag = null

  function hide() {
    root.hidden = true
    animals.replaceChildren()
    fruits.replaceChildren()
    drag = null
    handlers = null
    waiting = false
    const done = finish
    finish = () => {}
    done()
  }

  function place(piece, event) {
    const width = piece.offsetWidth
    const height = piece.offsetHeight
    piece.style.left = `${event.clientX - width / 2}px`
    piece.style.top = `${event.clientY - height / 2}px`
  }

  function release(piece, home) {
    piece.style.left = `${home.left}px`
    piece.style.top = `${home.top}px`
    window.setTimeout(() => {
      piece.classList.remove("is-dragging")
      piece.style.cssText = ""
    }, 180)
  }

  function ask() {
    const turn = queue[index]
    if (!turn || !handlers) return
    for (const piece of fruits.querySelectorAll(".feed-fruit")) {
      piece.classList.toggle("is-next", piece.dataset.fruit === turn.fruit.id)
    }
    waiting = true
    handlers.onLine(eatLine(turn.animal, turn.fruit))
  }

  function onDown(event, piece) {
    if (!waiting || drag || event.button !== 0 || piece.classList.contains("is-used")) return
    event.preventDefault()
    const home = piece.getBoundingClientRect()
    piece.classList.add("is-dragging")
    piece.style.width = `${home.width}px`
    piece.style.height = `${home.height}px`
    place(piece, event)
    piece.setPointerCapture(event.pointerId)
    drag = { piece, home, id: piece.dataset.fruit }

    function move(next) {
      if (!drag) return
      place(piece, next)
    }

    async function up(next) {
      piece.removeEventListener("pointermove", move)
      piece.removeEventListener("pointerup", up)
      piece.removeEventListener("pointercancel", up)
      const dropped = drag
      drag = null
      if (!dropped || !handlers) return
      const animal = document
        .elementsFromPoint(next.clientX, next.clientY)
        .map((node) => node.closest("[data-animal]"))
        .find(Boolean)
      const turn = queue[index]
      const correct = animal?.dataset.animal === turn.animal.id && dropped.id === turn.fruit.id
      if (!correct) {
        if (animal) animal.classList.add("is-shake")
        window.setTimeout(() => animal?.classList.remove("is-shake"), 360)
        release(piece, dropped.home)
        if (handlers.isCurrent()) handlers.onLine(eatLine(turn.animal, turn.fruit))
        return
      }
      waiting = false
      celebrate(animal)
      piece.remove()
      index += 1
      handlers.onProgress(index)
      playChime()
      if (index >= queue.length) {
        await wait(900)
        if (!handlers || !handlers.isCurrent()) return
        const done = finish
        finish = () => {}
        done()
        return
      }
      ask()
    }

    piece.addEventListener("pointermove", move)
    piece.addEventListener("pointerup", up)
    piece.addEventListener("pointercancel", up)
  }

  function render(fruitIds = FRUITS.map((fruit) => fruit.id), fedIds = []) {
    const list = fruitIds.map((id) => FRUITS.find((fruit) => fruit.id === id)).filter(Boolean)
    animals.replaceChildren()
    fruits.replaceChildren()
    for (const animal of FEED_ANIMALS) {
      const card = document.createElement("div")
      card.className = "feed-animal"
      card.dataset.animal = animal.id
      if (fedIds.includes(animal.id)) card.classList.add("is-fed")
      const image = document.createElement("img")
      image.src = `${base}art/${animal.id}.png`
      image.alt = ""
      image.draggable = false
      const name = document.createElement("span")
      name.textContent = animal.name
      card.append(image, name)
      animals.append(card)
    }
    const basket = document.createElement("div")
    basket.className = "basket is-wide"
    const body = document.createElement("div")
    body.className = "basket-body"
    list.forEach((fruit, slot) => {
      const card = document.createElement("button")
      card.type = "button"
      card.className = "feed-fruit"
      card.dataset.fruit = fruit.id
      card.style.setProperty("--slot", String(slot))
      card.style.setProperty("--lift", slot % 2 ? "1" : "0")
      card.setAttribute("aria-label", fruit.name)
      const image = document.createElement("img")
      image.src = `${base}art/${fruit.id}.png`
      image.alt = ""
      image.draggable = false
      card.append(image)
      card.addEventListener("pointerdown", (event) => onDown(event, card))
      body.append(card)
    })
    const art = document.createElement("img")
    art.className = "basket-art"
    art.src = `${base}art/basket.png?v=3`
    art.alt = ""
    art.draggable = false
    basket.append(body, art)
    fruits.append(basket)
    const turn = queue[index]
    if (!turn) return
    for (const piece of fruits.querySelectorAll(".feed-fruit")) {
      piece.classList.toggle("is-next", piece.dataset.fruit === turn.fruit.id)
    }
  }

  function play(nextHandlers) {
    hide()
    handlers = nextHandlers
    queue = questions()
    index = 0
    render()
    root.hidden = false
    ask()
    return new Promise((resolve) => {
      finish = resolve
    })
  }

  return { play, hide }
}
