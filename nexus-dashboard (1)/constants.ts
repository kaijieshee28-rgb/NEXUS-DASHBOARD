import { Shortcut } from './types';

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: '1',
    title: 'Google',
    url: 'https://www.google.com',
    color: '#4285F4',
    iconUrl: 'https://www.google.com/s2/favicons?sz=256&domain_url=google.com'
  },
  {
    id: '2',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    color: '#FF0000',
    iconUrl: 'https://www.google.com/s2/favicons?sz=256&domain_url=youtube.com'
  },
  {
    id: '3',
    title: 'Gmail',
    url: 'https://mail.google.com',
    color: '#EA4335',
    iconUrl: 'https://www.google.com/s2/favicons?sz=256&domain_url=mail.google.com'
  },
  {
    id: '4',
    title: 'GitHub',
    url: 'https://github.com',
    color: '#181717',
    iconUrl: 'https://www.google.com/s2/favicons?sz=256&domain_url=github.com'
  },
  {
    id: '5',
    title: 'Reddit',
    url: 'https://www.reddit.com',
    color: '#FF4500',
    iconUrl: 'https://www.google.com/s2/favicons?sz=256&domain_url=reddit.com'
  },
  {
    id: '6',
    title: 'X',
    url: 'https://twitter.com',
    color: '#1DA1F2',
    iconUrl: 'https://www.google.com/s2/favicons?sz=256&domain_url=twitter.com'
  }
];

export const MOCK_USER_NAME = "Traveler";