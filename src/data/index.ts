// ============================================
//  DATA BARREL — Re-export all data
// ============================================

export { rankTiers, actInfo } from "./squad";
export type { Player, RankTier } from "./squad";

export { videos, videoCategories } from "./videos";
export type { Video, VideoCategory } from "./videos";

export { photos, photoAlbums, placeholderGradients } from "./photos";
export type { Photo, PhotoAlbum } from "./photos";

export { navLinks, features, stats, siteMeta, uploadConfig } from "./site";
export type { NavLink, Feature, Stat } from "./site";

export { GAMES, GAME_CATEGORIES, GENERAL_GAME, detectGameFromFilename, getGameById, getGamesByCategory } from "./games";
export type { GameInfo, GameCategory } from "./games";
