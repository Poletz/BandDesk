export enum Tab {
  PROFILE = 'profile',
  SECURITY = 'security',
  LIVE = 'live',
  DOCS = 'docs',
  SETLISTS = 'setlists',
  CALENDAR = 'calendar',
  USERS = 'users',
}

export interface Provider {
  id: string;
  providerId: string; // "google" | "credentials"
}
