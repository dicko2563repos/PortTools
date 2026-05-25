const PCR_APP_URL = process.env.NEXT_PUBLIC_PCR_APP_URL?.trim() || "https://pcr.porttools.com.au";
const PMS_APP_URL = process.env.NEXT_PUBLIC_PMS_APP_URL?.trim() || "https://pms.porttools.com.au";
const ACCESS_APP_URL =
  process.env.NEXT_PUBLIC_ACCESS_APP_URL?.trim() || "https://access.porttools.com.au";

function appOrigin(baseUrl: string): string {
  return new URL(baseUrl).origin;
}

export function pcrRecordUrl(): string {
  return `${PCR_APP_URL}/port/record`;
}

export function pmsHomeUrl(): string {
  return PMS_APP_URL;
}

export function pmsMovementsUrl(): string {
  return `${PMS_APP_URL}/port/movements`;
}

export function accessRegisterUrl(movementsPortId: string): string {
  return `${ACCESS_APP_URL}/ports/${movementsPortId}/access`;
}

export function pmsReportsUrl(): string {
  return `${PMS_APP_URL}/reports`;
}

export function pcrAppOrigin(): string {
  return appOrigin(PCR_APP_URL);
}

export function pmsAppOrigin(): string {
  return appOrigin(PMS_APP_URL);
}

export function accessAppOrigin(): string {
  return appOrigin(ACCESS_APP_URL);
}

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "kgc@precisionaviation.com.au";
