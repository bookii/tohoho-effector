<!--
@component
## 概要
- Spinnerは、処理が進行中であることを示すコンポーネントです

## 機能
- アニメーションを使用して、処理中であることを視覚的に示します

## Props
- size: スピナーのサイズを指定します
- color: スピナーの色を指定します

## Usage
```svelte
<Spinner {size} {color}/>
```
-->

<script module lang="ts">
  import { cva, type VariantProps } from "class-variance-authority";

  export const spinnerVariants = cva(
    "animate-spin [animation-duration:1.2s] [animation-timing-function:ease-in-out]"
  );

  export type SpinnerProps = VariantProps<typeof spinnerVariants>;
  export interface SpinnerComponentProps extends SpinnerProps {
    /** スピナーのサイズ */
    size?: string;
    /** スピナーの色 */
    color?: string;
    /** クラス */
    class?: string;
  }
</script>

<script lang="ts">
  import { LoaderCircle } from "@lucide/svelte";

  let {
    size = "3rem",
    color = "var(--color-primary)",
    class: className = "",
  }: SpinnerComponentProps = $props();

  let spinnerVariantClass = $derived(
    spinnerVariants({
      class: className,
    })
  );
</script>

<LoaderCircle {size} {color} class={spinnerVariantClass} />
