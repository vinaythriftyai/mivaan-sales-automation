import type {
  GstOcrResult,
  OcrProvider
} from "./ocr-provider.js";

export class MockOcrProvider implements OcrProvider {
  async extractGstCertificate(
    _filePath: string
  ): Promise<GstOcrResult> {
    return {
      legalName: "Sample Structural Steels Private Limited",
      tradeName: "Sample Steel Traders",
      gstin: "22AAAAA0000A1Z5",
      pan: "AAAAA0000A",
      registrationStatus: "Active",
      addresses: [
        {
          label: "Principal Place of Business",
          line1: "Industrial Area, Sample Road",
          city: "Raipur",
          state: "Chhattisgarh",
          pinCode: "492001"
        }
      ],
      confidence: 0.94
    };
  }
}