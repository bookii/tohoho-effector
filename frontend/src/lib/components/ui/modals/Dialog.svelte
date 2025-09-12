<!--
@component
## 概要
- ユーザーに対して情報を提示したり、オプションを選択させるためのコンポーネントです

## 機能
- グループ化して表示することができます
- 任意のコンテンツを配置できます

## Usage
```svelte
<Dialog bind:open={isOpen}>
  {@render children()}
</Dialog>
```
-->

<script module lang="ts">
  import { cva, type VariantProps } from "class-variance-authority";
  import type { Snippet } from "svelte";

  export const dialogVariants = cva(
    "relative flex flex-col gap-6 p-6 bg-base-container-default border border-base-stroke-default rounded-lg shadow-lg"
  );

  export type DialogVariants = VariantProps<typeof dialogVariants>;

  export interface DialogProps extends DialogVariants {
    /** Dialogが開いているかどうか */
    open: boolean;
    /** Dialog以外押して閉じれるかどうか */
    dismissible?: boolean;
    /** primaryボタンの文言 */
    positiveText?: string;
    /** secondaryボタンの文言 */
    negativeText?: string;
    /** 閉じれるようにするかどうか */
    enableClose?: boolean;
    /** ボタンが押されたときのハンドラ */
    onClick: (result: boolean) => void;
    /** クラス */
    class?: string;
    children: Snippet<[]>;
  }
</script>

<script lang="ts">
  import Button from "@/lib/components/ui/atoms/Button.svelte";
  import { X } from "@lucide/svelte";
  import { fade, scale } from "svelte/transition";

  let {
    open = $bindable(false),
    dismissible = false,
    positiveText = "決定",
    enableClose = false,
    class: className = "",
    onClick,
    children,
  }: DialogProps = $props();

  let backgroundElement = $state<HTMLElement>();

  let dialogVariantsClass = $derived(
    dialogVariants({
      class: className,
    })
  );

  $effect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  // dialog外をクリックしたときにdialogを閉じる
  function handleClickOutside(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!backgroundElement) return;
    if (!(e.target instanceof HTMLElement)) return;
    if (backgroundElement.contains(e.target) && dismissible) {
      open = false;
    }
  }

  // escキーでdrawerを閉じる
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && dismissible) {
      open = false;
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 bg-base-container-default/50 z-40"
    bind:this={backgroundElement}
    transition:fade={{ duration: 150 }}
  ></div>
  <div class="fixed inset-0 z-50 size-fit m-auto">
    <div
      class={dialogVariantsClass}
      transition:scale={{ start: 0.9, duration: 150 }}
    >
      {@render children()}
      <Button
        class="max-md:w-full"
        variant="primary"
        onclick={() => onClick(true)}>{positiveText}</Button
      >
      {#if enableClose}
        <Button
          class="absolute top-2 right-2 p-2"
          tone="ghost"
          variant="secondary"
          size="small"
          isSquare
          onclick={() => onClick(false)}
        >
          <X size="1rem" />
        </Button>
      {/if}
    </div>
  </div>
{/if}
