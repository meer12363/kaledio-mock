"use client";

import dynamic from "next/dynamic";

/** three.js is heavy — load the 3D set only in the browser, after first paint */
export const LazyStage3D = dynamic(() => import("./Stage3D").then((m) => m.Stage3D), { ssr: false });
