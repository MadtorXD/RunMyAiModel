<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  interface Props {
    show: boolean;
    onClose: () => void;
  }
  let { show = $bindable(), onClose }: Props = $props();

  let name = $state('');
  let email = $state('');
  let rating = $state<number>(50); // Initialize at 50
  let feedback = $state('');
  let isSubmitting = $state(false);
  let isSuccess = $state(false);

  // Dynamic color interpolation: Light Red -> Orange -> Yellow -> Light Green -> Dark Green
  function getColor(val: number) {
    const stops = [
      { v: 0, c: [255, 40, 40] },   // solid red
      { v: 16, c: [230, 81, 0] },   // dark orange
      { v: 33, c: [255, 152, 0] },  // light orange
      { v: 50, c: [245, 127, 23] }, // dark yellow
      { v: 66, c: [255, 238, 88] }, // light yellow
      { v: 83, c: [129, 199, 132] },// light green
      { v: 100, c: [56, 142, 60] }  // dark green
    ];
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (val >= stops[i].v && val <= stops[i+1].v) {
        lower = stops[i];
        upper = stops[i+1];
        break;
      }
    }
    if (lower === upper) return `rgb(${lower.c[0]}, ${lower.c[1]}, ${lower.c[2]})`;
    
    const factor = (val - lower.v) / (upper.v - lower.v);
    const r = Math.round(lower.c[0] + factor * (upper.c[0] - lower.c[0]));
    const g = Math.round(lower.c[1] + factor * (upper.c[1] - lower.c[1]));
    const b = Math.round(lower.c[2] + factor * (upper.c[2] - lower.c[2]));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  let sliderColor = $derived(getColor(rating));

  // Disposable email validation
  const disposableDomains = [
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org', 
    'yopmail.com', 'throwawaymail.com', 'sharklasers.com', 'tempmail.com',
    'dispostable.com', 'trashmail.com', 'tempmail.net'
  ];
  
  let isEmailDisposable = $derived(
    email && disposableDomains.some(domain => email.toLowerCase().endsWith(`@${domain}`))
  );

  let isValidEmailFormat = $derived(
    email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  );

  let isNameValid = $derived(name.trim().length >= 2);

  // Keyboard mashing detection
  let isGibberish = $derived(
    /(qwe|asd|zxc|qaz|wsx|edc|rfv|wer|sdf|xcv|jkl|uiop)/i.test(name) || 
    /(qwe|asd|zxc|qaz|wsx|edc|rfv|wer|sdf|xcv|jkl|uiop)/i.test(email.split('@')[0]) ||
    /(.)\1{3,}/.test(name) || // 4 identical chars in a row
    /(.)\1{3,}/.test(email)
  );

  async function submitForm() {
    if (rating === null || !isNameValid || !isValidEmailFormat || isEmailDisposable || isGibberish) return;
    isSubmitting = true;
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: '31cc08b2-0f87-4d95-932b-68afb03ca72a',
          subject: 'New User Feedback - RunMyAIModel',
          from_name: 'RunMyAIModel Feedback',
          name: name,
          email: email,
          rating: rating + '/100',
          message: feedback || 'No message provided'
        })
      });
      
      const json = await response.json();
      if (json.success) {
        isSuccess = true;
      } else {
        console.error('Failed to submit feedback:', json);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      isSubmitting = false;
    }
    
    if (isSuccess) {
      setTimeout(() => {
        onClose();
        // Reset after close
        setTimeout(() => {
          isSuccess = false;
          rating = 50;
          feedback = '';
          name = '';
          email = '';
        }, 500);
      }, 2000);
    }
  }

  function handleEsc(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleEsc} />

{#if show}
  <div 
    class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    onclick={onClose}
    onkeydown={handleEsc}
    role="presentation"
  >
    <div 
      class="w-full max-w-md bg-[#0a0a0a] border border-[#2e2e2e] rounded-xl shadow-2xl p-8 relative flex flex-col gap-8"
      transition:scale={{ duration: 200, start: 0.95 }}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      tabindex="-1"
    >
      {#if !isSuccess}
        <div class="flex flex-col gap-1">
          <h2 id="feedback-title" class="text-2xl font-bold text-white tracking-tight">Give feedback</h2>
          <p class="text-[14px] text-gray-400">Your feedback helps us make RunMyAIModel better.</p>
        </div>

        <div class="space-y-6">
          <!-- Dynamic Slider -->
          <div class="space-y-4">
            <div class="flex justify-between items-end">
              <span class="text-[11px] uppercase tracking-widest font-bold text-gray-500">Your Rating</span>
              <span class="text-2xl font-bold font-mono transition-colors duration-75" style="color: {sliderColor}">{rating}<span class="text-sm text-gray-600">/100</span></span>
            </div>
            
            <div class="w-full h-8 flex items-center">
              <input 
                type="range" 
                min="0" max="100" 
                bind:value={rating} 
                class="custom-slider w-full"
                style="--slider-color: {sliderColor}; --slider-pct: {rating}%;"
              />
            </div>
          </div>

          <!-- Inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="name" class="text-[11px] uppercase tracking-widest font-bold text-gray-500">Name</label>
              <input 
                id="name"
                bind:value={name}
                type="text"
                placeholder="Your full name"
                class="w-full bg-black border {isGibberish && name.length > 0 ? 'border-red-500 focus:border-red-500' : 'border-[#2e2e2e] focus:border-[#444]'} rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                required
              />
              {#if isGibberish && name.length > 0}
                <p class="text-[10px] text-red-500 mt-1">Please enter a valid real name.</p>
              {/if}
            </div>
            <div class="space-y-2">
              <label for="email" class="text-[11px] uppercase tracking-widest font-bold text-gray-500">Email</label>
              <input 
                id="email"
                bind:value={email}
                type="email"
                placeholder="john@example.com"
                class="w-full bg-black border {(!isValidEmailFormat && email.length > 0) || isEmailDisposable || (isGibberish && email.length > 0) ? 'border-red-500 focus:border-red-500' : 'border-[#2e2e2e] focus:border-[#444]'} rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                required
              />
              {#if email.length > 0 && !isValidEmailFormat}
                <p class="text-[10px] text-red-500 mt-1">Please enter a valid email format.</p>
              {:else if isEmailDisposable}
                <p class="text-[10px] text-red-500 mt-1">Please use an original/real email.</p>
              {:else if isGibberish && email.length > 0}
                <p class="text-[10px] text-red-500 mt-1">Please use a valid real email.</p>
              {/if}
            </div>
          </div>

          <div class="space-y-2">
             <label for="message" class="text-[11px] uppercase tracking-widest font-bold text-gray-500">Message</label>
            <textarea
              id="message"
              bind:value={feedback}
              placeholder="Tell us what you think..."
              class="w-full h-28 bg-black border border-[#2e2e2e] rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#444] transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex gap-4">
          <button 
            onclick={onClose}
            class="flex-1 px-4 py-2.5 border border-[#2e2e2e] text-white text-sm font-bold rounded-md hover:bg-[#111] transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button 
            onclick={submitForm}
            disabled={rating === null || !isNameValid || !isValidEmailFormat || isEmailDisposable || isGibberish || isSubmitting}
            class="flex-1 px-4 py-2.5 bg-white text-black text-sm font-bold rounded-md hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            type="button"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in zoom-in-95">
          <div class="w-12 h-12 bg-vercel-blue/10 rounded-full flex items-center justify-center text-vercel-blue">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div class="text-center">
            <h3 class="text-white font-bold text-lg">Feedback Sent</h3>
            <p class="text-gray-400 text-sm mt-1">Thank you for helping us improve!</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  input[type=range].custom-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    background: transparent;
    margin: 0;
  }

  input[type=range].custom-slider:focus {
    outline: none;
  }

  input[type=range].custom-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px; 
    cursor: pointer;
    background: linear-gradient(to right, var(--slider-color) var(--slider-pct), #2e2e2e var(--slider-pct));
    border-radius: 9999px;
    transition: background 0.075s linear;
  }

  input[type=range].custom-slider::-webkit-slider-thumb {
    box-sizing: border-box;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: var(--slider-color);
    cursor: grab;
    -webkit-appearance: none;
    box-shadow: 0 0 15px var(--slider-color);
    border: 2px solid #000;
    transition: transform 0.1s, background 0.075s linear, box-shadow 0.075s linear;
    margin-top: -7px; /* (6/2) - (20/2) = -7px to center thumb perfectly */
  }
  
  input[type=range].custom-slider:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.15);
  }

  input[type=range].custom-slider::-moz-range-track {
    width: 100%;
    height: 6px; 
    cursor: pointer;
    background: linear-gradient(to right, var(--slider-color) var(--slider-pct), #2e2e2e var(--slider-pct));
    border-radius: 9999px;
    transition: background 0.075s linear;
  }

  input[type=range].custom-slider::-moz-range-thumb {
    box-sizing: border-box;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: var(--slider-color);
    cursor: grab;
    border: 2px solid #000;
    box-shadow: 0 0 15px var(--slider-color);
    transition: transform 0.1s, background 0.075s linear, box-shadow 0.075s linear;
  }
  
  input[type=range].custom-slider:active::-moz-range-thumb {
    cursor: grabbing;
    transform: scale(1.15);
  }
</style>
