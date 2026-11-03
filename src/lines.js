import { ANIMALS } from "./animals.js"

const base = import.meta.env.BASE_URL

export function clip(name, text) {
  return { src: `${base}audio/${name}.mp3`, text }
}

export const FIXED = {
  memoryDone: clip("memory-done", "Well done. You matched every animal."),
  round1Done: clip("round1-done", "Lovely. You found every animal."),
  round2Done: clip("round2-done", "Well done. You know all the animal sounds."),
  end: clip(
    "end",
    "All the animals are safe. The little monsters waved goodbye and went home for cocoa. The animals win. Well done.",
  ),
  tryAgain: clip("try-again", "Not that one. Have another try."),
}

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
    return clip(`find-${animal.id}`, `Find the ${animal.name}.`)
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
  if (kind === "saved") {
    return clip(
      `saved-${animal.id}`,
      `You saved the ${animal.name}. The little monster waved goodbye.`,
    )
  }
  return clip(`save-${animal.id}`, `Save the ${animal.name}.`)
}
