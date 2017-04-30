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
			 5: "morning",
			11: "lunch",
			15: "afternoon",
			19: "evening",
			23: "night",
		},
		shrinkLimit: 35,
		kudos: {
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
				"Meine Augen befinden sich bereits im Zustand seeliger Vorfreude!",
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

		this.lastKudoIndex = -1;

		if (this.config.remoteFile != null) {
			this.kudoFile((response) => {
				this.config.kudos = JSON.parse(response);
			});
		}

		// set subset at begin of day to same as end of day
		this.config.hourmap[0] = this.config.hourmap[0] ? this.config.hourmap[0] : this.config.hourmap[this.hourKey(24)]

		// Schedule update timer.
		var self = this;
		setInterval(function() {
			self.updateDom(self.config.fadeSpeed);
		}, this.config.updateInterval);
	},

	/* randomIndex(kudos)
	 * Generate a random index for a list of kudos.
	 *
	 * argument kudos Array<String> - Array with kudos.
	 *
	 * return Number - Random index.
	 */
	randomIndex: function(kudos) {
		if (kudos.length === 1) {
			return 0;
		}

		var generate = function() {
			return Math.floor(Math.random() * kudos.length);
		};

		var kudoIndex = generate();

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

	/* kudoArray()
	 * Retrieve an array of kudos for the time of the day.
	 *
	 * return kudos Array<String> - Array with kudos for the time of the day.
	 */
	kudoArray: function() {
		var hour = moment().hour();
		var kudos = new Array();

		var hourkey =  this.hourKey(hour);

		if (hourkey > -1) {
			kudos.push.apply(kudos, this.config.kudos[this.config.hourmap[hourkey]]);
		}

		kudos.push.apply(kudos, this.config.kudos.anytime);

		return kudos;
	},

	/* kudoFile(callback)
	 * Retrieve a file from the local filesystem
	 */
	kudoFile: function(callback) {
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

	/* kudoArray()
	 * Retrieve a random kudo.
	 *
	 * return kudo string - A kudo.
	 */
	randomKudo: function() {
		var kudos = this.kudoArray();
		var index = this.randomIndex(kudos);

		return kudos[index];
	},

	// Override dom generator.
	getDom: function() {
		var kudoText = this.randomKudo();

		var kudo = document.createTextNode(kudoText);
		var wrapper = document.createElement("div");
		if (kudo.length < this.config.shrinkLimit) {
			wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright";
		} else {
			wrapper.className = this.config.shrinkClasses ? this.config.shrinkClasses : "light medium bright";
		}
		wrapper.appendChild(kudo);

		return wrapper;
	},

});
