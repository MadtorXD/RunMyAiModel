import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
  try {
    const data = await request.json();
    
    const serverPassword = env.ADMIN_PASSWORD;
    if (serverPassword) {
      if (data.password !== serverPassword) {
        return json({ success: false, error: 'Invalid Password' }, { status: 401 });
      }
    } else if (!dev) {
         return json({ success: false, error: 'Admin dashboard is disabled in production unless ADMIN_PASSWORD is set.' }, { status: 403 });
    }

    const repoId = data.repoId;
    if (!repoId) throw new Error("HuggingFace Repo ID is required");

    const mmlu = data.mmlu ? parseFloat(data.mmlu) : null;
    const swe = data.swe ? parseFloat(data.swe) : null;
    const lmsys = data.lmsys ? parseFloat(data.lmsys) : null;
    const features = data.features || [];

    const infoRes = await fetch(`https://huggingface.co/api/models/${repoId}`);
    if (!infoRes.ok) throw new Error(`Failed to fetch model info from HuggingFace API (${infoRes.status})`);
    const info = await infoRes.json();
    
    let totalParams = 0;
    if (info.safetensors && info.safetensors.total) {
       totalParams = info.safetensors.total;
        throw new Error("Could not find total parameters in safetensors metadata. Ensure the model has safetensors.");
    }

    const paramsB = (totalParams / 1e9).toFixed(2);
    const weightGb = (parseFloat(paramsB) * 2).toFixed(2);

    const configRes = await fetch(`https://huggingface.co/${repoId}/raw/main/config.json`);
    if (!configRes.ok) throw new Error(`Failed to fetch config.json from HuggingFace (${configRes.status})`);
    const config = await configRes.json();

    const layers = config.num_hidden_layers || config.n_layer || config.n_layers || 0;
    const heads = config.num_attention_heads || config.n_head || config.n_heads || 0;
    const kvHeads = config.num_key_value_heads || config.multi_query_group_num || heads;
    const hiddenSize = config.hidden_size || config.d_model || config.n_embd || 0;
    
    const maxCtxRaw = config.max_position_embeddings || config.max_sequence_length || config.n_positions || 0;

    let kvPer1kGb = 0;
    let headDim = 0;
    if (layers && heads && hiddenSize && kvHeads) {
      headDim = hiddenSize / heads;
      // bytes = layers * kv_heads * head_dim * 2 (K+V) * 2 (bytes/f16) * 1024 (tokens)
      const bytesPer1k = layers * kvHeads * headDim * 2 * 2 * 1024;
      kvPer1kGb = bytesPer1k / (1024 ** 3);
    }

    const parts = repoId.split('/');
    const nameStr = parts[parts.length - 1];
    
    let friendlyName = nameStr.replace(/-/g, ' ').replace(/Instruct/gi, '').replace(/hf/gi, '').trim();
    friendlyName = friendlyName.replace(/\s+/g, ' ');

    const idAttr = nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-fp16';

    const newModel = {
      id: idAttr,
      name: friendlyName,
      params_b: parseFloat(paramsB),
      quantization: "fp16",
      weight_gb: parseFloat(weightGb),
      kv_per_1k_gb: parseFloat(kvPer1kGb.toFixed(3)),
      max_context_k: Math.floor(maxCtxRaw / 1000) || 4,
      layers: layers,
      mmlu_score: mmlu,
      swe_bench_score: swe,
      features: features,
      notes: `${layers} layers, ${kvHeads} KV heads, head_dim ${headDim}. Auto-fetched FP16 from ${repoId}.`,
      lmsys_score: lmsys
    };

    const gToken = env.GITHUB_TOKEN;
    const gOwner = env.GITHUB_OWNER;
    const gRepo = env.GITHUB_REPO;

    if (gToken && gOwner && gRepo) {
      // GitHub API commit (Prod)
      const apiUrl = `https://api.github.com/repos/${gOwner}/${gRepo}/contents/src/lib/data/models.json`;
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${gToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RunMyAIModel-AutoFetcher'
        }
      });
      
      if (!getRes.ok) throw new Error("Failed to read models.json from GitHub API");
      const getJson = await getRes.json();
      const sha = getJson.sha;
      
      const contentStr = (globalThis as any).Buffer ? (globalThis as any).Buffer.from(getJson.content, 'base64').toString('utf8') : atob(getJson.content);
      const existing = JSON.parse(contentStr);
      
      if (existing.find((m: any) => m.id === newModel.id)) {
        throw new Error(`Model with ID ${newModel.id} already exists`);
      }
      
      existing.unshift(newModel);
      
      const newJsonStr = JSON.stringify(existing, null, 2);
      const newContentStr = (globalThis as any).Buffer ? (globalThis as any).Buffer.from(newJsonStr, 'utf8').toString('base64') : btoa(newJsonStr);
      
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${gToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RunMyAIModel-AutoFetcher',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Auto-added ${newModel.name} via Admin Dashboard`,
          content: newContentStr,
          sha: sha
        })
      });
      
      if (!putRes.ok) throw new Error("Failed to push update to GitHub API");
      
    } else {
      // Local FS write (Dev)
      if (!dev) throw new Error("GitHub credentials must be set to use the Admin Dashboard in Production.");
      
      const filePath = path.resolve('src/lib/data/models.json');
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (existing.find((m: any) => m.id === newModel.id)) {
        throw new Error(`Model with ID ${newModel.id} already exists in database.`);
      }

      existing.unshift(newModel);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    }

    return json({ success: true, model: newModel });
  } catch(e: any) {
    return json({ success: false, error: e.message || 'Unknown error occurred' }, { status: 400 });
  }
}
