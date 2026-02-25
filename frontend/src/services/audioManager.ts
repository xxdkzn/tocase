import { useSettingsStore } from '@/store/settingsStore';

type SoundName = 'reel-spin' | 'reveal' | 'legendary';

/**
 * AudioManager - Singleton service for managing game sound effects
 * 
 * Features:
 * - Preloads audio files on initialization
 * - Respects user sound preferences from settingsStore
 * - Handles audio loading errors gracefully
 * - Supports looping sounds (reel-spin)
 * - Volume control (default 0.7)
 */
class AudioManager {
  private static instance: AudioManager;
  private audioMap: Map<SoundName, HTMLAudioElement>;
  private defaultVolume: number = 0.7;
  private isInitialized: boolean = false;

  private constructor() {
    this.audioMap = new Map();
  }

  /**
   * Get singleton instance of AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize and preload all audio files
   * For MVP, we use placeholder silent audio data URLs
   * In production, replace with actual audio file paths
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const soundFiles: Record<SoundName, string> = {
      // For MVP: Using silent audio data URLs as placeholders
      // In production: Replace with actual paths like '/sounds/reel-spin.mp3'
      'reel-spin': this.createSilentAudio(),
      'reveal': this.createSilentAudio(),
      'legendary': this.createSilentAudio(),
    };

    // Preload all audio files
    const loadPromises = Object.entries(soundFiles).map(([name, src]) => {
      return this.loadAudio(name as SoundName, src);
    });

    try {
      await Promise.all(loadPromises);
      this.isInitialized = true;
      console.log('[AudioManager] All audio files preloaded successfully');
    } catch (error) {
      console.warn('[AudioManager] Some audio files failed to load:', error);
      // Continue anyway - graceful degradation
      this.isInitialized = true;
    }
  }

  /**
   * Load a single audio file
   */
  private async loadAudio(name: SoundName, src: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      audio.addEventListener('canplaythrough', () => {
        audio.volume = this.defaultVolume;
        this.audioMap.set(name, audio);
        resolve();
      }, { once: true });

      audio.addEventListener('error', (e) => {
        console.warn(`[AudioManager] Failed to load audio: ${name}`, e);
        // Create a silent fallback
        const silentAudio = new Audio(this.createSilentAudio());
        silentAudio.volume = this.defaultVolume;
        this.audioMap.set(name, silentAudio);
        resolve(); // Resolve anyway for graceful degradation
      }, { once: true });

      audio.src = src;
      audio.preload = 'auto';
      audio.load();
    });
  }

  /**
   * Create a silent audio data URL (placeholder for MVP)
   * This is a minimal silent MP3 file encoded as base64
   */
  private createSilentAudio(): string {
    // Minimal silent MP3 (0.1 seconds)
    return 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v////////////////////////////////////////////////////////////////AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////////////////////////////////////////////////////////////////';
  }

  /**
   * Play a sound effect
   * Checks soundEnabled preference before playing
   */
  public play(soundName: SoundName, loop: boolean = false): void {
    const soundEnabled = useSettingsStore.getState().soundEnabled;
    
    if (!soundEnabled) {
      return;
    }

    const audio = this.audioMap.get(soundName);
    if (!audio) {
      console.warn(`[AudioManager] Audio not found: ${soundName}`);
      return;
    }

    try {
      audio.loop = loop;
      audio.currentTime = 0; // Reset to start
      const playPromise = audio.play();

      // Handle play promise (required for some browsers)
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`[AudioManager] Failed to play audio: ${soundName}`, error);
        });
      }
    } catch (error) {
      console.warn(`[AudioManager] Error playing audio: ${soundName}`, error);
    }
  }

  /**
   * Stop a specific sound
   */
  public stop(soundName: SoundName): void {
    const audio = this.audioMap.get(soundName);
    if (!audio) {
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
    } catch (error) {
      console.warn(`[AudioManager] Error stopping audio: ${soundName}`, error);
    }
  }

  /**
   * Stop all currently playing sounds
   */
  public stopAll(): void {
    this.audioMap.forEach((audio, name) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
      } catch (error) {
        console.warn(`[AudioManager] Error stopping audio: ${name}`, error);
      }
    });
  }

  /**
   * Set volume for all sounds (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    this.defaultVolume = Math.max(0, Math.min(1, volume));
    this.audioMap.forEach((audio) => {
      audio.volume = this.defaultVolume;
    });
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this.defaultVolume;
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// Initialize on module load
audioManager.initialize().catch((error) => {
  console.warn('[AudioManager] Initialization failed:', error);
});
