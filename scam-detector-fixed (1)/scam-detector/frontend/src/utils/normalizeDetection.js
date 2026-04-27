export function normalizeDetection(result) {
  if (!result) return result;

  const normalized = { ...result };
  const confidence = Number(normalized.confidence ?? 0);
  const inferredIsFake =
    typeof normalized.is_scam === "boolean"
      ? normalized.is_scam
      : String(normalized.label || "").toUpperCase().includes("FAKE");

  normalized.is_scam = inferredIsFake;
  normalized.label = inferredIsFake ? "FAKE VOICE" : "REAL HUMAN VOICE";

  const fakeLikelihood = inferredIsFake ? confidence : Math.max(0, 100 - confidence);

  if (fakeLikelihood >= 85) {
    normalized.risk_level = "High";
  } else if (fakeLikelihood >= 60) {
    normalized.risk_level = "Medium";
  } else {
    normalized.risk_level = "Low";
  }

  return normalized;
}
