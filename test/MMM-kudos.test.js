const Module = {
  register: jest.fn()
};

global.Module = Module;
global.Log = { info: jest.fn() };
global.moment = require("moment");

require("../MMM-kudos.js");
const moduleInstance = Module.register.mock.calls[0][1];

describe("MMM-kudos", () => {
  let instance;

  beforeEach(() => {
    instance = Object.assign({}, moduleInstance);
    instance.config = JSON.parse(JSON.stringify(moduleInstance.defaults));
    instance.config.hourmap = {
        5: ["first morning kudo"],
        20: ["first night kudo"]
    };
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
});
