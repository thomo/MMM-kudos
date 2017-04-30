# MMM-kudos

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

The module is based on the default compliment module. MMM-kudos displays a kudo out of a set of predefined ones. Depending on the current hour the used kudo set can be defined.

## Using the module

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: 'MMM-kudos',
            position: "middle_center", // see https://github.com/MichMich/MagicMirror#configuration for possible values
            config: {
                // See below for configurable options
            }
        }
    ]
}
```

## Configuration options

| Option           | Description
|----------------- |-----------
| `hourmap`        | A map which defines the start hours of kudos sets.
| `shrinkLimit`    | Length of kudo at which a smaller font is used to display it.
| `classes`        | *Optional* CSS classes used to display the kudo.
| `shrinkClasses`  | *Optional* CSS classes used to shrink the kudo.
| `updateInterval` | How often does the compliment have to change? (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `30000` (30 seconds)
| `fadeSpeed`      | Speed of the update animation. (Milliseconds) <br><br> **Possible values:**`0` - `5000` <br> **Default value:** `4000` (4 seconds)
| `compliments`	   | The list of compliments. <br><br> **Possible values:** An object with four arrays: `morning`, `afternoon`, `evening` and `anytime`. See _compliment configuration_ below. <br> **Default value:** See _compliment configuration_ below.
| `remoteFile`     | External file from which to load the compliments <br><br> **Possible values:** Path to a JSON file containing compliments, configured as per the value of the _compliments configuration_ (see below). An object with four arrays: `morning`, `afternoon`, `evening` and `anytime`. - `compliments.json` <br> **Default value:** `null` (Do not load from file)


````javascript
config: {
    hourmap: {
        0: "night",
        5: "morning",
        11: "lunch",
        15: "afternoon",
        19: "evening",
        23: "night",
    },
    compliments: {
        anytime: [
            "Und jetzt einen Kaffee!",
        ],
        morning: [
            "Guten Morgen, Sonnenschein!",
            "Genieße den Tag",
            "Gut geschlafen?",
            "Der frühe Vogel ..."
        ],
        lunch: [
            "Mahlzeit!",
            "Gibt's was zu Essen?",
            "Wer kocht heute?",
            "Mittagsschlaf?",
        ],
        afternoon: [
            "Wow, sexy!",
            "Du siehst gut aus!",
            "Heute ist Dein Tag!",
            "Schon Feierabend?"
        ],
        evening: [
            "Eine Augenweide!",
            "Bettzeit?",
            "Was für ein Tag ...",
            "Es ist ein Genuß dich zu sehen!",
            "Wie war dein Tag?"
        ],
        night: [
            'Noch nicht müde?',
            'Nu aber ab ins Bett!',
            'Wird wohl wieder spät heute?',
            'Schlaf schön!',
            "Kannst du nicht schlafen?",
        ]
    },
}
````
