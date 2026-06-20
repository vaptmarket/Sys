import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | undefined | null) {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2');
  }
  return value;
}

export function formatCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  const amount = Number(digits) / 100;
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/\D/g, '')) / 100;
}

export function formatNumber(value: number): string {
  if (value < 1000) return value.toString();
  if (value < 1000000) {
    const formatted = (value / 1000).toFixed(1);
    return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'k';
  }
  const formatted = (value / 1000000).toFixed(1);
  return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'M';
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // If already matches the target embed template structure with autoplay, bypass
  if (cleanUrl.includes('youtube.com/embed/') && (cleanUrl.includes('autoplay=1') || cleanUrl.includes('mute=1'))) {
    return cleanUrl;
  }

  // Regex to extract video id for youtube.com (watch, embed, shorts) and youtu.be
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);

  if (match && match[2].length === 11) {
    const videoId = match[2];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
  }

  return null;
}

