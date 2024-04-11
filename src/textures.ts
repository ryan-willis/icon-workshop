import seedrandom from "seedrandom";
import tinycolor from "tinycolor2";
import { TextureValue } from "./imagelib/types";

let rng: Function;

const rnd = () => rng();

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const SQRT_3 = Math.sqrt(3);
const SIN_60 = Math.sin((60 * Math.PI) / 180);

const TEXTURES: { [id: string]: (ctx: CanvasRenderingContext2D) => void } = {};

export function drawTexture(
  ctx: CanvasRenderingContext2D,
  { texture, seed, color }: TextureValue
) {
  ctx.fillStyle = tinycolor(color).toRgbString();
  rng = seedrandom(seed || "iconworkshop");
  TEXTURES[texture](ctx);
}

TEXTURES.stipple = (ctx) => {
  const MIN_R = 0.008;
  const MAX_R = 0.015;
  const COLS = Math.round(lerp(12, 30, rnd()));
  const DRIFT = 0.015;

  ctx.save();
  ctx.translate(0.5, 0.5);
  ctx.scale(2, 2);
  ctx.translate(-0.5, -0.5);
  ctx.beginPath();
  for (let x = 0; x < 1; x += 1 / COLS) {
    for (let y = 0; y < 1; y += 1 / COLS) {
      ctx.arc(
        x + (DRIFT * rnd()) / 0.5,
        y + (DRIFT * rnd()) / 0.5,
        lerp(MIN_R, MAX_R, rnd()),
        0,
        Math.PI * 2
      );
      ctx.closePath();
    }
  }
  ctx.fill();
  ctx.restore();
};

TEXTURES.mosaic = (ctx) => {
  const COLS = Math.round(lerp(6, 9, rnd()));
  const LEVELS = Math.round(lerp(2, 5, rnd()));

  ctx.save();
  ctx.translate(0.5, 0.5);
  ctx.scale(2, 2);
  ctx.translate(-0.5, -0.5);
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < COLS; y++) {
      ctx.globalAlpha = Math.round(LEVELS * rnd()) / LEVELS;
      ctx.fillRect(x / COLS, y / COLS, 1 / COLS, 1 / COLS);
    }
  }
  ctx.restore();
};

TEXTURES.waves = (ctx) => {
  const FREQ = Math.round(lerp(4, 18, rnd()));
  const LINES = Math.round(lerp(6, 8, rnd()));
  const THICKNESS = lerp(0.05, 0.5, rnd());
  const ROTATION = rnd() * Math.PI * 2;
  const D = 0.66; // 0.56 = roughly circular / equivalent to arcTo

  let step = 1 / FREQ;
  let cpOffs = (D * step) / 2; // control point offset
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = THICKNESS / LINES;
  ctx.lineJoin = "round";
  ctx.translate(0.5, 0.5);
  ctx.scale(2, 2);
  ctx.rotate(ROTATION);
  ctx.translate(-0.5, -0.5);
  ctx.translate(0, 0.5 / LINES);
  for (let l = 0; l < LINES; l++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < FREQ; i++) {
      ctx.bezierCurveTo(
        i * step + cpOffs,
        cpOffs * (i % 2 === 0 ? -1 : 1),
        (i + 1) * step - cpOffs,
        cpOffs * (i % 2 === 0 ? -1 : 1),
        (i + 1) * step,
        0
      );
    }
    ctx.stroke();
    ctx.translate(0, 1 / LINES);
  }
  ctx.restore();
};

TEXTURES.polka = (ctx) => {
  const RAD = lerp(0.1, 0.15, rnd());
  const HSPACE = lerp(0.1, 0.2, rnd()) + 2 * RAD;
  const NUM = Math.round(1 / HSPACE);
  const THICKNESS = lerp(0.01, 0.1, rnd());
  const ROTATION = rnd() * Math.PI * 2;

  ctx.save();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = THICKNESS;
  ctx.translate(0.5, 0.5);
  ctx.rotate(ROTATION);
  ctx.translate(-0.5, -0.5);
  ctx.translate(0.5, 0.5 + HSPACE / SQRT_3);
  for (let x = -NUM; x <= NUM; x++) {
    for (let y = -NUM; y <= NUM; y++) {
      ctx.beginPath();
      ctx.arc(
        x * HSPACE + (HSPACE / 2) * (y % 2 === 0 ? 0 : 1),
        y * HSPACE * SIN_60,
        RAD,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
};

TEXTURES.argyle = (ctx) => {
  const FREQ = Math.round(lerp(8, 14, rnd()));
  const ASPECT = lerp(1, 2, rnd());
  const LINES = FREQ / ASPECT;
  const H = 0.5 / LINES;
  const THICKNESS = lerp(0.01, 0.02, rnd());
  const FILL = rnd() < 0.5;

  let step = 1 / FREQ;
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = THICKNESS;
  ctx.translate(0.5, 0.5);
  ctx.scale(2, 2);
  ctx.translate(-0.5, -0.5);
  // ctx.translate(0, 0.5 / LINES);
  for (let l = 0; l < LINES; l++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < FREQ; i++) {
      ctx.lineTo((i + 0.5) * step, H * (i % 2 === 0 ? -1 : 1));
      ctx.lineTo((i + 1) * step, 0);
    }
    for (let i = FREQ - 1; i >= 0; i--) {
      ctx.lineTo((i + 1.5) * step, H * (i % 2 === 0 ? -1 : 1));
      ctx.lineTo((i + 1) * step, 0);
    }
    ctx.closePath();
    FILL ? ctx.fill() : ctx.stroke();
    ctx.translate(0, 1 / LINES);
  }
  ctx.restore();
};
