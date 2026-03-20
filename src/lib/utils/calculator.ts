export const INFERENCE_OVERHEAD_GB = 1.0;
export const TIGHT_FIT_CONTEXT_K = 4;

export function calcMultiGpuResources(vram: number, bandwidth: number | null, quantity: number) {
  if (quantity === 1 || quantity == null) {
    return { vram, bandwidth };
  }
  const totalVram = vram * quantity;
  if (bandwidth == null) {
    return { vram: totalVram, bandwidth: null };
  }
  const efficiency = quantity === 2 ? 0.85 : (quantity === 3 ? 0.75 : 0.70);
  const effectiveBandwidth = Math.round(bandwidth * quantity * efficiency);
  return { vram: totalVram, bandwidth: effectiveBandwidth };
}

export function calcMaxContext(model: any, userVram: number) {
  const availableForKv = userVram - model.weight_gb;
  if (availableForKv <= 0) return 0;
  if (model.kv_per_1k_gb <= 0) return model.max_context_k;
  const maxTokensK = availableForKv / model.kv_per_1k_gb;
  return Math.min(Math.floor(maxTokensK), model.max_context_k);
}

export function calcTokPerSec(model: any, bandwidth: number | null) {
  if (bandwidth == null) return null;
  return Math.round(bandwidth / (model.weight_gb + INFERENCE_OVERHEAD_GB));
}

export const MAX_OFFLOAD_RATIO = 0.5;

export function calcMaxContextWithOffload(model: any, vram: number, systemRamGB: number | null) {
  const availableForKv = vram - model.weight_gb;
  if (availableForKv <= 0) return { maxCtxK: 0, vramCtxK: 0, ramCtxK: 0, usingSystemRam: false };
  if (model.kv_per_1k_gb <= 0) {
    return { maxCtxK: model.max_context_k, vramCtxK: model.max_context_k, ramCtxK: 0, usingSystemRam: false };
  }
  const vramCtxK = Math.floor(availableForKv / model.kv_per_1k_gb);
  if (systemRamGB == null) {
    const capped = Math.min(vramCtxK, model.max_context_k);
    return { maxCtxK: capped, vramCtxK: capped, ramCtxK: 0, usingSystemRam: false };
  }
  const ramCtxK = Math.floor(systemRamGB / model.kv_per_1k_gb);
  const totalCtxK = Math.min(vramCtxK + ramCtxK, model.max_context_k);
  const actualRamCtxK = totalCtxK - Math.min(vramCtxK, totalCtxK);
  return {
    maxCtxK: totalCtxK,
    vramCtxK: Math.min(vramCtxK, totalCtxK),
    ramCtxK: actualRamCtxK,
    usingSystemRam: actualRamCtxK > 0,
  };
}

export function calcOffloadConfig(model: any, vram: number, systemRamGB: number | null) {
  const reserveForKV = INFERENCE_OVERHEAD_GB;
  const availableForWeights = vram - reserveForKV;
  if (model.weight_gb <= availableForWeights) {
    return { feasible: true, gpuWeightGB: model.weight_gb, ramWeightGB: 0, offloadRatio: 0, estimatedLayers: 0 };
  }
  if (systemRamGB == null) return { feasible: false };
  const ramWeightGB = model.weight_gb - Math.max(availableForWeights, 0);
  const offloadRatio = ramWeightGB / model.weight_gb;
  if (offloadRatio > MAX_OFFLOAD_RATIO || ramWeightGB > systemRamGB) {
    return { feasible: false };
  }
  return {
    feasible: true,
    gpuWeightGB: Math.max(availableForWeights, 0),
    ramWeightGB,
    offloadRatio,
    estimatedLayers: Math.round(offloadRatio * (model.layers ?? 0)),
  };
}

export function calcOffloadPenalty(offloadRatio: number, bandwidth: number | null) {
  if (offloadRatio <= 0) return { penaltyPercent: 0, speedMultiplier: 1.0 };
  let penalty = 0.15 + offloadRatio * 0.70;
  if (bandwidth != null) {
    if (bandwidth < 400) {
      penalty *= 0.80;
    } else if (bandwidth < 700) {
      penalty *= 0.90;
    }
  }
  penalty = Math.min(penalty, 0.50);
  return {
    penaltyPercent: Math.round(penalty * 100),
    speedMultiplier: 1 - penalty,
  };
}

export function contextLabel(k: number) {
  if (k >= 1000) return `${(k / 1000).toFixed(0)}M`;
  return `${k}K`;
}

export function tokLabel(tps: number | null) {
  if (tps == null) return null;
  return `~${tps} tok/s`;
}

export function qualityTier(score: number) {
  if (score >= 83) return { label: 'Excellent', cls: 'bg-gradient-to-r from-green-500 to-teal-500' };
  if (score >= 75) return { label: 'Great', cls: 'bg-gradient-to-r from-teal-500 to-amber-500' };
  if (score >= 67) return { label: 'Good', cls: 'bg-gradient-to-r from-amber-500 to-blue-500' };
  if (score >= 55) return { label: 'Fair', cls: 'bg-gradient-to-r from-blue-500 to-purple-500' };
  return { label: 'Basic', cls: 'bg-gradient-to-r from-red-500 to-pink-500' };
}

export function codingQualityTier(score: number | null) {
  if (score == null) return { label: 'N/A', cls: 'bg-gray-800' };
  if (score >= 30) return { label: 'Excellent', cls: 'bg-gradient-to-r from-green-500 to-teal-500' };
  if (score >= 22) return { label: 'Great', cls: 'bg-gradient-to-r from-teal-500 to-amber-500' };
  if (score >= 15) return { label: 'Good', cls: 'bg-gradient-to-r from-amber-500 to-blue-500' };
  if (score >= 8) return { label: 'Fair', cls: 'bg-gradient-to-r from-blue-500 to-purple-500' };
  return { label: 'Basic', cls: 'bg-gradient-to-r from-red-500 to-pink-500' };
}

export function lmsysQualityTier(score: number | null) {
  if (score == null) return { label: 'N/A', cls: 'bg-gray-800' };
  if (score >= 1250) return { label: 'Excellent', cls: 'bg-gradient-to-r from-green-500 to-teal-500' };
  if (score >= 1200) return { label: 'Great', cls: 'bg-gradient-to-r from-teal-500 to-amber-500' };
  if (score >= 1150) return { label: 'Good', cls: 'bg-gradient-to-r from-amber-500 to-blue-500' };
  if (score >= 1100) return { label: 'Fair', cls: 'bg-gradient-to-r from-blue-500 to-purple-500' };
  return { label: 'Basic', cls: 'bg-gradient-to-r from-red-500 to-pink-500' };
}

function compareScores(a: number | null, b: number | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

export function bucketModels(allModels: any[], vram: number, bandwidth: number | null, minContextK: number | null, minTokPerSec: number | null, requiredFeatures: string[] = [], sortBy = 'mmlu', systemRamGB: number | null = null, minTierLabel: string | null = null, modelFamily: string | null = null) {
  const effectiveMinCtx = minContextK;
  
  const tierWeight = { 'Excellent': 4, 'Great': 3, 'Good': 2, 'Fair': 1, 'Basic': 0, 'N/A': -1 };
  const minTierValue = minTierLabel ? (tierWeight[minTierLabel as keyof typeof tierWeight] ?? -1) : -1;

  const entries = allModels
    .filter(m => {
      if (modelFamily && modelFamily !== 'Other' && !m.name.toLowerCase().includes(modelFamily.toLowerCase())) return false;
      return true;
    })
    .map((m) => {
    const totalAtMinCtx = m.weight_gb + m.kv_per_1k_gb;
    const fitsInVram = vram >= totalAtMinCtx;

    let offloadInfo = null;
    let weightsAvailable = fitsInVram;

    if (!fitsInVram && systemRamGB != null) {
      const offload = calcOffloadConfig(m, vram, systemRamGB);
      if (offload.feasible && offload.offloadRatio! > 0) {
        const penalty = calcOffloadPenalty(offload.offloadRatio!, bandwidth);
        offloadInfo = {
          type: 'weights',
          gpuWeightGB: offload.gpuWeightGB,
          ramWeightGB: offload.ramWeightGB,
          offloadRatio: offload.offloadRatio,
          estimatedLayers: offload.estimatedLayers,
          penaltyPercent: penalty.penaltyPercent,
          speedMultiplier: penalty.speedMultiplier,
        };
        weightsAvailable = true;
      }
    }

    let maxCtxK;
    let ctxInfo = null;

    if (weightsAvailable && !offloadInfo && systemRamGB != null) {
      const extended = calcMaxContextWithOffload(m, vram, systemRamGB);
      maxCtxK = extended.maxCtxK;
      if (extended.usingSystemRam) {
        ctxInfo = { vramCtxK: extended.vramCtxK, ramCtxK: extended.ramCtxK };
      }
    } else if (offloadInfo) {
      const vramForKv = Math.max(vram - offloadInfo.gpuWeightGB! - INFERENCE_OVERHEAD_GB, 0);
      maxCtxK = m.kv_per_1k_gb > 0
        ? Math.min(Math.floor(vramForKv / m.kv_per_1k_gb), m.max_context_k)
        : m.max_context_k;
    } else {
      maxCtxK = calcMaxContext(m, vram);
    }

    const modelSupportsCtx = effectiveMinCtx != null ? m.max_context_k >= effectiveMinCtx : true;
    const meetsMinCtx = effectiveMinCtx != null ? maxCtxK >= effectiveMinCtx : true;

    let tokPerSec = calcTokPerSec(m, bandwidth);
    if (tokPerSec != null && offloadInfo) {
      tokPerSec = Math.round(tokPerSec * offloadInfo.speedMultiplier);
    }
    const meetsMinSpeed = minTokPerSec != null && tokPerSec != null ? tokPerSec >= minTokPerSec : true;

    const modelFeatures = (m.features ?? []).map((f: string) => f.toLowerCase().replace(' ', '_'));
    const lowName = m.name.toLowerCase();
    const lowNotes = (m.notes ?? '').toLowerCase();
    
    // Inferred Features Logic
    if (m.swe_bench_score !== null || lowName.includes('coder')) {
      modelFeatures.push('coding');
    }
    if (lowNotes.includes('moe') || lowName.includes('moe') || lowName.includes('a17b') || lowName.includes('a3b')) {
      modelFeatures.push('moe');
    }
    if (lowName.includes('math') || lowNotes.includes('math') || lowName.includes('deepseek') || lowName.includes('qwen') || (m.mmlu_score && m.mmlu_score > 75)) {
      modelFeatures.push('math');
    }
    if (lowName.includes('r1') || lowName.includes('reasoning') || lowNotes.includes('thinking')) {
      modelFeatures.push('reasoning');
    }

    const meetsFeatures = requiredFeatures.length > 0
      ? requiredFeatures.every((f) => modelFeatures.includes(f))
      : true;
      
    let tier;
    if (sortBy === 'swe-bench') {
      tier = codingQualityTier(m.swe_bench_score ?? null);
    } else if (sortBy === 'lmsys') {
      tier = lmsysQualityTier(m.lmsys_score ?? null);
    } else {
      tier = qualityTier(m.mmlu_score);
    }
    
    if (minTierLabel && (tierWeight[tier.label as keyof typeof tierWeight] ?? -1) < minTierValue) {
      return null;
    }
    
    if (!meetsFeatures || !meetsMinSpeed || !meetsMinCtx) {
      return null;
    }
    
    return {
      ...m,
      features: Array.from(new Set(modelFeatures)),
      maxCtxK,
      fitsAtAll: weightsAvailable,
      meetsMinCtx,
      meetsMinSpeed,
      meetsFeatures,
      modelSupportsCtx,
      tokPerSec,
      tier,
      offloadInfo,
      ctxInfo,
    };
  }).filter(e => e !== null);

  const fits: any[] = [];
  const tight: any[] = [];
  const noFit: any[] = [];

  for (const e of entries) {
    if (!e.fitsAtAll || !e.modelSupportsCtx) {
      noFit.push(e);
    } else if (e.offloadInfo) {
      tight.push(e);
    } else if (!e.meetsMinCtx || !e.meetsMinSpeed || !e.meetsFeatures) {
      tight.push(e);
    } else if (e.maxCtxK < TIGHT_FIT_CONTEXT_K) {
      tight.push(e);
    } else {
      fits.push(e);
    }
  }

  if (sortBy === 'swe-bench') {
    const sortFn = (a: any, b: any) => compareScores(a.swe_bench_score, b.swe_bench_score) || b.maxCtxK - a.maxCtxK;
    fits.sort(sortFn);
    tight.sort(sortFn);
    noFit.sort((a, b) => compareScores(a.swe_bench_score, b.swe_bench_score) || b.weight_gb - a.weight_gb);
  } else if (sortBy === 'lmsys') {
    const sortFn = (a: any, b: any) => compareScores(a.lmsys_score, b.lmsys_score) || b.maxCtxK - a.maxCtxK;
    fits.sort(sortFn);
    tight.sort(sortFn);
    noFit.sort((a, b) => compareScores(a.lmsys_score, b.lmsys_score) || b.weight_gb - a.weight_gb);
  } else {
    fits.sort((a, b) => b.mmlu_score - a.mmlu_score || b.maxCtxK - a.maxCtxK);
    tight.sort((a, b) => b.mmlu_score - a.mmlu_score || b.maxCtxK - a.maxCtxK);
    noFit.sort((a, b) => b.mmlu_score - a.mmlu_score || b.weight_gb - a.weight_gb);
  }

  return { fits, tight, noFit };
}

export function groupVariants(models: any[]) {
  const groups: any[] = [];
  const seen = new Map();

  for (const m of models) {
    if (seen.has(m.name)) {
      seen.get(m.name).variants.push(m);
    } else {
      const group = {
        name: m.name,
        params_b: m.params_b,
        tier: m.tier,
        mmlu_score: m.mmlu_score,
        swe_bench_score: m.swe_bench_score ?? null,
        features: m.features ?? [],
        variants: [m],
      };
      groups.push(group);
      seen.set(m.name, group);
    }
  }

  for (const g of groups) {
    g.variants.sort((a: any, b: any) => a.weight_gb - b.weight_gb);
  }

  return groups;
}

export function getDeploymentCommands(model: any) {
  const normName = model.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let ollamaTag = '';
  if (normName.includes('llama3.3')) ollamaTag = 'llama3.3:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('llama3.2')) ollamaTag = 'llama3.2:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('llama3.1')) ollamaTag = 'llama3.1:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('llama3')) ollamaTag = 'llama3:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('qwen2.5coder')) ollamaTag = 'qwen2.5-coder:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('qwen2.5')) ollamaTag = 'qwen2.5:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('mistralnemo')) ollamaTag = 'mistral-nemo';
  else if (normName.includes('mistral')) ollamaTag = 'mistral';
  else if (normName.includes('mixtral')) ollamaTag = 'mixtral';
  else if (normName.includes('gemma2')) ollamaTag = 'gemma2:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('deepseekcoder')) ollamaTag = 'deepseek-coder-v2';
  else if (normName.includes('deepseekr1')) ollamaTag = 'deepseek-r1:' + (normName.match(/(\d+b)/)?.[1] || '');
  else if (normName.includes('deepseekv3')) ollamaTag = 'deepseek-v3';
  else if (normName.includes('phi3')) ollamaTag = 'phi3';
  else ollamaTag = model.name.toLowerCase().replace(/ /g, '-');

  ollamaTag = ollamaTag.replace(/:$/, '');

  const isGGUF = model.quantization && model.quantization.toLowerCase().includes('q');
  
  if (isGGUF) {
    return [
      { name: 'Ollama', command: `ollama run ${ollamaTag}` },
      { name: 'llama.cpp', command: `./main -m ${model.id.toLowerCase()}.gguf -p "Hello!"` },
      { name: 'MLX (Mac)', command: `mlx_lm.generate --model mlx-community/${model.name.replace(/ /g, '-')}-${model.quantization}` }
    ];
  } else {
    return [
      { name: 'vLLM', command: `vllm serve ${model.name.replace(/ /g, '-')}` },
      { name: 'HuggingFace', command: `huggingface-cli download ${model.name.replace(/ /g, '-')}` }
    ];
  }
}

export function findCheapestCloud(model: any, gpuDb: any[]) {
  const needed = model.weight_gb ?? 0;
  const candidates = gpuDb
    .filter((g: any) => g.cloud_price_per_hr != null && g.vram_gb >= needed)
    .sort((a: any, b: any) => a.cloud_price_per_hr - b.cloud_price_per_hr);
  if (candidates.length === 0) return null;
  const best = candidates[0];
  return { gpuName: best.name, pricePerHr: best.cloud_price_per_hr };
}
