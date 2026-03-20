<script lang="ts">
  import { onMount } from 'svelte';
  import gpus from '$lib/data/gpus.json';

  interface Props {
    selectedGpu: any;
    gpuCount: number;
    customVram: number | null;
    systemRam: number;
    minContext: number | null;
    minTokSec: number | null;
    reqFeatures: string[];
    minTier: string | null;
    family: string | null;
    isAppleSilicon: boolean;
  }

  let { 
    selectedGpu = $bindable(null), 
    gpuCount = $bindable(1),
    customVram = $bindable(null),
    systemRam = $bindable(16),
    minContext = $bindable(null),
    minTokSec = $bindable(null),
    reqFeatures = $bindable([]),
    minTier = $bindable(null),
    family = $bindable(null),
    isAppleSilicon = $bindable(false)
  }: Props = $props();

  $effect(() => {
    isAppleSilicon = selectedGpu?.manufacturer === 'Apple' || (selectedGpu?.name && /^M[1-9]/.test(selectedGpu.name));
    if (isAppleSilicon) {
      systemRam = 0;
    }
  });

  let searchTerm = $state('');
  let isGpuOpen = $state(false);
  let isFeatureOpen = $state(false);
  
  let dropdownRef = $state<HTMLDivElement>();
  let inputRef = $state<HTMLInputElement>();
  let featureRef = $state<HTMLDivElement>();

  const groupedGpus = gpus.reduce((acc, gpu) => {
    if (!acc[gpu.manufacturer]) acc[gpu.manufacturer] = [];
    acc[gpu.manufacturer].push(gpu);
    return acc;
  }, {} as Record<string, typeof gpus>);

  let filteredGroups = $derived.by(() => {
    if (!searchTerm) return groupedGpus;
    const q = searchTerm.toLowerCase();
    const result: Record<string, typeof gpus> = {};
    for (const [mfg, list] of Object.entries(groupedGpus)) {
      const filtered = list.filter(g => {
        const nameMatches = g.name.toLowerCase().includes(q);
        if (nameMatches) return true;
        
        if (g.vram_options) {
          return g.vram_options.some((opt: any) => `${g.name} (${opt.vram_gb} gb)`.toLowerCase().includes(q));
        }
        return `${g.name} (${g.vram_gb} gb)`.toLowerCase().includes(q);
      });
      if (filtered.length > 0) result[mfg] = filtered;
    }
    return result;
  });

  function closeDropdown() {
    isGpuOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeDropdown();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(e.target as Node) && inputRef && !inputRef.contains(e.target as Node)) {
        closeDropdown();
      }
      if (featureRef && !featureRef.contains(e.target as Node)) {
        isFeatureOpen = false;
      }
    };
    window.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('click', handleClickOutside);
    };
  });

  const contextOptions = [
    { value: null, label: 'Any' },
    { value: 2, label: '2k' },
    { value: 4, label: '4k' },
    { value: 8, label: '8k' },
    { value: 16, label: '16k' },
    { value: 32, label: '32k' },
    { value: 64, label: '64k' },
    { value: 128, label: '128k' },
    { value: 256, label: '256k' },
    { value: 512, label: '512k' },
    { value: 1024, label: '1M' },
    { value: 2048, label: '2M+' }
  ];

  const tokSecOptions = [
    { value: null, label: 'Any' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
    { value: 40, label: '40' },
    { value: 50, label: '50' },
    { value: 100, label: '100' }
  ];

  const featureOptions = [
    { value: null, label: 'Any' },
    { value: 'reasoning', label: 'Reasoning' },
    { value: 'tool_use', label: 'Tool Use' },
    { value: 'vision', label: 'Vision' },
    { value: 'coding', label: 'Coding' },
    { value: 'moe', label: 'Mixture Of Experts' },
    { value: 'math', label: 'Mathematics' }
  ];

  const tierOptions = [
    { value: null, label: 'Any Quality' },
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Great', label: 'Great' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Basic', label: 'Basic' }
  ];

  const familyOptions = [
    { value: null, label: 'Any Family' },
    { value: 'Llama', label: 'Llama' },
    { value: 'Qwen', label: 'Qwen' },
    { value: 'DeepSeek', label: 'DeepSeek' },
    { value: 'Mistral', label: 'Mistral' },
    { value: 'Gemma', label: 'Gemma' },
    { value: 'Phi', label: 'Phi' },
    { value: 'Other', label: 'Other' }
  ];

  let repeatTimer: any;
  let repeatInterval: any;

  function startRepeat(fn: () => void) {
    fn();
    repeatTimer = setTimeout(() => {
      repeatInterval = setInterval(fn, 50);
    }, 400);
  }

  function stopRepeat() {
    clearTimeout(repeatTimer);
    clearInterval(repeatInterval);
  }
  function toggleFeature(val: string | null) {
    if (val === null) {
      reqFeatures = [];
      return;
    }
    if (reqFeatures.includes(val)) {
      reqFeatures = reqFeatures.filter((f: string) => f !== val);
    } else {
      reqFeatures = [...reqFeatures, val];
    }
  }

  function getFeatureLabel() {
    if (reqFeatures.length === 0) return "Any Features";
    const labels = reqFeatures.map((f: string) => featureOptions.find(opt => opt.value === f)?.label);
    if (labels.length === 1) return labels[0];
    return `${labels[0]}, +${labels.length - 1}`;
  }
  function selectGpu(gpu: any) {
    selectedGpu = gpu;
    searchTerm = `${gpu.name} (${gpu.vram_gb} GB)`;
    customVram = null;
    closeDropdown();
  }

  function onVramInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (val) {
      customVram = parseFloat(val);
      selectedGpu = null;
      searchTerm = '';
    } else {
      customVram = null;
    }
  }
</script>

<!-- Help Tooltip Snippet -->
{#snippet helpIcon(text: string)}
  <div class="relative group flex items-center ml-1.5 inline-flex align-middle">
    <svg class="w-3.5 h-3.5 text-gray-500 hover:text-gray-200 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-[#0a0a0a] border border-[#333] rounded-geist shadow-[0_0_20px_rgba(0,0,0,0.5)] text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-[100] pointer-events-none leading-relaxed overflow-visible text-center">
      <!-- Triangular Tail -->
      <div class="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0a0a0a] border-b border-r border-[#333] rotate-45"></div>
      {text}
    </div>
  </div>
{/snippet}

<div class="w-full bg-surface border border-border rounded-geist p-6 shadow-2xl space-y-6">
  
    <div class="grid grid-cols-3 gap-6 items-start text-left">
      
      <!-- Row 1: GPU, GPUs & VRAM combined container -->
      <div class="col-span-3 flex flex-row gap-4 items-end">
        
        <!-- GPU -->
        <div class="relative w-full flex-1">
          <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="gpu-search">
            Select Your GPU
          </label>
          <input
            id="gpu-search"
            bind:this={inputRef}
            type="text"
            bind:value={searchTerm}
            onfocus={() => isGpuOpen = true}
            class="block w-full pl-4 pr-10 py-2 bg-black border border-border rounded-geist text-gray-100 placeholder-gray-400 focus:border-gray-200 focus:outline-none transition-colors sm:text-sm"
            placeholder="Search GPUs..."
            autocomplete="off"
          />
          {#if searchTerm || selectedGpu}
            <button 
              class="absolute right-3 top-[34px] text-[#ff0000] hover:scale-110 transition-transform focus:outline-none"
              onclick={() => { selectedGpu = null; searchTerm = ''; }}
              title="Clear search"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          {/if}
          {#if isGpuOpen}
            <div bind:this={dropdownRef} class="absolute z-50 w-full mt-1 bg-black border border-border rounded-geist shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              {#each Object.entries(filteredGroups) as [mfg, items]}
                <div class="px-3 py-1.5 bg-surface text-xs font-bold text-gray-200 uppercase tracking-wider sticky top-0 border-b border-border z-10">
                  {mfg}
                </div>
                {#each items as gpu}
                  {#if gpu.vram_options}
                    {#each gpu.vram_options as opt}
                      <button
                        class="w-full text-left px-4 py-2 hover:bg-surface transition-colors flex justify-start items-center gap-2 group text-sm z-0"
                        onclick={() => selectGpu({ ...gpu, vram_gb: opt.vram_gb, bandwidth_gbps: opt.bandwidth_gbps, name: gpu.name })}
                      >
                        <span class="font-medium text-gray-100 group-hover:text-white">{gpu.name}</span>
                        <span class="text-xs text-gray-400 group-hover:text-gray-100">({opt.vram_gb} GB)</span>
                      </button>
                    {/each}
                  {:else}
                    <button
                      class="w-full text-left px-4 py-2 hover:bg-surface transition-colors flex justify-start items-center gap-2 group text-sm z-0"
                      onclick={() => selectGpu(gpu)}
                    >
                      <span class="font-medium text-gray-100 group-hover:text-white">{gpu.name}</span>
                      <span class="text-xs text-gray-400 group-hover:text-gray-100">({gpu.vram_gb} GB)</span>
                    </button>
                  {/if}
                {/each}
              {/each}
              {#if Object.keys(filteredGroups).length === 0}
                <div class="p-4 text-center text-sm text-gray-400">No GPUs found.</div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- GPUS count -->
        <div class="relative w-[72px] shrink-0">
          <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="gpu-count">
            GPUs {@render helpIcon("Number of GPUs. VRAM scales with this count for multi-GPU setups.")}
          </label>
          <div class="flex items-center justify-between w-full h-[38px] bg-black border border-border rounded-geist overflow-hidden transition-colors focus-within:border-gray-200">
            <input 
              type="number" 
              bind:value={gpuCount} 
              min="1" 
              max="8"
              class="flex-1 w-full bg-transparent text-center text-sm font-bold text-gray-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div class="flex flex-col border-l border-border h-full w-[26px] shrink-0">
              <button 
                onmousedown={() => startRepeat(() => { if (gpuCount < 8) gpuCount++; })}
                onmouseup={stopRepeat}
                onmouseleave={stopRepeat}
                class="flex-1 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center border-b border-border"
                title="Increase"
              >
                <svg class="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg>
              </button>
              <button 
                onmousedown={() => startRepeat(() => { if (gpuCount > 1) gpuCount--; })}
                onmouseup={stopRepeat}
                onmouseleave={stopRepeat}
                class="flex-1 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
                title="Decrease"
              >
                <svg class="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- OR divider -->
        <div class="pb-3 px-1 text-[10px] font-bold tracking-widest uppercase text-gray-400 italic shrink-0 pointer-events-none">
          or
        </div>

        <!-- VRAM -->
        <div class="relative w-28 shrink-0">
          <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="custom-vram">
            {isAppleSilicon ? 'Memory (GB)' : 'VRAM (GB)'} {@render helpIcon(isAppleSilicon ? "Total Unified Memory." : "Total video memory. Enter a custom value if no specific GPU is selected.")}
          </label>
          <input
            id="custom-vram"
            type="number"
            value={customVram || ''}
            oninput={onVramInput}
            class="block w-full px-4 py-2 bg-black border border-border rounded-geist text-gray-100 placeholder-gray-400 focus:border-gray-200 focus:outline-none transition-colors sm:text-sm"
            placeholder="e.g. 8"
            min="1"
            step="1"
          />
        </div>
        
      </div>

      <!-- Row 2: Minimum Context Window -->
      <div class="relative w-full">
        <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="min-context">
          Minimum Context Window {@render helpIcon("Max text memory. 128k+ is ideal for analyzing full documents.")}
        </label>
        <div class="relative">
          <select
            id="min-context"
            bind:value={minContext}
            class="block w-full px-4 py-2 bg-black border border-border rounded-geist text-gray-100 focus:border-gray-200 focus:outline-none transition-colors sm:text-sm appearance-none"
          >
            {#each contextOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-300">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <!-- Row 2: Minimum Tokens/Sec -->
      <div class="relative w-full">
        <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="min-toksec">
          Minimum Tokens/Sec {@render helpIcon("Generation speed. 15-20 t/s is reading speed; 50+ is very fast.")}
        </label>
        <div class="relative">
          <select
            id="min-toksec"
            bind:value={minTokSec}
            class="block w-full px-4 py-2 bg-black border border-border rounded-geist text-gray-100 focus:border-gray-200 focus:outline-none transition-colors sm:text-sm appearance-none"
          >
            {#each tokSecOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-300">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <!-- Row 2: Required Features (Multi-select) -->
      <div class="relative w-full" bind:this={featureRef}>
        <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="req-features">
          Required Features {@render helpIcon("Filter by capabilities like Coding (high SWE-bench), MoE (efficiency), Math, Vision, or Reasoning.")}
        </label>
        <div
          role="button"
          tabindex="0"
          onclick={() => isFeatureOpen = !isFeatureOpen}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') isFeatureOpen = !isFeatureOpen }}
          class="flex items-center justify-between w-full px-4 py-2 bg-black border border-border rounded-geist text-gray-100 hover:border-gray-200 focus:outline-none transition-colors sm:text-sm text-left relative cursor-pointer"
        >
          <span class={reqFeatures.length === 0 ? "text-gray-400" : "text-gray-100"}>
            {getFeatureLabel()}
          </span>
          <div class="flex items-center gap-2">
            {#if reqFeatures.length > 0}
              <button 
                onclick={(e) => { e.stopPropagation(); reqFeatures = []; }}
                class="text-gray-500 hover:text-white transition-colors"
                title="Clear all"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            {/if}
            <svg class="h-4 w-4 text-gray-300 transform transition-transform {isFeatureOpen ? 'rotate-180 text-white' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        {#if isFeatureOpen}
          <div class="absolute z-50 w-full mt-1 bg-black border border-border rounded-geist shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1">
            {#each featureOptions.filter(f => f.value !== null) as opt}
              <button
                onclick={() => toggleFeature(opt.value)}
                class="w-full flex items-center justify-between px-3 py-2 rounded-geist hover:bg-surface transition-colors group text-sm"
              >
                <span class="font-medium {reqFeatures.includes(opt.value as string) ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}">
                  {opt.label}
                </span>
                {#if reqFeatures.includes(opt.value as string)}
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Row 3: Quality Tier -->
      <div class="relative w-full">
        <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="min-tier">
          Minimum Quality Tier {@render helpIcon("Benchmarked performance. Excellent models are most capable.")}
        </label>
        <div class="relative">
          <select
            id="min-tier"
            bind:value={minTier}
            class="block w-full px-4 py-2 bg-black border border-border rounded-geist text-gray-100 focus:border-gray-200 focus:outline-none transition-colors sm:text-sm appearance-none"
          >
            {#each tierOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-300">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <!-- Row 3: Model Family -->
      <div class="relative w-full">
        <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="model-family">
          Model Family {@render helpIcon("Specific architectures like Llama, Qwen, or Mistral.")}
        </label>
        <div class="relative">
          <select
            id="model-family"
            bind:value={family}
            class="block w-full px-4 py-2 bg-black border border-border rounded-geist text-gray-100 focus:border-gray-200 focus:outline-none transition-colors sm:text-sm appearance-none"
          >
            {#each familyOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-300">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <!-- Row 3: System RAM -->
      {#if !isAppleSilicon}
      <div class="relative w-full">
        <label class="block text-xs font-semibold text-gray-200 uppercase tracking-widest mb-2" for="sys-ram">
          System RAM <span class="text-gray-400 normal-case tracking-tight">(optional)</span> {@render helpIcon("Spare memory used if VRAM is full (offloading). Much slower.")}
        </label>
        <div class="flex items-center justify-between w-full h-[38px] bg-black border border-border rounded-geist overflow-hidden transition-colors focus-within:border-gray-200">
          <div class="flex-1 flex gap-1 items-baseline px-4 pt-0.5">
            <input 
              type="number" 
              bind:value={systemRam} 
              min="0" 
              max="1024"
              class="w-8 bg-transparent text-left text-sm font-bold text-gray-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none overflow-hidden"
            />
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">GB</span>
          </div>
          <div class="flex flex-col border-l border-border h-full w-[26px] shrink-0">
            <button 
              onmousedown={() => startRepeat(() => { systemRam = Math.min(systemRam + 1, 1024); })}
              onmouseup={stopRepeat}
              onmouseleave={stopRepeat}
              class="flex-1 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center border-b border-border"
              title="Increase RAM"
            >
              <svg class="w-2.5 h-2.5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg>
            </button>
            <button 
              onmousedown={() => startRepeat(() => { systemRam = Math.max(systemRam - 1, 0); })}
              onmouseup={stopRepeat}
              onmouseleave={stopRepeat}
              class="flex-1 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
              title="Decrease RAM"
            >
              <svg class="w-2.5 h-2.5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </button>
          </div>
        </div>
      </div>
      {/if}
    </div>

    <!-- Dynamic Summary -->
    <div class="pt-6 border-t border-border/50 mt-6">
      <p class="text-[14px] text-gray-400 font-medium">
        {#if !selectedGpu && !customVram}
          Pick a GPU or enter VRAM to get started
        {:else}
          Using 
          <span class="text-vercel-blue font-bold">{selectedGpu ? selectedGpu.vram_gb * gpuCount : customVram} GB</span> {isAppleSilicon ? 'Unified Memory' : 'VRAM'} {#if systemRam > 0 && !isAppleSilicon}+ <span class="text-vercel-blue font-bold">{systemRam} GB</span> system RAM{/if}
        {/if}
      </p>
    </div>
  </div>
