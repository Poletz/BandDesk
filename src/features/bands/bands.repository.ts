import type { BandContextPayload } from '@/interfaces';
import { http } from '@/utils/http';
import type { PatchBandInput } from '@/utils/zod-band';

interface SetActiveBandResponse {
  activeBandId: string;
}

interface AvatarUploadUrlResponse {
  uploadUrl: string;
  key: string;
}

interface AvatarCommitResponse {
  url: string;
}

const getContext = async (): Promise<BandContextPayload> => {
  const { data } = await http.get<BandContextPayload>('/api/bands');

  return {
    bands: data?.bands ?? [],
    activeBandId: data?.activeBandId ?? null,
  };
};

const setActiveBand = async (bandId: string) => {
  const { data } = await http.patch<SetActiveBandResponse>('/api/bands/active', { bandId });

  return {
    activeBandId: data.activeBandId,
  };
};

const updateProfile = async (bandId: string, patch: PatchBandInput) => {
  const { data } = await http.patch(`/api/bands/${bandId}`, patch);
  return data;
};

const requestAvatarUploadUrl = async (
  bandId: string,
  params: { fileName: string; contentType: string; fileSizeBytes: number }
) => {
  const { data } = await http.post<AvatarUploadUrlResponse>(
    `/api/bands/${bandId}/avatar-upload-url`,
    params
  );
  return data;
};

const commitAvatar = async (bandId: string, key: string) => {
  const { data } = await http.post<AvatarCommitResponse>(`/api/bands/${bandId}/avatar`, { key });
  return data;
};

export const bandsRepository = {
  getContext,
  setActiveBand,
  updateProfile,
  requestAvatarUploadUrl,
  commitAvatar,
};
