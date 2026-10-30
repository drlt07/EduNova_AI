import { describe, expect, it } from "vitest";
import { NET_FAULTS, PATH_TASKS, REQUIRED_LINKS, checkHop, checkLink, ipConfig, macTable, missingLinks, ping, type DeviceId, type Link } from "@/lib/sim/network";

describe("đấu nối mạng", () => {
  it("chấp nhận đúng các dây cần thiết, theo hai chiều", () => {
    expect(checkLink([], "switch", "pc1").ok).toBe(true);
    expect(checkLink([], "internet", "router").ok).toBe(true);
    const links: Link[] = [];
    for (const [a, b] of REQUIRED_LINKS) {
      expect(checkLink(links, b, a).ok).toBe(true);
      links.push([b, a]);
    }
    expect(missingLinks(links)).toEqual([]);
  });

  it("từ chối cách nối sai và giải thích", () => {
    expect(checkLink([], "switch", "internet").message).toMatch(/qua router/);
    expect(checkLink([], "pc1", "pc2").ok).toBe(false);
    expect(checkLink([["pc1", "switch"]], "switch", "pc1").message).toMatch(/đã được nối/);
    expect(checkLink([], "internet", "server").ok).toBe(false);
  });
});

describe("đường đi gói tin", () => {
  const run = (taskId: string, picks: DeviceId[]) => {
    const t = PATH_TASKS.find((x) => x.id === taskId)!;
    const chosen: DeviceId[] = [];
    const results = picks.map((p) => {
      const r = checkHop(t, chosen, p);
      if (r.ok) chosen.push(p);
      return r;
    });
    return { chosen, results };
  };

  it("in trong LAN không qua router; vào web phải qua router rồi Internet", () => {
    const print = run("print", ["pc1", "switch", "router"]);
    expect(print.results[2]).toMatchObject({ ok: false });
    expect(print.results[2].message).toMatch(/cùng mạng 192\.168\.1\.x.*có cần ra router không\?/);
    expect(run("print", ["pc1", "switch", "printer"]).results.at(-1)).toMatchObject({ ok: true, done: true });
    const web = run("web", ["pc2", "switch", "internet"]);
    expect(web.results[2].message).toMatch(/cửa ra mạng khác\?/);
    expect(run("web", ["pc2", "switch", "router", "internet", "server"]).results.at(-1)).toMatchObject({ ok: true, done: true });
  });

  it("switch học MAC nguồn theo cổng, không lặp", () => {
    expect(macTable(["pc1", "pc2", "pc1", "router"]).map((r) => r.port)).toEqual([1, 2, 8]);
  });
});

describe("chẩn đoán bằng ping", () => {
  it("mạng bình thường thì ping đâu cũng được", () => {
    for (const to of ["printer", "router", "server"] as DeviceId[]) expect(ping({ fault: "none" }, "pc1", to).ok).toBe(true);
  });

  it("sai gateway: trong LAN được, ra ngoài không; ipconfig lộ gateway sai", () => {
    const net = { fault: "pc2-gateway" as const };
    expect(ping(net, "pc2", "printer").ok).toBe(true);
    expect(ping(net, "pc2", "server").ok).toBe(false);
    expect(ipConfig(net, "pc2").gateway).toBe("192.168.1.254");
    expect(ping(net, "pc1", "server").ok).toBe(true);
  });

  it("đứt WAN: cả phòng mất Internet nhưng LAN vẫn chạy", () => {
    const net = { fault: "wan-down" as const };
    expect(ping(net, "pc1", "printer").ok).toBe(true);
    expect(ping(net, "pc1", "server").ok).toBe(false);
    expect(ping(net, "pc2", "server").ok).toBe(false);
  });

  it("đứt dây máy An: máy An không ping được ai; máy Bình vẫn ra Internet", () => {
    const net = { fault: "pc1-cable" as const };
    expect(ping(net, "pc1", "printer").ok).toBe(false);
    expect(ping(net, "pc2", "server").ok).toBe(true);
  });

  it("mỗi ca sự cố có đáp án hợp lệ", () => {
    for (const f of NET_FAULTS) expect(f.options[f.answer]).toBeTruthy();
  });
});
