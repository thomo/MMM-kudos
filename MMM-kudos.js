/* Magic Mirror
 * Module: MMM-kudos
 *
 * By Thomas Mohaupt
 * MIT Licensed.
 */

Module.register("MMM-kudos", {
  defaults: {
    kudos: {
      "anytime": ["Und jetzt einen Kaffee!"],
      "morning": ["Guten Morgen, Sonnenschein!"],
      "lunch": ["Mahlzeit!"],
      "afternoon": ["Schon Feierabend?"],
      "evening": ["Eine Augenweide!"],
      "night": ["Schlaf schön!"],
      "....-01-01": [
        "Gesundes Neues Jahr!",
        "Neue Vorsätze für das neue Jahr gefasst?",
      ],
    },
    fadeSpeed: 4000,
    hourmap: {
      5: "morning",
      11: "lunch",
      15: "afternoon",
      19: "evening",
      23: "night",
    },
    remoteFile: null,
    // minutes; 0 = no refresh
    remoteFileRefreshInterval: 0,
    random: true,
    shrinkLimit: 35,
    updateInterval: 30000,
  },
  lastIndexUsed: -1,
  // Set currentweather from module
  currentWeatherType: "",
  requiresVersion: "2.1.0", // Required version of MagicMirror

  // Define required scripts.
  getScripts: function () {
    return ["moment.js"];
  },

  // Define start sequence.
  start: async function () {
    Log.info(`Starting module: ${this.name}`);

    this.lastKudoIndex = -1;

    // Schedule update timer first, so the module keeps rotating kudos
    // regardless of what happens while loading the remote file.
    setInterval(() => {
      this.updateDom(this.config.fadeSpeed);
    }, this.config.updateInterval);

    if (this.config.remoteFile !== null) {
      // Schedule the refresh before the initial load, so a failed initial
      // load is retried by the refresh.
      const refreshDelay = this.remoteFileRefreshDelay();
      if (refreshDelay !== null) {
        setInterval(async () => {
          // the new kudos are shown with the next scheduled update
          const kudos = await this.loadKudoFile();
          if (kudos) {
            this.setKudos(kudos);
          }
        }, refreshDelay);
      }

      const kudos = await this.loadKudoFile();
      if (kudos && this.setKudos(kudos)) {
        this.updateDom();
      }
    }
  },

  /**
   * Replace the kudos, if they differ from the current ones. Resets the
   * random and sequential positions, as they refer to the old kudo list.
   * @param {object} kudos the new kudos object
   * @returns {boolean} true if the kudos were replaced
   */
  setKudos: function (kudos) {
    if (JSON.stringify(this.config.kudos) === JSON.stringify(kudos)) {
      return false;
    }
    this.config.kudos = kudos;
    this.lastIndexUsed = -1;
    this.lastKudoIndex = -1;
    return true;
  },

  /**
   * Delay between two reloads of `remoteFile`, derived from
   * `remoteFileRefreshInterval` (minutes).
   * @returns {number|null} delay in milliseconds, or null if no refresh is
   *   configured (0) or the configured value is not a positive number
   */
  remoteFileRefreshDelay: function () {
    const minutes = this.config.remoteFileRefreshInterval;
    if (minutes === 0) {
      return null;
    }
    if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 0) {
      Log.error(`${this.name}: invalid remoteFileRefreshInterval "${minutes}" (expected minutes as a positive number), refresh disabled`);
      return null;
    }
    return minutes * 60 * 1000;
  },

  /**
   * Generate a random index for a list of kudos.
   * @param {string[]} kudos Array with kudos.
   * @returns {number} a random index of given array
   */
  randomKudoIndex: function (kudos) {
    if (kudos.length === 1) {
      return 0;
    }

    const generate = function () {
      return Math.floor(Math.random() * kudos.length);
    };

    let kudoIndex;

    do {
      kudoIndex = generate();
    } while (kudoIndex === this.lastKudoIndex);

    this.lastKudoIndex = kudoIndex;

    return kudoIndex;
  },

  hourMapKey: function (hour) {
    if (this.config.hourmap == null
      || Object.keys(this.config.hourmap).length === 0
    ) {
      return -1;
    }

    while (!(hour in this.config.hourmap) && hour > -1) {
      hour = hour - 1;
    }

    return hour < 0 ? this.hourMapKey(24) : hour;
  },

  /**
   * Retrieve an array of kudos for the time of the day.
   * @returns {string[]} array with kudos for the time of the day.
   */
  kudoArray: function () {
    const now = moment();
    const hour = now.hour();
    const date = now.format("YYYY-MM-DD");
    let kudos = [];

    var hourMapKey = this.hourMapKey(hour);

    if (hourMapKey > -1) {
      kudos = [...this.config.kudos[this.config.hourmap[hourMapKey]]];
    }

    // Add kudos based on weather
    if (this.currentWeatherType in this.config.kudos) {
      Array.prototype.push.apply(kudos, this.config.kudos[this.currentWeatherType]);
    }

    // Add kudos for anytime
    Array.prototype.push.apply(kudos, this.config.kudos.anytime);

    // Add kudos for special days
    for (let entry in this.config.kudos) {
      if (new RegExp(entry).test(date)) {
        Array.prototype.push.apply(kudos, this.config.kudos[entry]);
      }
    }

    return kudos;
  },

  /**
   * Load and parse the kudos file given by `remoteFile` (local path or URL).
   * Never throws: any failure (network error, HTTP error status, invalid
   * JSON, JSON that is not an object) is logged and reported as `null`.
   * @returns {Promise<object|null>} the parsed kudos object, or null on failure
   */
  loadKudoFile: async function () {
    const isRemote = this.config.remoteFile.indexOf("http://") === 0
      || this.config.remoteFile.indexOf("https://") === 0;
    const url = isRemote
      ? this.config.remoteFile
      : this.file(this.config.remoteFile);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      const kudos = JSON.parse(await response.text());
      if (kudos === null || typeof kudos !== "object" || Array.isArray(kudos)) {
        throw new Error("content is not a kudos object");
      }
      return kudos;
    } catch (error) {
      Log.error(`${this.name}: failed to load remoteFile "${url}": ${error.message}`);
      return null;
    }
  },

  /**
   * Retrieve a random kudo.
   * @returns {string} a kudo
   */
  getRandomKudo: function () {
    // get the current time of day kudos list
    const kudos = this.kudoArray();
    // variable for index to next message to display
    let index;
    // are we randomizing
    if (this.config.random) {
      // yes
      index = this.randomKudoIndex(kudos);
    } else {
      // no, sequential
      // if doing sequential, don't fall off the end
      index = this.lastIndexUsed >= kudos.length - 1 ? 0 : ++this.lastIndexUsed;
    }

    return kudos[index] || "";
  },

  // Override dom generator.
  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = this.config.classes
      ? this.config.classes
      : "thin xlarge bright pre-line";
    // get the kudo text
    const kudoText = this.getRandomKudo();
    // split it into parts on newline text
    const parts = kudoText.split("\n");
    // create a span to hold the kudo
    const kudo = document.createElement("span");
    // process all the parts of the kudo text
    for (const part of parts) {
      if (part !== "") {
        // create a text element for each part
        kudo.appendChild(document.createTextNode(part));
        // add a break
        kudo.appendChild(document.createElement("BR"));
      }
    }
    // only add kudo to wrapper if there is actual text in there
    if (kudo.children.length > 0) {
      // remove the last break
      kudo.lastElementChild.remove();
      wrapper.appendChild(kudo);
    }

    return wrapper;
  },

  // Override notification handler.
  notificationReceived: function (notification, payload) {
    if (notification === "CURRENTWEATHER_TYPE") {
      this.currentWeatherType = payload.type;
    }
  },
});
