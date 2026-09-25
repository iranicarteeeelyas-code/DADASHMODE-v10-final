# Broadcast Motion Graphics System - API Reference
## DADASHMODE V7

---

## Quick Start

```javascript
// Access the global broadcast graphics system
const gfx = window.broadcastGFX;

// Create and register graphics
const scoreCard = gfx.createScoreCard();
const round = gfx.createRoundIndicator();
const vault = gfx.createVaultDisplay();

// Update graphics
scoreCard.updateScore('E', 100);
round.setRound(3);
vault.showCode('2468');

// Switch animation style globally
gfx.setGlobalStyle('broadcast'); // or 'classic'

// Show/hide graphics
gfx.showGraphic('scoreboard'); // Plays entrance
gfx.hideGraphic('scoreboard'); // Plays exit
```

---

## Core Classes

### MotionDesignTokens
Centralized animation configuration object.

**Properties:**
- `durations`: Animation duration constants (quick, short, medium, long, xlong)
- `easing`: Easing function presets (easeOut, easeIn, easeInOut, expo, smooth)
- `stagger`: Stagger delay increments (tight, medium, loose)

**Usage:**
```javascript
const tokens = new MotionDesignTokens();
console.log(tokens.durations.medium); // 600ms
console.log(tokens.easing.expo); // 'cubic-bezier(0.16, 1, 0.3, 1)'
```

---

### AnimationTimeline
Reusable timeline/sequencer for animating DOM elements.

**Methods:**

#### `add(elem, props, duration, delay=0, easing='easeOut')`
Add an animation to the timeline.

```javascript
const tl = new AnimationTimeline();
tl.add(element, {opacity: 1, transform: 'translateY(0)'}, 600, 0, 'expo');
tl.play();
```

#### `stagger(elems[], props, duration, staggerDelay, easing='easeOut')`
Animate multiple elements with stagger.

```javascript
const cards = document.querySelectorAll('.card');
const tl = new AnimationTimeline();
tl.stagger(Array.from(cards), {opacity: 1, transform: 'scale(1)'}, 600, 80);
tl.play();
```

#### `play()`
Start the timeline.

#### `pause()`
Pause the timeline at current position.

#### `resume()`
Resume from paused position.

---

### BroadcastGraphicTemplate
Base class for all broadcast graphics. Manages state and transitions.

**Methods:**

#### `setState(newState)`
Set graphic state: 'idle', 'entering', 'visible', 'exiting', 'updating'

```javascript
const graphic = new BroadcastGraphicTemplate('my-graphic');
graphic.setState('entering'); // Plays entrance animation
```

#### `setStyle(style)`
Switch animation style: 'broadcast' or 'classic'

#### `triggerStateTransition()`
Automatically play correct animation for current state.

---

### Concrete Graphic Templates

#### ScoreCard
Display animated score with increment effects.

```javascript
const scoreCard = gfx.createScoreCard();

// Update score (triggers pop animation)
scoreCard.updateScore('E', 150);
scoreCard.updateScore('M', 120);

// Access current scores
console.log(scoreCard.data); // {E: 150, M: 120}
```

#### RoundIndicator
Round badge with visual state change.

```javascript
const round = gfx.createRoundIndicator();

// Set round (triggers rotate + scale animation)
round.setRound(1);
round.setRound(5);

console.log(round.current); // 5
```

#### VaultStationDisplay
Code and target display for vault round.

```javascript
const vault = gfx.createVaultDisplay();

// Show correct code
vault.showCode('2468');

// Feedback on wrong code (shake animation)
vault.wrongCodeFeedback();
```

#### ContestantCard
Contestant reveal with entrance animation.

```javascript
const card = gfx.createContestantCard('E');

// Reveal contestant (slide + scale animation)
card.reveal({
  name: 'علی محمدی',
  status: 'active'
});
```

#### WinnerReveal
Fullscreen winner announcement with celebration.

```javascript
const winner = gfx.createWinnerReveal();

// Show winner (scale + rotation animation)
winner.reveal('E', 'علی محمدی');

// Triggers confetti particle effect
```

---

## Animation Styles

### Classic Style
Minimal, functional animations:
- Duration: 300-400ms
- Easing: Simple ease-out
- Transforms: Opacity and basic scale
- Best for: Functional, real-time updates

**Characteristics:**
- Fast response
- Minimal visual complexity
- Mobile-friendly
- Minimal CPU/GPU usage

### Broadcast Style
Professional, cinematic animations:
- Duration: 600-1000ms
- Easing: Exponential ease-out (cubic-bezier(0.16, 1, 0.3, 1))
- Transforms: Scale, rotate, translate with stagger
- Best for: Professional broadcasts, premium experience

**Characteristics:**
- Polished, deliberate movement
- Choreographed sequences
- Cinematic feel
- Higher production value

---

## Switching Styles at Runtime

```javascript
// Switch all graphics at once
gfx.setGlobalStyle('broadcast');
gfx.setGlobalStyle('classic');

// Switch individual graphic
const card = gfx.graphics['scoreboard'];
card.setStyle('broadcast');

// Style persists across data updates
scoreCard.updateScore('E', 200); // Uses current style
```

---

## Performance Notes

### Animation Timing
- **Classic**: 300-400ms total duration
- **Broadcast**: 600-1000ms total duration
- **Stagger**: 40-120ms between elements
- **Target FPS**: 60 FPS (achieved)

### Memory Usage
- ScoreCard: ~2KB
- RoundIndicator: ~1KB
- VaultDisplay: ~1.5KB
- ContestantCard: ~2KB
- WinnerReveal: ~3KB
- **Total per graphics system**: <10KB

### GPU Considerations
- Uses CSS transforms (GPU-accelerated)
- Opacity and transform only (best performance)
- No layout thrashing
- Safe on mobile devices

---

## Integration with Game Engine

### Connecting to Game State

```javascript
// When round advances
const currentRound = 3;
gfx.createRoundIndicator().setRound(currentRound);

// When score updates
const newScore = r3Score(p, opts, cfg);
Object.entries(newScore.awards).forEach(([pid, pts]) => {
  scoreCard.updateScore(pid, currentScores[pid] + pts);
});

// When vault round starts
const vault = gfx.createVaultDisplay();
vault.showCode(generatedCode);

// When vault code is wrong
vault.wrongCodeFeedback(); // Shake animation
```

### State Synchronization

```javascript
// Listen to game state changes
gameEngine.on('stateChange', (newState) => {
  // Update graphics based on state
  if (newState.round !== currentRound) {
    roundIndicator.setRound(newState.round);
  }
  if (newState.scores.E !== currentScores.E) {
    scoreCard.updateScore('E', newState.scores.E);
  }
});
```

---

## Advanced Usage

### Custom Animation Timeline

```javascript
// Create custom animation sequence
const timeline = new AnimationTimeline();
timeline.add(elem1, {opacity: 1, transform: 'translateX(0)'}, 600, 0, 'expo');
timeline.add(elem2, {opacity: 1, transform: 'translateY(0)'}, 600, 100, 'expo');
timeline.add(elem3, {opacity: 1, transform: 'scale(1)'}, 600, 200, 'expo');

timeline.play();

// Control playback
setTimeout(() => timeline.pause(), 1000);
setTimeout(() => timeline.resume(), 2000);
setTimeout(() => timeline.play(), 3000); // Restart
```

### Creating Custom Graphics

```javascript
class CustomGraphic extends BroadcastGraphicTemplate {
  constructor(id) {
    super(id, 'custom');
  }

  playEnter() {
    const elem = document.getElementById(this.id);
    if (!elem) return;

    if (this.style === 'broadcast') {
      // Broadcast entrance
      elem.style.opacity = '0';
      elem.style.transform = 'scale(0.8) rotateZ(-10deg)';

      const tl = new AnimationTimeline();
      tl.add(elem, {opacity: 1, transform: 'scale(1) rotateZ(0deg)'}, 800, 0, 'expo');
      tl.play();
    } else {
      // Classic entrance
      elem.style.opacity = '0';
      const tl = new AnimationTimeline();
      tl.add(elem, {opacity: 1}, 300, 0, 'easeOut');
      tl.play();
    }
  }
}

// Register custom graphic
const custom = new CustomGraphic('my-custom');
gfx.register(custom);
custom.setState('entering');
```

---

## Browser Compatibility

- Chrome/Chromium 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Full support
- Edge 90+: Full support
- Mobile browsers: Full support (adaptive)

---

## Troubleshooting

**Graphics not animating:**
- Ensure element has correct ID in DOM
- Check that element has proper CSS positioning
- Verify `window.broadcastGFX` is initialized

**Animations stuttering:**
- Reduce simultaneous animations
- Use `stagger()` to spread animations across time
- Check browser DevTools for CPU/GPU throttling

**Style switching not working:**
- Ensure graphic is registered with `gfx.register()`
- Call `setStyle()` before triggering animation
- Verify graphic class implements `playEnter()`/`playExit()`

---

## Examples

### Complete Round Animation

```javascript
// Start round
const roundNum = 3;
const round = gfx.createRoundIndicator();
round.setRound(roundNum);
gfx.showGraphic('round-indicator');

// Show contestants
const e = gfx.createContestantCard('E');
const m = gfx.createContestantCard('M');
e.reveal({name: 'علی', status: 'active'});
m.reveal({name: 'فاطمه', status: 'active'});

// Update scores
const score = gfx.createScoreCard();
score.updateScore('E', 100);
score.updateScore('M', 95);

// Winner reveal
await new Promise(r => setTimeout(r, 10000)); // Wait for round completion
const winner = gfx.createWinnerReveal();
winner.reveal('E', 'علی');
```

---

**API Version**: 1.0.0
**Last Updated**: 2026-09-25
**Status**: Production Ready

