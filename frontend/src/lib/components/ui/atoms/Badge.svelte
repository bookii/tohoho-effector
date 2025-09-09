<!--
@component
## 概要
- ラベルやステータスなどの短い情報を表示するためのコンポーネントです
- 必要に応じて、リンクやボタンとしてナビゲーションやフィルターUIなど幅広い用途に対応します

## 機能
- クリックやフォーカスなどのインタラクションに対応します
- 見た目を変更するためのいくつかのスタイル用Propsが追加されています(詳細はPropsセクションを参照)

## Props
- tone: 塗りのスタイルを指定します
- link: ボタンやリンクスタイルに適用可能です

## Usage
```svelte
/** バッジ */
<Badge tone="filled">バッジ</Badge>
/** リンク */
<a href="/" class={badgeVariants({ tone: 'filled', link: true })}>バッジ</a>
```
-->

<script module lang="ts">
  import { cva, type VariantProps } from "class-variance-authority";
  import type { Snippet } from "svelte";

  export const badgeVariants = cva(
    "inline-flex items-center w-fit rounded-full leading-none text-xs font-semibold outline-primary",
    {
      variants: {
        /** ボタンの塗りの値 */
        tone: {
          filled: [
            "py-1 px-2.5 bg-primary text-base-foreground-on-fill-bright",
          ],
          outlined: [
            "py-[0.1875rem] px-[0.5625rem] border border-primary text-base-foreground-default",
          ],
        },
        /** リンク */
        link: {
          true: [],
          false: [],
        },
      },
      compoundVariants: [
        {
          tone: "filled",
          link: true,
          class:
            "transition-colors hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-[0.125rem] focus-visible:outline-offset-[0.125rem]",
        },
        {
          tone: "outlined",
          link: true,
          class:
            "transition-colors hover:border-primary/90 hover:bg-base-container-accent/90 active:bg-base-container-accent/80 active:border-primary/80 focus-visible:outline-[0.125rem] focus-visible:outline-offset-[0.125rem]",
        },
      ],
      defaultVariants: {
        tone: "filled",
        link: false,
      },
    }
  );

  export type BadgeVariants = VariantProps<typeof badgeVariants>;

  export interface BadgeProps extends BadgeVariants {
    /** クラス */
    class?: string;
    children?: Snippet<[]>;
  }
</script>

<script lang="ts">
  let {
    tone = "filled",
    link = false,
    class: className = "",
    children,
  }: BadgeProps = $props();

  let badgeVariantClass = $derived(
    badgeVariants({
      tone,
      link,
      class: className,
    })
  );
</script>

<div class={badgeVariantClass}>
  {@render children?.()}
</div>
