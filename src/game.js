import { ANIMALS } from "./animals.js"
import { stopSpeaking, speak } from "./audio.js"
import { FIXED, promptFor } from "./lines.js"

const ROUND_TITLES = {
  1: "Round 1 of 4 · Find the animals",
  2: "Round 2 of 4 · Animal sounds",
  3: "Round 3 of 4 · Memory match",
  4: "Round 4 of 4 · Save the animals",
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
    if (waiting && current) speak(current)
  })

  async function start() {
    stopSpeaking()
    turn += 1
    const my = turn
    round = 1
    waiting = false
    farm.resetVisuals()
    ui.memory.hide()
    ui.showHud()
    ui.setRound(ROUND_TITLES[1])
    ui.setProgress(0, ANIMALS.length)
    await beginRound(my)
  }

  async function beginRound(my) {
    ui.setRound(ROUND_TITLES[round])
    if (round === 3) {
      await runMemory(my)
      return
    }
    queue = shuffle(ANIMALS)
    index = 0
    ui.setProgress(0, queue.length)
    if (round === 4) farm.showMonsters()
    await ask(my)
  }

  async function runMemory(my) {
    waiting = false
    ui.setReady(false)
    ui.setProgress(0, ANIMALS.length)
    ui.setCaption("")
    current = null
    if (my !== turn) return
    waiting = true
    ui.setReady(false)
    await ui.memory.play({
      isCurrent: () => my === turn,
      onProgress(done) {
        ui.setProgress(done, ANIMALS.length)
      },
      async onLine(line) {
        if (my !== turn) return
        waiting = false
        ui.setReady(false)
        current = line
        ui.setCaption(line.text)
        await speak(line)
        if (my !== turn) return
        waiting = true
        ui.setReady(true)
      },
    })
    if (my !== turn) return
    ui.memory.hide()
    await completeRound(my)
  }

  async function ask(my) {
    const animal = queue[index]
    current = promptFor(round, animal, index)
    ui.setCaption(current.text)
    ui.setProgress(index, queue.length)
    waiting = true
    ui.setReady(true)
    await speak(current)
    if (my !== turn || !waiting) return
  }

  async function onPick(id) {
    if (round === 3 || !waiting) return
    const my = turn
    const animal = queue[index]
    if (id !== animal.id) {
      waiting = false
      ui.setReady(false)
      farm.shake(id)
      ui.setCaption(FIXED.tryAgain.text)
      await speak(FIXED.tryAgain)
      if (my !== turn) return
      ui.setCaption(current.text)
      waiting = true
      ui.setReady(true)
      await speak(current)
      if (my !== turn || !waiting) return
      return
    }

    waiting = false
    ui.setReady(false)
    const success = promptFor(round, animal, index, round === 4 ? "saved" : "yes")
    ui.setCaption(success.text)
    ui.setProgress(index + 1, queue.length)
    farm.celebrate(animal.id)
    if (round === 4) {
      const leaving = farm.dismissMonster(animal.id)
      await speak(success)
      await leaving
    } else {
      await speak(success)
    }
    if (my !== turn) return

    index += 1
    if (index < queue.length) {
      await wait(220)
      if (my !== turn) return
      await ask(my)
      return
    }
    await completeRound(my)
  }

  async function completeRound(my) {
    if (round === 1) {
      ui.setCaption(FIXED.round1Done.text)
      await speak(FIXED.round1Done)
      if (my !== turn) return
      round = 2
      await beginRound(my)
      return
    }
    if (round === 2) {
      ui.setCaption(FIXED.round2Done.text)
      await speak(FIXED.round2Done)
      if (my !== turn) return
      round = 3
      await beginRound(my)
      return
    }
    if (round === 3) {
      ui.setCaption(FIXED.memoryDone.text)
      await speak(FIXED.memoryDone)
      if (my !== turn) return
      round = 4
      await beginRound(my)
      return
    }
    ui.setCaption(FIXED.end.text)
    await speak(FIXED.end)
    if (my !== turn) return
    ui.showEnd()
  }

  return { start }
}
