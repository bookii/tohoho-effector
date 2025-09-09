<script lang="ts">
  import { IrisOutEffectAnimator } from "@/lib/IrisOutEffectAnimator";
  import {
    irisOutEffectStateSchema,
    type IrisOutEffectFacePosition,
    type IrisOutEffectStep,
  } from "shared";

  const { route } = $props();

  let currentStep: IrisOutEffectStep = $state("none");
  let facePosition: IrisOutEffectFacePosition | undefined = $state(undefined);
  let isAnimating = $state(false);

  const irisOutEffectAnimator = $derived.by(() => {
    if (!facePosition) {
      return undefined;
    }

    const canvasElement = document.getElementById("irisout-canvas");
    if (!(canvasElement instanceof HTMLCanvasElement)) {
      return undefined;
    }

    const targetVideoSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    return new IrisOutEffectAnimator({
      canvasElement,
      targetVideoSize,
      facePosition,
      onAnimationStart: () => {
        isAnimating = true;
      },
      onAnimationEnd: () => {
        isAnimating = false;
      },
    });
  });

  // 既存のアニメーション関数をコピー
  const animateIrisEffect = (targetStep: IrisOutEffectStep) => {
    irisOutEffectAnimator?.animate(targetStep);
  };

  $effect(() => {
    const sourceId = route.result.path.params.id;
    if (typeof sourceId !== "string") {
      return;
    }
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/streams?source_id=${sourceId}`
    );

    eventSource.addEventListener("effect-state", (event) => {
      const data = irisOutEffectStateSchema.parse(JSON.parse(event.data));

      if (
        data.facePosition &&
        JSON.stringify(data.facePosition) !== JSON.stringify(facePosition)
      ) {
        facePosition = data.facePosition;
      }
      currentStep = data.step;
      animateIrisEffect(data.step);
    });

    eventSource.addEventListener("ping", () => {
      // NOP
    });

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
    };

    return () => {
      eventSource.close();
    };
  });
</script>

<div class="fixed inset-0 bg-transparent">
  <canvas id="irisout-canvas" class="h-full w-full"></canvas>
</div>

<style>
  :global(body) {
    margin: 0;
    background: transparent;
    overflow: hidden;
  }
</style>
