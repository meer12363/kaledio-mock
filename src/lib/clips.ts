/**
 * Real footage for the mock UI: open movies from the Blender Foundation (CC BY),
 * streamed from Wikimedia Commons / blender.org. Each clip starts at `start`
 * seconds so the same film can play several different scenes.
 */

const WM = "https://upload.wikimedia.org/wikipedia/commons/transcoded";

const FILMS = {
  tears: `${WM}/c/cb/Tears_of_Steel_1080p.webm/Tears_of_Steel_1080p.webm.480p.vp9.webm`,
  sintel: `${WM}/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.480p.vp9.webm`,
  spring: `${WM}/a/a5/Spring_-_Blender_Open_Movie.webm/Spring_-_Blender_Open_Movie.webm.480p.vp9.webm`,
  cosmos: `${WM}/3/36/Cosmos_Laundromat_-_First_Cycle_-_Official_Blender_Foundation_release.webm/Cosmos_Laundromat_-_First_Cycle_-_Official_Blender_Foundation_release.webm.480p.vp9.webm`,
  elephants: `${WM}/a/a2/Elephants_Dream_%282006%29.webm/Elephants_Dream_%282006%29.webm.480p.vp9.webm`,
  llama: `${WM}/d/d0/Caminandes-_Llama_Drama_-_Short_Movie.ogv/Caminandes-_Llama_Drama_-_Short_Movie.ogv.480p.vp9.webm`,
} as const;

/** small H.264 trailer — plays everywhere, used if a webm can't */
export const FALLBACK_MP4 = "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4";

export type ClipId =
  | "tears-city"
  | "tears-canal"
  | "tears-bridge"
  | "sintel-snow"
  | "sintel-hero"
  | "sintel-dragon"
  | "spring-forest"
  | "cosmos-field"
  | "cosmos-eye"
  | "elephants-machine"
  | "llama-cliff";

export interface Clip {
  src: string;
  /** seconds into the film */
  start: number;
  film: string;
}

// timestamps picked by eye — each lands on a strong shot
export const CLIPS: Record<ClipId, Clip> = {
  "tears-city": { src: FILMS.tears, start: 70, film: "Tears of Steel" },
  "tears-canal": { src: FILMS.tears, start: 260, film: "Tears of Steel" },
  "tears-bridge": { src: FILMS.tears, start: 350, film: "Tears of Steel" },
  "sintel-snow": { src: FILMS.sintel, start: 100, film: "Sintel" },
  "sintel-hero": { src: FILMS.sintel, start: 400, film: "Sintel" },
  "sintel-dragon": { src: FILMS.sintel, start: 480, film: "Sintel" },
  "spring-forest": { src: FILMS.spring, start: 200, film: "Spring" },
  "cosmos-field": { src: FILMS.cosmos, start: 180, film: "Cosmos Laundromat" },
  "cosmos-eye": { src: FILMS.cosmos, start: 450, film: "Cosmos Laundromat" },
  "elephants-machine": { src: FILMS.elephants, start: 400, film: "Elephants Dream" },
  "llama-cliff": { src: FILMS.llama, start: 15, film: "Caminandes" },
};

export const FOOTAGE_CREDIT = "Footage: Blender Foundation open movies (CC BY)";
