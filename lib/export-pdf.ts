import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  fileName: string;
  summary?: { label: string; value: string }[];
}

export function exportToPDF({ title, subtitle, headers, data, fileName, summary }: PDFOptions) {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.setTextColor(26, 26, 26);
  doc.text(title, 15, 15);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(107, 107, 107);
    doc.text(subtitle, 15, 22);
  }

  if (summary && summary.length > 0) {
    let yPos = 30;
    doc.setFontSize(9);
    summary.forEach((item) => {
      doc.setTextColor(107, 107, 107);
      doc.text(`${item.label}:`, 15, yPos);
      doc.setTextColor(26, 26, 26);
      doc.text(item.value, 60, yPos);
      yPos += 6;
    });
  }

  const startY = summary ? 30 + summary.length * 6 + 5 : 30;

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: startY,
    theme: 'grid',
    headStyles: {
      fillColor: [74, 124, 89],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [26, 26, 26],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { right: 15, left: 15 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Generated: ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
      15,
      285
    );
  }

  doc.save(fileName);
}