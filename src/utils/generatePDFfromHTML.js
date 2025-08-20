import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import htmlToPdfmake from 'html-to-pdfmake';
import { JSDOM } from 'jsdom';


pdfMake.vfs = pdfFonts;

const { window } = new JSDOM('');

const generatePDFfromHTML = async (htmlContent) => {
    try {
        const pdfContent = htmlToPdfmake(htmlContent, { window });
        const docDefinition = { content: pdfContent };

        const pdfBuffer = await new Promise((resolve, reject) => {
            pdfMake.createPdf(docDefinition).getBuffer((buffer) => {
                resolve(buffer);
            });
        });

        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF from HTML:', error);
        throw new Error('Failed to generate PDF');
    }
}

export { generatePDFfromHTML };


