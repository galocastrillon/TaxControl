import { GoogleGenAI, Type } from "@google/genai";

export interface AIAnalysisResult {
  authority: string;
  department: string;
  company: string;
  notificationDate: string;
  emissionDate: string;
  daysLimit: number;
  dayType: string;
  trarniteNumber: string;
  title: string;
  summaryEs: string;
  summaryCn: string;
  activities: string[];
}

/**
 * Analyzes document content using Gemini AI.
 */
export const analyzeDocumentText = async (fileData: string, mimeType?: string): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const systemInstruction = `
    Actúa como un Socio de Impuestos Senior y Auditor de Cumplimiento Legal experto en el régimen tributario de Ecuador. 
    Tu misión es realizar un análisis EXHAUSTIVO, FÁCTICO y REAL del documento adjunto. 
    
    INSTRUCCIONES DE EXTRACCIÓN CRÍTICAS:
    1. ENTIDAD EMISORA (authority): Identifica la institución principal (ej. Servicio de Rentas Internas, IESS, etc.).
    2. DEPARTAMENTO/UNIDAD (department): Identifica la unidad específica (ej. Dirección Nacional de Grandes Contribuyentes).
    3. FECHA DE NOTIFICACIÓN: Busca la fecha legal de notificación. Devuélvela en formato YYYY-MM-DD.
    4. TRÁMITE (trarniteNumber): Extrae el número de expediente o resolución.
    5. PLAZO (daysLimit): Identifica el número de días otorgados.
    6. TIPO DE DÍAS (dayType): Identifica si son "Días hábiles" o "Días calendario".
    
    ESTRUCTURA PARA 'summaryEs':
    A. ENTIDAD EMISORA Y NATURALEZA
    B. RESUMEN EJECUTIVO
    C. OBLIGACIONES Y REQUERIMIENTOS
    D. BASE LEGAL Y ANÁLISIS TÉCNICO
    E. CALENDARIO DE PROCEDIMIENTOS
    F. MATRIZ DE RIESGOS
    G. IMPACTO ESTRATÉGICO
  `;

  try {
    const parts: any[] = [];
    if (mimeType) {
      parts.push({
        inlineData: { data: fileData, mimeType: mimeType }
      });
    } else {
      parts.push({ text: `Context:\n${fileData}` });
    }

    // Using ai.models.generateContent with systemInstruction in config
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: { 
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            authority: { type: Type.STRING },
            department: { type: Type.STRING },
            company: { type: Type.STRING },
            notificationDate: { type: Type.STRING },
            emissionDate: { type: Type.STRING },
            daysLimit: { type: Type.NUMBER },
            dayType: { type: Type.STRING },
            trarniteNumber: { type: Type.STRING },
            title: { type: Type.STRING },
            summaryEs: { type: Type.STRING },
            summaryCn: { type: Type.STRING },
            activities: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["authority", "department", "summaryEs", "summaryCn", "trarniteNumber"]
        }
      }
    });

    // Access .text property directly (not as a method)
    if (response.text) {
      return JSON.parse(response.text.trim()) as AIAnalysisResult;
    }
    throw new Error("Sin respuesta");
  } catch (error) {
    console.error("Error AI:", error);
    return {
      authority: "No identificado",
      department: "No identificado",
      company: "ECSA",
      notificationDate: "",
      emissionDate: "",
      daysLimit: 10,
      dayType: "Días hábiles",
      trarniteNumber: "No identificado",
      title: "Análisis fallido",
      summaryEs: "Error al analizar.",
      summaryCn: "解析错误",
      activities: []
    };
  }
};