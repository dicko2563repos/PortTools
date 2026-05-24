const PCR_APP_URL = process.env.NEXT_PUBLIC_PCR_APP_URL?.trim() || "https://pcr.porttools.com.au";
const PMS_APP_URL = process.env.NEXT_PUBLIC_PMS_APP_URL?.trim() || "https://pms.porttools.com.au";
const ACCESS_APP_URL =
  process.env.NEXT_PUBLIC_ACCESS_APP_URL?.trim() || "https://access.porttools.com.au";

export function pcrRecordUrl(): string {
  return `${PCR_APP_URL}/port/record`;
}

export function pmsHomeUrl(): string {
  return PMS_APP_URL;
}

export function accessRegisterUrl(movementsPortId: string): string {
  return `${ACCESS_APP_URL}/ports/${movementsPortId}/access`;
}

export function pmsReportsUrl(): string {
  return `${PMS_APP_URL}/reports`;
}

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "kgc@precisionaviation.com.au";
