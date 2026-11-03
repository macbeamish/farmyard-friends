import { ANIMALS } from "./animals.js"

const base = import.meta.env.BASE_URL

export function clip(name, text) {
  return { src: `${base}audio/${name}.mp3`, text }
}

export const FIXED = {
  welcome: clip("welcome", "Welcome to the farm. Listen carefully, then tap the animal."),
  round1: clip("round1", "First, let's find each animal."),
  round2: clip("round2", "Now listen. Which animal makes this sound?"),
  memory: clip(
    "memory",
    "Now a memory game. Turn over two cards. Match each animal with its name.",
  ),
  memoryDone: clip("memory-done", "Well done. You matched every animal."),
  round3: clip(
    "round3",
    "Some little pillow monsters have come to the farm. They are soft and friendly, but they are in the way. Save each animal. The animals are going to win.",
  ),
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

export function soundLine(animal) {
  const spoken = animal.sound.charAt(0).toUpperCase() + animal.sound.slice(1)
  return clip(`sound-${animal.id}`, `${spoken}.`)
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
  if (round === 2) {
    return clip(`says-${animal.id}`, `Which animal says ${animal.sound}?`)
  }
  if (kind === "saved") {
    return clip(
      `saved-${animal.id}`,
      `You saved the ${animal.name}. The little monster waved goodbye.`,
    )
  }
  return clip(`save-${animal.id}`, `Save the ${animal.name}.`)
}
