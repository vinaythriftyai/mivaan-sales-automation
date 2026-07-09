export type GstOcrResult = {
  legalName?: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  registrationStatus?: string;
  addresses: Array<{
    label: string;
    line1: string;
    city: string;
    state: string;
    pinCode: string;
  }>;
  confidence: number;
};

export interface OcrProvider {
  extractGstCertificate(filePath: string): Promise<GstOcrResult>;
}