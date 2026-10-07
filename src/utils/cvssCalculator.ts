import { CvssMetrics, SeverityLevel } from "../types";

export interface CvssInput {
  attackVector: "N" | "A" | "L" | "P";
  attackComplexity: "L" | "H";
  privilegesRequired: "N" | "L" | "H";
  userInteraction: "N" | "R";
  scope: "U" | "C";
  confidentiality: "H" | "L" | "N";
  integrity: "H" | "L" | "N";
  availability: "H" | "L" | "N";
}

// CVSS v3.1 Official Roundup function
export function cvssRoundup(val: number): number {
  const scaled = Math.round(val * 100000);
  if (scaled <= 0) return 0.0;
  if (scaled % 10000 === 0) {
    return Number((scaled / 100000).toFixed(1));
  }
  return Number((Math.floor(scaled / 10000) / 10 + 0.1).toFixed(1));
}

export function calculateCvssV31(input: CvssInput): CvssMetrics {
  const {
    attackVector,
    attackComplexity,
    privilegesRequired,
    userInteraction,
    scope,
    confidentiality,
    integrity,
    availability,
  } = input;

  // AV
  const avWeights: Record<string, number> = {
    N: 0.85,
    A: 0.62,
    L: 0.55,
    P: 0.2,
  };

  // AC
  const acWeights: Record<string, number> = {
    L: 0.77,
    H: 0.44,
  };

  // PR
  let prWeight = 0.85;
  if (scope === "U") {
    if (privilegesRequired === "L") prWeight = 0.62;
    if (privilegesRequired === "H") prWeight = 0.27;
  } else {
    // Scope Changed
    if (privilegesRequired === "L") prWeight = 0.68;
    if (privilegesRequired === "H") prWeight = 0.50;
  }

  // UI
  const uiWeights: Record<string, number> = {
    N: 0.85,
    R: 0.62,
  };

  // CIA
  const ciaWeights: Record<string, number> = {
    H: 0.56,
    L: 0.22,
    N: 0.0,
  };

  const av = avWeights[attackVector];
  const ac = acWeights[attackComplexity];
  const pr = prWeight;
  const ui = uiWeights[userInteraction];

  const c = ciaWeights[confidentiality];
  const i = ciaWeights[integrity];
  const a = ciaWeights[availability];

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);

  let impact = 0;
  if (scope === "U") {
    impact = 6.42 * iss;
  } else {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }

  const exploitability = 8.22 * av * ac * pr * ui;

  let baseScore = 0.0;
  if (impact <= 0) {
    baseScore = 0.0;
  } else if (scope === "U") {
    baseScore = cvssRoundup(Math.min(impact + exploitability, 10));
  } else {
    baseScore = cvssRoundup(Math.min(1.08 * (impact + exploitability), 10));
  }

  // Ensure bounded [0.0, 10.0]
  baseScore = Math.min(10.0, Math.max(0.0, Number(baseScore.toFixed(1))));

  let severity: SeverityLevel = "INFO";
  if (baseScore >= 9.0) severity = "CRITICAL";
  else if (baseScore >= 7.0) severity = "HIGH";
  else if (baseScore >= 4.0) severity = "MEDIUM";
  else if (baseScore > 0.0) severity = "LOW";
  else severity = "INFO";

  const vectorString = `CVSS:3.1/AV:${attackVector}/AC:${attackComplexity}/PR:${privilegesRequired}/UI:${userInteraction}/S:${scope}/C:${confidentiality}/I:${integrity}/A:${availability}`;

  return {
    ...input,
    baseScore,
    vectorString,
    severity,
  };
}

export function parseCvssVector(vector: string): CvssInput | null {
  try {
    const parts = vector.replace(/^CVSS:3\.1\//, "").split("/");
    const map: Record<string, string> = {};
    for (const p of parts) {
      const [k, v] = p.split(":");
      if (k && v) map[k] = v;
    }

    if (!map.AV || !map.AC || !map.PR || !map.UI || !map.S || !map.C || !map.I || !map.A) {
      return null;
    }

    return {
      attackVector: map.AV as any,
      attackComplexity: map.AC as any,
      privilegesRequired: map.PR as any,
      userInteraction: map.UI as any,
      scope: map.S as any,
      confidentiality: map.C as any,
      integrity: map.I as any,
      availability: map.A as any,
    };
  } catch (e) {
    return null;
  }
}
