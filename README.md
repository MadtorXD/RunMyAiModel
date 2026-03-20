# 🚀 RunMyAIModel

A high-performance hardware compatibility calculator designed specifically for running local, open-source Large Language Models (LLMs). 

With the explosion of local AI architecture, knowing exactly whether an immense model like Llama 3 70B can physically fit into your GPU's VRAM is critical. The RunMyAIModel calculator takes the guesswork out of AI hardware constraints through rigorous mathematical profiling.

---

## 🧮 The Core Mathematical Engine

This calculator does not use arbitrary "T-shirt sizes." It actively computes hardware constraints using the following physical hardware logic:

### 1. Total VRAM & KV Cache Profiling
The total VRAM required is never just the weights. We calculate the exact contextual bounds required to run the model at specific lengths:
```math
Total VRAM Needed = Model Weight (GB) + (Context Length in K * kv_per_1k_gb) + 1.0GB (Inference Overhead)
```

### 2. Tokens / Second Speed Prediction
In LLM inference, memory bandwidth (not compute TFOPs) is the primary bottleneck for generation speed:
```math
Predicted Tok/s = Effective Bandwidth (GB/s) / (Model Weight (GB) + 1.0GB)
```

### 3. CPU Offload Penalties (System RAM)
If a model exceeds your VRAM, it spills (offloads) into System RAM, destroying bandwidth caps over the slow PCIe lane. We penalize speed predictions accordingly:
```math
Offload Ratio = (Spillover Weight in RAM) / (Total Model Weight)
Base Speed Penalty = 15% + (Offload Ratio * 70%)
```

### 4. Apple Silicon Unified Memory Logic
Macs (M1-M4) do not have separate VRAM and System RAM. The UI automatically zeroes out System RAM when "Apple" is selected, treating the entire memory pool as Unified fast VRAM, bypassing the standard PCIe offload penalty entirely.

### 5. Multi-GPU PCIe Scaling Loss
Bandwidth does not scale perfectly linearly when bridging multiple GPUs together:
- **2 GPUs:** 85% total bandwidth efficiency
- **3 GPUs:** 75% total bandwidth efficiency
- **4 GPUs:** 70% total bandwidth efficiency

---

## ⚡ Core Features

- **Dynamic Tiering System**: Models are automatically categorized into three distinct execution tiers based on your hardware:
  - 🟢 **Runs Well**: Fully contained within VRAM for blazing fast generation.
  - 🟡 **Tight Fit**: Fits entirely locally, but pushes the physical limits of the card.
  - 🔴 **Must Offload**: Exceeds VRAM, forcing algorithmic calculation of performance loss over System RAM.
- **Granular Hardware Filters**: Filter instantly by GPU count, custom VRAM, System RAM, Context Size limits, and highly specialized model features (Reasoning, Vision, Coding, Mixture of Experts).
- **Automated Cloud Price Interpolation**: For models that physically cannot run on your local rig, the engine scans a database of Tier 1 datacenter GPUs (A6000, A100, H100) to find the absolute cheapest hourly rental (`$/hr`) that guarantees a fit.

## 🎨 UI & Architecture

Built with a stunning, ultra-minimalist, high-contrast dark mode aesthetic replicating premium tech tooling architectures (like Vercel and Apple).
- **Zero-Layout-Shift**: Highly stabilized Flexbox and Grid components ensure zero layout shifts during complex DOM updates.
- **Micro-Animations**: Extensive use of subtle fade-ins, color-interpolating sliders, and dynamic badge stacking (`flex-wrap`).
- **Feedback Engine**: A custom-built animated gradient feedback mechanism (0-100 score) integrated securely to natively validate and sanitize inputs.

## 🛠 Tech Stack

- **Frontend Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Typing**: TypeScript
- **Deployment Topology**: Designed explicitly for Edge Serverless deployment environments for 0ms cold starts.

---

### Setup Instructions

If you wish to fork and run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/RunMyAIModel.git
   ```
2. Navigate to the project directory:
   ```bash
   cd RunMyAiModel
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`.

---

## 📜 License & Usage

**Non-Commercial & Contribution License**

This project is actively maintained by the creator but welcomes community involvement! You are highly encouraged to read the code, fork the repository, and submit Pull Requests to improve the mathematical logic or hardware databases.

However, protective copyright applies to commercial usage:
You are **strictly prohibited** from deploying, distributing, or utilizing this code (including its exact mathematical engines, database schema, and UI architecture) for any **commercial purposes** or for-profit projects without explicit written permission from the creator.
