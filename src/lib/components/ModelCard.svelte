<script lang="ts">
  import { contextLabel, tokLabel, getDeploymentCommands } from '$lib/utils/calculator';
  
  interface Props {
    model: any;
    rankedBy?: string;
    isAppleSilicon?: boolean;
  }
  let { model, rankedBy = 'mmlu', isAppleSilicon = false }: Props = $props();

  // Premium VRAM Breakdown Constants (Hardened for Parity)
  let weightsVram = $derived(Number(model.offloadInfo?.vramWeightGB ?? model.weight_gb ?? 0) || 0);
  let expectedKvVram = $derived((Number(model.maxCtxK || 0) > 0 && Number(model.kv_per_1k_gb || 0) > 0) 
    ? (Number(model.maxCtxK) * Number(model.kv_per_1k_gb)) 
    : 0);
  let totalVram = $derived(Math.max(0.1, weightsVram + expectedKvVram));
  let weightPct = $derived(totalVram > 0 ? Math.min(100, Math.max(0, (weightsVram / totalVram) * 100)) : 0);
  let kvPct = $derived(totalVram > 0 ? Math.min(100 - weightPct, Math.max(0, (expectedKvVram / totalVram) * 100)) : 0);

  let commands = $derived(getDeploymentCommands(model));
</script>

<div class="bg-surface border border-border group-container hover:border-gray-300 transition-all p-5 rounded-geist flex flex-col gap-4">
  <div class="flex justify-between items-start">
    <div>
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-white">{model.name}</h3>
        <span class="inline-flex items-center rounded-full bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight border border-white">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" /></svg>
          {model.id.split('-').pop()?.toUpperCase() || model.quantization}
        </span>
      </div>
      <div class="flex flex-wrap gap-2 mt-2 items-center">
        <span class="text-[10px] text-gray-100 font-mono uppercase tracking-widest border border-border px-1.5 py-0.5 rounded">
          {#if rankedBy === 'swe-bench'}
            SWE-Bench: {model.swe_bench_score !== null ? model.swe_bench_score : '-'}
          {:else if rankedBy === 'lmsys'}
            LMSYS: {model.lmsys_score !== null ? model.lmsys_score : '-'}
          {:else}
            MMLU: {model.mmlu_score !== null ? model.mmlu_score : '-'}
          {/if}
        </span>
        <span class="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm {model.tier.cls}">
          {model.tier.label}
        </span>
        {#each (model.features || []) as feature}
          {@const config = ({
            'reasoning': { label: 'Reasoning', color: '#0060D1' },
            'tool_use': { label: 'Tool Use', color: '#8E4EC6' },
            'vision': { label: 'Vision', color: '#DA3036' },
            'coding': { label: 'Coding', color: '#388E4A' },
            'moe': { label: 'Mixture Of Experts', color: '#4F46E5' },
            'math': { label: 'Mathematics', color: '#FF990A' }
          } as Record<string, { label: string, color: string }>)[feature] || { label: feature.replace('_', ' '), color: '#666' }}
          <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white border border-white/10 shadow-sm" style="background-color: {config.color}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            {config.label}
          </span>
        {/each}
      </div>
    </div>
    
    <!-- Ecosystem links -->
    <div class="flex flex-col md:flex-row gap-2 items-end md:items-center">
      <!-- Deploy commands -->
      <div class="relative group/menu">
        <button 
          class="p-1.5 bg-vercel-blue/10 border border-vercel-blue/30 rounded hover:bg-vercel-blue/20 transition-colors tooltip shrink-0" 
          title="Deployment Commands"
        >
          <svg class="w-4 h-4 text-vercel-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </button>
          
        <!-- Dropdown Menu -->
        <div class="absolute top-full mt-2 right-0 w-64 bg-[#0a0a0a] border border-[#333] rounded-geist shadow-[0_0_20px_rgba(0,0,0,0.5)] z-200 p-2 flex flex-col gap-1 cursor-default text-left opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 translate-y-2 group-hover/menu:translate-y-0">
          <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-1 border-b border-[#333] mb-1">
            Run Locally
          </div>
          {#each commands as cmd}
            <button 
              class="flex flex-col gap-1 p-2 rounded hover:bg-[#1a1a1a] transition-colors text-left group/cmd relative overflow-hidden"
              onclick={(e) => { 
                navigator.clipboard.writeText(cmd.command); 
                const btn = e.currentTarget as HTMLButtonElement;
                const fb = btn.querySelector('.copied-feedback');
                if (fb) {
                  fb.classList.remove('opacity-0');
                  setTimeout(() => fb.classList.add('opacity-0'), 1500);
                }
              }}
              title="Copy to clipboard"
            >
              <div class="text-[11px] font-bold text-gray-200">{cmd.name}</div>
              <div class="text-[10px] font-mono text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis w-full group-hover/cmd:text-vercel-blue transition-colors">
                $ {cmd.command}
              </div>
              <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cmd:opacity-100 transition-opacity">
                <svg class="w-3.5 h-3.5 text-vercel-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <div class="copied-feedback absolute inset-0 bg-vercel-blue text-white rounded flex items-center justify-center font-bold opacity-0 transition-opacity pointer-events-none text-[10px] tracking-widest uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                Copied Command!
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- HF logo -->
      <a href="https://huggingface.co/models?search={encodeURIComponent(model.name + ' ' + model.quantization)}" target="_blank" rel="noopener noreferrer" class="p-1.5 bg-black border border-border rounded hover:bg-gray-900 transition-colors tooltip flex-shrink-0" title="View on HuggingFace">
        <img
          src="https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo-monochrome.png"
          alt="HuggingFace"
          class="w-4 h-4"
          style="filter: invert(0.7);"
        />
      </a>
    </div>


  </div>

  <div class="space-y-3 mt-2">
    <div class="bg-black border border-border px-3 pt-2 pb-3 rounded-geist text-sm relative">
      <div class="absolute top-2 right-3 font-mono uppercase tracking-widest text-[10px] text-gray-200">
        {#if model.fitsAtAll && model.modelSupportsCtx}
          {@const isTight = !!model.offloadInfo || !model.meetsMinCtx || !model.meetsMinSpeed || !model.meetsFeatures || model.maxCtxK < 4}
          <span class="{!isTight ? 'text-green-500' : 'text-yellow-500'}">
            {!isTight ? 'Fits Well' : 'Tight Fit'}
          </span>
        {:else}
          <span class="text-red-500">No Fit</span>
        {/if}
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 text-xs">
        <div>
          <span class="text-gray-100 block">Context</span>
          <span class="text-white font-bold">{model.maxCtxK > 0 ? contextLabel(model.maxCtxK) : '—'}</span>
        </div>
        <div>
          <span class="text-gray-100 block">Speed</span>
          <span class="text-white font-bold">{tokLabel(model.tokPerSec) || '—'}</span>
        </div>
      </div>

      {#if model.offloadInfo}
        <div class="mt-2 text-[10px] text-yellow-500 font-mono">
          ⚠️ Offloads {model.offloadInfo.ramWeightGB.toFixed(1)}GB to RAM (~{model.offloadInfo.penaltyPercent}% slower)
        </div>
      {/if}
      {#if model.ctxInfo && model.ctxInfo.ramCtxK > 0}
        <div class="mt-1 text-[10px] text-gray-200 font-mono font-medium">
          ℹ️ {contextLabel(model.ctxInfo.vramCtxK)} on {isAppleSilicon ? 'Unified Memory' : 'GPU'}, {contextLabel(model.ctxInfo.ramCtxK)} extended via {isAppleSilicon ? 'Disk Swap' : 'System RAM'}
        </div>
      {/if}
      {#if !model.meetsFeatures}
        <div class="mt-1 text-[10px] text-red-400 font-mono">
          Missing required features
        </div>
      {/if}
      {#if !model.fitsAtAll}
        <div class="mt-1 text-[10px] text-red-500 font-mono">
          Needs {(model.weight_gb + model.kv_per_1k_gb).toFixed(1)} GB. System RAM insufficient.
        </div>
        {#if model.cheapestCloud}
          <a 
            href="https://www.runpod.io/console/gpu-cloud"
            target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-mono hover:bg-sky-500/20 transition-colors"
          >
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            Rent {model.cheapestCloud.gpuName} for ~${model.cheapestCloud.pricePerHr.toFixed(2)}/hr
          </a>
        {/if}
      {/if}

      <!-- VRAM usage bar -->
      {#if totalVram >= 0.1}
        <div class="mt-4 pt-4 border-t border-border/50 space-y-1.5">
          <div class="flex justify-between text-[8px] font-mono text-gray-300 uppercase tracking-widest font-bold">
            <span>{isAppleSilicon ? 'Unified Memory Anatomy' : 'VRAM Anatomy'}</span>
            <span>{ (weightsVram + expectedKvVram).toFixed(1) } / { Math.max((weightsVram + expectedKvVram), Math.round(totalVram)).toFixed(1) } GB</span>
          </div>
          
          <div class="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden flex">
            <div class="h-full bg-vercel-blue transition-all" style="width: {weightPct}%" title={isAppleSilicon ? "Model Weights" : "Model Weights in VRAM"}></div>
            <div class="h-full bg-purple-500 transition-all" style="width: {kvPct}%" title="KV Cache (Context Window)"></div>
          </div>
          
          <div class="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono mt-2">
            <div class="flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-vercel-blue"></div>
              <span class="text-gray-200">Weights <span class="text-gray-400">({weightsVram.toFixed(1)}GB)</span></span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span class="text-gray-200">Context <span class="text-gray-400">({expectedKvVram.toFixed(1)}GB)</span></span>
            </div>
            {#if model.offloadInfo && model.offloadInfo.ramWeightGB > 0}
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <span class="text-yellow-600 font-bold">RAM Offload <span class="text-yellow-700">({model.offloadInfo.ramWeightGB.toFixed(1)}GB)</span></span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
