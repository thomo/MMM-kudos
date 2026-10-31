const Module = {
  register: jest.fn()
};

global.Module = Module;
global.Log = { info: jest.fn(), error: jest.fn() };
global.moment = require("moment");

require("../MMM-kudos.js");
const moduleInstance = Module.register.mock.calls[0][1];

/**
 * Build a minimal fetch Response stand-in.
 * @param {string} body response body
 * @param {object} [options] response options
 * @param {boolean} [options.ok] whether the response is successful
 * @param {number} [options.status] HTTP status code
 * @returns {object} object mimicking a fetch Response
 */
const mockResponse = (body, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  text: jest.fn().mockResolvedValue(body),
});

describe("MMM-kudos", () => {
  let instance;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    instance = Object.assign({}, moduleInstance);
    instance.name = "MMM-kudos";
    instance.file = jest.fn(file => `modules/MMM-kudos/${file}`);
    instance.updateDom = jest.fn();
    instance.config = JSON.parse(JSON.stringify(moduleInstance.defaults));
    instance.config.hourmap = {
      5: ["first morning kudo"],
      20: ["first night kudo"]
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  describe("defaults", () => {
    test("remoteFileRefreshInterval defaults to 0 (no refresh)", () => {
      expect(moduleInstance.defaults.remoteFileRefreshInterval).toBe(0);
    });
  });

  describe("hourMapKey", () => {
    test("hourMapKey - when hourmap is undefined", () => {
      instance.config.hourmap = null;
      expect(instance.hourMapKey(6)).toBe(-1);
    });

    test("hourMapKey - when hourmap is empty", () => {
      instance.config.hourmap = {};
      expect(instance.hourMapKey(6)).toBe(-1);
    });

    test("hourMapKey - when current hour is after first defined hour", () => {
      expect(instance.hourMapKey(6)).toBe(5);
    });

    test("hourMapKey - when hour is equal to exact defined hour", () => {
      expect(instance.hourMapKey(20)).toBe(20);
    });

    test("hourMapKey - when hour is bigger than last defined hour", () => {
      expect(instance.hourMapKey(22)).toBe(20);
    });

    test("hourMapKey - when hour when it is before first defined hour", () => {
      expect(instance.hourMapKey(3)).toBe(20);
    });
  });

  describe("randomKudoIndex", () => {
    test("randomKudoIndex - returns 0 for single item array", () => {
      expect(instance.randomKudoIndex(["single"])).toBe(0);
      expect(instance.randomKudoIndex(["single"])).toBe(0);
    });

    test("randomKudoIndex - multiple calls", () => {
      const kudos = ["one", "two", "three"];
      const firstIndex = instance.randomKudoIndex(kudos);
      const secondIndex = instance.randomKudoIndex(kudos);
      expect(secondIndex).not.toBe(firstIndex);
    });

    test("randomKudoIndex - returns -1 for an empty array without hanging", () => {
      instance.lastKudoIndex = 0;
      expect(instance.randomKudoIndex([])).toBe(-1);
    });
  });

  describe("kudoArray", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // 2026-10-31 11:30 local time -> hourmap key 11 ("lunch")
      jest.setSystemTime(new Date(2026, 9, 31, 11, 30));
      instance.config.hourmap = { 5: "morning", 11: "lunch" };
    });

    test("kudoArray - combines hour, weather, anytime and date kudos", () => {
      instance.currentWeatherType = "rain";
      instance.config.kudos = {
        "morning": ["morning kudo"],
        "lunch": ["lunch kudo"],
        "rain": ["rain kudo"],
        "anytime": ["anytime kudo"],
        "....-10-31": ["halloween kudo"],
        "....-12-24": ["christmas kudo"],
      };

      expect(instance.kudoArray()).toEqual([
        "lunch kudo",
        "rain kudo",
        "anytime kudo",
        "halloween kudo",
      ]);
    });

    test("kudoArray - set from hourmap missing in kudos does not throw", () => {
      instance.config.kudos = { anytime: ["anytime kudo"] };

      expect(instance.kudoArray()).toEqual(["anytime kudo"]);
    });

    test("kudoArray - non-array sets are ignored", () => {
      instance.currentWeatherType = "rain";
      instance.config.kudos = {
        "lunch": "not an array",
        "rain": { text: "not an array" },
        "anytime": null,
        "....-10-31": 5,
      };

      expect(instance.kudoArray()).toEqual([]);
    });

    test("kudoArray - invalid regex keys are skipped and logged once", () => {
      instance.config.kudos = {
        "(birthday": ["never matches"],
        "anytime": ["anytime kudo"],
        "....-10-31": ["halloween kudo"],
      };

      expect(instance.kudoArray()).toEqual(["anytime kudo", "halloween kudo"]);
      expect(instance.kudoArray()).toEqual(["anytime kudo", "halloween kudo"]);
      expect(Log.error).toHaveBeenCalledTimes(1);
      expect(Log.error).toHaveBeenCalledWith(expect.stringContaining("(birthday"));
    });

    test("kudoArray - does not mutate the configured sets", () => {
      instance.config.kudos = {
        lunch: ["lunch kudo"],
        anytime: ["anytime kudo"],
      };

      instance.kudoArray();

      expect(instance.config.kudos.lunch).toEqual(["lunch kudo"]);
    });
  });

  describe("getRandomKudo", () => {
    beforeEach(() => {
      instance.config.hourmap = {};
      instance.config.kudos = { anytime: [] };
    });

    test("getRandomKudo - random mode returns empty string for no kudos", () => {
      instance.config.random = true;
      instance.lastKudoIndex = 0;
      expect(instance.getRandomKudo()).toBe("");
    });

    test("getRandomKudo - sequential mode returns empty string for no kudos", () => {
      instance.config.random = false;
      expect(instance.getRandomKudo()).toBe("");
    });
  });

  describe("loadKudoFile", () => {
    const kudos = { anytime: ["remote kudo"] };

    test("loadKudoFile - resolves a local path via this.file", async () => {
      instance.config.remoteFile = "kudos.json";
      global.fetch.mockResolvedValue(mockResponse(JSON.stringify(kudos)));

      await expect(instance.loadKudoFile()).resolves.toEqual(kudos);
      expect(instance.file).toHaveBeenCalledWith("kudos.json");
      expect(global.fetch).toHaveBeenCalledWith("modules/MMM-kudos/kudos.json");
    });

    test("loadKudoFile - uses http(s) URLs as is", async () => {
      instance.config.remoteFile = "https://example.com/kudos.json";
      global.fetch.mockResolvedValue(mockResponse(JSON.stringify(kudos)));

      await expect(instance.loadKudoFile()).resolves.toEqual(kudos);
      expect(instance.file).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith("https://example.com/kudos.json");
    });

    test("loadKudoFile - returns null and logs when fetch rejects", async () => {
      instance.config.remoteFile = "https://example.com/kudos.json";
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(instance.loadKudoFile()).resolves.toBeNull();
      expect(Log.error).toHaveBeenCalledTimes(1);
    });

    test("loadKudoFile - returns null and logs on HTTP error status", async () => {
      instance.config.remoteFile = "https://example.com/kudos.json";
      global.fetch.mockResolvedValue(
        mockResponse("<html>Not Found</html>", { ok: false, status: 404 })
      );

      await expect(instance.loadKudoFile()).resolves.toBeNull();
      expect(Log.error).toHaveBeenCalledWith(expect.stringContaining("404"));
    });

    test("loadKudoFile - returns null and logs on invalid JSON", async () => {
      instance.config.remoteFile = "kudos.json";
      global.fetch.mockResolvedValue(mockResponse("{ not json"));

      await expect(instance.loadKudoFile()).resolves.toBeNull();
      expect(Log.error).toHaveBeenCalledTimes(1);
    });

    test("loadKudoFile - returns null and logs when JSON is not an object", async () => {
      instance.config.remoteFile = "kudos.json";
      global.fetch.mockResolvedValue(mockResponse("[\"just\", \"an\", \"array\"]"));

      await expect(instance.loadKudoFile()).resolves.toBeNull();
      expect(Log.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("remoteFileRefreshDelay", () => {
    test("remoteFileRefreshDelay - 0 means no refresh", () => {
      instance.config.remoteFileRefreshInterval = 0;
      expect(instance.remoteFileRefreshDelay()).toBeNull();
      expect(Log.error).not.toHaveBeenCalled();
    });

    test.each([
      [15, 15 * 60 * 1000],
      [1, 60 * 1000],
      [0.5, 30 * 1000],
    ])("remoteFileRefreshDelay - %p minutes are used as is (no minimum)", (minutes, expected) => {
      instance.config.remoteFileRefreshInterval = minutes;
      expect(instance.remoteFileRefreshDelay()).toBe(expected);
    });

    test.each([
      ["30min"],
      ["30"],
      [undefined],
      [null],
      [-5],
      [NaN],
      [Infinity],
      [{}],
    ])("remoteFileRefreshDelay - invalid value %p disables refresh and logs", (value) => {
      instance.config.remoteFileRefreshInterval = value;
      expect(instance.remoteFileRefreshDelay()).toBeNull();
      expect(Log.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("start", () => {
    const kudos = { anytime: ["remote kudo"] };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(global, "setInterval");
    });

    const delays = () => setInterval.mock.calls.map(call => call[1]);

    test("start - without remoteFile only the update timer is scheduled", async () => {
      await instance.start();

      expect(delays()).toEqual([instance.config.updateInterval]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("start - remoteFile without refresh interval loads once, no refresh timer", async () => {
      instance.config.remoteFile = "kudos.json";
      global.fetch.mockResolvedValue(mockResponse(JSON.stringify(kudos)));

      await instance.start();

      expect(delays()).toEqual([instance.config.updateInterval]);
      expect(instance.config.kudos).toEqual(kudos);
      expect(instance.updateDom).toHaveBeenCalledTimes(1);
    });

    test("start - every scheduled delay is a finite positive number", async () => {
      instance.config.remoteFile = "kudos.json";
      instance.config.remoteFileRefreshInterval = 20;
      global.fetch.mockResolvedValue(mockResponse(JSON.stringify(kudos)));

      await instance.start();

      expect(delays()).toEqual([instance.config.updateInterval, 20 * 60 * 1000]);
      for (const delay of delays()) {
        expect(Number.isFinite(delay) && delay > 0).toBe(true);
      }
    });

    test("start - invalid refresh interval schedules no refresh timer", async () => {
      instance.config.remoteFile = "kudos.json";
      instance.config.remoteFileRefreshInterval = "30min";
      global.fetch.mockResolvedValue(mockResponse(JSON.stringify(kudos)));

      await instance.start();

      expect(delays()).toEqual([instance.config.updateInterval]);
    });

    test("start - failed initial load keeps defaults and still schedules timers", async () => {
      const defaultKudos = instance.config.kudos;
      instance.config.remoteFile = "https://example.com/kudos.json";
      instance.config.remoteFileRefreshInterval = 1;
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(instance.start()).resolves.toBeUndefined();

      expect(delays()).toEqual([instance.config.updateInterval, 60 * 1000]);
      expect(instance.config.kudos).toBe(defaultKudos);
      expect(instance.updateDom).not.toHaveBeenCalled();
    });

    test("start - refresh retries after a failed initial load", async () => {
      instance.config.remoteFile = "https://example.com/kudos.json";
      instance.config.remoteFileRefreshInterval = 1;
      global.fetch
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValue(mockResponse(JSON.stringify(kudos)));

      await instance.start();
      await jest.advanceTimersByTimeAsync(60 * 1000);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(instance.config.kudos).toEqual(kudos);
    });

    test("start - refreshed kudos are used by the very next kudo selection", async () => {
      const refreshed = { anytime: ["refreshed kudo"] };
      instance.config.hourmap = {};
      instance.config.random = false;
      instance.config.remoteFile = "kudos.json";
      instance.config.remoteFileRefreshInterval = 1;
      global.fetch
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ anytime: ["first", "second"] })))
        .mockResolvedValue(mockResponse(JSON.stringify(refreshed)));

      await instance.start();
      expect(instance.getRandomKudo()).toBe("first");

      await jest.advanceTimersByTimeAsync(60 * 1000);

      expect(instance.getRandomKudo()).toBe("refreshed kudo");
    });
  });

  describe("setKudos", () => {
    test("setKudos - replaces changed kudos and resets positions", () => {
      instance.lastIndexUsed = 3;
      instance.lastKudoIndex = 2;
      const kudos = { anytime: ["new kudo"] };

      expect(instance.setKudos(kudos)).toBe(true);

      expect(instance.config.kudos).toBe(kudos);
      expect(instance.lastIndexUsed).toBe(-1);
      expect(instance.lastKudoIndex).toBe(-1);
    });

    test("setKudos - keeps kudos and positions when content is unchanged", () => {
      const current = instance.config.kudos;
      instance.lastIndexUsed = 3;
      instance.lastKudoIndex = 2;

      expect(instance.setKudos(JSON.parse(JSON.stringify(current)))).toBe(false);

      expect(instance.config.kudos).toBe(current);
      expect(instance.lastIndexUsed).toBe(3);
      expect(instance.lastKudoIndex).toBe(2);
    });
  });
});
