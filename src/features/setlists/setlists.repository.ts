import { Setlist, SetlistStatus } from '@/interfaces';
import { http } from '@/utils/http';

export interface SetlistSongInput {
  id?: string;
  title: string;
  artist?: string | null;
  key?: string | null;
  notes?: string | null;
}

export interface CreateSetlistParams {
  title: string;
  status?: SetlistStatus;
  songs?: SetlistSongInput[];
}

export interface PatchSetlistParams {
  title?: string;
  status?: SetlistStatus;
  songs?: SetlistSongInput[];
}

const list = async (bandId: string): Promise<Setlist[]> => {
  const { data } = await http.get<{ setlists: Setlist[] }>(`/api/bands/${bandId}/setlists`);
  return data?.setlists ?? [];
};

const get = async (bandId: string, setlistId: string): Promise<Setlist> => {
  const { data } = await http.get<{ setlist: Setlist }>(
    `/api/bands/${bandId}/setlists/${setlistId}`
  );
  return data.setlist;
};

const create = async (bandId: string, params: CreateSetlistParams): Promise<string> => {
  const { data } = await http.post<{ setlistId: string }>(`/api/bands/${bandId}/setlists`, params);
  return data.setlistId;
};

const update = async (
  bandId: string,
  setlistId: string,
  params: PatchSetlistParams
): Promise<Setlist> => {
  const { data } = await http.patch<{ setlist: Setlist }>(
    `/api/bands/${bandId}/setlists/${setlistId}`,
    params
  );
  return data.setlist;
};

const remove = async (bandId: string, setlistId: string): Promise<void> => {
  await http.delete(`/api/bands/${bandId}/setlists/${setlistId}`);
};

export const setlistsRepository = {
  list,
  get,
  create,
  update,
  remove,
};
