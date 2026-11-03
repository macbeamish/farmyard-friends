export const ANIMALS = [
  { id: "cow", name: "cow", sound: "moo" },
  { id: "pig", name: "pig", sound: "oink" },
  { id: "duck", name: "duck", sound: "quack" },
  { id: "horse", name: "horse", sound: "neigh" },
  { id: "bunny", name: "bunny", sound: "squeak" },
  { id: "chicken", name: "chicken", sound: "cluck" },
  { id: "turkey", name: "turkey", sound: "gobble" },
  { id: "sheep", name: "sheep", sound: "baa" },
]

// Feet sit on the grass in a 16 by 9 world, origin at the center.
// Back row is higher on the hill; front row is closer to the camera.
export const LAYOUT = [
  { id: "sheep", x: -4.95, feet: -1.22, height: 1.72 },
  { id: "horse", x: -3.15, feet: -1.05, height: 2.15 },
  { id: "cow", x: -0.45, feet: -0.62, height: 2.05 },
  { id: "bunny", x: 2.35, feet: -0.95, height: 1.62 },
  { id: "turkey", x: 3.85, feet: -2.35, height: 1.72 },
  { id: "duck", x: -4.35, feet: -2.72, height: 1.48 },
  { id: "chicken", x: -1.55, feet: -2.95, height: 1.52 },
  { id: "pig", x: 1.85, feet: -2.55, height: 1.58 },
]

export const WINDMILL = {
  x: -5.85,
  feet: 0.15,
  height: 2.55,
  hubFromTop: 0.4,
  bladeSize: 2.35,
}

export const MONSTER_LOOKS = ["monster-lilac", "monster-mint", "monster-butter"]
