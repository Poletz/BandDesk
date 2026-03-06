import { BandDocument } from '@/interfaces';

export const documentsMockData: BandDocument[] = [
  {
    id: 'doc-1',
    title: 'Main Technical Rider',
    category: 'technical-rider',
    fileName: 'tech-rider-v3.pdf',
    fileUrl: '#',
    uploadedAt: '2026-01-08T10:00:00.000Z',
    tags: ['live', 'required'],
  },
  {
    id: 'doc-2',
    title: 'Stage Plot Duo Setup',
    category: 'stage-plot',
    fileName: 'stage-plot-duo.png',
    fileUrl: '#',
    uploadedAt: '2026-01-20T15:20:00.000Z',
  },
  {
    id: 'doc-3',
    title: 'SIAE Declaration Template',
    category: 'siae',
    fileName: 'siae-template.docx',
    fileUrl: '#',
    uploadedAt: '2026-01-28T11:45:00.000Z',
  },
  {
    id: 'doc-4',
    title: 'Official Songbook',
    category: 'songbook',
    fileName: 'songbook-2026.pdf',
    fileUrl: '#',
    uploadedAt: '2026-02-02T18:05:00.000Z',
  },
];
