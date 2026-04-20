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

// Delegates analysis to the server-side /api/analyze endpoint so the Gemini key is never exposed in the browser.
export const analyzeDocumentText = async (fileData: string, mimeType?: string): Promise<AIAnalysisResult> => {
  const token = localStorage.getItem('auth_token');
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fileData, mimeType })
    });

    if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);
    return response.json() as Promise<AIAnalysisResult>;
  } catch (error) {
    console.error('Error AI:', error);
    return {
      authority: 'No identificado',
      department: 'No identificado',
      company: 'ECSA',
      notificationDate: '',
      emissionDate: '',
      daysLimit: 10,
      dayType: 'Días hábiles',
      trarniteNumber: 'No identificado',
      title: 'Análisis fallido',
      summaryEs: 'Error al analizar.',
      summaryCn: '解析错误',
      activities: []
    };
  }
};