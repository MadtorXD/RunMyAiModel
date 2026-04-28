<script lang="ts">
  let repoId = $state('');
  let password = $state('');
  let mmlu = $state('');
  let swe = $state('');
  let lmsys = $state('');
  let features = $state('');
  let quantization = $state('fp16');
  let bpw = $state('16');

  
  let loading = $state(false);
  let message = $state('');
  let errorMsg = $state('');

  let notifications = $state<any[]>([]);
  let showNotifications = $state(false);
  let unreadCount = $derived(notifications.filter(n => n.status === 'pending').length);

  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/admin/notifications?password=${password}`);
      if (res.ok) {
        notifications = await res.json();
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }

  async function markNotification(id: string, status: string) {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, password })
      });
      if (res.ok) {
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) notifications[index].status = status;
      }
    } catch (err) {
      console.error('Failed to update notification', err);
    }
  }

  async function triggerSync() {
    try {
      const res = await fetch(`/api/cron/sync?password=${password}`);
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Sync failed', err);
    }
  }

  $effect(() => {
    if (password) {
      fetchNotifications();
    }
  });
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!repoId) return;

    loading = true;
    message = '';
    errorMsg = '';
    
    try {
      const res = await fetch('/api/add-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repoId.trim(),
          password: password,
          mmlu: mmlu ? parseFloat(mmlu) : null,
          swe: swe ? parseFloat(swe) : null,
          lmsys: lmsys ? parseFloat(lmsys) : null,
          features: features ? features.split(',').map(f => f.trim().toLowerCase()) : [],
          quantization: quantization,
          bpw: bpw ? parseFloat(bpw) : null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        message = `Successfully added ${data.model.name}! Database updated.`;
        repoId = '';
        mmlu = '';
        swe = '';
        lmsys = '';
        features = '';
      } else {
        errorMsg = data.error || 'Failed to add model';
      }
    } catch (err: any) {
      errorMsg = err.message || 'Network error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Area | RunMyAIModel</title>
</svelte:head>

<main class="min-h-screen relative overflow-hidden flex flex-col items-center pt-8 px-6 pb-24 font-sans text-white">
  
  <div class="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black -z-10 [transform:translateZ(0)]"></div>

  <div class="w-full max-w-5xl z-10 text-center space-y-12 relative animate-in fade-in slide-in-from-top-4 duration-1000">
    
    <div class="space-y-4 pt-8 relative">
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter animate-in fade-in slide-in-from-top-4 duration-1000 relative z-10">
        Run My <span class="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">AI</span>&#32;<span class="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Model</span>.
      </h1>
      <p class="text-xl leading-8 text-gray-300 max-w-2xl mx-auto font-normal animate-in fade-in slide-in-from-top-4 duration-1000 delay-150 relative z-10">Find the perfect model for your GPU in seconds</p>
    </div>

    <div class="max-w-2xl w-full mx-auto bg-[#0a0a0a] border border-[#333] p-8 rounded-geist shadow-[0_0_40px_rgba(0,0,0,0.5)] text-left animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
      <div class="flex items-center justify-between gap-3 mb-2">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <h2 class="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>
        
        <div class="relative">
          <button 
            onclick={() => showNotifications = !showNotifications}
            class="p-2 rounded-full hover:bg-white/5 transition-colors relative"
            title="Notifications"
          >
            <svg class="w-6 h-6 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {#if unreadCount > 0}
              <span class="absolute top-1 right-1 w-4 h-4 bg-vercel-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            {/if}
          </button>

          {#if showNotifications}
            <div class="absolute right-0 mt-2 w-80 bg-[#0d0d0d] border border-[#333] rounded-geist shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div class="p-4 border-b border-[#333] flex justify-between items-center bg-black/50">
                <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400">Notifications</h3>
                <button onclick={triggerSync} class="text-[10px] text-vercel-blue hover:underline">Sync Now</button>
              </div>
              <div class="max-h-[400px] overflow-y-auto">
                {#if notifications.length === 0}
                  <p class="p-8 text-center text-gray-600 text-sm italic">No notifications yet.</p>
                {:else}
                  {#each notifications as n}
                    <div class="p-4 border-b border-[#222] last:border-0 hover:bg-white/[0.02] transition-colors {n.status === 'pending' ? 'border-l-2 border-l-vercel-blue' : ''}">
                      <div class="flex justify-between items-start gap-2 mb-1">
                        <h4 class="text-[13px] font-bold {n.status === 'pending' ? 'text-white' : 'text-gray-500'}">{n.title}</h4>
                        <span class="text-[9px] text-gray-600 shrink-0">{new Date(n.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p class="text-[11px] text-gray-500 mb-3 line-clamp-2">{n.description}</p>
                      <div class="flex gap-2">
                        {#if n.type === 'model'}
                          <button 
                            onclick={() => { repoId = n.metadata.repoId; showNotifications = false; }}
                            class="text-[10px] bg-vercel-blue/10 text-vercel-blue px-2 py-1 rounded hover:bg-vercel-blue/20 transition-colors font-bold"
                          >
                            Use Repo ID
                          </button>
                        {/if}
                        <button 
                          onclick={() => markNotification(n.id, n.status === 'pending' ? 'completed' : 'pending')}
                          class="text-[10px] {n.status === 'pending' ? 'bg-white/5 text-gray-400' : 'bg-green-900/20 text-green-500'} px-2 py-1 rounded hover:bg-white/10 transition-colors"
                        >
                          {n.status === 'pending' ? 'Mark Done' : 'Undo'}
                        </button>
                        {#if n.metadata?.link}
                          <a href={n.metadata.link} target="_blank" class="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-white/10 transition-colors">View Link</a>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
      <p class="text-gray-400 mb-8 text-sm">Automated HuggingFace Integration (Localhost Only).</p>
    
    {#if message}
      <div class="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-geist text-green-400 text-sm font-medium">
        {message}
      </div>
    {/if}

    {#if errorMsg}
      <div class="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-geist text-red-500 text-sm font-medium">
        {errorMsg}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-5">
      
      <div>
        <label for="repoId" class="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">HuggingFace Repo ID <span class="text-vercel-blue">*</span></label>
        <input 
          id="repoId" 
          type="text" 
          bind:value={repoId} 
          placeholder="e.g., meta-llama/Llama-2-7b-hf" 
          required
          class="w-full bg-black border border-[#333] rounded-[6px] px-4 py-2.5 text-sm focus:outline-none focus:border-vercel-blue transition-colors text-white placeholder-gray-600"
        />
        <p class="text-xs text-gray-600 mt-1.5">The exact HuggingFace URL path. We will fetch params, layers, heads, and config automatically.</p>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label for="mmlu" class="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">MMLU Score</label>
          <input 
            id="mmlu" 
            type="number" 
            step="0.1" 
            bind:value={mmlu} 
            placeholder="e.g., 68.4" 
            class="w-full bg-black border border-[#333] rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:border-vercel-blue transition-colors text-white placeholder-gray-600"
          />
        </div>
        <div>
          <label for="swe" class="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">SWE-Bench</label>
          <input 
            id="swe" 
            type="number" 
            step="0.1" 
            bind:value={swe} 
            placeholder="e.g., 12.5" 
            class="w-full bg-black border border-[#333] rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:border-vercel-blue transition-colors text-white placeholder-gray-600"
          />
        </div>
        <div>
          <label for="lmsys" class="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">LMSYS Elo</label>
          <input 
            id="lmsys" 
            type="number" 
            bind:value={lmsys} 
            placeholder="e.g., 1235" 
            class="w-full bg-black border border-[#333] rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:border-vercel-blue transition-colors text-white placeholder-gray-600"
          />
        </div>
      </div>

      <div>
        <label for="features" class="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Features</label>
        <input 
          id="features" 
          type="text" 
          bind:value={features} 
          placeholder="tool_use, vision, coding" 
          class="w-full bg-black border border-[#333] rounded-[6px] px-4 py-2 text-sm focus:outline-none focus:border-vercel-blue transition-colors text-white placeholder-gray-600"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="quantization" class="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Quantization</label>
          <select 
            id="quantization" 
            bind:value={quantization}
            onchange={() => {
              if (quantization === 'fp16') bpw = '16';
              else if (quantization.startsWith('Q4')) bpw = '4';
              else if (quantization.startsWith('Q8')) bpw = '8';
              else if (quantization.startsWith('Q6')) bpw = '6';
            }}
            class="w-full bg-black border border-[#333] rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:border-vercel-blue transition-colors text-white appearance-none"
          >
            <option value="fp16">FP16 (Original)</option>
            <option value="Q4_K_M">Q4_K_M (GGUF)</option>
            <option value="Q5_K_M">Q5_K_M (GGUF)</option>
            <option value="Q6_K">Q6_K (GGUF)</option>
            <option value="Q8_0">Q8_0 (GGUF)</option>
            <option value="4bpw">4.0 bpw (EXL2)</option>
            <option value="5bpw">5.0 bpw (EXL2)</option>
            <option value="6bpw">6.0 bpw (EXL2)</option>
          </select>
        </div>
        <div>
          <label for="bpw" class="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Bits Per Weight</label>
          <input 
            id="bpw" 
            type="number" 
            step="0.1"
            bind:value={bpw} 
            placeholder="e.g., 4.5" 
            class="w-full bg-black border border-[#333] rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:border-vercel-blue transition-colors text-white placeholder-gray-600"
          />
        </div>
      </div>

      <div>
        <label for="password" class="block text-xs font-bold text-red-400 mb-1.5 uppercase tracking-wider">Admin Password <span class="text-vercel-blue">*</span></label>
        <input 
          id="password" 
          type="password" 
          bind:value={password} 
          placeholder="Required if Environment Variable is set" 
          class="w-full bg-[#111] border border-red-900/50 rounded-[6px] px-4 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors text-white placeholder-gray-600"
        />
      </div>

      <div class="pt-4">
        <button 
          type="submit" 
          disabled={loading || !repoId}
          class="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-geist transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Fetching Spec...
          {:else}
            Fetch & Add Model
          {/if}
        </button>
      </div>

    </form>
    
    <div class="mt-8 pt-6 border-t border-[#333] text-center">
      <a href="/" class="text-sm text-vercel-blue hover:text-blue-400 transition-colors">← Back to Calculator</a>
    </div>
  </div>
</div>
</main>
