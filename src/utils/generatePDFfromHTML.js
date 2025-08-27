import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import htmlToPdfmake from 'html-to-pdfmake';
import { JSDOM } from 'jsdom';


pdfMake.vfs = pdfFonts;

const { window } = new JSDOM('');
const options = {
    defaultStyles: {
        // Override default element styles that are defined below
        b: { bold: true },
        strong: { bold: true },
        u: { decoration: 'underline' },
        del: { decoration: 'lineThrough' },
        s: { decoration: 'lineThrough' },
        em: { italics: true },
        i: { italics: true },
        h1: { fontSize: 24, bold: true, marginBottom: 5 },
        h2: { fontSize: 22, bold: true, marginBottom: 5 },
        h3: { fontSize: 20, bold: true, marginBottom: 5 },
        h4: { fontSize: 18, bold: true, marginBottom: 5 },
        h5: { fontSize: 16, bold: true, marginBottom: 5 },
        h6: { fontSize: 14, bold: true, marginBottom: 5 },
        a: { color: 'blue', decoration: 'underline' },
        strike: { decoration: 'lineThrough' },
        p: { margin: [0, 5, 0, 10] },
        ul: { marginBottom: 5, marginLeft: 5 },
        table: { marginBottom: 5, width: '100%' },
        th: { bold: true, fillColor: '#EEEEEE' }
    },
    tableAutoSize: false,  // Enable automatic table sizing
    imagesByReference: false,  // Handle images by reference
    removeExtraBlanks: false,  // Remove extra whitespace
    removeTagClasses: false,  // Keep HTML tag classes
    window: window,  // Required for Node.js usage
    ignoreStyles: [],  // Style properties to ignore
    fontSizes: [10, 14, 16, 18, 20, 24, 28], // Font sizes for legacy <font> tag
    customTag: function (params) { /* Custom tag handler */ }
};
const generatePDFfromHTML = async (htmlContent) => {
    try {
        const pdfContent = htmlToPdfmake(htmlContent, { window, options });
        const docDefinition = { content: pdfContent , styles : {
            invoiceHeader: {
                fontSize: 24,
                bold: true,
                marginBottom: 5,
                backgroundColor: 'red'
            }
        } };

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


