import type { IrisOutEffectFacePosition, IrisOutEffectStep } from "shared";

export type IrisOutEffectConfig = {
  canvasElement: HTMLCanvasElement;
  targetVideoSize: { width: number; height: number };
  facePosition: IrisOutEffectFacePosition;
  onAnimationStart: () => void;
  onAnimationEnd: () => void;
};

export class IrisOutEffectAnimator {
  private animationFrame?: number;
  private currentRadius: number | undefined;
  private isAnimating = false;
  private config: IrisOutEffectConfig;

  constructor(config: IrisOutEffectConfig) {
    this.config = config;
  }

  public animate(targetStep: IrisOutEffectStep): Promise<void> {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        this.cancel();
      }

      const { canvasElement, targetVideoSize, facePosition } = this.config;
      const { width, height } = targetVideoSize;
      // Canvas のサイズを設定（高DPI対応）
      const dpr = window.devicePixelRatio || 1;
      canvasElement.width = width * dpr;
      canvasElement.height = height * dpr;
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;

      const ctx = canvasElement.getContext("2d");
      if (!ctx) {
        resolve();
        return;
      }

      const scaleX = width / facePosition.bitmapWidth;
      const scaleY = height / facePosition.bitmapHeight;

      const centerX =
        (facePosition.x + facePosition.width * 0.5) * scaleX * dpr;
      // 中央より少し上が丁度いい
      const centerY =
        (facePosition.y + facePosition.height * 0.3) * scaleY * dpr;

      const radiusFromFaceCenter = this.radiusFromFaceCenter(
        facePosition,
        width,
        height,
        dpr
      );

      let startRadius: number, endRadius: number, duration: number;

      switch (targetStep) {
        case "none":
          startRadius = this.currentRadius ?? radiusFromFaceCenter;
          endRadius = radiusFromFaceCenter;
          duration = 1200;
          break;
        case "focused":
          startRadius = this.currentRadius ?? radiusFromFaceCenter;
          endRadius =
            Math.max(
              facePosition.width * scaleX,
              facePosition.height * scaleY
            ) *
            0.8 *
            dpr;
          duration = 1200;
          break;
        case "hidden":
          startRadius = this.currentRadius ?? radiusFromFaceCenter;
          endRadius = 0;
          duration = 600;
          break;
      }

      const startTime = performance.now();
      this.isAnimating = true;

      const frame = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.currentRadius = Math.max(
          startRadius + (endRadius - startRadius) * progress,
          0
        );

        ctx.clearRect(0, 0, width * dpr, height * dpr);
        ctx.save();
        // 全体を黒で塗りつぶし
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width * dpr, height * dpr);
        // 円形部分を透明にしてくり抜く
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.currentRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        if (progress === 0) {
          this.config.onAnimationStart?.();
        } else if (progress < 1) {
          this.animationFrame = requestAnimationFrame(frame);
        } else {
          this.isAnimating = false;
          this.currentRadius = endRadius;
          this.config.onAnimationEnd?.();
          resolve();
        }
      };
      this.animationFrame = requestAnimationFrame(frame);
      resolve();
    });
  }

  public cancel(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.isAnimating = false;
  }

  private radiusFromFaceCenter(
    facePosition: IrisOutEffectFacePosition,
    canvasWidth: number,
    canvasHeight: number,
    dpr: number
  ): number {
    const scaleX = canvasWidth / facePosition.bitmapWidth;
    const scaleY = canvasHeight / facePosition.bitmapHeight;

    const faceCenterX = (facePosition.x + facePosition.width / 2) * scaleX;
    const faceCenterY = (facePosition.y + facePosition.height / 2) * scaleY;

    // 顔の中央から画面の4つの角への距離を計算
    const distances = [
      Math.sqrt(faceCenterX ** 2 + faceCenterY ** 2), // 左上
      Math.sqrt((canvasWidth - faceCenterX) ** 2 + faceCenterY ** 2), // 右上
      Math.sqrt(faceCenterX ** 2 + (canvasHeight - faceCenterY) ** 2), // 左下
      Math.sqrt(
        (canvasWidth - faceCenterX) ** 2 + (canvasHeight - faceCenterY) ** 2
      ), // 右下
    ];

    return Math.max(...distances) * dpr * 1.1;
  }
}
