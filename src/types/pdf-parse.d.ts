declare module 'pdf-parse' {
  interface PDFData {
    numpages: number
    numrender: number
    info: any
    metadata: any
    version: string
    text: string
  }
  
  function pdf(buffer: Buffer): Promise<PDFData>
  export = pdf
}

