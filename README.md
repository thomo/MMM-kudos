# MMM-kudos
A MagicMirror² module to display motivational or fun kudos based on the time of day.

This is a module for the [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror/).

MMM-kudos is based on the default compliment module. It displays a random kudo from a predefined set of kudo groups. The used kudo group is build by joining 
- the group for the current hour, 
- the "anytime" group, 
- a weather specific group, and 
- a date specific group. 

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
    - [Weather keys](#weather-keys)
    - [Kudos Configuration Example](#kudos-configuration-example)
- [License](#license)    
- [Changelog](#changelog)    
- [Support](#support)

## Installation

To install this module, add the following configuration block to the `modules` array in your `config/config.js` file. The `position` field determines where the module will appear on the MagicMirror² interface. Refer to the [MagicMirror² configuration documentation](https://docs.magicmirror.builders/modules/configuration.html) for possible values.

```js
{
    module: 'MMM-kudos',
    position: "middle_center", // see https://docs.magicmirror.builders/modules/configuration.html for possible values
    config: {
        // See below for configurable options
    }
}
```

## Configuration

| Option           | Description |
|----------------- |-------------|
| `classes`        | *Optional* CSS classes used to style the kudo. Example: `"bright large"`.|
| `fadeSpeed`      | Speed of the update animation. (Milliseconds) <br><br> **Possible values:** `0` - `5000` <br> **Default value:** `4000` (4 seconds)|
| `hourmap`        | A map defining the start hours for different kudos sets. A set is valid starting at the given hour until the next defined hour, the last hour will be valid until the first.<br><br> Example: `{ 5: "morning", 11: "lunch", 18: "evening" }` means: <br> - the "morning" set will be used from 5-11,<br> - the "lunch" from 11-18, and<br> - the "evening" from 18-5.|
| `kudos`	         | The list of kudos. <br><br> **Possible values:** An object with arrays - the keys are defined in the values of the _hourmap object_ plus the default array `anytime`, weather names, and regex dates. See [Kudos Configuration Example](#kudos-configuration-example). <br><br> **Default value:** [MMM-kudos.js](MMM-kudos.js).|
| `random`         | Choose kudo randomly (`true`) or sequential (`false`).<br> <br> **Default value:** `true`|
| `remoteFile`     | External file from which to load the kudos. <br><br> **Possible values:** Path or URL (starting with http:// or https://) to a JSON file containing kudos, structured as per the _kudos configuration_.<br> **Default value:** `null` (Do not load from file)|
| `remoteFileRefreshInterval` | How often to reload the remote file, if remoteFile is specified. (minutes)<br><br> **Default value:** `0` (no refresh)<br>**Minimum value:** `15` |
| `shrinkLimit`    | The kudo length at which a smaller font is used to display the kudo. Example: `35`.|
| `shrinkClasses`  | *Optional* CSS classes used to style the shrunk kudo. Example: `"small dimmed"`.|
| `updateInterval` | Defines how often the kudo changes. (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `30000` (30 seconds)|

### Weather keys

To define weather specific kudos, define arrays with these keys:
- `day_sunny`
- `day_cloudy`
- `cloudy`
- `cloudy_windy`
- `showers`
- `rain`
- `thunderstorm`
- `snow`
- `fog`
- `night_clear`
- `night_cloudy`
- `night_showers`
- `night_rain`
- `night_thunderstorm`
- `night_snow`
- `night_alt_cloudy_windy`

### Kudos Configuration Example
Below is an example of how to configure the `kudos` object. It defines 5 time ranges: morning (5-11), lunch (11-15), afternoon (15-19), evening (19-23), and night (23-5). For each time range an array of kudos are defined which are used in this range. The default array `anytime` is used additional in each time range. Also the on 1st Jan, 4th May and 6th Dec some special kudos are selected. 

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
      "Wow, you look great!",
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
    "....-..-01": [
        "Turn over the calendar page"
    ],
    "....-01-01": [
        "Happy New Year"
    ],
    "....-05-04": [
        "May the force be with you",
    ],
    "....-12-06": [
        "Dont forget to 'Buy ThoMo a coffee'",
    ],
  },
  updateInterval: 30000,
  remoteFile: null,
  fadeSpeed: 4000,
},
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG.md](CHANGELOG.md) file.

## Support
Like this module? Keep me awake and coding — buy me a coffee ☕️.

<a href="https://www.buymeacoffee.com/thomo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
