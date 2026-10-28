"use client";

import Lottie from "lottie-react";
import { useReducedMotion } from "framer-motion";
import { Search, ShoppingBag } from "lucide-react";

const successAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 42,
  w: 160,
  h: 160,
  nm: "Shringaar order success",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Success ring",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [80, 80, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: 0.67, y: 1 }, o: { x: 0.33, y: 0 }, t: 0, s: [45, 45, 100] },
            { t: 16, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [88, 88] }, d: 1, nm: "Ring" },
        {
          ty: "st",
          c: { a: 0, k: [0.18, 0.49, 0.36, 1] },
          o: { a: 0, k: 100 },
          w: 7,
          lc: 2,
          lj: 2,
          nm: "Ring stroke",
        },
        {
          ty: "sh",
          ks: {
            a: 0,
            k: {
              i: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              o: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              v: [
                [-21, 0],
                [-6, 15],
                [23, -17],
              ],
              c: false,
            },
          },
          nm: "Check",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.18, 0.49, 0.36, 1] },
          o: { a: 0, k: 100 },
          w: 8,
          lc: 2,
          lj: 2,
          nm: "Check stroke",
        },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: "Transform",
        },
      ],
      ip: 0,
      op: 42,
      st: 0,
      bm: 0,
    },
    ...[
      { x: 30, y: 44, color: [0.72, 0.53, 0.04, 1] },
      { x: 128, y: 47, color: [0.91, 0.71, 0.72, 1] },
      { x: 34, y: 119, color: [0.91, 0.71, 0.72, 1] },
      { x: 126, y: 116, color: [0.72, 0.53, 0.04, 1] },
    ].map((confetti, index) => ({
      ddd: 0,
      ind: index + 2,
      ty: 4,
      nm: "Confetti",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 12, s: [100] },
            { t: 38, s: [0] },
          ],
        },
        r: { a: 0, k: index % 2 ? 35 : -35 },
        p: { a: 0, k: [confetti.x, confetti.y, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [8, 8] },
          d: 1,
          nm: "Confetti dot",
        },
        {
          ty: "fl",
          c: { a: 0, k: confetti.color },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "Confetti fill",
        },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: "Transform",
        },
      ],
      ip: 0,
      op: 42,
      st: 0,
      bm: 0,
    })),
  ],
};

type IllustrationKind = "success" | "empty-cart" | "empty-search";

const emptyAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 36,
  w: 160,
  h: 160,
  nm: "Shringaar empty state",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Gentle orbit",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 36, s: [12] },
          ],
        },
        p: { a: 0, k: [80, 80, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [94, 94, 100] },
            { t: 18, s: [100, 100, 100] },
            { t: 36, s: [94, 94, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [90, 90] }, d: 1, nm: "Orbit" },
        {
          ty: "st",
          c: { a: 0, k: [0.72, 0.53, 0.04, 0.45] },
          o: { a: 0, k: 100 },
          w: 3,
          lc: 2,
          lj: 2,
          nm: "Orbit stroke",
        },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: "Transform",
        },
      ],
      ip: 0,
      op: 36,
      st: 0,
      bm: 0,
    },
  ],
};

export function LottieIllustration({
  kind,
  label,
}: {
  kind: IllustrationKind;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  const isSuccess = kind === "success";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative size-28">
        <Lottie
          animationData={isSuccess ? successAnimation : emptyAnimation}
          autoplay={!reduceMotion}
          className="absolute inset-0"
          loop={!reduceMotion && !isSuccess}
        />
        {!isSuccess && (
          <span className="text-gold absolute inset-0 grid place-items-center">
            {kind === "empty-cart" ? (
              <ShoppingBag aria-hidden="true" className="size-8" />
            ) : (
              <Search aria-hidden="true" className="size-8" />
            )}
          </span>
        )}
      </div>
      <span className="text-muted mt-1 text-xs font-medium">{label}</span>
    </div>
  );
}
