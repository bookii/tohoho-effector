<script lang="ts">
  import Badge from "@/lib/components/ui/atoms/Badge.svelte";
  import Button from "@/lib/components/ui/atoms/Button.svelte";
  import Card from "@/lib/components/ui/atoms/Card.svelte";
  import Input from "@/lib/components/ui/atoms/Input.svelte";
  import Spinner from "@/lib/components/ui/atoms/Spinner.svelte";
  import Message from "@/lib/components/ui/items/Message.svelte";
  import * as FaceDetectorService from "@/lib/FaceDetectorService";
  import { IrisOutEffectAnimator } from "@/lib/IrisOutEffectAnimator";
  import * as MediaDeviceService from "@/lib/MediaDeviceService";
  import {
    ClipboardCopy,
    Play,
    RotateCcw,
    ScanFace,
    Sparkles,
    Video,
    X,
  } from "@lucide/svelte";
  import { createClient } from "backend";
  import type { IrisOutEffectFacePosition, IrisOutEffectStep } from "shared";
  import { tick } from "svelte";

  const deleteStream = async () => {
    if (!sourceId) {
      return;
    }
    await apiClient.streams.$delete({
      query: { source_id: sourceId },
    });
  };

  window.addEventListener("beforeunload", async () => {
    deleteStream();
  });

  window.addEventListener("load", () => {
    const performanceEntries = performance.getEntriesByType("navigation");
    if (
      performanceEntries.length > 0 &&
      performanceEntries[0].entryType === "reload"
    ) {
      deleteStream();
    }
  });

  const irisOutEffectAnimator = $derived.by(() => {
    // faceDetectionStatus が変わったときだけ再初期化
    if (faceDetectionStatus?.type !== "success") {
      return undefined;
    }
    const canvasElement = document.getElementById(
      "irisout-canvas"
    ) as HTMLCanvasElement;
    const videoElement = document.getElementById(
      "video-step4"
    ) as HTMLVideoElement;
    if (
      !canvasElement ||
      !videoElement ||
      !faceDetectionStatus ||
      faceDetectionStatus.type !== "success"
    ) {
      return undefined;
    }

    const videoRect = videoElement.getBoundingClientRect();

    return new IrisOutEffectAnimator({
      canvasElement,
      targetVideoSize: { width: videoRect.width, height: videoRect.height },
      facePosition: faceDetectionStatus.position,
      onAnimationStart: () => {
        isAnimating = true;
      },
      onAnimationEnd: () => {
        isAnimating = false;
      },
    });
  });

  let currentStep: 0 | 1 | 2 | 3 | 4 = $state(0);
  let deviceId: string | undefined = $state(undefined);
  let isFetchingDeviceId = $state(false);
  let sourceId: string | undefined = $state(undefined);
  let sourceUrl: string | undefined = $state(undefined);
  let hasCopiedSourceUrl = $state(false);
  let sourceExpiresAt: number | undefined = $state(undefined);
  let faceDetectionStatus:
    | { type: "inProgress" }
    | { type: "success"; position: IrisOutEffectFacePosition }
    | { type: "failure" }
    | undefined = $state(undefined);
  let currentIrisOutStep: IrisOutEffectStep = $state("none");
  let isAnimating = $state(false);
  let videoStep1Element: HTMLVideoElement | undefined = $state(undefined);
  let mediaStream: MediaStream | undefined = $state(undefined);
  let trackResolution: { width: number; height: number } | undefined =
    $state(undefined);
  let step1ErrorMessage: string | undefined = $state(undefined);
  let step4ErrorMessage: string | undefined = $state(undefined);

  const apiClient = createClient(import.meta.env.VITE_API_BASE_URL);

  const prepareForDetecting = async () => {
    try {
      isFetchingDeviceId = true;
      await MediaDeviceService.ensureCameraAccess();
      deviceId = await MediaDeviceService.fetchVirtualCameraId();
      mediaStream = await MediaDeviceService.fetchMediaStream(deviceId);
      const trackSettings = mediaStream!.getVideoTracks()[0].getSettings();
      if (trackSettings.width && trackSettings.height) {
        trackResolution = {
          width: trackSettings.width,
          height: trackSettings.height,
        };
      }
      let element = document.getElementById("video-step1");
      if (element && element instanceof HTMLVideoElement) {
        videoStep1Element = element;
        videoStep1Element.srcObject = mediaStream;
      }
      step1ErrorMessage = undefined;
    } catch (error: unknown) {
      if (error instanceof Error) {
        step1ErrorMessage = error.message;
      }
    } finally {
      isFetchingDeviceId = false;
    }
  };

  const detectFacePosition = async () => {
    if (!mediaStream) {
      return;
    }
    const track = mediaStream?.getVideoTracks()[0];
    if (!track) {
      return;
    }

    faceDetectionStatus = { type: "inProgress" };
    const blob = await new ImageCapture(
      mediaStream.getVideoTracks()[0]
    ).takePhoto();
    const bitmap = await createImageBitmap(blob);

    try {
      const faces = await FaceDetectorService.detectFacePositions(bitmap);
      faceDetectionStatus =
        faces.length > 0
          ? {
              type: "success",
              position: {
                ...faces[Math.floor(Math.random() * faces.length)],
                bitmapWidth: bitmap.width,
                bitmapHeight: bitmap.height,
              },
            }
          : { type: "failure" };
    } catch (error) {
      faceDetectionStatus = { type: "failure" };
    }
  };

  const goToStep1 = async () => {
    currentStep = 1;
    await tick();
    document.getElementById("step1")?.scrollIntoView({ behavior: "smooth" });
  };

  const goToStep2 = async () => {
    try {
      await apiClient.sources.$post().then(async (response) => {
        const data = await response.json();
        sourceId = data.id;
        sourceUrl = data.url;
        sourceExpiresAt = data.expiresAt;
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        step1ErrorMessage = error.message;
        return;
      }
    }
    currentStep = 2;
    await tick();
    document.getElementById("step2")?.scrollIntoView({ behavior: "smooth" });
  };

  const goToStep3 = async () => {
    currentStep = 3;
    await tick();
    document.getElementById("step3")?.scrollIntoView({ behavior: "smooth" });
  };

  const goToStep4 = async () => {
    currentStep = 4;
    await tick();
    const videoStep4Element = document.getElementById("video-step4");
    if (
      videoStep4Element &&
      videoStep4Element instanceof HTMLVideoElement &&
      mediaStream
    ) {
      videoStep4Element.srcObject = mediaStream;
      if (videoStep1Element) {
        videoStep1Element.srcObject = null;
      }
    }
    document.getElementById("step4")?.scrollIntoView({ behavior: "smooth" });
  };

  const onCopyWithButton = async () => {
    try {
      if (!sourceUrl) {
        throw new Error("Source URL is not available.");
      }
      await navigator.clipboard.writeText(sourceUrl);
      hasCopiedSourceUrl = true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        step1ErrorMessage = error.message;
      }
    }
  };

  const onCopyWithCommand = (event: ClipboardEvent) => {
    const element = document.getElementById("browser-source-url");
    if (element && event.composedPath().includes(element)) {
      hasCopiedSourceUrl = true;
      return;
    }
  };

  const selectAll = () => {
    const element = document.getElementById("browser-source-url");
    if (element instanceof HTMLInputElement) {
      element.select();
    }
  };

  const updateIrisOutStep = async (step: IrisOutEffectStep) => {
    if (faceDetectionStatus?.type !== "success" || !sourceId || isAnimating) {
      return;
    }
    if (!irisOutEffectAnimator) {
      return;
    }
    try {
      await apiClient["effect-states"][":id"].$post({
        param: { id: sourceId },
        json: {
          step: step,
          facePosition: faceDetectionStatus.position,
        },
      });
    } catch (_: unknown) {
      step4ErrorMessage = "エフェクトの反映に失敗しました";
      return;
    }
    currentIrisOutStep = step;
    await irisOutEffectAnimator.animate(step);
  };
</script>

<div class="mx-auto max-w-3xl space-y-4 p-4">
  <div id="step0" class="flex flex-col space-y-6 px-6 pt-8 pb-10">
    <div class="flex flex-col items-center space-y-4">
      <h1 class="text-3xl font-bold">とほほエフェクター</h1>
      <div>
        <p class="text-center text-sm/relaxed text-base-foreground-muted">
          「とほほ…もうこりごりだよ〜」のエフェクト (アイリスアウト)
          を配信画面にかけるツールです。
        </p>
        <p class="text-center text-sm/relaxed text-base-foreground-muted">
          OBS Studio の仮想カメラを利用して、VTuber さんの顔の位置を検出します。
        </p>
      </div>
    </div>
    <div class="relative">
      <div
        class="aspect-video rounded-md bg-base-container-primary object-contain"
      ></div>
    </div>
    <Button
      variant="primary"
      size="large"
      class="mt-2 py-2"
      disabled={currentStep !== 0}
      onclick={goToStep1}
    >
      <Sparkles class="size-4" />
      開始
    </Button>
  </div>
  {#if currentStep >= 1}
    <div id="step1" class="scroll-mt-4" class:min-h-screen={currentStep === 1}>
      <Card>
        <div class="flex flex-col space-y-2">
          <p class="text-xs">ステップ 1/4</p>
          <h2 class="text-2xl font-bold">OBS Studio の仮想カメラの設定</h2>
        </div>
        <div>
          <ol class="list-decimal space-y-2 px-6 text-sm">
            <li>OBS Studio の「仮想カメラ開始」をクリックします。</li>
            <li>下の「仮想カメラの映像を取得」ボタンをクリックします。</li>
            <li>
              仮想カメラの映像を確認できたら、「次へ」ボタンをクリックします。
            </li>
          </ol>
        </div>
        <div class="flex flex-col space-y-2">
          <Button variant="secondary" onclick={prepareForDetecting}>
            {#if isFetchingDeviceId}
              <Spinner
                size="1rem"
                color="var(--color-base-foreground-default)"
              />
            {:else}
              <Video class="size-4" />
              仮想カメラの映像を取得
            {/if}
          </Button>
          {#if step1ErrorMessage}
            <p class="text-xs text-destructive">
              {step1ErrorMessage}
            </p>
          {/if}
        </div>
        <div class="relative">
          <video
            id="video-step1"
            class="aspect-video rounded-md bg-base-container-primary object-contain"
            autoplay
            playsinline
          >
            <track default kind="captions" />
          </video>
          <Badge tone="filled" class="absolute top-3 left-3"
            >仮想カメラの映像</Badge
          >
        </div>
        <Button
          variant="primary"
          disabled={currentStep !== 1 || !deviceId}
          onclick={goToStep2}
        >
          次へ
        </Button>
      </Card>
    </div>
  {/if}
  {#if currentStep >= 2}
    <div id="step2" class="scroll-mt-4" class:min-h-screen={currentStep === 2}>
      <Card>
        <div class="flex flex-col space-y-2">
          <p class="text-xs">ステップ 2/4</p>
          <h2 class="text-2xl font-bold">ブラウザソースの設定</h2>
        </div>
        <Message class="!items-center">
          <p class="text-sm">
            アイリスアウトをかけるレイヤーとして、ブラウザソースを利用します。
          </p>
        </Message>
        <div>
          <ol class="list-decimal space-y-2 px-6 text-sm">
            <li>下の URL をコピーします。</li>
            <li>
              OBS Studio でブラウザソースを追加します。
              <ul class="list-disc space-y-1 px-4 pt-2">
                <li>
                  「URL」のフィールドにはコピーした URL をペーストしてください。
                </li>
                <li>
                  {#if trackResolution}
                    「幅」は <strong>{trackResolution.width}</strong
                    >、「高さ」は
                    <strong>{trackResolution.height}</strong>
                    に設定してください。
                  {:else}
                    「幅」と「高さ」は基本（キャンバス）解像度と一致させてください。
                  {/if}
                </li>
              </ul>
            </li>
            <li>
              追加したブラウザソースを、アイリスアウトを適用したいソースの上のレイヤーに移動させます。
            </li>
            <li>
              ブラウザソースの設定が完了したら、「次へ」ボタンをクリックします。
            </li>
          </ol>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="flex flex-row space-x-2">
            <Input
              id="browser-source-url"
              readonly
              value={sourceUrl}
              onclick={selectAll}
              onfocus={selectAll}
            />
            <Button
              variant="secondary"
              class="w-auto text-nowrap"
              onclick={onCopyWithButton}
            >
              <ClipboardCopy class="size-4" />
              URLをコピー
            </Button>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-base-foreground-subtle">
              {#if sourceExpiresAt}
                URLは <strong>
                  {new Date(sourceExpiresAt).toLocaleString()}
                </strong> まで有効
              {/if}
              (このページを閉じるか再読み込みをすると無効になります)
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          disabled={currentStep !== 2 || !hasCopiedSourceUrl}
          onclick={goToStep3}
        >
          次へ
        </Button>
      </Card>
    </div>
  {/if}
  {#if currentStep >= 3}
    <div id="step3" class="scroll-mt-4" class:min-h-screen={currentStep === 3}>
      <Card>
        <div class="flex flex-col space-y-2">
          <p class="text-xs">ステップ 3/4</p>
          <h2 class="text-2xl font-bold">顔の位置の検出</h2>
        </div>
        <div>
          <ol class="list-decimal space-y-2 px-6 text-sm">
            <li>下の「顔の位置を検出」ボタンをクリックします。</li>
            <li>
              顔の位置を正しく検出できたら、「次へ」ボタンをクリックします。
              <ul class="list-disc px-4 pt-2">
                <li>
                  顔の位置が正しくない場合は、再度「顔の位置を検出」ボタンをクリックしてください。
                </li>
              </ul>
            </li>
          </ol>
        </div>
        <div class="flex flex-col space-y-2">
          <Button
            variant="secondary"
            disabled={faceDetectionStatus?.type === "inProgress" ||
              currentIrisOutStep !== "none"}
            onclick={detectFacePosition}
          >
            {#if faceDetectionStatus?.type == "inProgress"}
              <Spinner
                size="1rem"
                color="var(--color-base-foreground-default)"
              />
            {:else}
              <ScanFace class="size-4" />
              顔の位置を検出
            {/if}
          </Button>
          {#if faceDetectionStatus == undefined}
            <p class="text-xs text-base-foreground-subtle">
              顔の位置は未検出です
            </p>
          {:else if faceDetectionStatus.type === "inProgress"}
            <p class="text-xs text-base-foreground-subtle">
              顔の位置を検出中です…
            </p>
          {:else if faceDetectionStatus.type === "success"}
            <p class="text-xs text-success">顔の位置を検出しました!</p>
          {:else if faceDetectionStatus.type === "failure"}
            <p class="text-xs text-destructive">
              顔の位置を検出できませんでした
            </p>
          {/if}
        </div>

        <Button
          variant="primary"
          disabled={currentStep !== 3 ||
            faceDetectionStatus?.type !== "success"}
          onclick={goToStep4}
        >
          次へ
        </Button>
      </Card>
    </div>
  {/if}
  {#if currentStep >= 4}
    <div id="step4" class="scroll-mt-4" class:min-h-screen={currentStep === 4}>
      <Card>
        <div class="flex flex-col space-y-2">
          <p class="text-xs">ステップ 4/4</p>
          <h2 class="text-2xl font-bold">アイリスアウト効果の適用</h2>
        </div>
        <ul class="list-disc px-6 text-sm">
          <li>下のボタンをクリックして、アイリスアウト効果を適用します。</li>
        </ul>
        <div class="flex max-w-full space-x-4">
          <Button
            class="flex-1/3"
            variant="primary"
            disabled={currentIrisOutStep !== "none" || isAnimating}
            onclick={() => {
              updateIrisOutStep("focused");
            }}
          >
            <Play class="size-4" />
            フォーカスを開始
          </Button>
          <Button
            class="flex-1/3"
            variant="primary"
            disabled={currentIrisOutStep !== "focused" || isAnimating}
            onclick={() => {
              updateIrisOutStep("hidden");
            }}
          >
            <X class="size-4" />
            フォーカスを閉じる
          </Button>
          <Button
            class="flex-1/3"
            variant="secondary"
            disabled={currentIrisOutStep === "none" || isAnimating}
            onclick={() => {
              updateIrisOutStep("none");
            }}
          >
            <RotateCcw class="size-4" />
            元に戻す
          </Button>
        </div>
        {#if step4ErrorMessage}
          <p class="text-xs text-destructive">
            {step4ErrorMessage}
          </p>
        {/if}
        <div class="relative">
          <video
            id="video-step4"
            class="aspect-video rounded-md bg-base-container-primary object-contain"
            autoplay
            playsinline
          >
            <track default kind="captions" />
          </video>
          <canvas
            id="irisout-canvas"
            class="pointer-events-none absolute inset-0 h-full w-full"
          ></canvas>
          <Badge tone="filled" class="absolute top-3 left-3"
            >仮想カメラの映像</Badge
          >
        </div>
      </Card>
    </div>
  {/if}
</div>

<svelte:window oncopy={onCopyWithCommand} />
