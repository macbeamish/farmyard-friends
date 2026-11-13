import { ANIMALS } from "./animals.js"

const base = import.meta.env.BASE_URL

export function clip(name, text) {
  return { src: `${base}audio/${name}.mp3`, text }
}

function title(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function single(name, text) {
  return { text, parts: [clip(name, text)] }
}

export const GOOD_JOB = single("good-job", "Good job!")
export const WELL_DONE = single("well-done", "Well done!")
export const PRAISE_YES = single("praise-yes", "Yes!")
export const PRAISE_GREAT = single("praise-great", "Great!")
export const YAY = single("praise-yay", "Yay!")
export const HOORAY = single("praise-hooray", "Hooray!")
export const GREAT_JOB = single("great-job", "Great job!")
export const AWESOME = single("praise-awesome", "Awesome!")
export const FRUIT_PRAISE = [YAY, HOORAY, GREAT_JOB, AWESOME]
export const PRAISE = [WELL_DONE, GOOD_JOB, PRAISE_YES, PRAISE_GREAT]

const byId = Object.fromEntries(ANIMALS.map((animal) => [animal.id, animal]))

export function animalById(id) {
  return byId[id]
}

export function nameLine(animal) {
  const spoken = title(animal.name)
  return single(`name-${animal.id}`, `${spoken}.`)
}

export function eatLine(animal, fruit) {
  return single(`eat-${animal.id}-${fruit.id}`, `The ${animal.name} is eating ${fruit.phrase}.`)
}

function whereLine(animal) {
  return single(`where-${animal.id}`, `Where is the ${animal.name}?`)
}

function yesLine(animal) {
  return single(`yes-${animal.id}`, `Yes. It's a ${animal.name}.`)
}

function saysLine(animal) {
  return single(`says-${animal.id}`, `Which animal says ${animal.sound}?`)
}

export function promptFor(round, animal, index, kind = "ask") {
  if (kind === "yes") return yesLine(animal)
  if (round === 3 && animal.id === "bunny") {
    return single("hop-hop", "Which animal goes hop hop?")
  }
  if (round === 3) return saysLine(animal)
  if (round === 4) return whereLine(animal)
  return single(`save-${animal.id}`, `Save the ${animal.name}.`)
}

export function roundPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)]
}
