import { jsPDF } from "jspdf";
import { organization } from './data.js';

let org = {};

organization.subscribe((value) => {
    org = value;
});

function processId(id, timestamp) {
    const datetime = new Date(timestamp);
    const month = datetime.getMonth() + 1;
    const year = datetime.getFullYear();
    return `NC/${String(month).padStart(2, '0')}/${String(year).slice(2, 4)}/${String(id).padStart(5, '0')}`;
}

export function generate(receipt) {
    var doc = new jsPDF();

    function pdfFont(size, color, face, bold = false) {
        doc.setFontSize(size);
        doc.setFont(face, bold ? "bold" : "");
        doc.setTextColor(color);
    }

    // Logo placeholder
    pdfFont(24, "#000085", "Helvetica");
    doc.text("NetCredential", 20, 30);

    // Receipt details
    pdfFont(14, "black", "Helvetica", true);
    doc.text(20, 45, 'Payment Receipt');

    pdfFont(12, "black", "Helvetica", false);
    doc.text(20, 55, 'Receipt Number: ' + processId(receipt.id, receipt.timestamp));
    doc.text(20, 65, 'Date: ' + receipt.timestamp.toLocaleString("en-IN", {"dateStyle": "long", "timeStyle": "short"}));

    // Business details
    pdfFont(14, "black", "Helvetica", true);
    doc.text(20, 85, 'From:');
    pdfFont(12, "black", "Helvetica", false);
    doc.text(20, 95, 'Alhansat Technologies');
    doc.text(20, 105, 'Kagalwala House, Behind Metro House, BKC');
    doc.text(20, 115, 'Mumbai, Maharashtra 400098');
    doc.text(20, 125, 'India');
    doc.text(20, 135, 'GSTIN: 27AAYCA1881A1ZJ');

    // Client details
    pdfFont(14, "black", "Helvetica", true);
    doc.text(120, 85, 'To:');
    pdfFont(12, "black", "Helvetica", false);
    doc.text(120, 95, receipt.name);
    if (receipt.state) {
        doc.text(120, 105, receipt.state + ', ' + receipt.country);
    } else {
        doc.text(120, 105, receipt.country);
    }
    if (receipt.tax_id) {
        doc.text(120, 115, 'GSTIN: ' + receipt.tax_id);
    } else {
        doc.text(120, 115, org.email);
    }

    // Items table headers
    pdfFont(12, "black", "Helvetica", true);
    doc.text(20, 155, 'Description');
    doc.text(80, 155, 'HSN Code');
    doc.text(110, 155, 'Quantity');
    doc.text(150, 155, 'Amount');
    doc.line(20, 160, 180, 160); // Draw a line

    // Items details
    pdfFont(12, "black", "Helvetica", false);
    doc.text(20, 170, 'Credits');
    doc.text(80, 170, '9973'); // TODO: Verify HSN Code
    doc.text(110, 170, receipt.credits.toString());
    doc.text(150, 170, receipt.amount.toString() + ' ' + receipt.currency);

    // Sub-Total and Tax
    doc.text(100, 190, 'Sub-Total:');
    doc.text(150, 190, receipt.amount.toString() + ' ' + receipt.currency);

    if (receipt.country == 'India') {
        if (receipt.state == 'Maharashtra') {
            doc.text(100, 200, 'CGST (9%):');
            doc.text(150, 200, (receipt.amount*0.09).toString() + ' ' + receipt.currency);

            doc.text(100, 210, 'SGST (9%):');
            doc.text(150, 210, (receipt.amount*0.09).toString() + ' ' + receipt.currency);
        } else {
            doc.text(100, 200, 'IGST (18%):');
            doc.text(150, 200, (receipt.amount*0.18).toString() + ' ' + receipt.currency);
        }
    }

    // Total
    if (receipt.country == 'India') {
        pdfFont(12, "black", "Helvetica", true);
        doc.text(100, 220, 'Total:');
        doc.text(150, 220, (receipt.amount*1.18).toString() + ' ' + receipt.currency);
    } else {
        pdfFont(12, "black", "Helvetica", true);
        doc.text(100, 200, 'Total:');
        doc.text(150, 200, receipt.amount.toString() + ' ' + receipt.currency);
    }

    // Save the PDF
    doc.save(`Receipt (${processId(receipt.id, receipt.timestamp)}).pdf`);
}