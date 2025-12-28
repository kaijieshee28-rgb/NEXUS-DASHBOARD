export interface Shortcut {
  id: string;
  title: string;
  url: string;
  iconUrl?: string;
  color?: string; // Optional hex color for the block
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS',
  AI_AGENT = 'AI_AGENT',
  MAPS = 'MAPS',
  IMAGE_STUDIO = 'IMAGE_STUDIO'
}

export interface UserPreferences {
  userName: string;
  theme: 'dark' | 'light';
}