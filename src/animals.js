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
  { id: "sheep", x: -6.05, feet: -1.05, height: 1.62 },
  { id: "horse", x: -3.45, feet: -0.85, height: 2.05 },
  { id: "cow", x: -0.7, feet: -0.35, height: 1.95 },
  { id: "bunny", x: 2.35, feet: -0.7, height: 1.52 },
  { id: "turkey", x: 4.7, feet: -2.55, height: 1.52 },
  { id: "duck", x: -5.45, feet: -3.05, height: 1.38 },
  { id: "chicken", x: -2.25, feet: -3.2, height: 1.42 },
  { id: "pig", x: 1.05, feet: -2.85, height: 1.48 },
]

export const WINDMILL = {
  x: -5.85,
  feet: 0.15,
  height: 2.55,
  hubFromTop: 0.4,
  bladeSize: 2.35,
}

export const MONSTER_LOOKS = ["monster-lilac", "monster-mint", "monster-butter"]
