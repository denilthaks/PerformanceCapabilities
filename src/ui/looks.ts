// The four player looks: names and pixel palettes for the player sprite in
// sprites.tsx. Kept free of React so the standalone prototype can import it.

export interface Palette { hair: string; hairShade: string; skin: string; suit: string; suitHi: string; suitShade: string; accent: string }

export const PLAYER_LOOKS: Record<string, { label: string; palette: Palette }> = {
  ember: { label: 'Ember', palette: { hair: '#5a1a14', hairShade: '#3a0f0c', skin: '#c08a6a', suit: '#18141f', suitHi: '#2a2434', suitShade: '#0a090d', accent: '#ff1f4b' } },
  onyx: { label: 'Onyx', palette: { hair: '#120d0b', hairShade: '#050404', skin: '#6b4430', suit: '#1c1f2b', suitHi: '#2e3344', suitShade: '#0b0c12', accent: '#e0b34a' } },
  vanta: { label: 'Vanta', palette: { hair: '#d9dbe2', hairShade: '#a9adb9', skin: '#e2c2a6', suit: '#2a0610', suitHi: '#4a1426', suitShade: '#15040a', accent: '#c9ccd6' } },
  signal: { label: 'Signal', palette: { hair: '#3a2a22', hairShade: '#2a1c16', skin: '#b48a72', suit: '#18141f', suitHi: '#2a2434', suitShade: '#0a090d', accent: '#8f6a1e' } },
};
