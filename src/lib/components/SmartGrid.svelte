<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  let mouseX = $state(0);
  let mouseY = $state(0);
  let gridOffsetX = $state(0);
  let gridOffsetY = $state(0);
  let frameId: number;

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  onMount(() => {
    // Start cursor light vaguely near the center
    mouseX = window.innerWidth / 2;
    mouseY = window.innerHeight / 2;

    const speedX = 0.5;
    const speedY = 0.5;

    function loop() {
      // Modulo 40 because the SVG pattern is 40x40
      gridOffsetX = (gridOffsetX + speedX) % 40;
      gridOffsetY = (gridOffsetY + speedY) % 40;
      frameId = requestAnimationFrame(loop);
    }
    frameId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
    if (frameId) cancelAnimationFrame(frameId);
  });
</script>

<svelte:window onmousemove={handleMouseMove} />

<!-- Fixed base grid -->
<div class="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
  
  <div class="absolute inset-0 opacity-[0.05]">
    <svg class="w-full h-full">
      <defs>
        <pattern
          id="infinite-grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={gridOffsetX}
          y={gridOffsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="white"
            stroke-width="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#infinite-grid-pattern)" />
    </svg>
  </div>

  <!-- Interactive masked grid -->
  <div 
    class="absolute inset-0 opacity-20 transition-opacity duration-300"
    style:mask-image="radial-gradient(300px circle at {mouseX}px {mouseY}px, black, transparent)"
    style:-webkit-mask-image="radial-gradient(300px circle at {mouseX}px {mouseY}px, black, transparent)"
  >
    <svg class="w-full h-full">
      <defs>
        <pattern
          id="active-grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={gridOffsetX}
          y={gridOffsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="white"
            stroke-width="1.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#active-grid-pattern)" />
    </svg>
  </div>
</div>
