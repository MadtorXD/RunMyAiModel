<script lang="ts">
  import FeedbackDialog from './FeedbackDialog.svelte';

  let showFeedback = $state(false);
</script>

<footer class="mt-auto pt-16 pb-12 z-10 border-t border-border w-full max-w-5xl mx-auto flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase tracking-widest px-4">
  <div class="flex flex-col gap-1 md:flex-row md:gap-4">
    <span>&copy; 2026 RunMyAIModel.com</span>
    <span class="hidden md:inline">•</span>
    <span>Data derived from Official Specs</span>
  </div>
  
  <div class="flex gap-8">
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
</footer>

<FeedbackDialog bind:show={showFeedback} onClose={() => showFeedback = false} />
