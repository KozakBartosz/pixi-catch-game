import './style.css';
import { GameApp } from './app/GameApp';

const gameRoot: HTMLElement | null =
  document.querySelector<HTMLElement>('#game');

if (!gameRoot) {
  throw new Error('Missing #game element');
}

const gameApp: GameApp = new GameApp(gameRoot);
gameApp.start();
