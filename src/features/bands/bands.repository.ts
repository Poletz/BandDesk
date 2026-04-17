import type { BandContextPayload } from '@/interfaces';
import { http } from '@/utils/http';

interface SetActiveBandResponse {
  activeBandId: string;
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

export const bandsRepository = {
  getContext,
  setActiveBand,
};
