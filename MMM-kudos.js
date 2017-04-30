/* global Module */

/* Magic Mirror
 * Module: MMM-kudos
 *
 * By Thomas Mohaupt
 * MIT Licensed.
 */

Module.register("MMM-kudos", {
	defaults: {
		hourmap: {
			0: "night",
			5: "morning",
			11: "lunch",
			15: "afternoon",
			19: "evening",
			23: "night",
		},
		shrinkLimit: 35,
		compliments: {
			anytime: [
				"Und jetzt einen Kaffee!",
				"Dem Kühnen lächeln die Götter zu!",
				"Herkules war auch mal schwach.",
			],
			morning: [
				"Guten Morgen, Sonnenschein!",
				"Genieße den Tag",
				"Gut geschlafen?",
				"Der frühe Vogel ...",
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
				"Schon Feierabend?",
			],
			evening: [
				"Eine Augenweide!",
				"Bettzeit?",
				"Was für ein Tag ...",
				"Es ist ein Genuß dich zu sehen!",
				"Wie war dein Tag?",
				"Meine Augen befinden sich bereits im Zustand seliger Vorfreude!",
			],
			night: [
				"Noch nicht müde?",
				"Nu aber ab ins Bett!",
				"Wird wohl wieder spät heute?",
				"Schlaf schön!",
				"Kannst du nicht schlafen?",
			]
		},
		updateInterval: 30000,
		remoteFile: null,
		fadeSpeed: 4000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		this.lastComplimentIndex = -1;

		if (this.config.remoteFile != null) {
			this.complimentFile((response) => {
				this.config.compliments = JSON.parse(response);
			});
		}

		// Schedule update timer.
		var self = this;
		setInterval(function() {
			self.updateDom(self.config.fadeSpeed);
		}, this.config.updateInterval);
	},

	/* randomIndex(compliments)
	 * Generate a random index for a list of compliments.
	 *
	 * argument compliments Array<String> - Array with compliments.
	 *
	 * return Number - Random index.
	 */
	randomIndex: function(compliments) {
		if (compliments.length === 1) {
			return 0;
		}

		var generate = function() {
			return Math.floor(Math.random() * compliments.length);
		};

		var complimentIndex = generate();

		while (complimentIndex === this.lastComplimentIndex) {
			complimentIndex = generate();
		}

		this.lastComplimentIndex = complimentIndex;

		return complimentIndex;
	},

	/* complimentArray()
	 * Retrieve an array of compliments for the time of the day.
	 *
	 * return compliments Array<String> - Array with compliments for the time of the day.
	 */
	complimentArray: function() {
		var hour = moment().hour();
		var compliments = null;

		var hourkey =  hour
		while (!(hourkey in this.config.hourmap) || hourkey < 0){
			hourkey = hourkey - 1;
		}

		if (hourkey > -1) {
			compliments = this.config.compliments[this.config.hourmap[hourkey]];
		}

		if (typeof compliments === "undefined") {
			compliments = new Array();
		}

		compliments.push.apply(compliments, this.config.compliments.anytime);

		return compliments;

	},

	/* complimentFile(callback)
	 * Retrieve a file from the local filesystem
	 */
	complimentFile: function(callback) {
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open("GET", this.file(this.config.remoteFile), true);
		xobj.onreadystatechange = function() {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	},

	/* complimentArray()
	 * Retrieve a random compliment.
	 *
	 * return compliment string - A compliment.
	 */
	randomCompliment: function() {
		var compliments = this.complimentArray();
		var index = this.randomIndex(compliments);

		return compliments[index];
	},

	// Override dom generator.
	getDom: function() {
		var complimentText = this.randomCompliment();

		var compliment = document.createTextNode(complimentText);
		var wrapper = document.createElement("div");
		if (compliment.length < this.config.shrinkLimit) {
			wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright";
		} else {
			wrapper.className = this.config.shrinkClasses ? this.config.shrinkClasses : "light medium bright";
		}
		wrapper.appendChild(compliment);

		return wrapper;
	},

});
