import { getGemini } from "./gemini";
import { database } from "./db";
import { PredictionInsight } from "../src/types";

export async function generatePredictionsForCase(caseId: string): Promise<PredictionInsight[]> {
  const network = database.getFinalNetwork(caseId);
  if (!network || network.nodes.length === 0) {
    throw new Error("No network graph found for this case. Run Second LLM Reasoning first.");
  }

  const ai = getGemini();

  if (ai) {
    try {
      const networkSummary = {
        nodes: network.nodes.map((n) => ({ id: n.id, name: n.name, type: n.type, role: n.role })),
        edges: network.edges.map((e) => ({
          source: network.nodes.find((n) => n.id === e.sourceId)?.name,
          target: network.nodes.find((n) => n.id === e.targetId)?.name,
          relationType: e.relationType,
          confidence: e.confidence,
          isHidden: e.isHiddenConnection,
        })),
        keyInfluencers: network.networkMetrics.keyInfluencers,
      };

      const prompt = `You are the Predictive Intelligence Engine for the NCRB Criminal Network Analysis System.
Input: Current Final Criminal Network JSON.
Task: Generate high-precision predictive threat and risk intelligence.
CRITICAL CONSTRAINT: Predictions must be clearly separated from confirmed facts and existing relationships.
Focus on:
1. Emerging / Future connections (e.g. who the syndicate is likely to recruit next as courier or front).
2. Key Influencer vulnerability & flight risk.
3. Suspicious financial or logistical transit patterns.
4. Possible network expansion or retaliation vector.

CURRENT NETWORK SNAPSHOT:
${JSON.stringify(networkSummary, null, 2)}

Return a JSON array of predictions matching this structure:
[
  {
    "category": "FUTURE_CONNECTION" | "EMERGING_RELATIONSHIP" | "KEY_INFLUENCER" | "SUSPICIOUS_PATTERN" | "NETWORK_EXPANSION" | "FLIGHT_RISK",
    "title": "Concise intelligence alert title",
    "probability": 85,
    "description": "Clear analytical forecast of what will occur",
    "targetEntities": [{ "id": "ent-xxx", "name": "Name", "role": "Role" }],
    "rationale": "Forensic pattern rationale justifying the prediction",
    "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "suggestedIntervention": "Actionable recommendation for law enforcement investigators"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        const predictions: PredictionInsight[] = parsed.map((p: any, idx: number) => ({
          id: `pred-gen-${Date.now()}-${idx + 1}`,
          caseId,
          category: p.category || "SUSPICIOUS_PATTERN",
          title: p.title || "Intelligence Alert",
          probability: typeof p.probability === "number" ? p.probability : 75,
          description: p.description || "",
          targetEntities: p.targetEntities || [],
          rationale: p.rationale || "",
          riskLevel: p.riskLevel || "HIGH",
          suggestedIntervention: p.suggestedIntervention || "Verify with tactical unit.",
          generatedAt: new Date().toISOString(),
        }));

        database.savePredictions(caseId, predictions);
        return predictions;
      }
    } catch (err) {
      console.warn("Gemini prediction generation error, using existing case predictions:", err);
    }
  }

  // Return existing case predictions or fallback
  const existing = database.getPredictions(caseId);
  return existing;
}
