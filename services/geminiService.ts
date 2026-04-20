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

export const analyzeDocumentText = async (fileData: string, mimeType?: string): Promise<AIAnalysisResult> => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fileData, mimeType })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Error ${response.status} al analizar el documento`);
  }

  return response.json() as Promise<AIAnalysisResult>;
};
