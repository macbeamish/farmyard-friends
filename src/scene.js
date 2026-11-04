import * as THREE from "three"
import { LAYOUT, MONSTER_LOOKS, WINDMILL } from "./animals.js"

const WORLD_W = 16
const WORLD_H = 9
const base = import.meta.env.BASE_URL

function asset(path) {
  return `${base}${path}`
}

function loadTexture(url) {
  const loader = new THREE.TextureLoader()
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = 8
        resolve(texture)
      },
      undefined,
      () => reject(new Error(`Could not load ${url}`)),
    )
  })
}

async function loadOptional(url) {
  try {
    return await loadTexture(url)
  } catch {
    return null
  }
}

function makeShadowTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createRadialGradient(64, 32, 6, 64, 32, 58)
  gradient.addColorStop(0, "rgba(70, 50, 20, 0.32)")
  gradient.addColorStop(1, "rgba(70, 50, 20, 0)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeHeartTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#e2556a"
  ctx.beginPath()
  ctx.moveTo(64, 108)
  ctx.bezierCurveTo(12, 78, 8, 36, 40, 28)
  ctx.bezierCurveTo(54, 24, 62, 36, 64, 44)
  ctx.bezierCurveTo(66, 36, 74, 24, 88, 28)
  ctx.bezierCurveTo(120, 36, 116, 78, 64, 108)
  ctx.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function alphaGrid(image) {
  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data
}

function spriteMaterial(texture) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  })
}

function plane(texture, width, height) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), spriteMaterial(texture))
  return mesh
}

export async function createFarm(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x8ec8ea, 1)
  stage.prepend(renderer.domElement)
  renderer.domElement.setAttribute(
    "aria-label",
    "Farmyard picture. Tap the animal that matches the words you hear.",
  )

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 20)
  camera.position.z = 10

  const [background, towerTex, bladeTex, shadowTex] = await Promise.all([
    loadTexture(asset("art/farm-bg.jpg")),
    loadTexture(asset("art/windmill-tower.png")),
    loadTexture(asset("art/windmill-blades.png")),
    Promise.resolve(makeShadowTexture()),
  ])

  const backdrop = plane(background, WORLD_W, WORLD_H)
  backdrop.position.z = 0
  backdrop.renderOrder = 0
  backdrop.material.depthWrite = true
  backdrop.material.transparent = false
  scene.add(backdrop)

  const towerHeight = WINDMILL.height
  const towerWidth = towerHeight * (towerTex.image.width / towerTex.image.height)
  const tower = plane(towerTex, towerWidth, towerHeight)
  tower.position.set(WINDMILL.x, WINDMILL.feet + towerHeight / 2, 0.2)
  tower.renderOrder = 2
  scene.add(tower)

  const blades = plane(bladeTex, WINDMILL.bladeSize, WINDMILL.bladeSize)
  const hubY = WINDMILL.feet + towerHeight * (1 - WINDMILL.hubFromTop)
  blades.position.set(WINDMILL.x, hubY, 0.3)
  blades.renderOrder = 3
  scene.add(blades)

  const actors = []
  const pickables = []

  for (let i = 0; i < LAYOUT.length; i += 1) {
    const spot = LAYOUT[i]
    const texture = await loadTexture(asset(`art/${spot.id}.png`))
    const blink = await loadOptional(asset(`art/${spot.id}-blink.png`))
    const aspect = texture.image.width / texture.image.height
    const height = spot.height
    const width = height * aspect
    const mesh = plane(texture, width, height)
    const homeY = spot.feet + height / 2
    mesh.position.set(spot.x, homeY, 0.5)
    mesh.renderOrder = 20 + Math.round(-spot.feet * 4)
    mesh.userData.alpha = alphaGrid(texture.image)
    mesh.userData.id = spot.id
    scene.add(mesh)
    pickables.push(mesh)

    const shadow = plane(shadowTex, width * 0.72, height * 0.22)
    shadow.position.set(spot.x, spot.feet + 0.02, 0.4)
    shadow.renderOrder = mesh.renderOrder - 1
    scene.add(shadow)

    const look = MONSTER_LOOKS[i % MONSTER_LOOKS.length]
    const monsterTex = await loadTexture(asset(`art/${look}.png`))
    const monsterBlink = await loadOptional(asset(`art/${look}-blink.png`))
    const monsterHeight = Math.min(1.35, height * 0.68)
    const monsterWidth = monsterHeight * (monsterTex.image.width / monsterTex.image.height)
    const monster = plane(monsterTex, monsterWidth, monsterHeight)
    const side = i % 2 === 0 ? -1 : 1
    const monsterHome = new THREE.Vector3(
      spot.x + side * (width * 0.22 + 0.02),
      spot.feet + height * 0.7,
      0.6,
    )
    monster.position.copy(monsterHome)
    monster.renderOrder = mesh.renderOrder + 2
    monster.visible = false
    monster.raycast = () => {}
    scene.add(monster)

    actors.push({
      id: spot.id,
      mesh,
      blink,
      homeY,
      phase: i * 0.7,
      monster,
      monsterBlink,
      monsterHome,
      hopUntil: 0,
      shakeUntil: 0,
      leaveUntil: 0,
    })
  }

  const heartTex = makeHeartTexture()
  const heart = plane(heartTex, 0.55, 0.55)
  heart.visible = false
  heart.renderOrder = 80
  heart.raycast = () => {}
  scene.add(heart)
  let heartUntil = 0

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let pickHandler = () => {}

  function resize() {
    const width = stage.clientWidth || 1
    const height = stage.clientHeight || 1
    renderer.setSize(width, height, false)
    const scale = Math.min(width / WORLD_W, height / WORLD_H)
    const camW = width / scale
    const camH = height / scale
    camera.left = -camW / 2
    camera.right = camW / 2
    camera.top = camH / 2
    camera.bottom = -camH / 2
    camera.updateProjectionMatrix()
  }

  function opaqueHit(hit) {
    const data = hit.object.userData.alpha
    if (!data || !hit.uv) return false
    const image = hit.object.material.map.image
    const x = Math.min(image.width - 1, Math.max(0, Math.floor(hit.uv.x * image.width)))
    const y = Math.min(image.height - 1, Math.max(0, Math.floor((1 - hit.uv.y) * image.height)))
    return data[(y * image.width + x) * 4 + 3] > 48
  }

  function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(pickables, false)
    for (const hit of hits) {
      if (opaqueHit(hit)) {
        pickHandler(hit.object.userData.id)
        return
      }
    }
  }

  renderer.domElement.addEventListener("pointerdown", onPointerDown)
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(stage)
  resize()

  const startedAt = performance.now()
  const now = () => (performance.now() - startedAt) / 1000

  function animate() {
    const t = now()
    blades.rotation.z = t * 0.5

    for (const actor of actors) {
      const bob = Math.sin(t * 1.7 + actor.phase) * 0.045
      const sway = Math.sin(t * 1.25 + actor.phase) * 0.03
      let y = actor.homeY + bob
      let rot = sway
      if (t < actor.hopUntil) {
        const k = 1 - (actor.hopUntil - t) / 0.45
        y += Math.sin(Math.min(1, Math.max(0, k)) * Math.PI) * 0.38
      }
      if (t < actor.shakeUntil) {
        rot += Math.sin((actor.shakeUntil - t) * 28) * 0.08
      }
      actor.mesh.position.y = y
      actor.mesh.rotation.z = rot

      const blinkOn = (t + actor.phase) % 4.8 < 0.12
      if (actor.blink) actor.mesh.material.map = blinkOn ? actor.blink : actor.mesh.userData.base

      if (!actor.monster.visible) continue
      if (t < actor.leaveUntil) {
        const k = 1 - (actor.leaveUntil - t) / 1.15
        actor.monster.position.y = actor.monsterHome.y + k * 2.4
        actor.monster.position.x = actor.monsterHome.x + Math.sin(k * 8) * 0.12
        actor.monster.material.opacity = 1 - k
        actor.monster.rotation.z = Math.sin(k * 10) * 0.25
        if (k >= 1) actor.monster.visible = false
      } else {
        const loom = 1 + Math.sin(t * 2.4 + actor.phase) * 0.06
        actor.monster.scale.set(loom, loom, 1)
        actor.monster.position.y = actor.monsterHome.y + Math.sin(t * 2.6 + actor.phase) * 0.1
        actor.monster.rotation.z = Math.sin(t * 1.8 + actor.phase) * 0.1
        const monsterBlink = (t + actor.phase + 1.2) % 5.1 < 0.12
        if (actor.monsterBlink) {
          actor.monster.material.map = monsterBlink ? actor.monsterBlink : actor.monster.userData.base
        }
      }
    }

    if (heart.visible) {
      if (t >= heartUntil) heart.visible = false
      else {
        const k = 1 - (heartUntil - t) / 0.9
        heart.position.y = heart.userData.baseY + k * 0.7
        heart.material.opacity = 1 - k
      }
    }

    renderer.render(scene, camera)
  }

  for (const actor of actors) {
    actor.mesh.userData.base = actor.mesh.material.map
    actor.monster.userData.base = actor.monster.material.map
  }
  renderer.setAnimationLoop(animate)

  function actorById(id) {
    return actors.find((actor) => actor.id === id)
  }

  return {
    onPick(handler) {
      pickHandler = handler
    },
    showMonsters() {
      for (const actor of actors) {
        actor.monster.visible = true
        actor.monster.material.opacity = 1
        actor.monster.position.copy(actor.monsterHome)
        actor.monster.rotation.z = 0
        actor.leaveUntil = 0
      }
    },
    resetVisuals() {
      for (const actor of actors) {
        actor.monster.visible = false
        actor.monster.material.opacity = 1
        actor.monster.position.copy(actor.monsterHome)
        actor.monster.rotation.z = 0
        actor.leaveUntil = 0
        actor.hopUntil = 0
        actor.shakeUntil = 0
      }
      heart.visible = false
    },
    celebrate(id) {
      const actor = actorById(id)
      if (!actor) return
      const t = now()
      actor.hopUntil = t + 0.45
      heart.visible = true
      heart.material.opacity = 1
      heart.position.set(actor.mesh.position.x, actor.homeY + actor.mesh.geometry.parameters.height * 0.35, 0.8)
      heart.userData.baseY = heart.position.y
      heartUntil = t + 0.9
    },
    shake(id) {
      const actor = actorById(id)
      if (!actor) return
      actor.shakeUntil = now() + 0.35
    },
    dismissMonster(id) {
      const actor = actorById(id)
      if (!actor) return Promise.resolve()
      const t = now()
      actor.leaveUntil = t + 1.15
      actor.monster.visible = true
      return new Promise((resolve) => {
        window.setTimeout(resolve, 1150)
      })
    },
    destroy() {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)
      renderer.dispose()
    },
  }
}
