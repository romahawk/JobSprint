import type { CvProfile, CvTargetTrack, JobOsApplication, JobOsCvAsset, JobTrack } from "../types/jobOs";

export const MAX_CV_ASSETS = 5;

export function normalizeCvDefaults(cvs: JobOsCvAsset[]): JobOsCvAsset[] {
  if (cvs.length === 0) return [];

  const preferredDefaultIndex = cvs.findIndex((cv) => cv.isDefault);
  const defaultIndex = preferredDefaultIndex >= 0 ? preferredDefaultIndex : 0;

  return cvs.map((cv, index) => ({
    ...cv,
    isDefault: index === defaultIndex,
  }));
}

export function getDefaultCvAsset(cvs: JobOsCvAsset[]): JobOsCvAsset | null {
  return normalizeCvDefaults(cvs).find((cv) => cv.isDefault) ?? null;
}

function mapTrackToProfile(track: JobTrack): CvTargetTrack {
  if (track === "TPM") return "TPM";
  if (track === "Systems PM") return "Implementation";
  return "PO";
}

export function getRecommendedCvForTrack(
  cvs: JobOsCvAsset[],
  cvProfiles: CvProfile[],
  track: JobTrack
): JobOsCvAsset | null {
  const targetTrack = mapTrackToProfile(track);
  const matchingProfileIds = new Set(
    cvProfiles.filter((profile) => profile.targetTrack === targetTrack).map((profile) => profile.id)
  );

  return (
    cvs.find((cv) => cv.linkedProfileId && matchingProfileIds.has(cv.linkedProfileId)) ??
    getDefaultCvAsset(cvs)
  );
}

export function getApplicationCvAssetId(
  application: Pick<JobOsApplication, "cvAssetId" | "cvVersion">,
  cvs: JobOsCvAsset[]
): string | undefined {
  if (application.cvAssetId && cvs.some((cv) => cv.id === application.cvAssetId)) {
    return application.cvAssetId;
  }

  const matchedByName = cvs.find((cv) => cv.name === application.cvVersion);
  return matchedByName?.id;
}

export function getApplicationCvLabel(
  application: Pick<JobOsApplication, "cvAssetId" | "cvVersion">,
  cvs: JobOsCvAsset[]
): string {
  const resolvedId = getApplicationCvAssetId(application, cvs);
  if (resolvedId) {
    return cvs.find((cv) => cv.id === resolvedId)?.name ?? application.cvVersion;
  }
  return application.cvVersion || "No CV selected";
}
