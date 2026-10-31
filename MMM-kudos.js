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
  // Largest delay setInterval/setTimeout can handle (2^31 - 1 ms, ~24.8 days);
  // larger values overflow and make the timer fire immediately.
  maxTimerDelay: 2147483647,
  // A remoteFile load taking longer than this is aborted (ms).
  remoteFileTimeout: 30000,

  // Define required scripts.
  getScripts: function () {
    return ["moment.js"];
  },

  // Define start sequence.
  start: function () {
    Log.info(`Starting module: ${this.name}`);

    this.lastKudoIndex = -1;

    const updateDelay = this.timerDelay("updateInterval", this.config.updateInterval, 1)
      ?? this.defaults.updateInterval;
    setInterval(() => {
      this.updateDom(this.config.fadeSpeed);
    }, updateDelay);

    if (this.config.remoteFile !== null) {
      this.refreshDelay = this.remoteFileRefreshDelay();
      // Not awaited: MagicMirror waits for start() of all modules before it
      // renders anything, so a slow remoteFile must not block start().
      this.reloadKudos(true);
    }
  },

  /**
   * Load `remoteFile` and apply its kudos. If a refresh is configured, the
   * next load is scheduled only after this one has finished, so loads never
   * overlap and an older response can never overwrite a newer one. A failed
   * load (including the initial one) is retried by the next refresh.
   * @param {boolean} redraw whether to redraw immediately when the kudos
   *   changed; otherwise they are shown with the next scheduled update
   * @returns {Promise<void>} resolved when the load is finished
   */
  reloadKudos: async function (redraw) {
    const kudos = await this.loadKudoFile();
    if (kudos && this.setKudos(kudos) && redraw) {
      this.updateDom();
    }
    if (this.refreshDelay !== null) {
      setTimeout(() => this.reloadKudos(false), this.refreshDelay);
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
   *   configured (0) or the configured value is invalid (logged)
   */
  remoteFileRefreshDelay: function () {
    const minutes = this.config.remoteFileRefreshInterval;
    if (minutes === 0) {
      return null;
    }
    return this.timerDelay("remoteFileRefreshInterval", minutes, 60 * 1000);
  },

  /**
   * Convert a configured timer interval to a delay usable by
   * setInterval/setTimeout. Values that are not numbers, or whose delay is
   * below 1 ms or above `maxTimerDelay`, would make the timer fire in a tight
   * loop; they are rejected and logged.
   * @param {string} option name of the config option, for the log message
   * @param {*} value configured value
   * @param {number} unitMs milliseconds per unit of the value
   * @returns {number|null} delay in milliseconds, or null if invalid
   */
  timerDelay: function (option, value, unitMs) {
    const delay = Number.isFinite(value) ? value * unitMs : NaN;
    if (delay >= 1 && delay <= this.maxTimerDelay) {
      return delay;
    }
    const shown = typeof value === "number" ? value : JSON.stringify(value) ?? String(value);
    Log.error(`${this.name}: invalid ${option} ${shown} (expected a number giving a delay from 1 ms to about 24.8 days), ignored`);
    return null;
  },

  /**
   * Generate a random index for a list of kudos.
   * @param {string[]} kudos Array with kudos.
   * @returns {number} a random index of given array
   */
  randomKudoIndex: function (kudos) {
    if (kudos.length === 0) {
      return -1;
    }
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

    const hourMapKey = this.hourMapKey(hour);

    if (hourMapKey > -1) {
      kudos.push(...this.kudoSet(this.config.hourmap[hourMapKey]));
    }

    // Add kudos based on weather
    if (this.currentWeatherType) {
      kudos.push(...this.kudoSet(this.currentWeatherType));
    }

    // Add kudos for anytime
    kudos.push(...this.kudoSet("anytime"));

    // Add kudos for special days
    for (const entry in this.config.kudos) {
      if (this.dateKeyMatches(entry, date)) {
        kudos.push(...this.kudoSet(entry));
      }
    }

    return kudos;
  },

  /**
   * Test whether a kudos key, read as a regular expression, matches a date.
   * Keys that are no valid regular expression never match; each of them is
   * logged once.
   * @param {string} key kudos key, e.g. "....-12-24"
   * @param {string} date date formatted as YYYY-MM-DD
   * @returns {boolean} true if the key matches the date
   */
  dateKeyMatches: function (key, date) {
    try {
      return new RegExp(key).test(date);
    } catch (error) {
      this.invalidDateKeys ??= new Set();
      if (!this.invalidDateKeys.has(key)) {
        this.invalidDateKeys.add(key);
        Log.error(`${this.name}: ignoring kudos key "${key}" for date matching: ${error.message}`);
      }
      return false;
    }
  },

  /**
   * Retrieve one set of kudos by its key. Missing sets, e.g. a set named in
   * the hourmap but not defined in a `remoteFile`, and values that are not
   * arrays are treated as empty sets.
   * @param {string} key name of the kudo set
   * @returns {string[]} the kudos of the set, or an empty array
   */
  kudoSet: function (key) {
    const set = Object.hasOwn(this.config.kudos, key)
      ? this.config.kudos[key]
      : undefined;
    return Array.isArray(set) ? set : [];
  },

  /**
   * Load and parse the kudos file given by `remoteFile` (local path or URL).
   * Never throws: any failure (network error, no response within
   * `remoteFileTimeout`, HTTP error status, invalid
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
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.remoteFileTimeout),
      });
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      const kudos = JSON.parse(await response.text());
      if (kudos === null || typeof kudos !== "object" || Array.isArray(kudos)) {
        throw new Error("content is not a kudos object");
      }
      return kudos;
    } catch (error) {
      const reason = error.name === "TimeoutError"
        ? `no response within ${this.remoteFileTimeout / 1000} s`
        : error.message;
      Log.error(`${this.name}: failed to load remoteFile "${url}": ${reason}`);
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
