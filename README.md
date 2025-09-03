# MMM-kudos
A MagicMirror² module to display motivational or fun kudos based on the time of day.

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

MMM-kudos is based on the default compliment module. It displays a kudo from a predefined set, with the ability to customize which kudos are shown based on the current hour. You can also define day specific set of messages, e.g. to remember special dates.

## Table of Contents
1. [Using the Module](#using-the-module)
2. [Configuration Options](#configuration-options)
3. [Kudos Configuration Example](#kudos-configuration-example)
4. [Additional Information](#additional-information)

## Using the Module

To use this module, add the following configuration block to the `modules` array in your `config/config.js` file. The `position` field determines where the module will appear on the MagicMirror² interface. Refer to the [MagicMirror² configuration documentation](https://docs.magicmirror.builders/modules/configuration.html) for possible values.
```js
var config = {
    modules: [
        {
            module: 'MMM-kudos',
            position: "middle_center", // see https://docs.magicmirror.builders/modules/configuration.html for possible values
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
| `hourmap`        | A map defining the start hours for different kudos sets. A set is valid starting at the given hour until the next defined hour, the last hour will be valid until the first.<br> Example: `{ 5: "morning", 11: "lunch", 18: "evening" }` means: <br> - the "morning" set will be used from 5-11,<br> - the "lunch" from 11-18, and<br> - the "evening" from 18-5.
| `shrinkLimit`    | The character length at which a smaller font is used to display the kudo. Example: `35`.
| `classes`        | *Optional* CSS classes used to style the kudo. Example: `"bright large"`.
| `shrinkClasses`  | *Optional* CSS classes used to style the shrunk kudo. Example: `"small dimmed"`.
| `updateInterval` | Defines how often the kudo changes. (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `30000` (30 seconds)
| `fadeSpeed`      | Speed of the update animation. (Milliseconds) <br><br> **Possible values:** `0` - `5000` <br> **Default value:** `4000` (4 seconds)
| `kudos`	         | The list of kudos. <br><br> **Possible values:** An object with arrays - the names are defined in the values of the _hourmap object_ plus the default array `anytime`. See [Kudos Configuration Example](#kudos-configuration-example). <br> **Default value:** See [Kudos Configuration Example](#kudos-configuration-example).
| `remoteFile`     | External file from which to load the kudos. <br><br> **Possible values:** Path to a JSON file containing kudos, structured as per the _kudos configuration_.<br> **Default value:** `null` (Do not load from file)


### Kudos Configuration Example
Below is an example of how to configure the `kudos` object:

```js
config: {
  hourmap: {
     5: "morning",
    11: "lunch",
    15: "afternoon",
    19: "evening",
    23: "night",
  },
  shrinkLimit: 35,
  kudos: {
    anytime: [
      "Time for a coffee break!",
      "Fortune favors the bold!",
      "Even Hercules had his off days.",
    ],
    morning: [
      "Good morning, sunshine!",
      "Make the most of your day!",
      "Did you sleep well?",
      "The early bird catches the worm...",
    ],
    lunch: [
      "Lunch time!",
      "What's on the menu?",
      "Who's cooking today?",
      "Time for a power nap?",
    ],
    afternoon: [
      "Wow, looking sharp!",
      "You're glowing today!",
      "Today is your day!",
      "Clocking out already?",
    ],
    evening: [
      "A sight for sore eyes!",
      "Is it bedtime yet?",
      "What a day it's been...",
      "It's a delight to see you!",
      "How was your day?",
      "My eyes are already in a state of blissful anticipation!",
    ],
    night: [
      "Not tired yet?",
      "Time to hit the hay!",
      "Burning the midnight oil again?",
      "Sleep tight!",
      "Having trouble sleeping?",
    ],
    "....-01-01": [
        "Happy New Year"
    ],
    "....-06-30": [
        "Happy Birthday",
    ],
    "....-12-06": [
        "Dont forget to 'Buy ThoMo a coffee'",
    ],
  },
  updateInterval: 30000,
  remoteFile: null,
  fadeSpeed: 4000
}
```

## Support
Like this module? Keep me awake and coding — buy me a coffee ☕️.

<a href="https://www.buymeacoffee.com/thomo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
