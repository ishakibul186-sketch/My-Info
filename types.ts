export interface Note {
  id: string;
  name: string;
  title: string;
  message: string; // HTML content
  timestamp: number;
  isFavorite: boolean;
}

export interface UserSettings {
  userId: string;
  theme: 'dark' | 'light';
}

export enum SortOption {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  AZ = 'AZ'
}