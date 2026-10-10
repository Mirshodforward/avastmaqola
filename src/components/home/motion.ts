import type { CSSProperties } from "react";

/** Ketma-ket paydo bo‘lish tartibi: scroll animatsiyasida diapazon siljishi (globals.css: --i) */
export const seq = (i: number) => ({ "--i": i }) as CSSProperties;

/** Sahifa yuklanganda animatsiya kechikishi, soniyada (globals.css: --d) */
export const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;
