import { describe, expect, it } from "vitest";
import { createController, lightFor, requestSwitch, setMode, tickController, NEXT_PHASE, type PhaseName } from "@/lib/traffic/traffic-controller";
import { AXIS_OF, STOP_S, CAR_LENGTH, createSimulation, mayEnter, stepSimulation, vehiclePose, inBox } from "@/lib/traffic/simulation-state";

const DT = 1 / 60;
const run = (st: ReturnType<typeof createSimulation>, seconds: number, each?: () => void) => {
  for (let i = 0; i < seconds / DT; i++) {
    stepSimulation(st, DT);
    each?.();
  }
};

describe("TrafficController", () => {
  it("never shows green on both axes and always passes through yellow and all-red", () => {
    const c = createController();
    const seen: PhaseName[] = [c.phase];
    for (let i = 0; i < 60 * 60; i++) {
      seen.push(...tickController(c, DT));
      expect(lightFor(c.phase, "NS") === "green" && lightFor(c.phase, "EW") === "green").toBe(false);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBe(NEXT_PHASE[seen[i - 1]]);
  });
  it("manual mode holds green until switch is requested, then goes yellow first", () => {
    const c = createController("manual");
    tickController(c, 100);
    expect(c.phase).toBe("NS_GREEN");
    expect(requestSwitch(c)).toBe(true);
    tickController(c, DT);
    expect(c.phase).toBe("NS_YELLOW");
    expect(requestSwitch(c)).toBe(false); // không đổi được khi đang vàng
    tickController(c, 5);
    expect(c.phase).toBe("EW_GREEN");
    setMode(c, "auto");
    tickController(c, c.timing.green + DT);
    expect(c.phase).toBe("EW_YELLOW");
  });
});

describe("vehicle rules", () => {
  it("decision: green go, red stop, yellow go only if too close to stop safely", () => {
    expect(mayEnter("green", 20, 7, false)).toBe(true);
    expect(mayEnter("red", 20, 7, false)).toBe(false);
    expect(mayEnter("red", 0.5, 7, false)).toBe(false);
    expect(mayEnter("yellow", 20, 7, false)).toBe(false);
    expect(mayEnter("yellow", 1, 7, false)).toBe(true);
  });
  it("poses put each approach on its right-hand lane", () => {
    expect(vehiclePose({ approach: "N", s: 0 })).toMatchObject({ x: -2, z: -42 });
    expect(vehiclePose({ approach: "E", s: 0 })).toMatchObject({ x: 42, z: -2 });
  });
  it("cars stop before the line on red and nobody runs a red light or collides over 5 minutes", () => {
    const st = createSimulation();
    let stoppedBeforeLine = 0;
    run(st, 300, () => {
      for (const v of st.vehicles) {
        const light = lightFor(st.controller.phase, AXIS_OF[v.approach]);
        if (light === "red" && v.status === "waiting") {
          expect(v.s + CAR_LENGTH / 2).toBeLessThanOrEqual(STOP_S + 0.01);
          stoppedBeforeLine++;
        }
      }
    });
    expect(stoppedBeforeLine).toBeGreaterThan(0);
    expect(st.stats.violations).toBe(0);
    expect(st.stats.conflicts).toBe(0);
    expect(st.stats.passed).toBeGreaterThan(20);
    expect(st.stats.stopsAtRed).toBeGreaterThan(4);
  });
  it("manual mode: the red axis waits until the student switches the light", () => {
    const st = createSimulation();
    setMode(st.controller, "manual");
    run(st, 40);
    const ew = st.vehicles.filter((v) => AXIS_OF[v.approach] === "EW");
    expect(ew.every((v) => v.status === "waiting")).toBe(true);
    requestSwitch(st.controller);
    run(st, 8);
    expect(ew.some((v) => v.trips > 0 || v.s > STOP_S)).toBe(true);
    expect(st.stats.violations).toBe(0);
    expect(st.stats.conflicts).toBe(0);
  });
  it("is deterministic", () => {
    const a = createSimulation(), b = createSimulation();
    run(a, 60);
    run(b, 60);
    expect(a.vehicles.map((v) => v.s)).toEqual(b.vehicles.map((v) => v.s));
    expect(a.vehicles.some(inBox) === b.vehicles.some(inBox)).toBe(true);
  });
});
