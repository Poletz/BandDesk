import { BandDocument } from '@/interfaces';
import { documentsMockData } from './documents.mock';

let inMemoryDocuments: BandDocument[] = [...documentsMockData];

export const documentsRepository = {
  list: () => inMemoryDocuments,
  reset: () => {
    inMemoryDocuments = [...documentsMockData];
  },
};
