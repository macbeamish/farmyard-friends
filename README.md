# Farmyard Friends

A gentle English-learning game for young children. A narrator with a mild British accent asks the player to find animals, match their sounds, and save them from soft pillow monsters.

The farm is a flat picture. The windmill sails turn, and the animals blink and sway.

## How to play

Each round has a written title and a short instruction in English and Russian. The Play and Hear it again buttons are labelled in both languages. The narrator only asks the question.

1. **Find the Animals — Найди животных.** “Where is the … sheep?” A correct choice is answered with “Yes. It's a … sheep.”
2. **Animal Sounds — Звуки животных.** “Which animal says …” and then the animal's own call. For the bunny, the narrator asks “Which animal goes hop hop?”
3. **Memory Game — Игра на память.** One card shows the animal. The other shows its written name, and the narrator says that name. A correct pair is answered with “Good job.”
4. **Save the Animals — Спаси животных.** “Save the sheep.” A correct choice is answered with “Well done,” “Good job,” “Yes!” or “Great.” That monster waves and floats home.

A **Next round** button on the left skips ahead. If it is left alone, the rounds continue as usual. The game is laid out for a tablet held sideways.

There is no score to lose and no scary pictures. A wrong tap on the farm just shakes, then the question plays again. You can tap an animal while the question is still playing. In the memory game, a wrong pair stays face up until the next card is clicked.

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
- Horse: “Segregation of information about emotional arousal and valence in horse whinnies” by Briefer, Maigrot, Mandel, Freymond, Bachmann, and Hillmann, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), Wikimedia Commons.
- Sheep: “Sheep bleating” by earthcalling, public domain, Wikimedia Commons.
- Chicken: “Hen announcing she's lain an egg” by alys, public domain, Wikimedia Commons.
- Turkey: “Gobbler” by bod, public domain, Wikimedia Commons.
