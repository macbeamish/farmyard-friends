# Farmyard Friends

A gentle English-learning game for young children. A narrator with a mild British accent asks the player to find animals, match their sounds, and save them from soft pillow monsters.

The farm is a flat picture. The windmill sails turn, and the animals blink and sway.

## How to play

1. **Find the animals.** The round starts straight away: “Find the sheep.” A correct choice is answered with “Yes. It's a sheep.”
2. **Animal sounds.** The round plays the animal's own call. For the bunny, the narrator asks “Which animal goes hop hop?” A correct choice is answered with “Yes. It's a pig.”
3. **Memory match.** Flip cards. One card shows the animal. The other shows its written name, and the narrator says that name. Match all eight pairs.
4. **Save the animals.** Little pillow monsters float beside the animals. They are in the way, not fighting. The round starts with “Save the sheep.” That monster waves and floats home. When every animal is safe, the animals win.

There is no score to lose and no scary pictures. On the farm, a wrong tap gets “Not that one. Have another try.” You can tap an animal while the question is still playing. In the memory game, a wrong pair shakes and turns back down, with no extra spoken line.

## Run it

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

## Put it on Netlify

Build command: `npm run build`  
Publish directory: `dist`

`netlify.toml` already has those settings. Connect the GitHub repository and Netlify will pick them up.

## Animals

Cow (moo), pig (oink), duck (quack), horse (neigh), bunny (hop hop), chicken (cluck), turkey (gobble), sheep (baa).

Round 2 plays a short real animal call. The bunny question is spoken instead. Each call is a trimmed excerpt:

- Cow: “Single Cow Moo” by MichaeltheFox8621, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), Wikimedia Commons.
- Pig: “Mudchute pig 1” by Secretlondon, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), Wikimedia Commons.
- Duck: “Anas platyrhynchos - Mallard - XC62258” by Jonathon Jongsma, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), Wikimedia Commons.
- Horse: “Wiehern” by Hü, public domain, Wikimedia Commons.
- Sheep: “Sheep bleating” by earthcalling, public domain, Wikimedia Commons.
- Chicken: “Hen announcing she's lain an egg” by alys, public domain, Wikimedia Commons.
- Turkey: “Gobbler” by bod, public domain, Wikimedia Commons.
