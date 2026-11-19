// Generates offline placeholder portraits: public/photos/p01.svg ... p36.svg
//
//   npm run photos
//
// Each SVG is 600x800: a flat pastel background (cycling through the Coy palette),
// three large overlapping soft shapes in other palette colors, and the person's
// initial, huge and bold, in ink. No faces, no external assets, no network.
// Output is deterministic, so re-running produces identical files.
//
// Windows-friendly: only node:fs / node:path / node:url, no shell commands.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROFILES_PATH = path.join(ROOT, "data", "profiles.json");
const OUT_DIR = path.join(ROOT, "public", "photos");

const W = 600;
const H = 800;
const INK = "#15111e";

// Same values as the tokens in app/globals.css. Backgrounds cycle through this order.
const PALETTE = [
  "#e6dfff", // lavender
  "#c9f3de", // mint
  "#ffdfcf", // peach
  "#ffe066", // yellow
  "#d9ecff", // sky
  "#ffe3ee", // pink-soft
];

// Small seeded PRNG so each portrait is stable between runs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rand, min, max) => min + rand() * (max - min);
const round = (n) => Math.round(n * 10) / 10;

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shape(rand, fill) {
  const cx = round(between(rand, 60, W - 60));
  const cy = round(between(rand, 120, H - 120));
  const kind = rand();

  if (kind < 0.4) {
    const r = round(between(rand, 140, 230));
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  }
  if (kind < 0.7) {
    const rx = round(between(rand, 150, 250));
    const ry = round(between(rand, 110, 190));
    const rot = round(between(rand, -40, 40));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  }
  const size = round(between(rand, 240, 360));
  const radius = round(between(rand, 60, 110));
  const rot = round(between(rand, -25, 25));
  return `<rect x="${round(cx - size / 2)}" y="${round(cy - size / 2)}" width="${size}" height="${size}" rx="${radius}" fill="${fill}" transform="rotate(${rot} ${cx} ${cy})"/>`;
}

function portrait(profile, index) {
  const rand = mulberry32(1000 + index * 7919);
  const bg = PALETTE[index % PALETTE.length];
  const others = PALETTE.filter((c) => c !== bg);

  // Three different non-background colors, picked without repeats.
  const picks = [];
  while (picks.length < 3) {
    const color = others[Math.floor(rand() * others.length)];
    if (!picks.includes(color)) picks.push(color);
  }

  const initial = escapeXml(profile.name.trim().charAt(0).toUpperCase());

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    ...picks.map((color) => shape(rand, color)),
    `<text x="${W / 2}" y="${H / 2 + 120}" text-anchor="middle" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-size="380" font-weight="900" letter-spacing="-12" fill="${INK}">${initial}</text>`,
    `</svg>`,
    "",
  ].join("\n");
}

const profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
fs.mkdirSync(OUT_DIR, { recursive: true });

profiles.forEach((profile, index) => {
  const file = path.join(OUT_DIR, `${profile.id}.svg`);
  fs.writeFileSync(file, portrait(profile, index), "utf8");
});

console.log(`Wrote ${profiles.length} photos to ${path.relative(ROOT, OUT_DIR)}`);
