/* global Module */

/* Magic Mirror
 * Module: MMM-kudos
 *
 * By Thomas Mohaupt
 * MIT Licensed.
 */

Module.register("MMM-kudos", {
	defaults: {
		kudos: {
			anytime: [
				"Und jetzt einen Kaffee!",
			],
			morning: [
				"Guten Morgen, Sonnenschein!",
			],
			lunch: [
				"Mahlzeit!",
			],
			afternoon: [
				"Schon Feierabend?",
			],
			evening: [
				"Eine Augenweide!",
			],
			night: [
				"Schlaf schön!",
			],
			"....-01-01": ["Gesundes Neues Jahr!", "Neue Vorsätze für das neue Jahr gefasst?"],
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
		random: true,
		shrinkLimit: 35,
		updateInterval: 30000
	},
	lastIndexUsed: -1,
  // Set currentweather from module
	currentWeatherType: "",
	requiresVersion: "2.1.0", // Required version of MagicMirror

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: async function () {
		Log.info(`Starting module: ${this.name}`);

		this.lastKudoIndex = -1;

		if (this.config.remoteFile !== null) {
			const response = await this.loadKudoFile();
			this.config.kudos = JSON.parse(response);
			this.updateDom();
		}

		// set subset at begin of day to same as end of day
		this.config.hourmap[0] = this.config.hourmap[0] ? this.config.hourmap[0] : this.config.hourmap[this.hourKey(24)]

		// Schedule update timer.
		setInterval(() => {
			this.updateDom(this.config.fadeSpeed);
		}, this.config.updateInterval);
	},

	/**
	 * Generate a random index for a list of kudos.
	 * @param {string[]} kudos Array with kudos.
	 * @returns {number} a random index of given array
	 */
	randomIndex: function (kudos) {
		if (kudos.length === 1) {
			return 0;
		}

		const generate = function () {
			return Math.floor(Math.random() * kudos.length);
		};

		let kudoIndex = generate();

		while (kudoIndex === this.lastKudoIndex) {
			kudoIndex = generate();
		}

		this.lastKudoIndex = kudoIndex;

		return kudoIndex;
	},

  hourKey: function(hour) {
		while (!(hour in this.config.hourmap) || hour < 0){
			hour = hour - 1;
		}

		return hour;
	},

	/**
	 * Retrieve an array of kudos for the time of the day.
	 * @returns {string[]} array with kudos for the time of the day.
	 */
	kudoArray: function() {
		const hour = moment().hour();
		const date = moment().format("YYYY-MM-DD");
		let kudos = [];

		var hourkey =  this.hourKey(hour);

		if (hourkey > -1) {
			kudos = [...this.config.kudos[this.config.hourmap[hourkey]]];
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
	 * Retrieve a file from the local filesystem
	 * @returns {Promise} Resolved when the file is loaded
	 */
	loadKudoFile: async function () {
		const isRemote = this.config.remoteFile.indexOf("http://") === 0 || this.config.remoteFile.indexOf("https://") === 0,
			url = isRemote ? this.config.remoteFile : this.file(this.config.remoteFile);
		const response = await fetch(url);
		return await response.text();
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
			index = this.randomIndex(kudos);
		} else {
			// no, sequential
			// if doing sequential, don't fall off the end
			index = this.lastIndexUsed >= kudos.length - 1 ? 0 : ++this.lastIndexUsed;
		}

		return kudos[index] || "";
	},

	// Override dom generator.
	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright pre-line";
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
	notificationReceived: function (notification, payload, sender) {
		if (notification === "CURRENTWEATHER_TYPE") {
			this.currentWeatherType = payload.type;
		}
	}
});
