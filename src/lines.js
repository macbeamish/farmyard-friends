import { ANIMALS } from "./animals.js"

const base = import.meta.env.BASE_URL

export function clip(name, text) {
  return { src: `${base}audio/${name}.mp3`, text }
}

export const GOOD_JOB = clip("good-job", "Good job.")
export const WELL_DONE = clip("well-done", "Well done.")

const byId = Object.fromEntries(ANIMALS.map((animal) => [animal.id, animal]))

export function animalById(id) {
  return byId[id]
}

export function nameLine(animal) {
  const spoken = animal.name.charAt(0).toUpperCase() + animal.name.slice(1)
  return clip(`name-${animal.id}`, `${spoken}.`)
}

export function promptFor(round, animal, index, kind = "ask") {
  if (round === 1 && kind === "yes") {
    return clip(`yes-${animal.id}`, `Yes. It's a ${animal.name}.`)
  }
  if (round === 1) {
    return clip(`find-${animal.id}`, `Where is the ${animal.name}?`)
  }
  if (round === 2 && kind === "yes") {
    return clip(`yes-${animal.id}`, `Yes. It's a ${animal.name}.`)
  }
  if (round === 2 && animal.id === "bunny") {
    return clip("hop-hop", "Which animal goes hop hop?")
  }
  if (round === 2) {
    const spoken = animal.sound.charAt(0).toUpperCase() + animal.sound.slice(1)
    return clip(`sound-${animal.id}`, `${spoken}.`)
  }
  return clip(`save-${animal.id}`, `Save the ${animal.name}.`)
}
