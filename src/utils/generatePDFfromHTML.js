// import pdfMake from 'pdfmake/build/pdfmake.js';
// import pdfFonts from 'pdfmake/build/vfs_fonts.js';
// import htmlToPdfmake from 'html-to-pdfmake';
import { JSDOM } from 'jsdom';
import { ApiError } from './ApiError.js';
import pdf from 'html-pdf-node';



const generatePDFfromHTML = async (htmlContent) => {
    try {
        let file = { content: htmlContent };
        let options = {
            format: 'A4',
            margin: { top: "20px", bottom: "20px" },
        };

        let pdfBuffer = await pdf.generatePdf(file, options);

        return pdfBuffer;

    } catch (error) {
        console.error('Error generating PDF from HTML:', error);
        throw new ApiError(500, 'Failed to generate PDF');
    }
}

export { generatePDFfromHTML };
