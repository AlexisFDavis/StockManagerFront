import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CotizacionData {
    fecha: string;
    cliente: string;
    ubicacion: string;
    descripcionGeneral: string;
    obra: string;
    items: Array<{
        nombre: string;       
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        total: number;
    }>;
    subtotal: number;
}

export interface ReciboData {
    fecha: string;
    cliente: string;
    direccion: string;
    localidad: string;
    cuit?: string;
    concepto: string;
    total: number;
    formaPago: 'Efectivo' | 'Cheque';
    aclaracion?: string;
}

export interface RemitoData {
    fecha: string;
    cliente: string;
    direccion: string;
    localidad: string;
    cuit?: string;
    facturaNumero?: string;
    items: Array<{
        cantidad: number;
        descripcion: string;
    }>;
    transportista: string;
    Domicilio: string;
}

async function cargarTemplate(nombreArchivo: string): Promise<ArrayBuffer> {
    try {
        const response = await fetch(`/templates/${nombreArchivo}`);
        if (!response.ok) {
            throw new Error(`Error al cargar template: ${response.statusText}`);
        }
        return await response.arrayBuffer();
    } catch (error) {
        console.error(`Error cargando template ${nombreArchivo}:`, error);
        throw error;
    }
}

export async function generarCotizacion(data: CotizacionData): Promise<Uint8Array> {
    try {
        const templateBytes = await cargarTemplate('cotizacion.pdf');
        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const fechaFormateada = data.fecha.replace(/\//g, '');
        firstPage.drawText(fechaFormateada, {
            x: 450,
            y: height - 100,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.ubicacion, {
            x: 100,
            y: height - 130,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        let yPosition = height - 280;
        data.items.forEach((item) => {
            firstPage.drawText(item.nombre, {
                x: 50,
                y: yPosition,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
            
            const descripcionLimitada = item.descripcion.length > 30 
                ? item.descripcion.substring(0, 30) + '...' 
                : item.descripcion;
            firstPage.drawText(descripcionLimitada, {
                x: 150,
                y: yPosition,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
            
            firstPage.drawText(item.cantidad.toString(), {
                x: 350,
                y: yPosition,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
            
            firstPage.drawText(`$${item.precioUnitario.toLocaleString('es-AR')}`, {
                x: 400,
                y: yPosition,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
            
            firstPage.drawText(`$${item.total.toLocaleString('es-AR')}`, {
                x: 480,
                y: yPosition,
                size: 10,
                font: fontBold,
                color: rgb(0, 0, 0),
            });
            
            yPosition -= 20;
        });
        
        firstPage.drawText(`$${data.subtotal.toLocaleString('es-AR')}`, {
            x: 480,
            y: yPosition - 20,
            size: 8,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    } catch (error) {
        console.error('Error al generar cotización:', error);
        throw error;
    }
}

export async function generarRemito(data: RemitoData): Promise<Uint8Array> {
    try {
        const templateBytes = await cargarTemplate('REMITO (1).pdf');
        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        const fechaFormateada = data.fecha.replace(/\//g, '');
        firstPage.drawText(fechaFormateada, {
            x: 100,
            y: height - 100,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.cliente, {
            x: 100,
            y: height - 130,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.direccion, {
            x: 100,
            y: height - 150,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.localidad, {
            x: 100,
            y: height - 170,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        if (data.cuit) {
            firstPage.drawText(data.cuit, {
                x: 400,
                y: height - 150,
                size: 8,
                font: font,
                color: rgb(0, 0, 0),
            });
        }
        
        if (data.facturaNumero) {
            firstPage.drawText(data.facturaNumero, {
                x: 300,
                y: height - 190,
                size: 8,
                font: font,
                color: rgb(0, 0, 0),
            });
        }
        
        let yPosition = height - 250;
        data.items.forEach((item) => {
            firstPage.drawText(item.cantidad.toString(), {
                x: 50,
                y: yPosition,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
            
            const descripcionLimitada = item.descripcion.length > 40 
                ? item.descripcion.substring(0, 40) + '...' 
                : item.descripcion;
            firstPage.drawText(descripcionLimitada, {
                x: 150,
                y: yPosition,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
            
            yPosition -= 20;
        });
        
        firstPage.drawText(data.transportista, {
            x: 50,
            y: 100,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.Domicilio, {
            x: 50,
            y: 80,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    } catch (error) {
        console.error('Error al generar remito:', error);
        throw error;
    }
}

export async function generarRecibo(data: ReciboData): Promise<Uint8Array> {
    try {
        const templateBytes = await cargarTemplate('RECIBO (1).pdf');
        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const partesFecha = data.fecha.split('/');
        const dia = partesFecha[0] || '';
        const mes = partesFecha[1] || '';
        const año = partesFecha[2] || '';
        
        firstPage.drawText(dia, {
            x: 307,
            y: height - 93,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(mes, {
            x: 330,
            y: height - 93,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(año, {
            x: 355,
            y: height - 93,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.cliente, {
            x: 80,
            y: height - 127,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.direccion, {
            x: 80,
            y: height - 145,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText(data.localidad, {
            x: 280,
            y: height - 145,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        if (data.cuit) {
            firstPage.drawText(data.cuit, {
                x: 400,
                y: height - 150,
                size: 8,
                font: font,
                color: rgb(0, 0, 0),
            });
            } else {
            firstPage.drawText('[CUIT]', {
                x: 400,
                y: height - 150,
                size: 8,
                font: font,
                color: rgb(1, 0, 0),
            });
        }
        
        const totalEnLetras = convertirNumeroALetras(data.total);
        firstPage.drawText(totalEnLetras, {
            x: 150,
            y: height - 203,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        const conceptoLimitado = data.concepto.length > 60 
            ? data.concepto.substring(0, 60) + '...' 
            : data.concepto;
        firstPage.drawText(conceptoLimitado, {
            x: 43,
            y: height - 222,
            size: 11,
            font: font,
            color: rgb(0, 0, 0),
        });
        
        firstPage.drawText('→ CONCEPTO DE:', {
            x: 43,
            y: height - 240,
            size: 7,
            font: font,
            color: rgb(1, 0, 0),
        });
        
        firstPage.drawText('→ CUIT:', {
            x: 400,
            y: height - 165,
            size: 7,
            font: font,
            color: rgb(1, 0, 0),
        });
        
        firstPage.drawText(`$${data.total.toLocaleString('es-AR')}`, {
            x: 450,
            y: height - 280,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        
        if (data.formaPago === 'Efectivo') {
            firstPage.drawText('X', {
                x: 100,
                y: height - 300,
                size: 8,
                font: fontBold,
                color: rgb(0, 0, 0),
            });
        } else {
            firstPage.drawText('X', {
                x: 150,
                y: height - 300,
                size: 8,
                font: fontBold,
                color: rgb(0, 0, 0),
            });
        }
        
        if (data.aclaracion) {
            firstPage.drawText(data.aclaracion, {
                x: 300,
                y: height - 320,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
            });
        }
        
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    } catch (error) {
        console.error('Error al generar recibo:', error);
        throw error;
    }
}

function convertirNumeroALetras(numero: number): string {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    if (numero === 0) return 'cero pesos';
    if (numero < 10) return `${unidades[numero]} pesos`;
    if (numero < 20) return `${especiales[numero - 10]} pesos`;
    if (numero < 100) {
        const decena = Math.floor(numero / 10);
        const unidad = numero % 10;
        if (unidad === 0) return `${decenas[decena]} pesos`;
        return `${decenas[decena]} y ${unidades[unidad]} pesos`;
    }
    
    if (numero < 1000) {
        const centena = Math.floor(numero / 100);
        const resto = numero % 100;
        let resultado = '';
        
        if (centena === 1) {
            resultado = 'ciento';
        } else if (centena === 5) {
            resultado = 'quinientos';
        } else if (centena === 7) {
            resultado = 'setecientos';
        } else if (centena === 9) {
            resultado = 'novecientos';
        } else {
            resultado = unidades[centena] + 'cientos';
        }
        
        if (resto > 0) {
            resultado += ' ' + convertirNumeroALetras(resto);
        } else {
            resultado += ' pesos';
        }
        
        return resultado;
    }
    
    return `${numero.toLocaleString('es-AR')} pesos`;
}

export function descargarPDF(pdfBytes: Uint8Array, nombreArchivo: string) {
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
