<!--
@component
## 概要
- セクション間の区切り線（セパレーター）を表示するためのコンポーネントです

## 機能
- directionに応じて、横または縦の区切り線を表示します

## Props
- direction: 方向を指定すると、それに合わせたスタイルが適用されます

## Usage
```svelte
<Separator direction="horizontal" />
<Separator direction="vertical" />
```
-->

<script module lang="ts">
  import { cva, type VariantProps } from "class-variance-authority";
  import type { Snippet } from "svelte";

  export const separatorVariants = cva("bg-base-stroke-default", {
    variants: {
      /** セパレーターの方向 */
      direction: {
        horizontal: ["w-full h-px"],
        vertical: ["w-px h-full"],
      },
    },
    defaultVariants: {
      direction: "horizontal",
    },
  });

  export type SeparatorVariants = VariantProps<typeof separatorVariants>;

  export interface SeparatorProps extends SeparatorVariants {
    /** クラス */
    class?: string;
    children?: Snippet<[]>;
  }
</script>

<script lang="ts">
  let { direction, class: className = "" }: SeparatorProps = $props();

  let separatorVariantClass = $derived(
    separatorVariants({
      direction: direction,
      class: className,
    })
  );
</script>

<div class={separatorVariantClass}></div>
