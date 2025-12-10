import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialization to prevent top-level crashes if process.env is missing at module load
let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    // The API_KEY is injected by the environment.
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export interface ImageAnalysisResult {
  suggestedName: string;
  characteristics: string;
  observations: string;
  detectedType: string;
}

export const analyzeSiteImage = async (base64DataUrl: string): Promise<ImageAnalysisResult> => {
  // Extract proper mimeType and base64 data from the Data URL
  // Format: data:[<mediatype>][;base64],<data>
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  let mimeType = "image/jpeg";
  let cleanBase64 = base64DataUrl;

  if (matches && matches.length === 3) {
    mimeType = matches[1];
    cleanBase64 = matches[2];
  } else {
    // Fallback if just raw base64 or unexpected format
    cleanBase64 = base64DataUrl.split(',')[1] || base64DataUrl;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: `Actúa como un ingeniero experto en topografía y catastro. Analiza esta imagen de un punto de levantamiento en campo.
            Genera un JSON con los siguientes campos:
            - suggestedName: Un nombre corto y técnico (ej. "Agrietamiento Pavimento", "Muro Colapsado").
            - detectedType: Clasifica EXACTAMENTE en una de estas categorías: "Infraestructura", "Vegetación", "Hidrografía", "Punto de Control", "Inundación", "Hundimiento", "Subsidencia", "Agrietamiento", "Desbordamiento", "Deslave", "Otro".
            - characteristics: Describe técnicamente lo que ves (materiales, dimensiones, profundidad estimada). Máximo 15 palabras.
            - observations: Observaciones relevantes para gestión de riesgos o catastro. Máximo 15 palabras.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedName: { type: Type.STRING },
            detectedType: { type: Type.STRING },
            characteristics: { type: Type.STRING },
            observations: { type: Type.STRING }
          },
          required: ["suggestedName", "detectedType", "characteristics", "observations"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as ImageAnalysisResult;
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};