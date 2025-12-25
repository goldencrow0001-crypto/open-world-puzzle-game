import { Howl } from 'howler';

// Using reliable hosted assets for demo purposes.
// We manipulate 'rate' to give them a more tech/cyberpunk feel.
const SOUND_URLS = {
  move: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3',
  click: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-bounce.m4a', 
  success: 'https://codeskulptor-demos.commondatastorage.googleapis.com/nsmb_coin.mp3',
  error: 'https://codeskulptor-demos.commondatastorage.googleapis.com/galaxy/alien1_death.wav',
  interface: 'https://commondatastorage.googleapis.com/codeskulptor-assets/sounddogs/thrust.mp3', // For opening interfaces
  levelUp: 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg',
};

const sounds: Record<string, Howl> = {
  move: new Howl({ src: [SOUND_URLS.move], volume: 0.3, rate: 1.5 }), // Higher pitch pop
  click: new Howl({ src: [SOUND_URLS.click], volume: 0.4, rate: 2.0 }), // High blip
  success: new Howl({ src: [SOUND_URLS.success], volume: 0.4, rate: 1.0 }), // Coin sound
  error: new Howl({ src: [SOUND_URLS.error], volume: 0.3, rate: 0.8 }), // Low buzz
  interface: new Howl({ src: [SOUND_URLS.interface], volume: 0.2, rate: 3.0 }), // High tech whir
  levelUp: new Howl({ src: [SOUND_URLS.levelUp], volume: 0.4, rate: 1.2 }), // Faster fanfare
};

export type SoundType = keyof typeof sounds;

export const playSound = (type: SoundType) => {
  try {
    if (sounds[type]) {
      sounds[type].play();
    }
  } catch (e) {
    console.warn("Audio playback failed", e);
  }
};

export const toggleMute = (muted: boolean) => {
  try {
      // Howler global mute
      // @ts-ignore
      if (typeof Howler !== 'undefined') {
        // @ts-ignore
        Howler.mute(muted);
      }
  } catch(e) {
      console.warn("Audio mute failed", e);
  }
};