import { ANIMALS } from "./animals.js"

const base = import.meta.env.BASE_URL
const BEAT = 500

export function clip(name, text) {
  return { src: `${base}audio/${name}.mp3`, text }
}

function title(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function single(name, text) {
  return { text, parts: [clip(name, text)] }
}

export const GOOD_JOB = single("good-job", "Good job.")
export const WELL_DONE = single("well-done", "Well done.")
export const PRAISE_YES = single("praise-yes", "Yes!")
export const PRAISE_GREAT = single("praise-great", "Great!")
export const PRAISE = [WELL_DONE, GOOD_JOB, PRAISE_YES, PRAISE_GREAT]

const byId = Object.fromEntries(ANIMALS.map((animal) => [animal.id, animal]))

export function animalById(id) {
  return byId[id]
}

export function nameLine(animal) {
  const spoken = title(animal.name)
  return single(`name-${animal.id}`, `${spoken}.`)
}

function whereLine(animal) {
  const spoken = title(animal.name)
  return {
    text: `Where is the ${animal.name}?`,
    parts: [clip("where-is-the", "Where is the"), { pause: BEAT }, clip(`ask-${animal.id}`, `${spoken}?`)],
  }
}

function yesLine(animal) {
  const spoken = title(animal.name)
  return {
    text: `Yes. It's a ${animal.name}.`,
    parts: [clip("yes-its-a", "Yes. It's a"), { pause: BEAT }, clip(`name-${animal.id}`, `${spoken}.`)],
  }
}

function saysLine(animal) {
  const spoken = title(animal.sound)
  return {
    text: `Which animal says ${animal.sound}?`,
    parts: [clip("which-says", "Which animal says"), clip(`sound-${animal.id}`, `${spoken}.`)],
  }
}

export function promptFor(round, animal, index, kind = "ask") {
  if (kind === "yes") return yesLine(animal)
  if (round === 1 && animal.id === "bunny") {
    return single("hop-hop", "Which animal goes hop hop?")
  }
  if (round === 1) return saysLine(animal)
  if (round === 2) return whereLine(animal)
  return single(`save-${animal.id}`, `Save the ${animal.name}.`)
}

export function roundPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)]
}
