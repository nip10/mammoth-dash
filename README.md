# Multiplayer Racing Game

A real-time multiplayer racing game built with Next.js, Three.js, and PartyKit.

## Features

- Real-time multiplayer racing with WebSockets
- 3D graphics powered by Three.js and React Three Fiber
- Physics-based gameplay with gravity and terrain effects
- Host-controlled game sessions with room codes
- Responsive UI with game status and player scores
- Jump mechanics to gain advantage during races

## How to Play

1. **Create or Join a Game**
   - The host creates a game and receives a room code
   - Other players join using the room code
   - Players appear on the starting ramp

2. **Start the Race**
   - The host can press the "Start Race" button when all players are ready
   - Players automatically start sliding down the mountain

3. **Controls**
   - Press SPACE to jump
   - Jumping helps you gain speed and avoid obstacles
   - Players automatically move forward based on terrain inclination

4. **Winning**
   - First player to reach the finish line wins
   - Scores are based on completion time
   - Player positions are shown in real-time

## Technical Stack

- **Frontend**: Next.js, React, TypeScript
- **3D Rendering**: Three.js, React Three Fiber, Drei
- **Physics**: React Three Cannon
- **Multiplayer**: PartyKit WebSockets
- **State Management**: Zustand

## Development

# Project Structure

- `/components` - React components including 3D game elements
- `/pages` - Next.js pages and API routes
- `/public` - Static assets including textures
- `/store` - Zustand state management
- `/types` - TypeScript type definitions
- `/utils` - Utility functions
- `/party` - PartyKit server code for multiplayer functionality

# Future Improvements

- Add more varied terrain with obstacles
- Implement power-ups and special abilities
- Add customizable player characters
- Create tournament mode with multiple races
- Add sound effects and background music

```bash
# Install dependencies
npm install

# Run PartyKit WebSocket server
npx partykit dev

# In a separate terminal, run the Next.js development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
