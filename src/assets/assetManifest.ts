export interface AssetManifest {
  player: {
    idleLeft: string;
    idleRight: string;
    runLeft: readonly string[];
    runRight: readonly string[];
  };
  food: readonly string[];
}

export const ASSET_MANIFEST: AssetManifest = {
  player: {
    idleLeft: '/assets/characters/knight iso char_idle_2.png',
    idleRight: '/assets/characters/knight iso char_idle_3.png',
    runLeft: [
      '/assets/characters/knight iso char_run left_0.png',
      '/assets/characters/knight iso char_run left_1.png',
      '/assets/characters/knight iso char_run left_2.png',
      '/assets/characters/knight iso char_run left_3.png',
      '/assets/characters/knight iso char_run left_4.png',
      '/assets/characters/knight iso char_run left_5.png',
    ],
    runRight: [
      '/assets/characters/knight iso char_run right_0.png',
      '/assets/characters/knight iso char_run right_1.png',
      '/assets/characters/knight iso char_run right_2.png',
      '/assets/characters/knight iso char_run right_3.png',
      '/assets/characters/knight iso char_run right_4.png',
      '/assets/characters/knight iso char_run right_5.png',
    ],
  },
  food: [
    '/assets/food/Apple.png',
    '/assets/food/Cherry.png',
    '/assets/food/Cheese.png',
    '/assets/food/Cookie.png',
    '/assets/food/Strawberry.png',
  ],
};

export const REQUIRED_ASSET_URLS: readonly string[] = [
  ASSET_MANIFEST.player.idleLeft,
  ASSET_MANIFEST.player.idleRight,
  ...ASSET_MANIFEST.player.runLeft,
  ...ASSET_MANIFEST.player.runRight,
  ...ASSET_MANIFEST.food,
];
