import { db } from '@/utils/db';

export const bandsDB = db.collection('bands');
export const bandMembershipsDB = db.collection('band_memberships');
export const bandInvitesDB = db.collection('band_invites');
export const setlistsDB = db.collection('setlists');
export const bandDocumentsDB = db.collection('band_documents');
export const auditLogsDB = db.collection('audit_logs');

export const buildBandMembershipDocId = (bandId: string, userId: string) => `${bandId}_${userId}`;
