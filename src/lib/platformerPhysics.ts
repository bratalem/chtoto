export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlatformerPlayer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  grounded: boolean;
};

export type PlatformerInput = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

const gravity = 950;
const moveSpeed = 118;
const jumpPower = 330;

function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function playerRect(player: PlatformerPlayer): Rect {
  return { x: player.x, y: player.y, width: player.width, height: player.height };
}

export function updatePlatformerPlayer(
  player: PlatformerPlayer,
  input: PlatformerInput,
  colliders: Rect[],
  delta: number,
) {
  const next = { ...player, grounded: false };
  const direction = Number(input.right) - Number(input.left);
  next.vx = direction * moveSpeed;
  if (direction !== 0) next.facing = direction > 0 ? 1 : -1;
  if (input.jump && player.grounded) next.vy = -jumpPower;

  next.vy += gravity * delta;
  next.x += next.vx * delta;
  for (const collider of colliders) {
    if (!overlaps(playerRect(next), collider)) continue;
    if (next.vx > 0) next.x = collider.x - next.width;
    if (next.vx < 0) next.x = collider.x + collider.width;
  }

  next.y += next.vy * delta;
  for (const collider of colliders) {
    if (!overlaps(playerRect(next), collider)) continue;
    if (next.vy > 0) {
      next.y = collider.y - next.height;
      next.grounded = true;
    }
    if (next.vy < 0) next.y = collider.y + collider.height;
    next.vy = 0;
  }

  next.x = Math.max(0, Math.min(512 - next.width, next.x));
  if (next.y > 140) {
    next.x = 28;
    next.y = 72;
    next.vy = 0;
  }

  return next;
}
