import { ANIMALS, FEED_ANIMALS, MEMORY_ANIMALS } from "./animals.js"
import { hearAgain, playChime, speakLine, stopSpeaking } from "./audio.js"
import { FRUITS } from "./fruits.js"
import { promptFor } from "./lines.js"
import { burstStarsAt } from "./stars.js"

const LAST_ROUND = 6

const ROUNDS = {
  1: {
    help: "Match each fruit with its name.",
    helpRu: "Соедини каждый фрукт с его названием.",
  },
  2: {
    help: "Feed the animals by dragging the fruit to them.",
    helpRu: "Покорми животных, перетащив к ним фрукты.",
  },
  3: {
    help: "Tap the animal that makes the sound.",
    helpRu: "Нажми на животное, которое издаёт этот звук.",
  },
  4: {
    help: "Tap the animal you hear.",
    helpRu: "Нажми на животное, которое слышишь.",
  },
  5: {
    help: "Match each animal with its name.",
    helpRu: "Соедини каждое животное с его названием.",
  },
  6: {
    help: "Tap the animal you hear to save it.",
    helpRu: "Нажми на животное, которое слышишь, чтобы спасти его.",
  },
}

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

export function createGame(farm, ui) {
  let round = 1
  let queue = []
  let index = 0
  let waiting = false
  let current = null
  let turn = 0

  farm.onPick((id) => {
    onPick(id)
  })

  ui.onAgain(() => {
    hearAgain()
  })

  async function start() {
    stopSpeaking()
    turn += 1
    const my = turn
    round = 1
    waiting = false
    farm.resetVisuals()
    ui.memory.hide()
    ui.feed.hide()
    ui.showHud()
    ui.setRound(ROUNDS[1])
    ui.setProgress(0, FRUITS.length)
    await beginRound(my)
  }

  async function beginRound(my) {
    ui.setRound(ROUNDS[round])
    ui.memory.hide()
    ui.feed.hide()
    if (round === 1) {
      await runMemory(my, FRUITS)
      return
    }
    if (round === 2) {
      await runFeed(my)
      return
    }
    if (round === 5) {
      await runMemory(my, MEMORY_ANIMALS)
      return
    }
    queue = shuffle(ANIMALS)
    index = 0
    ui.setProgress(0, queue.length)
    if (round === LAST_ROUND) farm.showMonsters()
    await ask(my)
  }

  async function runMemory(my, items) {
    waiting = false
    ui.setReady(false)
    ui.setProgress(0, items.length)
    ui.setCaption("")
    current = null
    if (my !== turn) return
    waiting = true
    ui.setReady(false)
    await ui.memory.play(items, {
      isCurrent: () => my === turn,
      onProgress(done) {
        ui.setProgress(done, items.length)
      },
      async onLine(line) {
        if (my !== turn) return
        waiting = false
        ui.setReady(false)
        current = line
        ui.setCaption(line.text)
        await speakLine(line)
        if (my !== turn) return
        waiting = true
        ui.setReady(true)
      },
    })
    if (my !== turn) return
    ui.memory.hide()
    await completeRound(my)
  }

  async function runFeed(my) {
    waiting = false
    ui.setReady(false)
    ui.setProgress(0, FEED_ANIMALS.length)
    ui.setCaption("")
    current = null
    if (my !== turn) return
    waiting = true
    await ui.feed.play({
      isCurrent: () => my === turn,
      onProgress(done) {
        ui.setProgress(done, FEED_ANIMALS.length)
      },
      async onLine(line) {
        if (my !== turn) return
        current = line
        ui.setCaption(line.text)
        await speakLine(line)
      },
    })
    if (my !== turn) return
    ui.feed.hide()
    await completeRound(my)
  }

  async function ask(my) {
    const animal = queue[index]
    current = promptFor(round, animal, index)
    ui.setCaption(current.text)
    ui.setProgress(index, queue.length)
    waiting = true
    ui.setReady(true)
    const finished = await speakLine(current)
    if (!finished || my !== turn || !waiting) return
  }

  function skipRound() {
    const my = turn + 1
    turn = my
    waiting = false
    stopSpeaking()
    ui.memory.hide()
    ui.feed.hide()
    farm.resetVisuals()
    if (round >= LAST_ROUND) {
      ui.showEnd()
      return
    }
    round += 1
    beginRound(my)
  }

  async function onPick(id) {
    if (round < 3 || round === 5 || !waiting) return
    const my = turn
    const animal = queue[index]
    if (id !== animal.id) {
      waiting = false
      ui.setReady(false)
      farm.shake(id)
      await wait(280)
      if (my !== turn) return
      ui.setCaption(current.text)
      waiting = true
      ui.setReady(true)
      const replayed = await speakLine(current)
      if (!replayed || my !== turn || !waiting) return
      return
    }

    waiting = false
    ui.setReady(false)
    ui.setProgress(index + 1, queue.length)
    farm.celebrate(animal.id)
    if (round === LAST_ROUND) {
      const box = farm.screenBox(animal.id)
      if (box) burstStarsAt(box)
      const leaving = farm.dismissMonster(animal.id)
      await playChime()
      await leaving
    } else {
      const success = promptFor(round, animal, index, "yes")
      ui.setCaption(success.text)
      await speakLine(success)
    }
    if (my !== turn) return

    index += 1
    if (index < queue.length) {
      if (my !== turn) return
      await ask(my)
      return
    }
    await completeRound(my)
  }

  async function completeRound(my) {
    if (round < LAST_ROUND) {
      round += 1
      if (my !== turn) return
      await beginRound(my)
      return
    }
    if (my !== turn) return
    ui.showEnd()
  }

  return { start, skip: skipRound }
}
