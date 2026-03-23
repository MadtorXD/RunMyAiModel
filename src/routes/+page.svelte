<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import SmartGrid from '$lib/components/SmartGrid.svelte';
  import HardwareFilter from '$lib/components/HardwareFilter.svelte';
  import ModelCard from '$lib/components/ModelCard.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import models from '$lib/data/models.json';
  import gpus from '$lib/data/gpus.json';
  import { bucketModels, groupVariants, findCheapestCloud } from '$lib/utils/calculator';

  let selectedGpu = $state<any>(null);
  let gpuCount = $state(1);
  let customVram = $state<number | null>(null);
  let systemRam = $state(0);
  let minContext = $state<number | null>(null);
  let minTokSec = $state<number | null>(null);
  let reqFeatures = $state<string[]>([]);
  let minTier = $state<string | null>(null);
  let family = $state<string | null>(null);
  let isAppleSilicon = $state(false);
  let resultFilter = $state('');
  let rankedBy = $state('mmlu');

  onMount(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('gpu')) {
        const gName = params.get('gpu');
        const g = gpus.find((x: any) => x.name === gName) || gpus.find((x: any) => x.name.startsWith(gName || ''));
        if (g) {
          const explicitVram = params.get('vram');
          const explicitBw = params.get('bw');
          selectedGpu = { 
            ...g, 
            vram_gb: explicitVram ? Number(explicitVram) : g.vram_gb,
            bandwidth_gbps: explicitBw ? Number(explicitBw) : g.bandwidth_gbps,
            name: explicitVram ? `${g.name} (${explicitVram}GB)` : g.name
          };
        }
      }
      if (params.has('custom')) customVram = Number(params.get('custom'));
      if (params.has('ram')) systemRam = Number(params.get('ram'));
      if (params.has('ctx')) minContext = Number(params.get('ctx'));
      if (params.has('tok')) minTokSec = Number(params.get('tok'));
      if (params.has('feat')) reqFeatures = params.get('feat')?.split(',') || [];
      if (params.has('tier')) minTier = params.get('tier');
      if (params.has('fam')) family = params.get('fam');
      if (params.has('q')) resultFilter = params.get('q') || '';
      if (params.has('gpus')) gpuCount = Number(params.get('gpus'));
      if (params.has('sort')) rankedBy = params.get('sort') || 'mmlu';
    }
  });

  function copyShareLink(e: Event) {
    const params = new URLSearchParams();
    if (selectedGpu) {
      params.set('gpu', selectedGpu.name);
      params.set('vram', selectedGpu.vram_gb.toString());
      if (selectedGpu.bandwidth_gbps) params.set('bw', selectedGpu.bandwidth_gbps.toString());
    }
    if (customVram) params.set('custom', customVram.toString());
    if (systemRam) params.set('ram', systemRam.toString());
    if (minContext) params.set('ctx', minContext.toString());
    if (minTokSec) params.set('tok', minTokSec.toString());
    if (reqFeatures.length > 0) params.set('feat', reqFeatures.join(','));
    if (minTier) params.set('tier', minTier);
    if (family) params.set('fam', family);
    if (resultFilter) params.set('q', resultFilter);
    if (gpuCount > 1) params.set('gpus', gpuCount.toString());
    if (rankedBy !== 'mmlu') params.set('sort', rankedBy);
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    
    const btn = e.currentTarget as HTMLButtonElement;
    const feedback = btn.querySelector('.copied-feedback');
    if (feedback) {
      feedback.classList.remove('opacity-0');
      setTimeout(() => feedback.classList.add('opacity-0'), 2000);
    }
  }

  let bucketedResults = $derived.by(() => {
    let baseVram = 0;
    let baseBandwidth: number | null = null;
    if (selectedGpu) {
      baseVram = selectedGpu.vram_gb * gpuCount;
      baseBandwidth = selectedGpu.bandwidth_gbps ? selectedGpu.bandwidth_gbps * gpuCount : null;
    } else if (customVram) {
      baseVram = customVram;
      baseBandwidth = null;
    } else {
      return null;
    }

    let bucketed = bucketModels(models, baseVram, baseBandwidth, minContext, minTokSec, reqFeatures, rankedBy, systemRam || null, minTier, family);
    
    // Add cloud pricing for models that don't fit locally
    bucketed.noFit = bucketed.noFit.map((m: any) => ({
      ...m,
      cheapestCloud: findCheapestCloud(m, gpus as any[])
    }));

    if (resultFilter.trim()) {
      const q = resultFilter.toLowerCase();
      const filterFn = (m: any) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
      bucketed.fits = bucketed.fits.filter(filterFn);
      bucketed.tight = bucketed.tight.filter(filterFn);
      bucketed.noFit = bucketed.noFit.filter(filterFn);
    }
    return bucketed;
  });

  let fitsModels = $derived(bucketedResults ? bucketedResults.fits : []);
  let tightModels = $derived(bucketedResults ? bucketedResults.tight : []);
  let noFitModels = $derived(bucketedResults ? bucketedResults.noFit : []);
  let hasSearched = $derived(selectedGpu !== null || customVram !== null);
</script>

<svelte:head><title>RunMyAIModel | AI Hardware Calculator</title></svelte:head>

<main class="min-h-screen relative overflow-hidden flex flex-col items-center pt-8 px-6 font-sans bg-transparent">
  <SmartGrid />
  <header class="absolute top-0 w-full p-6 flex justify-center md:justify-end z-50 max-w-[1072px] left-1/2 -translate-x-1/2">
    <a href="/guide" class="text-sm font-medium text-gray-400 hover:text-white transition-colors bg-surface border border-border px-4 py-1.5 rounded-geist shadow-lg flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
      Beginner's Guide
    </a>
  </header>
  <div class="w-full max-w-5xl z-10 text-center space-y-12 relative pt-8">
    <div class="space-y-4 pt-8 relative">
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter animate-in fade-in slide-in-from-top-4 duration-1000 relative z-10">
        Run My <span class="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">AI</span>&#32;<span class="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Model</span>.
      </h1>
      <p class="text-xl leading-8 text-gray-300 max-w-2xl mx-auto font-normal animate-in fade-in slide-in-from-top-4 duration-1000 delay-150 relative z-10">Find the perfect AI model for your GPU in seconds</p>
    </div>

    <div class="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
      <HardwareFilter bind:selectedGpu bind:gpuCount bind:customVram bind:systemRam bind:minContext bind:minTokSec bind:reqFeatures bind:minTier bind:family bind:isAppleSilicon />
    </div>

    <div class="mt-12 w-full text-left">
      <div class="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 border-b border-border pb-4">
        <div class="w-full md:w-auto">
          <h2 class="text-2xl font-bold text-white tracking-tight mb-2">Results</h2>
          {#if hasSearched}
            {@const allModelsCount = fitsModels.length + tightModels.length + noFitModels.length}
            {@const fittingModelsCount = fitsModels.length + tightModels.length}
            <div class="text-[13px] text-gray-300">
              <strong class="text-white font-bold">{fittingModelsCount}</strong> of {allModelsCount} model configurations can run on 
              <strong class="text-white font-bold">{selectedGpu ? selectedGpu.vram_gb * gpuCount : customVram} GB</strong> VRAM {#if systemRam > 0}+ <strong class="text-white font-bold">{systemRam} GB</strong> system RAM{/if}
              — sorted by quality
            </div>
            <div class="flex items-center gap-3 mt-3">
              <span class="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Ranked by</span>
              <div class="inline-flex p-0.5 bg-[#0a0a0a] border border-[#333] rounded-[6px] transition-colors">
                <button onclick={() => rankedBy = 'mmlu'} class="px-2.5 py-1 text-[10px] font-bold rounded-[4px] transition-all duration-200 {rankedBy === 'mmlu' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}">MMLU</button>
                <button onclick={() => rankedBy = 'swe-bench'} class="px-2.5 py-1 text-[10px] font-bold rounded-[4px] transition-all duration-200 {rankedBy === 'swe-bench' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}">SWE-Bench</button>
                <button onclick={() => rankedBy = 'lmsys'} class="px-2.5 py-1 text-[10px] font-bold rounded-[4px] transition-all duration-200 {rankedBy === 'lmsys' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}">LMSYS</button>
              </div>
              <!-- Tooltip -->
              <div class="relative group flex items-center">
                <svg class="w-4 h-4 text-gray-500 hover:text-gray-200 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div class="absolute bottom-full right-[-8px] md:right-auto md:left-1/2 md:-translate-x-1/2 mb-3 w-[260px] md:w-72 p-4 bg-[#0a0a0a] border border-[#333] rounded-geist shadow-[0_0_20px_rgba(0,0,0,0.5)] text-[11px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none leading-relaxed overflow-visible">
                  <div class="absolute -bottom-[6px] right-[12px] md:right-auto md:left-1/2 md:-translate-x-1/2 w-2.5 h-2.5 bg-[#0a0a0a] border-b border-r border-[#333] rotate-45"></div>
                  <div class="space-y-2">
                    {#if rankedBy === 'mmlu'}
                      <p><strong class="text-white font-semibold">MMLU</strong> measures general knowledge across 57 subjects. Higher = more capable.</p>
                      <p class="text-gray-500">Sorted best-first.</p>
                    {:else if rankedBy === 'swe-bench'}
                      <p><strong class="text-white font-semibold">SWE-bench Verified</strong> measures a model's ability to resolve real-world GitHub issues. Higher = better.</p>
                      <p class="text-gray-500">Sorted best-first.</p>
                    {:else if rankedBy === 'lmsys'}
                      <p><strong class="text-white font-semibold">LMSYS Chatbot Arena</strong> is a crowdsourced leaderboard based on human evaluations. Higher Elo = preferred by humans.</p>
                      <p class="text-gray-500">Sorted best-first.</p>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
        {#if hasSearched}
          <div class="flex gap-4 w-full md:w-auto animate-in fade-in duration-500 shrink-0">
            <input type="text" bind:value={resultFilter} placeholder="Filter by name..." class="w-full md:w-52 px-4 py-2 bg-black border border-border rounded-geist text-sm text-gray-100 placeholder-gray-500 focus:border-vercel-blue focus:outline-none transition-colors" />
            <button onclick={copyShareLink} class="px-4 py-2 bg-white text-black text-sm font-bold rounded-geist hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 relative">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              <span>Share Config</span>
              <span class="copied-feedback absolute inset-0 bg-green-500 text-white rounded-geist flex items-center justify-center font-bold opacity-0 transition-opacity pointer-events-none">Copied URL!</span>
            </button>
          </div>
        {/if}
      </div>
      
      {#if !hasSearched}
        <div class="w-full py-16 border border-border border-dashed rounded-geist flex items-center justify-center text-gray-400 text-sm">Select a GPU or enter your VRAM to see results.</div>
      {:else}
        {#if fitsModels.length > 0}
          <div class="mb-12 relative border-2 border-dotted border-green-900/60 rounded-geist p-6 shadow-2xl isolate overflow-hidden">
            <div class="absolute inset-0 bg-green-900/10 backdrop-blur-md -z-10 [transform:translateZ(0)]"></div>
            <h3 class="text-lg font-bold text-green-500 mb-6 tracking-wide uppercase">RUNS WELL</h3>
            <div class="flex flex-col gap-4">{#each fitsModels as model}<div class="animate-in fade-in duration-500"><ModelCard {model} {rankedBy} {isAppleSilicon} /></div>{/each}</div>
          </div>
        {/if}
        {#if tightModels.length > 0}
          <div class="mb-12 relative border-2 border-dotted border-yellow-900/60 rounded-geist p-6 shadow-2xl isolate overflow-hidden">
            <div class="absolute inset-0 bg-yellow-900/10 backdrop-blur-md -z-10 [transform:translateZ(0)]"></div>
            <h3 class="text-lg font-bold text-yellow-500 mb-6 tracking-wide uppercase">TIGHT FIT</h3>
            <div class="flex flex-col gap-4">{#each tightModels as model}<div class="animate-in fade-in duration-500"><ModelCard {model} {rankedBy} {isAppleSilicon} /></div>{/each}</div>
          </div>
        {/if}
        {#if noFitModels.length > 0}
          <div class="mb-12 relative border-2 border-dotted border-red-900/60 rounded-geist p-6 shadow-2xl isolate overflow-hidden">
            <div class="absolute inset-0 bg-red-900/10 backdrop-blur-md -z-10 [transform:translateZ(0)]"></div>
            <h3 class="text-lg font-bold text-red-500 mb-6 tracking-wide uppercase">DOES NOT FIT</h3>
            <div class="flex flex-col gap-4 text-gray-400">{#each noFitModels as model}<div class="animate-in fade-in duration-500 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all"><ModelCard {model} {rankedBy} /></div>{/each}</div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  <Footer />
</main>
```
