import { Container, Graphics } from 'pixi.js';

interface BurstParticle {
  graphic: Graphics;
  directionX: number;
  directionY: number;
  speed: number;
}

const PARTICLE_COLORS: readonly number[] = [
  0xffdc83, 0xfff1c2, 0xe49566, 0xce6d6d,
];

export class CatchBurst {
  public readonly container: Container = new Container();
  private readonly particles: BurstParticle[] = [];
  private readonly reducedMotion: boolean;
  private readonly duration: number;
  private age: number = 0;

  public constructor(x: number, y: number, reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
    this.duration = reducedMotion ? 0.12 : 0.4;
    this.container.position.set(x, y);
    const count: number = reducedMotion ? 4 : 10;
    for (let index: number = 0; index < count; index += 1) {
      const angle: number = (index / count) * Math.PI * 2 - Math.PI / 2;
      const graphic: Graphics = new Graphics();
      graphic.beginFill(0x65333a);
      graphic.drawRect(-3, -3, 6, 6);
      graphic.endFill();
      graphic.beginFill(PARTICLE_COLORS[index % PARTICLE_COLORS.length]);
      graphic.drawRect(-2, -2, 4, 4);
      graphic.endFill();
      this.container.addChild(graphic);
      this.particles.push({
        graphic,
        directionX: Math.cos(angle),
        directionY: Math.sin(angle),
        speed: 78 + (index % 3) * 15,
      });
    }
    this.positionParticles();
  }

  /** Returns true when the burst has finished and can be destroyed. */
  public advance(dtSeconds: number): boolean {
    this.age = Math.min(
      this.duration,
      this.age + Math.min(Math.max(dtSeconds, 0), 0.1),
    );
    this.positionParticles();
    this.container.alpha = 1 - this.age / this.duration;
    return this.age >= this.duration;
  }

  private positionParticles(): void {
    for (const particle of this.particles) {
      const distance: number = this.reducedMotion
        ? 9
        : 4 + particle.speed * this.age;
      const x: number = particle.directionX * distance;
      const y: number =
        particle.directionY * distance +
        (this.reducedMotion ? 0 : 65 * this.age * this.age);
      particle.graphic.position.set(Math.round(x), Math.round(y));
    }
  }
}
