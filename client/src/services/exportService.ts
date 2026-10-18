import { exportDocx } from '../api.js';

export async function exportResumePdf(filename: string = 'EJ_Pondales_CV.pdf') {
  // Trigger standard print stylesheet which is pixel-perfect and vector-rendered
  window.print();
}

export async function exportResumeDocx(
  name: string = 'EJ_Pondales',
  customSummary?: string,
  entryIds?: string[]
) {
  try {
    const blob = await exportDocx(customSummary, entryIds);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}_CV.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Failed to export DOCX:', err);
    alert('DOCX generation failed. Check server console.');
  }
}
