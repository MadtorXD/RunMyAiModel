<script lang="ts">
  import FeedbackDialog from './FeedbackDialog.svelte';

  let showFeedback = $state(false);
</script>

<footer class="mt-auto pt-16 pb-12 z-10 border-t border-border w-full max-w-5xl mx-auto flex flex-col items-center gap-6 md:flex-row md:justify-between md:items-center text-[10px] text-gray-500 font-mono uppercase tracking-widest px-4">
  <div class="flex flex-col items-center gap-1 md:items-start md:flex-row md:gap-4">
    <span>&copy; 2026 RunMyAIModel.com</span>
    <span class="hidden md:inline">•</span>
    <span>Data derived from Official Specs</span>
  </div>
  
  <div class="flex flex-col items-center gap-4 md:flex-row md:gap-8">
    <div class="flex gap-6 md:gap-8 items-center order-1 md:order-2">
      <a 
        href="https://github.com/MadtorXD/RunMyAiModel" 
        target="_blank" 
        rel="noopener noreferrer"
        class="hover:text-white transition-colors"
      >
        GitHub
      </a>
      <button 
        onclick={() => showFeedback = true}
        class="hover:text-white transition-colors uppercase cursor-pointer"
      >
        Feedback
      </button>
    </div>
    <a 
      href="https://ko-fi.com/u7u51wi5yh" 
      target="_blank" 
      rel="noopener noreferrer"
      class="flex items-center gap-2 group hover:-translate-y-0.5 transition-transform order-2 md:order-1"
      title="Support me on Ko-fi"
    >
      <span class="bg-[linear-gradient(to_right,#3b82f6,#22d3ee,#a855f7,#ec4899)] px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20">
        <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Ko-fi" class="h-3.5 md:h-4 w-auto drop-shadow-md" />
        <span class="capitalize tracking-tight font-sans text-[11px] md:text-sm">Support Me</span>
      </span>
    </a>
  </div>
</footer>

<FeedbackDialog bind:show={showFeedback} onClose={() => showFeedback = false} />
