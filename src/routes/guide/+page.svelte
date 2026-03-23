<script lang="ts">
  import { onMount, tick } from 'svelte';
  import SmartGrid from '$lib/components/SmartGrid.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let activeSection = $state('intro');
  let searchQuery = $state('');

  onMount(() => {
    // Offset rootMargin to trigger earlier when scrolling down
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeSection = entry.target.id;
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px' });

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  });

  const sections = [
    { id: 'intro', title: 'Introduction' },
    { id: 'hardware', title: 'Hardware Setup' },
    { id: 'models', title: 'Models & Features' },
    { id: 'quantization', title: 'Quantization & Compression' },
    { id: 'performance', title: 'Performance & Speed' },
    { id: 'scores', title: 'Quality Scores & Tiers' },
    { id: 'results', title: 'Result Categories & Badges' }
  ];

  function scrollToTarget(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
</script>

<svelte:head>
  <title>Beginner's Guide | RunMyAIModel</title>
  <meta name="description" content="A massively detailed guide explaining AI model metrics, quality tiers, MMLU scoring, VRAM buckets, and cloud pricing UI elements." />
</svelte:head>


<main class="min-h-screen relative flex flex-col font-sans bg-transparent text-white selection:bg-vercel-blue selection:text-white">
  <!-- Background with lower z-index -->
  <div class="fixed inset-0 -z-10 bg-black overflow-hidden pointer-events-none">
    <SmartGrid />
  </div>

  <!-- Back to Tool button — Fixed for easy access while scrolling -->
  <header class="fixed top-0 w-full p-6 flex justify-end z-50 max-w-[1072px] left-1/2 -translate-x-1/2 pointer-events-none">
    <div class="pointer-events-auto">
      <a href="/" class="text-sm font-medium text-gray-400 hover:text-white transition-colors bg-[#0A0A0A]/80 backdrop-blur-md border border-[#2E2E2E] px-4 py-1.5 rounded-md shadow-2xl flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to the Tool
      </a>
    </div>
  </header>

  <!-- Body: sidebar + content, starts below the button -->
  <div class="flex flex-1 w-full max-w-[1200px] mx-auto pt-16 relative z-10 box-border">

    <!-- Left Sidebar: Fixed for stability -->
    <aside class="hidden md:flex flex-col w-64 shrink-0 border-r border-white/5 self-start sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto z-30 pointer-events-auto">
      <div class="py-10 pr-4 pl-6">
        <ul class="flex flex-col gap-1">
          {#each sections as sec}
            <li>
              <button
                onclick={() => scrollToTarget(sec.id)}
                class="w-full text-left py-2 px-3 rounded-md text-[13px] transition-colors {activeSection === sec.id ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-white hover:bg-white/5'}"
              >
                {sec.title}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 min-w-0 px-8 md:px-16 py-16 pb-32 relative z-10">
      
      <!-- Section: Intro -->
      <section id="intro" class="scroll-mt-20 space-y-8">
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-12">
          <span class="bg-linear-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Beginner's</span> <span class="bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Guide</span>.
        </h1>
        <p class="text-[16px] text-gray-300 leading-loose">
          Welcome to the absolute master guide for understanding every single setting, slider, feature tag, and color-coded badge inside our AI Hardware Calculator. 
        </p>
        <p class="text-[16px] text-gray-300 leading-loose">
          Artificial Intelligence operates on massive numerical thresholds. To make our platform accessible, we compress complex parameters into beautiful badges. In this documentation, we peel back the curtain. We will show you exactly what every absolute badge looks like on the site, what it means, and exactly what mathematical numbers trigger it.
        </p>
      </section>

      <hr class="border-white/10 my-16" />

      <!-- Section: Hardware -->
      <section id="hardware" class="scroll-mt-20 space-y-8">
        <h2 class="text-3xl font-bold tracking-tight text-white mb-8">
          Hardware Setup
        </h2>
        <div class="space-y-10">
          <div>
            <h3 class="text-xl font-semibold text-white mb-3">Video RAM (VRAM) vs System RAM</h3>
            <p class="text-[16px] text-gray-300 leading-loose">
              <strong>System RAM</strong> is the slow filing cabinet inside your computer (e.g., 32GB DDR5). <strong>VRAM</strong> is the ultra-fast, dedicated super-memory physically bolted onto your graphics card (e.g., 24GB on an RTX 4090). To run an AI model fast, its entire "brain" must fit squarely inside your VRAM. If it overflows into your System RAM, the model slows down to a crawl (known as CPU Offloading).
            </p>
          </div>
          
          <div>
            <h3 class="text-xl font-semibold text-white mb-3">Multi-GPU Arrays</h3>
            <p class="text-[16px] text-gray-300 leading-loose">
              If you own multiple graphics cards (e.g., 2× RTX 3090s), you effectively double your VRAM (24GB + 24GB = 48GB). However, slicing an AI's brain across two separate cards introduces a <strong>PCIe Bottleneck</strong> penalty. Because the two cards must constantly whisper over the motherboard, the overall Speed (Tokens/Second) is penalized by about 15% to 30%.
            </p>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-white mb-3">Apple Silicon (Unified Memory)</h3>
            <p class="text-[16px] text-gray-300 leading-loose">
              Apple computers (M1, M2, M3, M4 Max/Ultra) do not use separate VRAM. Instead, they use <strong>Unified Memory</strong>, meaning their colossal 64GB or 128GB of System RAM acts entirely like super-fast VRAM. This is why Macs are the undisputed kings of running massive AI models on a laptop. If you select a Mac on our site, the "System RAM" slider is completely disabled to reflect this architectural superpower.
            </p>
          </div>
        </div>
      </section>

      <hr class="border-white/10 my-16" />

      <!-- Section: Models -->
      <section id="models" class="scroll-mt-20 space-y-8">
        <h2 class="text-3xl font-bold tracking-tight text-white mb-8">
          Models & Features
        </h2>
        <p class="text-[16px] text-gray-300 leading-loose mb-6">
          AI models are labeled with exact visual tags representing their architecture. Below are the exact graphical badges you will see attached to models on the dashboard.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- 8B -->
          <div class="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <span class="inline-flex items-center rounded-full bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight border border-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" /></svg>
                8B
              </span>
            </div>
            <p class="text-[14px] text-gray-400 leading-relaxed">The size of the brain (8 Billion connections). 8B is excellent for laptops. 70B+ requires heavy servers.</p>
          </div>

          <!-- Reasoning -->
          <div class="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white border border-white/10 shadow-sm" style="background-color: #0060D1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Reasoning
              </span>
            </div>
            <p class="text-[14px] text-gray-400 leading-relaxed">These models are explicitly trained to output a "chain of thought", thinking step-by-step.</p>
          </div>

          <!-- MoE -->
          <div class="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white border border-white/10 shadow-sm" style="background-color: #4F46E5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Mixture Of Experts
              </span>
            </div>
            <p class="text-[14px] text-gray-400 leading-relaxed">Instead of firing all neurons at once, an MoE model routes your question to a specific tiny "expert" sub-brain.</p>
          </div>

          <!-- Tool Use -->
          <div class="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white border border-white/10 shadow-sm" style="background-color: #8E4EC6">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
                Tool Use
              </span>
            </div>
            <p class="text-[14px] text-gray-400 leading-relaxed">The capability to hook securely into external APIs to browse the web or trigger functions.</p>
          </div>

          <!-- Coding -->
          <div class="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white border border-white/10 shadow-sm" style="background-color: #388E4A">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                Coding
              </span>
            </div>
            <p class="text-[14px] text-gray-400 leading-relaxed">These models achieve elite scores on SWE-Bench and can autonomously write and debug software architecture.</p>
          </div>

          <!-- Mathematics -->
          <div class="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white border border-white/10 shadow-sm" style="background-color: #FF990A">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                Mathematics
              </span>
            </div>
            <p class="text-[14px] text-gray-400 leading-relaxed">Highly specialized datasets allowing the model to flawlessly solve complex algebra, calculus, and logical proofs.</p>
          </div>

          <!-- Vision -->
          <div class="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white border border-white/10 shadow-sm" style="background-color: #DA3036">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                Vision
              </span>
            </div>
            <p class="text-[14px] text-gray-400 leading-relaxed">Multimodal architecture that allows the AI to natively "see" and interpret uploaded images, charts, and video frames.</p>
          </div>

        </div>
      </section>

      <hr class="border-white/10 my-16" />

      <!-- Section: Quantization -->
      <section id="quantization" class="scroll-mt-20 space-y-8">
        <h2 class="text-3xl font-bold tracking-tight text-white mb-8">
          Quantization & Compression
        </h2>
        <p class="text-[16px] text-gray-300 leading-loose">
          Quantization is the act of surgically compressing the neural parameters so they physically fit inside your GPU.
        </p>
        <ul class="list-none space-y-4 mt-8">
          <li class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <span class="bg-[#222] border border-[#444] text-white px-1.5 py-0.5 rounded font-mono text-sm shadow-sm mt-1">FP16</span>
            <div class="text-[15px] text-gray-400 leading-relaxed">
              <strong class="text-white">Uncompressed Perfection.</strong> Massive file size. Highest possible quality. Used almost exclusively in enterprise environments where massive data center GPUs are available.
            </div>
          </li>
          <li class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <span class="bg-[#222] border border-[#444] text-white px-1.5 py-0.5 rounded font-mono text-sm shadow-sm mt-1">Q8_0</span>
            <div class="text-[15px] text-gray-400 leading-relaxed">
              <strong class="text-white">Virtually Lossless.</strong> Cuts the file size exactly in half. Human reviewers cannot perceive a difference in reasoning quality compared to FP16. High recommendation.
            </div>
          </li>
          <li class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <span class="bg-[#222] border border-[#444] text-white px-1.5 py-0.5 rounded font-mono text-sm shadow-sm mt-1">Q6_K</span>
            <div class="text-[15px] text-gray-400 leading-relaxed">
              <strong class="text-white">The Sweet Spot.</strong> Shaves it down further. Arguably the best overall balance of VRAM usage, inference speed, and retained intelligence.
            </div>
          </li>
          <li class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <span class="bg-[#222] border border-[#444] text-white px-1.5 py-0.5 rounded font-mono text-sm shadow-sm mt-1">Q4_K</span>
            <div class="text-[15px] text-gray-400 leading-relaxed">
              <strong class="text-white">Aggressive Squeeze.</strong> Shrinks the model by a massive 75%. Perfect for running huge 70B models on heavily limited 24GB hardware. Math capability degrades slightly.
            </div>
          </li>
          <li class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <span class="bg-[#222] border border-[#444] text-white px-1.5 py-0.5 rounded font-mono text-sm shadow-sm mt-1">Q3_K</span>
            <div class="text-[15px] text-gray-400 leading-relaxed">
              <strong class="text-white">Extreme Compression.</strong> Files are now ~25% of their original size. Substantial logic degradation begins to occur. Recommended only as a last resort for local hardware.
            </div>
          </li>
          <li class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <span class="bg-[#222] border border-[#444] text-white px-1.5 py-0.5 rounded font-mono text-sm shadow-sm mt-1">Q2_K</span>
            <div class="text-[15px] text-gray-400 leading-relaxed">
              <strong class="text-white">Minimum Viable.</strong> The model is barely functional for complex reasoning but fits on almost any device. Use only for simple chat tasks where VRAM is critically scarce.
            </div>
          </li>
        </ul>
      </section>

      <hr class="border-white/10 my-16" />

      <!-- Section: Performance -->
      <section id="performance" class="scroll-mt-20 space-y-8">
        <h2 class="text-3xl font-bold tracking-tight text-white mb-8">
          Performance & Speed
        </h2>
        <p class="text-[16px] text-gray-300 leading-loose">
          AI performance isn't just about fitting; it's about memory growth and typing speed.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10">
          <div>
            <h3 class="text-xl font-semibold text-white mb-3">The KV Cache (Context)</h3>
            <p class="text-[15px] text-gray-400 leading-relaxed mb-6">
              The "Context Window" is the model's short-term memory. As your conversation grows, the <strong>KV Cache</strong> expands, consuming more VRAM every few thousand words.
            </p>
            <div class="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 font-mono text-[12px] text-purple-400">
              ℹ️ A 70B model uses ~1GB VRAM per 8K tokens. A 128K context requires 16GB VRAM just for memory!
            </div>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-white mb-3">Tokens per Second (TPS)</h3>
            <p class="text-[15px] text-gray-400 leading-relaxed mb-6">
              Writing speed is limited by your <strong>Memory Bandwidth (GB/s)</strong>. The wider the lane, the faster the model can read its 30GB+ brain.
            </p>
            <div class="p-4 rounded-xl bg-vercel-blue/5 border border-vercel-blue/20 font-mono text-[12px] text-vercel-blue">
              ℹ️ Rule: TPS = Bandwidth / Model_Size. <br/>
              An RTX 4090 hit ~33 tok/s on a 30GB Llama-3 model.
            </div>
          </div>
        </div>
      </section>

      <hr class="border-white/10 my-16" />

      <!-- Section: Scores -->
      <section id="scores" class="scroll-mt-20 space-y-8">
        <h2 class="text-3xl font-bold tracking-tight text-white mb-8">
          Quality Scores & Tiers
        </h2>
        <p class="text-[16px] text-gray-300 leading-loose">
          Our engine parses industry tests (MMLU, SWE-Bench, Chatbot Arena ELO) into five strict graphical badges. Here is the *exact mathematical thresholds* for each tier natively inside the calculator:
        </p>
        
        <div class="space-y-12 mt-12">
          <!-- Excellent -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 group hover:border-green-500/20 transition-all duration-500 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-5">
              <svg class="w-24 h-24 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
            </div>
            <h3 class="text-3xl font-black uppercase tracking-tighter bg-linear-to-r from-green-500 to-teal-500 bg-clip-text text-transparent italic mb-6">Excellent</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-6">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">MMLU (General)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">83.0<span class="text-green-500/50">+</span></span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">SWE-B (Coding)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">30.0<span class="text-green-500/50">+</span></span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">LMSYS (ELO)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">1250<span class="text-green-500/50">+</span></span>
              </div>
            </div>
          </div>

          <!-- Great -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 group hover:border-teal-500/20 transition-all duration-500 relative overflow-hidden">
            <h3 class="text-3xl font-black uppercase tracking-tighter bg-linear-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent italic mb-6">Great</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-6">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">MMLU (General)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">75.0 <span class="text-gray-600">-</span> 82.9</span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">SWE-B (Coding)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">22.0 <span class="text-gray-600">-</span> 29.9</span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">LMSYS (ELO)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">1200 <span class="text-gray-600">-</span> 1249</span>
              </div>
            </div>
          </div>

          <!-- Good -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 group hover:border-amber-500/20 transition-all duration-500 relative overflow-hidden">
            <h3 class="text-3xl font-black uppercase tracking-tighter bg-linear-to-r from-amber-500 to-blue-500 bg-clip-text text-transparent italic mb-6">Good</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-6">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">MMLU (General)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">67.0 <span class="text-gray-600">-</span> 74.9</span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">SWE-B (Coding)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">15.0 <span class="text-gray-600">-</span> 21.9</span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">LMSYS (ELO)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">1150 <span class="text-gray-600">-</span> 1199</span>
              </div>
            </div>
          </div>

          <!-- Fair -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 group hover:border-blue-500/20 transition-all duration-500 relative overflow-hidden">
            <h3 class="text-3xl font-black uppercase tracking-tighter bg-linear-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent italic mb-6">Fair</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-6">
              <div class="space-y-1">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">MMLU (General)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">55.0 <span class="text-gray-600">-</span> 66.9</span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">SWE-B (Coding)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">8.0 <span class="text-gray-600">-</span> 14.9</span>
              </div>
              <div class="space-y-1 border-l border-white/5 pl-8">
                <span class="text-[10px] uppercase font-bold tracking-widest text-gray-500 italic block">LMSYS (ELO)</span>
                <span class="text-2xl font-mono text-white tracking-tighter">1100 <span class="text-gray-600">-</span> 1149</span>
              </div>
            </div>
          </div>

          <!-- Basic -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 group hover:border-red-500/20 transition-all duration-500 relative overflow-hidden">
            <h3 class="text-3xl font-black uppercase tracking-tighter bg-linear-to-r from-red-500 to-pink-500 bg-clip-text text-transparent italic mb-6">Basic</h3>
            <div class="border-t border-white/5 pt-6">
              <p class="text-[16px] text-gray-400 font-mono leading-relaxed italic">
                Models that fall below the Fair threshold. Usually obsolete.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr class="border-white/10 my-16" />

      <!-- Section: Results Validation -->
      <section id="results" class="scroll-mt-20 space-y-8">
        <h2 class="text-3xl font-bold tracking-tight text-white mb-8">
          Result Categories & Badges
        </h2>
        <p class="text-[16px] text-gray-300 leading-loose">
          The algorithm buckets model cards into three distinct visual containers. These are the exact headers and error texts you will see dynamically rendered based on the GPU math:
        </p>
        
        <div class="space-y-8 mt-10">
          
          <!-- Fits Well -->
          <div class="p-8 rounded-2xl border border-border/50 bg-black relative group overflow-hidden">
            <div class="absolute top-0 right-0 p-4 font-mono text-[10px] text-green-500/50 uppercase tracking-tighter">
               VRAM-NATIVE
            </div>
            <div class="flex items-center mb-6">
              <div class="font-mono uppercase tracking-widest text-[10px] text-green-500 font-bold mb-4">
                Fits Well
              </div>
            </div>
            <p class="text-[16px] leading-relaxed text-gray-300 mb-8">
              The model's uncompressed weights plus the expected Context Window buffer fit strictly inside your physical GPU VRAM. 
            </p>
            <div class="p-5 rounded-xl bg-green-500/5 border border-green-500/20">
              <h4 class="text-[12px] font-bold text-white uppercase tracking-widest mb-3">Under the Hood (The Math)</h4>
              <p class="text-[14px] text-gray-400 font-mono leading-loose">
                Trigger: <span class="text-white">Weights_GB + (KV_Cache_GB @ 32K) + 1GB_Overhead</span> <span class="text-green-500"> &lt; Total_VRAM</span>
              </p>
              <p class="text-[13px] text-gray-500 mt-3 leading-relaxed">
                When this condition is met, inference happens at Maximum Hardware Bandwidth. No slow system memory is used.
              </p>
            </div>
          </div>

          <!-- Tight Fit Example -->
          <div class="p-8 rounded-2xl border border-border/50 bg-black relative group overflow-hidden">
            <div class="absolute top-0 right-0 p-4 font-mono text-[10px] text-yellow-500/50 uppercase tracking-tighter">
               HYBRID-MODE
            </div>
            <div class="flex flex-col mb-6">
              <div class="font-mono uppercase tracking-widest text-[10px] text-yellow-500 font-bold mb-4">
                Tight Fit
              </div>
              
              <div class="space-y-2 mb-4 bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/20">
                <div class="text-[11px] text-yellow-500 font-mono font-bold uppercase tracking-wider">
                  ⚠️ Offloads 8.4GB to RAM (~35% slower)
                </div>
                <div class="text-[11px] text-white/50 font-mono font-medium">
                  ℹ️ 32K on GPU, 16K extended via System RAM
                </div>
              </div>
            </div>
            <p class="text-[16px] leading-relaxed text-gray-300 mb-8">
              Your VRAM is full, forcing the calculator to spill layers into your System RAM. 
            </p>
            <div class="p-5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <h4 class="text-[12px] font-bold text-white uppercase tracking-widest mb-3">Under the Hood (The Math)</h4>
              <p class="text-[14px] text-gray-400 font-mono leading-loose">
                Trigger: <span class="text-white">VRAM_Saturation &gt; 95%</span> <span class="text-yellow-500">AND</span> <span class="text-white">Weight_Offload &lt; 50%</span>
              </p>
              <p class="text-[13px] text-gray-500 mt-3 leading-relaxed">
                Tokens will generate at approximately 15-40% of native GPU speed depending on your PCIe lane bandwidth.
              </p>
            </div>
          </div>

          <!-- Does Not Fit -->
          <div class="p-8 rounded-2xl border border-red-500/30 bg-black relative group overflow-hidden">
            <div class="absolute top-0 right-0 p-4 font-mono text-[10px] text-red-500/50 uppercase tracking-tighter">
               FATAL-OOM
            </div>
            <div class="flex items-center mb-6">
              <div class="font-mono uppercase tracking-widest text-[10px] text-red-500 font-bold mb-4">
                Does Not Fit
              </div>
            </div>
            <p class="text-[16px] leading-relaxed text-gray-300 mb-8">
              The model architecture exceeds your total physical memory capacity (VRAM + System RAM). Local execution is mathematically impossible.
            </p>
            <div class="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
              <h4 class="text-[12px] font-bold text-white uppercase tracking-widest mb-3">Under the Hood (The Math)</h4>
              <p class="text-[14px] text-gray-400 font-mono leading-loose">
                Trigger: <span class="text-white">Weights_GB + context</span> <span class="text-red-500"> &gt; (VRAM + RAM)</span>
              </p>
              <p class="text-[13px] text-gray-500 mt-3 leading-relaxed">
                When this red outline appears, the calculator automatically triggers the Cloud Rental Scanner.
              </p>
            </div>
          </div>

          <!-- Cloud Rental Pill Explanation -->
          <div class="p-8 rounded-2xl border border-sky-500/30 bg-sky-500/5 relative overflow-hidden group">
             <div class="absolute top-0 right-0 p-4 font-mono text-[10px] text-sky-500/50 uppercase tracking-tighter">
               EXTERNAL-COMPUTE
            </div>
             <div class="font-mono uppercase tracking-widest text-[10px] text-sky-500 font-bold mb-6">
                Cloud Rental Pill
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               <div class="space-y-4">
                 <h4 class="text-[12px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Cheapest Fit Algorithm</h4>
                 <p class="text-[14px] text-gray-400 leading-loose">
                   The calculator scans an API of data-center GPUs to find the <span class="text-white font-bold">absolute lowest hourly price</span> for a GPU that has enough VRAM (A6000, A100, or H100) to host the model at full 32K context.
                 </p>
               </div>
               <div class="space-y-4">
                 <h4 class="text-[12px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Market Rate Estimate</h4>
                 <p class="text-[14px] text-gray-400 leading-loose">
                   The blue pill displays the live average market rate on platforms like <a href="https://runpod.io?ref=f43w8geb" target="_blank" rel="noopener noreferrer" class="text-sky-400 font-bold underline decoration-sky-500/30 hover:text-sky-300 transition-colors">RunPod</a> or Lambda. This helps you decide if a 44¢ rental is better than a $2,000 upgrade.
                 </p>
               </div>
             </div>

             <div class="flex flex-col gap-4">
               <div class="text-[11px] text-sky-400/80 font-mono uppercase tracking-widest">Live UI Component Replic:</div>
               <div class="inline-flex items-center w-fit gap-1.5 px-2 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-mono shadow-lg shadow-sky-500/5">
                  <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                  Rent Nvidia A6000 for ~$0.44/hr
               </div>
             </div>
          </div>

        </div>
      </section>
    </div>
  </div>
  <Footer />
</main>
