"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Download,
  ExternalLink,
  Link2,
  Shuffle,
  Watch,
  X,
  Copy,
  Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type CaseStyle = "diver" | "vintage" | "integrated" | "chronograph";
type DialColor =
  | "sunburst-blue"
  | "matte-black"
  | "silver-white"
  | "forest-green"
  | "salmon";
type StrapType =
  | "vintage-leather"
  | "steel-jubilee"
  | "rubber-fkm"
  | "nato-olive"
  | "mesh";

interface WatchConfig {
  caseStyle: CaseStyle;
  dialColor: DialColor;
  strapType: StrapType;
  strapColor: string;
  strapShine: number;
  dialFinish: number;
}

interface Option<T extends string> {
  id: T;
  label: string;
  swatch?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CASE_OPTIONS: Option<CaseStyle>[] = [
  { id: "diver", label: "Diver Case" },
  { id: "vintage", label: "Vintage Dress Watch" },
  { id: "integrated", label: "Integrated Bracelet" },
  { id: "chronograph", label: "Chronograph Case" },
];

const DIAL_OPTIONS: Option<DialColor>[] = [
  { id: "sunburst-blue", label: "Sunburst Blue", swatch: "#1e4a8a" },
  { id: "matte-black", label: "Matte Black", swatch: "#1a1a1a" },
  { id: "silver-white", label: "Silver White", swatch: "#d4d4d8" },
  { id: "forest-green", label: "Forest Green", swatch: "#1a4d3a" },
  { id: "salmon", label: "Salmon", swatch: "#e8927c" },
];

const STRAP_OPTIONS: Option<StrapType>[] = [
  { id: "vintage-leather", label: "Vintage Leather" },
  { id: "steel-jubilee", label: "Stainless Steel Jubilee" },
  { id: "rubber-fkm", label: "Rubber FKM" },
  { id: "nato-olive", label: "NATO Olive" },
  { id: "mesh", label: "Mesh Milanese" },
];

const STRAP_COLORS: Record<StrapType, { id: string; label: string; hex: string }[]> = {
  "vintage-leather": [
    { id: "cognac", label: "Cognac", hex: "#8B5A2B" },
    { id: "black", label: "Black", hex: "#1c1c1c" },
    { id: "tan", label: "Tan", hex: "#C4956A" },
    { id: "burgundy", label: "Burgundy", hex: "#6B2737" },
  ],
  "steel-jubilee": [
    { id: "steel", label: "Brushed Steel", hex: "#a8a8ae" },
    { id: "polished", label: "Polished Steel", hex: "#d4d4dc" },
    { id: "two-tone", label: "Two-Tone Gold", hex: "#c9a84c" },
  ],
  "rubber-fkm": [
    { id: "black", label: "Black", hex: "#111111" },
    { id: "navy", label: "Navy", hex: "#1a2744" },
    { id: "orange", label: "Racing Orange", hex: "#e85d04" },
  ],
  "nato-olive": [
    { id: "olive", label: "Olive", hex: "#4a5d23" },
    { id: "grey", label: "Grey", hex: "#4a4a4a" },
    { id: "navy-red", label: "Navy / Red", hex: "#1a2744" },
  ],
  mesh: [
    { id: "silver", label: "Silver Mesh", hex: "#b0b0b8" },
    { id: "black", label: "Black PVD", hex: "#2a2a2a" },
    { id: "gold", label: "Gold Mesh", hex: "#c9a84c" },
  ],
};

const AFFILIATE_LINKS: Record<
  StrapType,
  { title: string; price: string; url: string; vendor: string }[]
> = {
  "vintage-leather": [
    {
      title: "Horween Chromexcel Strap",
      price: "$89",
      vendor: "Crown & Buckle",
      url: "https://example.com/aff/leather-chromexcel",
    },
    {
      title: "Italian Calf Quick-Release",
      price: "$65",
      vendor: "Barton Bands",
      url: "https://example.com/aff/leather-calf",
    },
  ],
  "steel-jubilee": [
    {
      title: "Jubilee Bracelet — 20mm",
      price: "$149",
      vendor: "Strapcode",
      url: "https://example.com/aff/jubilee-20mm",
    },
    {
      title: "Oyster-Style End Links",
      price: "$35",
      vendor: "AliExpress Parts",
      url: "https://example.com/aff/end-links",
    },
  ],
  "rubber-fkm": [
    {
      title: "FKM Rubber Dive Strap",
      price: "$42",
      vendor: "ISOfrane",
      url: "https://example.com/aff/fkm-dive",
    },
    {
      title: "Tropic-Style Rubber",
      price: "$28",
      vendor: "Uncle Seiko",
      url: "https://example.com/aff/tropic",
    },
  ],
  "nato-olive": [
    {
      title: "Premium NATO — Olive",
      price: "$18",
      vendor: "Crown & Buckle",
      url: "https://example.com/aff/nato-olive",
    },
    {
      title: "Seatbelt NATO 2-Pack",
      price: "$24",
      vendor: "Barton Bands",
      url: "https://example.com/aff/nato-seatbelt",
    },
  ],
  mesh: [
    {
      title: "Milanese Mesh 20mm",
      price: "$55",
      vendor: "Strapcode",
      url: "https://example.com/aff/mesh-milanese",
    },
    {
      title: "Magnetic Mesh Clasp",
      price: "$38",
      vendor: "AliExpress Parts",
      url: "https://example.com/aff/mesh-magnetic",
    },
  ],
};

const DEFAULT_CONFIG: WatchConfig = {
  caseStyle: "diver",
  dialColor: "sunburst-blue",
  strapType: "vintage-leather",
  strapColor: "cognac",
  strapShine: 55,
  dialFinish: 70,
};

const CANVAS_W = 520;
const CANVAS_H = 640;

// ─── Config serialization ──────────────────────────────────────────────────────

function encodeConfig(config: WatchConfig): string {
  return btoa(JSON.stringify(config));
}

function decodeConfig(code: string): WatchConfig | null {
  try {
    const parsed = JSON.parse(atob(code)) as WatchConfig;
    if (parsed.caseStyle && parsed.dialColor && parsed.strapType) return parsed;
    return null;
  } catch {
    return null;
  }
}


// ─── Canvas helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function adjustColor(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
}

function getDialBaseColor(dial: DialColor): string {
  const map: Record<DialColor, string> = {
    "sunburst-blue": "#1e4a8a",
    "matte-black": "#141414",
    "silver-white": "#c8c8d0",
    "forest-green": "#1a4d3a",
    salmon: "#e8927c",
  };
  return map[dial];
}

function getStrapHex(config: WatchConfig): string {
  const colors = STRAP_COLORS[config.strapType];
  const match = colors.find((c) => c.id === config.strapColor);
  return match?.hex ?? colors[0].hex;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Strap rendering ───────────────────────────────────────────────────────────

function drawStrap(
  ctx: CanvasRenderingContext2D,
  config: WatchConfig,
  cx: number,
  cy: number,
) {
  const hex = getStrapHex(config);
  const shine = config.strapShine / 100;
  const strapW = 72;
  const topY = cy - 200;
  const bottomY = cy + 200;

  ctx.save();

  if (config.strapType === "vintage-leather") {
    const grad = ctx.createLinearGradient(cx - strapW / 2, topY, cx + strapW / 2, bottomY);
    grad.addColorStop(0, adjustColor(hex, -20 + shine * 15));
    grad.addColorStop(0.5, hex);
    grad.addColorStop(1, adjustColor(hex, -30));
    ctx.fillStyle = grad;

    // Top strap
    drawRoundRect(ctx, cx - strapW / 2, topY, strapW, cy - 95 - topY, 6);
    ctx.fill();
    // Bottom strap
    drawRoundRect(ctx, cx - strapW / 2, cy + 95, strapW, bottomY - cy - 95, 6);
    ctx.fill();

    // Stitching
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + shine * 0.1})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * (strapW / 2 - 8), topY + 10);
      ctx.lineTo(cx + side * (strapW / 2 - 8), cy - 95);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * (strapW / 2 - 8), cy + 95);
      ctx.lineTo(cx + side * (strapW / 2 - 8), bottomY - 10);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Leather grain (deterministic pattern to avoid flicker on re-render)
    ctx.globalAlpha = 0.08 + shine * 0.12;
    for (let i = 0; i < 40; i++) {
      const gx = cx - strapW / 2 + ((i * 17) % 100) * (strapW / 100);
      const gy = topY + ((i * 31) % 100) * ((bottomY - topY) / 100);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 3, gy + 1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (config.strapType === "steel-jubilee") {
    const linkH = 14;
    const drawLinks = (startY: number, endY: number) => {
      for (let y = startY; y < endY; y += linkH) {
        const isCenter = Math.floor((y - startY) / linkH) % 2 === 0;
        const lw = isCenter ? strapW - 10 : strapW;
        const lx = isCenter ? cx - lw / 2 : cx - strapW / 2;

        const lg = ctx.createLinearGradient(lx, y, lx + lw, y + linkH);
        lg.addColorStop(0, adjustColor(hex, -30 + shine * 40));
        lg.addColorStop(0.4, adjustColor(hex, 20 + shine * 30));
        lg.addColorStop(1, adjustColor(hex, -20));
        ctx.fillStyle = lg;
        drawRoundRect(ctx, lx, y, lw, linkH - 2, 3);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    };
    drawLinks(topY, cy - 95);
    drawLinks(cy + 95, bottomY);
  } else if (config.strapType === "rubber-fkm") {
    const grad = ctx.createLinearGradient(cx - strapW / 2, 0, cx + strapW / 2, 0);
    grad.addColorStop(0, adjustColor(hex, -15));
    grad.addColorStop(0.3, hex);
    grad.addColorStop(0.7, adjustColor(hex, 10 + shine * 20));
    grad.addColorStop(1, adjustColor(hex, -15));
    ctx.fillStyle = grad;
    drawRoundRect(ctx, cx - strapW / 2, topY, strapW, cy - 95 - topY, 8);
    ctx.fill();
    drawRoundRect(ctx, cx - strapW / 2, cy + 95, strapW, bottomY - cy - 95, 8);
    ctx.fill();

    // Vent holes
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let i = 0; i < 5; i++) {
      const hy = cy + 110 + i * 28;
      ctx.beginPath();
      ctx.ellipse(cx, hy, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.strapType === "nato-olive") {
    const stripeW = strapW + 16;
    const drawNato = (startY: number, endY: number) => {
      const natoGrad = ctx.createLinearGradient(cx - stripeW / 2, 0, cx + stripeW / 2, 0);
      if (config.strapColor === "navy-red") {
        natoGrad.addColorStop(0, "#1a2744");
        natoGrad.addColorStop(0.45, "#1a2744");
        natoGrad.addColorStop(0.45, "#8b1a1a");
        natoGrad.addColorStop(0.55, "#8b1a1a");
        natoGrad.addColorStop(0.55, "#1a2744");
        natoGrad.addColorStop(1, "#1a2744");
      } else {
        natoGrad.addColorStop(0, adjustColor(hex, -10));
        natoGrad.addColorStop(0.5, hex);
        natoGrad.addColorStop(1, adjustColor(hex, -10));
      }
      ctx.fillStyle = natoGrad;
      drawRoundRect(ctx, cx - stripeW / 2, startY, stripeW, endY - startY, 2);
      ctx.fill();

      // Keepers
      ctx.fillStyle = adjustColor(hex, -25);
      drawRoundRect(ctx, cx - stripeW / 2 + 4, startY + 20, stripeW - 8, 8, 2);
      ctx.fill();
    };
    drawNato(topY, cy - 95);
    drawNato(cy + 95, bottomY);

    // Secondary under strap
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = adjustColor(hex, 15);
    drawRoundRect(ctx, cx - (strapW - 8) / 2, topY + 5, strapW - 8, cy - 95 - topY - 10, 2);
    ctx.fill();
    drawRoundRect(ctx, cx - (strapW - 8) / 2, cy + 100, strapW - 8, bottomY - cy - 105, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (config.strapType === "mesh") {
    const drawMesh = (startY: number, endY: number) => {
      ctx.fillStyle = hex;
      drawRoundRect(ctx, cx - strapW / 2, startY, strapW, endY - startY, 4);
      ctx.fill();

      ctx.strokeStyle = `rgba(255,255,255,${0.1 + shine * 0.25})`;
      ctx.lineWidth = 0.5;
      for (let x = cx - strapW / 2; x < cx + strapW / 2; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y < endY; y += 5) {
        ctx.beginPath();
        ctx.moveTo(cx - strapW / 2, y);
        ctx.lineTo(cx + strapW / 2, y);
        ctx.stroke();
      }

      // Shine overlay
      const mg = ctx.createLinearGradient(cx - strapW / 2, startY, cx + strapW / 2, endY);
      mg.addColorStop(0, "rgba(255,255,255,0)");
      mg.addColorStop(0.5, `rgba(255,255,255,${shine * 0.15})`);
      mg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = mg;
      drawRoundRect(ctx, cx - strapW / 2, startY, strapW, endY - startY, 4);
      ctx.fill();
    };
    drawMesh(topY, cy - 95);
    drawMesh(cy + 95, bottomY);
  }

  ctx.restore();
}

// ─── Case rendering ────────────────────────────────────────────────────────────

function drawCase(
  ctx: CanvasRenderingContext2D,
  config: WatchConfig,
  cx: number,
  cy: number,
) {
  const r = 92;
  ctx.save();

  // Case shadow
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;

  const caseGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, r);
  caseGrad.addColorStop(0, "#4a4a52");
  caseGrad.addColorStop(0.7, "#2a2a30");
  caseGrad.addColorStop(1, "#1a1a1e");
  ctx.fillStyle = caseGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";

  // Lugs
  const lugW = config.caseStyle === "integrated" ? 28 : 22;
  const lugH = config.caseStyle === "vintage" ? 38 : config.caseStyle === "integrated" ? 32 : 44;
  ctx.fillStyle = "#2a2a30";
  for (const side of [-1, 1]) {
    if (config.caseStyle === "integrated") {
      ctx.beginPath();
      ctx.moveTo(cx + side * (r - 8), cy - 20);
      ctx.lineTo(cx + side * (r + lugW), cy - 30);
      ctx.lineTo(cx + side * (r + lugW), cy + 30);
      ctx.lineTo(cx + side * (r - 8), cy + 20);
      ctx.closePath();
      ctx.fill();
    } else {
      const lugX = side === 1 ? cx + (r - 6) : cx - (r - 6) - lugW;
      drawRoundRect(ctx, lugX, cy - lugH / 2, lugW, lugH, 4);
      ctx.fill();
    }
  }

  // Bezel — diver & chronograph
  if (config.caseStyle === "diver") {
    ctx.strokeStyle = "#3a3a42";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const inner = r - 14;
      const outer = r - 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.stroke();
    }
  } else if (config.caseStyle === "chronograph") {
    ctx.strokeStyle = "#3a3a42";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Tachymeter marks
    ctx.strokeStyle = "#71717a";
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const inner = r - 8;
      const outer = r - (i % 5 === 0 ? 2 : 5);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.stroke();
    }
  } else if (config.caseStyle === "vintage") {
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Crown
  const crownX = cx + r + (config.caseStyle === "chronograph" ? -8 : 2);
  ctx.fillStyle = "#3a3a42";
  drawRoundRect(ctx, crownX, cy - 8, 10, 16, 2);
  ctx.fill();
  ctx.strokeStyle = "#52525b";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chronograph pushers
  if (config.caseStyle === "chronograph") {
    for (const dy of [-22, 22]) {
      drawRoundRect(ctx, crownX - 2, cy + dy - 5, 8, 10, 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ─── Dial rendering ────────────────────────────────────────────────────────────

function drawDial(
  ctx: CanvasRenderingContext2D,
  config: WatchConfig,
  cx: number,
  cy: number,
) {
  const r = config.caseStyle === "diver" ? 72 : 78;
  const base = getDialBaseColor(config.dialColor);
  const finish = config.dialFinish / 100;

  ctx.save();

  // Dial base
  if (finish > 0.3 && config.dialColor !== "matte-black") {
    const sunburst = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
    sunburst.addColorStop(0, adjustColor(base, 40 * finish));
    sunburst.addColorStop(0.4, base);
    sunburst.addColorStop(1, adjustColor(base, -40));
    ctx.fillStyle = sunburst;
  } else {
    ctx.fillStyle = base;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Sunburst rays
  if (finish > 0.2) {
    ctx.globalAlpha = finish * 0.35;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      ctx.strokeStyle = i % 2 === 0 ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Subdials for chronograph
  if (config.caseStyle === "chronograph") {
    for (const [ox, oy] of [
      [0, -28],
      [-30, 18],
      [30, 18],
    ]) {
      ctx.fillStyle = adjustColor(base, -15);
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Hour markers
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 3 === 0;
    const inner = r - (isMajor ? 18 : 12);
    const outer = r - 4;
    ctx.strokeStyle =
      config.dialColor === "silver-white"
        ? "rgba(0,0,0,0.7)"
        : "rgba(255,255,255,0.85)";
    ctx.lineWidth = isMajor ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  // Date window
  if (config.caseStyle === "diver" || config.caseStyle === "integrated") {
    ctx.fillStyle = "#f4f4f5";
    drawRoundRect(ctx, cx + 18, cy - 8, 22, 14, 2);
    ctx.fill();
    ctx.fillStyle = "#18181b";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("22", cx + 29, cy + 2);
  }

  // Brand text
  ctx.fillStyle =
    config.dialColor === "silver-white"
      ? "rgba(0,0,0,0.5)"
      : "rgba(255,255,255,0.45)";
  ctx.font = "8px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ATELIER", cx, cy - 28);
  ctx.font = "6px sans-serif";
  ctx.fillText("AUTOMATIC", cx, cy - 18);

  // Gloss reflection
  if (finish > 0.1) {
    const gloss = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    gloss.addColorStop(0, `rgba(255,255,255,${finish * 0.2})`);
    gloss.addColorStop(0.5, "rgba(255,255,255,0)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ─── Hands rendering ───────────────────────────────────────────────────────────

function drawHands(
  ctx: CanvasRenderingContext2D,
  config: WatchConfig,
  cx: number,
  cy: number,
) {
  const handColor =
    config.dialColor === "silver-white" ? "#18181b" : "#f4f4f5";
  const accent = "#c9a84c";

  ctx.save();
  ctx.lineCap = "round";

  // Hour hand — 10:10 position
  const hourAngle = ((10 * 30 - 90) * Math.PI) / 180;
  ctx.strokeStyle = handColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hourAngle) * 38, cy + Math.sin(hourAngle) * 38);
  ctx.stroke();

  // Minute hand
  const minAngle = ((10 * 6 - 90) * Math.PI) / 180;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(minAngle) * 52, cy + Math.sin(minAngle) * 52);
  ctx.stroke();

  // Second hand
  const secAngle = ((22 * 6 - 90) * Math.PI) / 180;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(secAngle) * 12, cy - Math.sin(secAngle) * 12);
  ctx.lineTo(cx + Math.cos(secAngle) * 58, cy + Math.sin(secAngle) * 58);
  ctx.stroke();

  // Center cap
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = handColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Crystal & ambient ─────────────────────────────────────────────────────────

function drawCrystal(
  ctx: CanvasRenderingContext2D,
  config: WatchConfig,
  cx: number,
  cy: number,
) {
  const r = config.caseStyle === "diver" ? 72 : 78;
  const finish = config.dialFinish / 100;

  ctx.save();
  ctx.globalAlpha = 0.06 + finish * 0.08;
  const crystal = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.5, cy);
  crystal.addColorStop(0, "#ffffff");
  crystal.addColorStop(1, "transparent");
  ctx.fillStyle = crystal;
  ctx.beginPath();
  ctx.ellipse(cx - 15, cy - 25, 35, 20, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderWatch(ctx: CanvasRenderingContext2D, config: WatchConfig) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2 + 10;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Ambient background gradient on canvas
  const bg = ctx.createRadialGradient(cx, cy, 50, cx, cy, 280);
  bg.addColorStop(0, "#18181b");
  bg.addColorStop(1, "#09090b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawStrap(ctx, config, cx, cy);
  drawCase(ctx, config, cx, cy);
  drawDial(ctx, config, cx, cy);
  drawHands(ctx, config, cx, cy);
  drawCrystal(ctx, config, cx, cy);
}

// ─── UI subcomponents ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
      {children}
    </h3>
  );
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
            value === opt.id
              ? "border-[#c9a84c]/60 bg-[#c9a84c]/10 text-white"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          }`}
        >
          <span className="flex items-center gap-2">
            {opt.swatch && (
              <span
                className="inline-block h-3 w-3 rounded-full ring-1 ring-zinc-700"
                style={{ background: opt.swatch }}
              />
            )}
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function ColorSwatches({
  colors,
  value,
  onChange,
}: {
  colors: { id: string; label: string; hex: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.label}
          onClick={() => onChange(c.id)}
          className={`h-8 w-8 rounded-full ring-2 transition-all ${
            value === c.id
              ? "ring-[#c9a84c] scale-110"
              : "ring-zinc-700 hover:ring-zinc-500"
          }`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-500">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-[#c9a84c]"
      />
    </div>
  );
}

function configFromSearchParams(searchParams: URLSearchParams): WatchConfig {
  const code = searchParams.get("c");
  if (code) {
    const decoded = decodeConfig(code);
    if (decoded) return decoded;
  }
  return DEFAULT_CONFIG;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function WatchVisualizerContent() {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<WatchConfig>(() =>
    configFromSearchParams(searchParams),
  );
  const [saveOpen, setSaveOpen] = useState(false);
  const [copied, setCopied] = useState<"url" | "code" | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderWatch(ctx, config);
  }, [config]);

  const shareCode = useMemo(() => encodeConfig(config), [config]);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("c", shareCode);
    return url.toString();
  }, [shareCode]);

  const update = useCallback(
    <K extends keyof WatchConfig>(key: K, value: WatchConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleStrapTypeChange = (strapType: StrapType) => {
    const defaultColor = STRAP_COLORS[strapType][0].id;
    setConfig((prev) => ({ ...prev, strapType, strapColor: defaultColor }));
  };

  const randomize = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const strapType = pick(STRAP_OPTIONS).id;
    setConfig({
      caseStyle: pick(CASE_OPTIONS).id,
      dialColor: pick(DIAL_OPTIONS).id,
      strapType,
      strapColor: pick(STRAP_COLORS[strapType]).id,
      strapShine: Math.floor(Math.random() * 100),
      dialFinish: Math.floor(Math.random() * 100),
    });
  };

  const downloadMockup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CANVAS_W * 2;
    exportCanvas.height = CANVAS_H * 2;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    renderWatch(ctx, config);
    const link = document.createElement("a");
    link.download = `watch-mockup-${config.caseStyle}-${config.dialColor}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  const copyToClipboard = async (text: string, type: "url" | "code") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const strapColors = STRAP_COLORS[config.strapType];
  const affiliateLinks = AFFILIATE_LINKS[config.strapType];

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-white lg:flex-row">
      {/* ── Sidebar controls ── */}
      <aside className="w-full shrink-0 overflow-y-auto border-b border-zinc-800 lg:w-[380px] lg:border-b-0 lg:border-r">
        <div className="border-b border-zinc-800/80 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/10">
              <Watch className="h-4 w-4 text-[#c9a84c]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide">
                Watch & Strap Visualizer
              </h1>
              <p className="text-[11px] text-zinc-500">
                Configure · Preview · Export
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-7 px-6 py-6">
          <section>
            <SectionTitle>Watch Case</SectionTitle>
            <OptionGrid
              options={CASE_OPTIONS}
              value={config.caseStyle}
              onChange={(v) => update("caseStyle", v)}
            />
          </section>

          <section>
            <SectionTitle>Dial Color</SectionTitle>
            <OptionGrid
              options={DIAL_OPTIONS}
              value={config.dialColor}
              onChange={(v) => update("dialColor", v)}
            />
          </section>

          <section>
            <SectionTitle>Strap Type</SectionTitle>
            <OptionGrid
              options={STRAP_OPTIONS}
              value={config.strapType}
              onChange={handleStrapTypeChange}
            />
          </section>

          <section>
            <SectionTitle>Strap Color</SectionTitle>
            <ColorSwatches
              colors={strapColors}
              value={config.strapColor}
              onChange={(v) => update("strapColor", v)}
            />
          </section>

          <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <SliderControl
              label="Strap Texture / Shine"
              value={config.strapShine}
              onChange={(v) => update("strapShine", v)}
            />
            <SliderControl
              label="Dial Finish"
              value={config.dialFinish}
              onChange={(v) => update("dialFinish", v)}
            />
          </section>

          <button
            type="button"
            onClick={randomize}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-[#c9a84c]/40 hover:bg-zinc-800 hover:text-white"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Randomize Combination
          </button>
        </div>
      </aside>

      {/* ── Preview & actions ── */}
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-zinc-700/30 to-transparent" />
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="mx-auto block w-full max-w-[520px]"
              />
            </div>
            <p className="mt-4 text-center text-[11px] text-zinc-600">
              Live canvas preview — updates instantly as you customize
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-800 bg-zinc-950/80 px-6 py-6 lg:px-10">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadMockup}
                className="inline-flex items-center gap-2 rounded-lg bg-[#c9a84c] px-5 py-2.5 text-xs font-semibold text-[#09090b] transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download High-Res Mockup
              </button>
              <button
                type="button"
                onClick={() => setSaveOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                <Link2 className="h-4 w-4" />
                Save Configuration
              </button>
            </div>

            {/* Affiliate section */}
            <section>
              <SectionTitle>Buy Strap / Find Parts</SectionTitle>
              <p className="mb-3 text-xs text-zinc-500">
                Recommended parts for your{" "}
                <span className="text-zinc-400">
                  {STRAP_OPTIONS.find((s) => s.id === config.strapType)?.label}
                </span>{" "}
                selection
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {affiliateLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:border-[#c9a84c]/30 hover:bg-zinc-900"
                  >
                    <div>
                      <p className="text-xs font-medium text-zinc-200 group-hover:text-white">
                        {link.title}
                      </p>
                      <p className="text-[10px] text-zinc-500">{link.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#c9a84c]">
                        {link.price}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ── Save modal ── */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Save Configuration</h2>
              <button
                type="button"
                onClick={() => setSaveOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-500">
                  Shareable URL
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 truncate rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(shareUrl, "url")}
                    className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-zinc-400 hover:text-white"
                  >
                    {copied === "url" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-500">
                  Config Code
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareCode}
                    className="flex-1 truncate rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-[10px] text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(shareCode, "code")}
                    className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-zinc-400 hover:text-white"
                  >
                    {copied === "code" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-zinc-600">
                  Append <code className="text-zinc-500">?c=&lt;code&gt;</code>{" "}
                  to reload this exact build.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSaveOpen(false)}
              className="mt-6 w-full rounded-lg bg-zinc-800 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WatchVisualizerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-500">
          Loading visualizer…
        </div>
      }
    >
      <WatchVisualizerContent />
    </Suspense>
  );
}
