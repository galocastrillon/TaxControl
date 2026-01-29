
import { GoogleGenAI, Type } from "@google/genai";

export interface AIAnalysisResult {
  authority: string;
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
 * Analiza el contenido de un documento (PDF o Imagen) utilizando Gemini.
 * @param fileData Cadena base64 del archivo o texto contextual para el análisis.
 * @param mimeType Tipo MIME del archivo (e.g., 'application/pdf', 'image/jpeg'). Si se omite, se trata fileData como texto.
 */
// Fix: Added optional mimeType to accommodate text-only re-analysis calls from DocumentDetail.tsx
export const analyzeDocumentText = async (fileData: string, mimeType?: string): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const prompt = `
    Actúa como un Socio de Impuestos Senior y Auditor de Cumplimiento Legal con especialidad en el régimen tributario de Ecuador. 
    Tu misión es realizar un análisis EXHAUSTIVO, FÁCTICO y REAL del documento adjunto. 
    Extrae la información basándote ÚNICAMENTE en lo que está escrito en el archivo.
    
    INSTRUCCIONES CRÍTICAS:
    1. PROHIBIDO REALIZAR SUPOSICIONES: Si un dato (fecha, número de trámite, plazo) no está explícito, responde "No consta en el documento".
    2. RIGOR TÉCNICO: El reporte debe ser formal, técnico y ejecutivo, dirigido a directivos y departamentos legales.
    3. EXTRACCIÓN DE DATOS: Pon especial atención en extraer con exactitud:
       - Número de Trámite o Expediente.
       - Autoridad Emisora (SRI, SENAEP, etc.).
       - Fecha de Notificación (si se menciona) o Fecha de Emisión.
       - Plazo otorgado para respuesta o cumplimiento (en días).
    
    ESTRUCTURA OBLIGATORIA PARA 'summaryEs' (Usa estos encabezados A-G):
    A. ENTIDAD EMISORA Y NATURALEZA: Identificación fáctica del organismo y tipo de acto.
    B. RESUMEN EJECUTIVO: Síntesis técnica de los hechos descritos.
    C. OBLIGACIONES Y REQUERIMIENTOS: Detalle de las exigencias imperativas al administrado.
    D. BASE LEGAL Y ANÁLISIS TÉCNICO: Normativa citada y lógica aplicada por la autoridad.
    E. CALENDARIO DE PROCEDIMIENTOS: Determinación de hitos y plazos legales encontrados.
    F. MATRIZ DE RIESGOS: Consecuencias legales o multas mencionadas por incumplimiento.
    G. IMPACTO ESTRATÉGICO: Valoración profesional del efecto en la operación.

    'summaryCn': Traducción técnica y formal al chino simplificado de la estructura A-G anterior.
    'activities': Lista de pasos concretos a seguir por el equipo operativo.
  `;

  try {
    const parts: any[] = [];
    if (mimeType) {
      // Add multimedia part if mimeType is provided
      parts.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      });
      parts.push({ text: prompt });
    } else {
      // Handle text-only prompts for re-analysis or summary refinement
      parts.push({ text: `${prompt}\n\nInformación de contexto adicional para análisis:\n${fileData}` });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            authority: { type: Type.STRING },
            company: { type: Type.STRING },
            notificationDate: { type: Type.STRING, description: "Formato YYYY-MM-DD" },
            emissionDate: { type: Type.STRING, description: "Formato YYYY-MM-DD" },
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
          required: ["authority", "summaryEs", "summaryCn", "trarniteNumber"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as AIAnalysisResult;
    }
    throw new Error("Sin respuesta de IA");
  } catch (error) {
    console.error("Error en análisis IA:", error);
    return {
      authority: "No identificado",
      company: "ECSA",
      notificationDate: "",
      emissionDate: "",
      daysLimit: 10,
      dayType: "Días hábiles",
      trarniteNumber: "No identificado",
      title: "Análisis fallido",
      summaryEs: "El análisis no pudo completarse. Por favor, revise el documento manualmente para extraer los hechos fácticos.",
      summaryCn: "分析未能完成。请手动检查文件以提取事实信息。",
      activities: []
    };
  }
};
