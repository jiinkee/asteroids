# Asteroids
This is an implementation of a basic one-player Asteroids game using reactive functional programming for FIT2102 Programming Paradigms Assignment 1.

### Game Play
Try the game at https://peijiin.github.io/asteroids/

### Features implemented
- A ship movable by arrow keys and able to shoot and destroy asteroids
- Big asteroids break down into smaller asteroids when shot
- Only smaller asteroids can be destroyed when shot
- 20 points are awarded for each destroyed small asteroid
- The ship has 3 lives
- A collision between the ship and any asteroid will deduct the ship's lives by 1
- Indestructable enemy will also appear out of nowhere and moves at random speed
- Game ends when all lives are lost or the ship collides with the enemy
- Both ship and asteroids wrap around the screen edges

### Credits
Game template provided by Professor Tim Dwyer.
