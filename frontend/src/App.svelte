<script lang="ts">
  import Index from "@/routes/Index.svelte";
  import Source from "@/routes/Source.svelte";
  import { Router, type RouteConfig } from "@mateothegreat/svelte5-router";

  const routes: RouteConfig[] = [
    {
      path: "sources/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})",
      component: Source,
    },
    {
      component: Index,
    },
  ];
</script>

<Router {routes} />
