# Audio System Documentation

## Overview

The audio system provides immersive sound effects for the case opening experience. It's built with a singleton pattern for efficient resource management and respects user preferences.

## Architecture

### AudioManager Service (`audioManager.ts`)

The `AudioManager` class is a singleton that manages all game audio:

- **Singleton Pattern**: Ensures only one instance manages audio resources
- **Preloading**: All audio files are preloaded on initialization to avoid delays
- **Graceful Degradation**: Handles loading errors without breaking the app
- **User Preferences**: Checks `soundEnabled` from settingsStore before playing
- **Volume Control**: Default volume set to 0.7 (70%)

### Sound Effects

| Sound Name | Usage | Loop | Timing |
|------------|-------|------|--------|
| `reel-spin` | Plays during case opening animation | Yes | 0-5s (entire animation) |
| `reveal` | Plays when NFT is revealed | No | At 5s mark (when reel stops) |
| `legendary` | Special sound for Legendary drops | No | At 5s mark (in addition to reveal) |

## Integration

### CaseOpeningAnimation Component

The animation component integrates audio at key moments:

```typescript
// Start animation - play looping reel-spin
audioManager.play('reel-spin', true);

// Animation completes - stop reel-spin, play reveal
audioManager.stop('reel-spin');
audioManager.play('reveal');

// Legendary drop - play special sound
if (winningNFT.rarity === 'Legendary') {
  audioManager.play('legendary');
}

// Cleanup on unmount
audioManager.stop('reel-spin');
```

## Current Implementation (MVP)

For the MVP, the system uses **silent placeholder audio** (base64-encoded minimal MP3). This allows:

- Testing the audio system without actual audio files
- Demonstrating the integration points
- Easy replacement with real audio later

## Production Implementation

### Step 1: Prepare Audio Files

Create or source three audio files meeting these requirements:

**Technical Specifications:**
- Format: MP3 (primary) or OGG (fallback)
- Max Size: 100KB per file
- Sample Rate: 44.1kHz
- Bitrate: 128kbps or lower
- Channels: Stereo or Mono

**Duration Guidelines:**
- `reel-spin.mp3`: 2-3 seconds (will loop seamlessly)
- `reveal.mp3`: 1-2 seconds (short, punchy)
- `legendary.mp3`: 2-3 seconds (celebratory)

**Sound Design Tips:**
- **reel-spin**: Mechanical, rhythmic sound (like slot machine reels)
- **reveal**: Bright, attention-grabbing (like a "ding" or "chime")
- **legendary**: Epic, triumphant (fanfare, bells, celebration)

### Step 2: Place Files

Put audio files in the public directory:

```
frontend/public/sounds/
  ├── reel-spin.mp3
  ├── reveal.mp3
  └── legendary.mp3
```

### Step 3: Update AudioManager

In `frontend/src/services/audioManager.ts`, update the `initialize()` method:

```typescript
public async initialize(): Promise<void> {
  if (this.isInitialized) {
    return;
  }

  const soundFiles: Record<SoundName, string> = {
    'reel-spin': '/sounds/reel-spin.mp3',
    'reveal': '/sounds/reveal.mp3',
    'legendary': '/sounds/legendary.mp3',
  };

  // Rest of the initialization code...
}
```

### Step 4: Test

1. Enable sound in settings (Profile page)
2. Open a case and verify:
   - Reel-spin sound plays during animation
   - Reveal sound plays when reel stops
   - Legendary sound plays for Legendary drops
3. Disable sound and verify no audio plays
4. Test on multiple browsers (Chrome, Safari, Firefox)

## Browser Compatibility

### Supported Formats

Different browsers support different audio formats:

| Browser | MP3 | OGG | WAV |
|---------|-----|-----|-----|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ✅ | ❌ | ✅ |
| Edge | ✅ | ✅ | ✅ |

**Recommendation**: Use MP3 for maximum compatibility (supported by all major browsers).

### Autoplay Policies

Modern browsers restrict autoplay of audio. Our implementation handles this:

1. Audio is user-initiated (triggered by opening a case)
2. Play promises are caught to handle autoplay blocks
3. Errors are logged but don't break the experience

## API Reference

### AudioManager Methods

#### `getInstance(): AudioManager`
Get the singleton instance.

```typescript
import { audioManager } from '@/services/audioManager';
```

#### `initialize(): Promise<void>`
Initialize and preload all audio files. Called automatically on module load.

#### `play(soundName: SoundName, loop?: boolean): void`
Play a sound effect.

```typescript
audioManager.play('reveal'); // Play once
audioManager.play('reel-spin', true); // Play looping
```

#### `stop(soundName: SoundName): void`
Stop a specific sound.

```typescript
audioManager.stop('reel-spin');
```

#### `stopAll(): void`
Stop all currently playing sounds.

```typescript
audioManager.stopAll();
```

#### `setVolume(volume: number): void`
Set volume for all sounds (0.0 to 1.0).

```typescript
audioManager.setVolume(0.5); // 50% volume
```

#### `getVolume(): number`
Get current volume level.

```typescript
const volume = audioManager.getVolume(); // Returns 0.7 by default
```

## User Settings Integration

The audio system integrates with the settings store:

```typescript
// In settingsStore.ts
interface SettingsState {
  soundEnabled: boolean;
  toggleSound: () => void;
}

// AudioManager checks this before playing
const soundEnabled = useSettingsStore.getState().soundEnabled;
```

Users can toggle sound in the Profile page, and the preference is persisted to localStorage.

## Performance Considerations

### Preloading
All audio files are preloaded on app initialization to ensure:
- No delays when playing sounds
- Smooth user experience
- Predictable loading behavior

### Memory Usage
With 3 audio files at ~100KB each, total memory usage is ~300KB, which is negligible for modern devices.

### Mobile Considerations
- Audio files are kept small (under 100KB) for fast loading on mobile networks
- Looping sounds are optimized to loop seamlessly without gaps
- Volume is set to 0.7 to avoid being too loud on mobile devices

## Troubleshooting

### Sound Not Playing

1. **Check user preference**: Verify sound is enabled in settings
2. **Check browser console**: Look for AudioManager warnings
3. **Check file paths**: Ensure audio files are in `/public/sounds/`
4. **Check browser support**: Test in different browsers
5. **Check autoplay policy**: Some browsers block autoplay

### Audio Loading Errors

The AudioManager handles loading errors gracefully:
- Failed loads are logged to console
- Silent fallback audio is used
- App continues to function normally

### Performance Issues

If audio causes performance problems:
- Reduce audio file sizes (lower bitrate)
- Use shorter audio clips
- Consider lazy loading audio (load on first case open)

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic Volume**: Adjust volume based on animation phase
2. **More Sounds**: Add sounds for other actions (inventory, selling, level up)
3. **Sound Themes**: Allow users to choose different sound packs
4. **Spatial Audio**: Use Web Audio API for 3D positioning
5. **Music**: Add background music with separate volume control
6. **Format Detection**: Automatically choose MP3 or OGG based on browser support
7. **Compression**: Use advanced audio compression techniques
8. **Caching**: Implement service worker caching for audio files

## Resources

### Audio Creation Tools
- **Audacity**: Free, open-source audio editor
- **GarageBand**: Mac audio creation tool
- **FL Studio**: Professional DAW

### Sound Libraries
- **Freesound.org**: Free sound effects library
- **Zapsplat.com**: Free sound effects for games
- **Soundsnap.com**: Professional sound library

### Audio Optimization
- **FFmpeg**: Command-line tool for audio conversion
- **Audacity**: Can export with custom bitrate/sample rate
- **Online Audio Converter**: Web-based conversion tools

### Example FFmpeg Commands

Convert to MP3 with 128kbps:
```bash
ffmpeg -i input.wav -b:a 128k -ar 44100 output.mp3
```

Trim audio to 2 seconds:
```bash
ffmpeg -i input.mp3 -t 2 -c copy output.mp3
```

Normalize volume:
```bash
ffmpeg -i input.mp3 -filter:a loudnorm output.mp3
```

## Testing Checklist

- [ ] Audio files are under 100KB each
- [ ] Audio files are in `/public/sounds/` directory
- [ ] AudioManager paths are updated to real files
- [ ] Sound plays during case opening animation
- [ ] Reel-spin sound loops seamlessly
- [ ] Reveal sound plays when reel stops
- [ ] Legendary sound plays for Legendary drops
- [ ] Sound respects user preference (on/off)
- [ ] No audio plays when sound is disabled
- [ ] Audio stops on component unmount
- [ ] No console errors related to audio
- [ ] Works on Chrome, Safari, Firefox
- [ ] Works on iOS and Android (Telegram WebApp)
- [ ] Volume level is appropriate (not too loud/quiet)
- [ ] No performance impact on animation (60fps maintained)

## Conclusion

The audio system is fully implemented and ready for production audio files. The current MVP uses silent placeholders, making it easy to test the integration without actual audio. Simply replace the placeholder paths with real audio files to enable the full audio experience.
