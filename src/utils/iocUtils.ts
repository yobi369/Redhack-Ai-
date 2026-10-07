import { ThreatIndicator, IocType } from "../types";

export function defangIndicator(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/https:\/\//gi, "hxxps://")
    .replace(/http:\/\//gi, "hxxp://")
    .replace(/ftp:\/\//gi, "fxp://")
    .replace(/@/g, "[@]")
    .replace(/\./g, "[.]");
}

export function refangIndicator(defanged: string): string {
  if (!defanged) return "";
  return defanged
    .trim()
    .replace(/hxxps:\/\//gi, "https://")
    .replace(/hxxp:\/\//gi, "http://")
    .replace(/fxp:\/\//gi, "ftp://")
    .replace(/\[@\]/g, "@")
    .replace(/\[\.\]/g, ".")
    .replace(/\(\.\)/g, ".")
    .replace(/\{\.\}/g, ".");
}

export function detectIocType(val: string): IocType {
  const clean = refangIndicator(val);
  if (/^CVE-\d{4}-\d{4,7}$/i.test(clean)) return "CVE";
  if (/^[a-f0-9]{64}$/i.test(clean)) return "SHA256";
  if (/^[a-f0-9]{32}$/i.test(clean)) return "MD5";
  if (/^https?:\/\//i.test(clean)) return "URL";
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(clean)) {
    return "IPv4";
  }
  if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(clean)) return "IPv6";
  return "Domain";
}

// STIX 2.1 Bundle Generator for threat intelligence sharing
export function exportToStix21(indicators: ThreatIndicator[]): string {
  const bundleId = `bundle--${Math.random().toString(36).substring(2, 12)}-${Date.now()}`;
  const now = new Date().toISOString();

  const objects = indicators.map((ind) => {
    const rawVal = refangIndicator(ind.rawIndicator || ind.indicator);
    let pattern = `[network-traffic:src_ref.value = '${rawVal}']`;

    if (ind.type === "IPv4") {
      pattern = `[ipv4-addr:value = '${rawVal}']`;
    } else if (ind.type === "Domain") {
      pattern = `[domain-name:value = '${rawVal}']`;
    } else if (ind.type === "URL") {
      pattern = `[url:value = '${rawVal}']`;
    } else if (ind.type === "SHA256") {
      pattern = `[file:hashes.'SHA-256' = '${rawVal}']`;
    } else if (ind.type === "MD5") {
      pattern = `[file:hashes.'MD5' = '${rawVal}']`;
    }

    return {
      type: "indicator",
      spec_version: "2.1",
      id: `indicator--${ind.id}`,
      created: ind.firstSeen || now,
      modified: ind.lastSeen || now,
      name: `IOC: ${ind.type} (${ind.indicator})`,
      description: `Indicator associated with ${ind.threatActor || ind.sourceAttribution}. Confidence: ${ind.confidence}%.`,
      indicator_types: ["malicious-activity"],
      pattern,
      pattern_type: "stix",
      valid_from: ind.firstSeen || now,
      valid_until: ind.expiresAt,
      confidence: ind.confidence,
      labels: ind.tags,
      created_by_ref: "identity--redhack-soc-threat-intel",
      object_marking_refs: [
        ind.tlp === "TLP:RED"
          ? "marking-definition--tlp-red"
          : ind.tlp === "TLP:AMBER"
          ? "marking-definition--tlp-amber"
          : ind.tlp === "TLP:GREEN"
          ? "marking-definition--tlp-green"
          : "marking-definition--tlp-clear",
      ],
    };
  });

  const bundle = {
    type: "bundle",
    id: bundleId,
    objects,
  };

  return JSON.stringify(bundle, null, 2);
}

// Scope and Authorization Checker
export function isTargetAuthorized(
  target: string,
  authorizedCidrs: string[],
  authorizedDomains: string[],
  exclusions: string[]
): { authorized: boolean; reason: string } {
  const cleanTarget = target.trim().toLowerCase();

  // Check explicit exclusions first (Safety First)
  for (const exc of exclusions) {
    const cleanExc = exc.trim().toLowerCase();
    if (!cleanExc) continue;
    if (cleanTarget === cleanExc || cleanTarget.includes(cleanExc)) {
      return {
        authorized: false,
        reason: `Target '${target}' matches explicit safety exclusion: '${exc}'. Execution blocked.`,
      };
    }
  }

  // Check authorized domains
  for (const dom of authorizedDomains) {
    const cleanDom = dom.trim().toLowerCase();
    if (!cleanDom) continue;
    if (cleanTarget === cleanDom || cleanTarget.endsWith(`.${cleanDom}`)) {
      return { authorized: true, reason: `Target authorized under domain scope '${dom}'.` };
    }
  }

  // Check authorized IP or CIDR simple match
  for (const cidr of authorizedCidrs) {
    const cleanCidr = cidr.trim().toLowerCase();
    if (!cleanCidr) continue;
    if (cleanTarget === cleanCidr) {
      return { authorized: true, reason: `Target matches authorized CIDR '${cidr}'.` };
    }
    // Simple subnet prefix match (e.g. 10.0.0. from 10.0.0.0/24)
    const base = cleanCidr.split("/")[0].split(".").slice(0, 3).join(".");
    if (cleanTarget.startsWith(base)) {
      return { authorized: true, reason: `Target belongs to authorized subnet '${cidr}'.` };
    }
  }

  return {
    authorized: false,
    reason: `Target '${target}' is not in authorized CIDRs or domains list. Execution refused by governance policy.`,
  };
}
