import { CubeTextureLoader, sRGBEncoding } from "three";

const loader = new CubeTextureLoader();

export const starMapPlainTexture = loader.load([
  "textures/starmap/jpg_processed/4K/starmap_plain_back.jpg",
  "textures/starmap/jpg_processed/4K/starmap_plain_front.jpg",
  "textures/starmap/jpg_processed/4K/starmap_plain_up.jpg",
  "textures/starmap/jpg_processed/4K/starmap_plain_down.jpg",
  "textures/starmap/jpg_processed/4K/starmap_plain_right.jpg",
  "textures/starmap/jpg_processed/4K/starmap_plain_left.jpg",
]);
starMapPlainTexture.encoding = sRGBEncoding

export const starMapGridTexture = loader.load([
  "textures/starmap/jpg_processed/4K/starmap_grid_back.jpg",
  "textures/starmap/jpg_processed/4K/starmap_grid_front.jpg",
  "textures/starmap/jpg_processed/4K/starmap_grid_up.jpg",
  "textures/starmap/jpg_processed/4K/starmap_grid_down.jpg",
  "textures/starmap/jpg_processed/4K/starmap_grid_right.jpg",
  "textures/starmap/jpg_processed/4K/starmap_grid_left.jpg",
]);
starMapGridTexture.encoding = sRGBEncoding

export const starMapFiguresTexture = loader.load([
  "textures/starmap/jpg_processed/4K/starmap_figures_back.jpg",
  "textures/starmap/jpg_processed/4K/starmap_figures_front.jpg",
  "textures/starmap/jpg_processed/4K/starmap_figures_up.jpg",
  "textures/starmap/jpg_processed/4K/starmap_figures_down.jpg",
  "textures/starmap/jpg_processed/4K/starmap_figures_right.jpg",
  "textures/starmap/jpg_processed/4K/starmap_figures_left.jpg",
]);
starMapFiguresTexture.encoding = sRGBEncoding

export const starMapBoundsTexture = loader.load([
  "textures/starmap/jpg_processed/4K/starmap_bounds_back.jpg",
  "textures/starmap/jpg_processed/4K/starmap_bounds_front.jpg",
  "textures/starmap/jpg_processed/4K/starmap_bounds_up.jpg",
  "textures/starmap/jpg_processed/4K/starmap_bounds_down.jpg",
  "textures/starmap/jpg_processed/4K/starmap_bounds_right.jpg",
  "textures/starmap/jpg_processed/4K/starmap_bounds_left.jpg",
]);
starMapBoundsTexture.encoding = sRGBEncoding

export const skyBoxTexture = (name: string) => {
  switch (name) {
    case "plain":
      return starMapPlainTexture;
    case "grid":
      return starMapGridTexture;
    case "figures":
      return starMapFiguresTexture;
    case "bounds":
      return starMapBoundsTexture;
    default:
      return starMapPlainTexture;
  }
};
