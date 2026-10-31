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
});
