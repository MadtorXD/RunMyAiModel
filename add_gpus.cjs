const fs = require('fs');

const original = JSON.parse(fs.readFileSync('src/lib/data/gpus_original.json', 'utf-8'));

const extraGpus = [
  // NVIDIA Workstation Ada Generation
  { name: 'RTX 6000 Ada Generation', manufacturer: 'NVIDIA', vram_gb: 48, bandwidth_gbps: 960 },
  { name: 'RTX 5880 Ada Generation', manufacturer: 'NVIDIA', vram_gb: 48, bandwidth_gbps: 864 },
  { name: 'RTX 5000 Ada Generation', manufacturer: 'NVIDIA', vram_gb: 32, bandwidth_gbps: 576 },
  { name: 'RTX 4500 Ada Generation', manufacturer: 'NVIDIA', vram_gb: 24, bandwidth_gbps: 432 },
  { name: 'RTX 4000 Ada Generation SFF', manufacturer: 'NVIDIA', vram_gb: 20, bandwidth_gbps: 320 },
  { name: 'RTX 2000 Ada Generation', manufacturer: 'NVIDIA', vram_gb: 16, bandwidth_gbps: 224 },

  // NVIDIA Workstation Ampere Generation
  { name: 'RTX A6000', manufacturer: 'NVIDIA', vram_gb: 48, bandwidth_gbps: 768 },
  { name: 'RTX A5500', manufacturer: 'NVIDIA', vram_gb: 24, bandwidth_gbps: 768 },
  { name: 'RTX A5000', manufacturer: 'NVIDIA', vram_gb: 24, bandwidth_gbps: 768 },
  { name: 'RTX A4500', manufacturer: 'NVIDIA', vram_gb: 20, bandwidth_gbps: 640 },
  { name: 'RTX A4000', manufacturer: 'NVIDIA', vram_gb: 16, bandwidth_gbps: 448 },
  
  // NVIDIA Data Center Hopper & Grace
  { name: 'H200', manufacturer: 'NVIDIA', vram_gb: 141, bandwidth_gbps: 4800 },
  { name: 'H100 NVL (Dual)', manufacturer: 'NVIDIA', vram_gb: 188, bandwidth_gbps: 7800 },

  // NVIDIA Older Consumer Cards
  { name: 'TITAN RTX', manufacturer: 'NVIDIA', vram_gb: 24, bandwidth_gbps: 672 },
  { name: 'TITAN V', manufacturer: 'NVIDIA', vram_gb: 12, bandwidth_gbps: 653 },
  { name: 'TITAN Xp', manufacturer: 'NVIDIA', vram_gb: 12, bandwidth_gbps: 548 },
  { name: 'GeForce GTX 1080 Ti', manufacturer: 'NVIDIA', vram_gb: 11, bandwidth_gbps: 484 },
  { name: 'GeForce GTX 1080', manufacturer: 'NVIDIA', vram_gb: 8, bandwidth_gbps: 320 },
  { name: 'GeForce GTX 1070 Ti', manufacturer: 'NVIDIA', vram_gb: 8, bandwidth_gbps: 256 },
  { name: 'GeForce GTX 1070', manufacturer: 'NVIDIA', vram_gb: 8, bandwidth_gbps: 256 },
  { name: 'GeForce GTX 1060', manufacturer: 'NVIDIA', vram_options: [
    { vram_gb: 6, bandwidth_gbps: 192 },
    { vram_gb: 3, bandwidth_gbps: 192 }
  ]},

  // AMD Radeon Pro Workstation
  { name: 'Radeon Pro W7900', manufacturer: 'AMD', vram_gb: 48, bandwidth_gbps: 864 },
  { name: 'Radeon Pro W7800', manufacturer: 'AMD', vram_gb: 32, bandwidth_gbps: 576 },
  { name: 'Radeon Pro W7700', manufacturer: 'AMD', vram_gb: 16, bandwidth_gbps: 576 },
  { name: 'Radeon Pro W6800', manufacturer: 'AMD', vram_gb: 32, bandwidth_gbps: 512 },

  // AMD Recent Consumer additions
  { name: 'Radeon RX 7900 GRE', manufacturer: 'AMD', vram_gb: 16, bandwidth_gbps: 576 },
  { name: 'Radeon RX 7600 XT', manufacturer: 'AMD', vram_gb: 16, bandwidth_gbps: 288 },
  { name: 'Radeon RX 6750 XT', manufacturer: 'AMD', vram_gb: 12, bandwidth_gbps: 432 },
  { name: 'Radeon RX 6700 XT', manufacturer: 'AMD', vram_gb: 12, bandwidth_gbps: 384 },
  { name: 'Radeon RX 6650 XT', manufacturer: 'AMD', vram_gb: 8, bandwidth_gbps: 280 },

  // Intel Arc
  { name: 'Arc A770', manufacturer: 'Intel', vram_options: [
    { vram_gb: 16, bandwidth_gbps: 512 },
    { vram_gb: 8, bandwidth_gbps: 512 }
  ]},
  { name: 'Arc A750', manufacturer: 'Intel', vram_gb: 8, bandwidth_gbps: 512 },
  { name: 'Arc A580', manufacturer: 'Intel', vram_gb: 8, bandwidth_gbps: 512 },

  // Apple Silicon (Unified Memory Systems with typical allocations)
  // Unified memory bandwidths:
  // M1/M2/M3: ~100GB/s
  // M1/M2/M3 Pro: 200GB/s (M3 Pro 150GB/s)
  // M1/M2/M3 Max: 400GB/s (M3 Max 300-400GB/s)
  // M1/M2 Ultra: 800GB/s
  { name: 'Apple M3 Max', manufacturer: 'Apple', vram_options: [
    { vram_gb: 128, bandwidth_gbps: 400 },
    { vram_gb: 96, bandwidth_gbps: 300 },
    { vram_gb: 48, bandwidth_gbps: 300 },
    { vram_gb: 36, bandwidth_gbps: 400 }
  ]},
  { name: 'Apple M3 Pro', manufacturer: 'Apple', vram_options: [
    { vram_gb: 36, bandwidth_gbps: 150 },
    { vram_gb: 18, bandwidth_gbps: 150 }
  ]},
  { name: 'Apple M2 Ultra', manufacturer: 'Apple', vram_options: [
    { vram_gb: 192, bandwidth_gbps: 800 },
    { vram_gb: 128, bandwidth_gbps: 800 },
    { vram_gb: 64, bandwidth_gbps: 800 }
  ]},
  { name: 'Apple M2 Max', manufacturer: 'Apple', vram_options: [
    { vram_gb: 96, bandwidth_gbps: 400 },
    { vram_gb: 64, bandwidth_gbps: 400 },
    { vram_gb: 32, bandwidth_gbps: 400 }
  ]},
  { name: 'Apple M1 Ultra', manufacturer: 'Apple', vram_options: [
    { vram_gb: 128, bandwidth_gbps: 800 },
    { vram_gb: 64, bandwidth_gbps: 800 }
  ]}
];

const nameSet = new Set(original.map(g => g.name));

for (const eg of extraGpus) {
  if (!nameSet.has(eg.name)) {
    original.push(eg);
    nameSet.add(eg.name);
  }
}

// Sort the list properly by Manufacturer then by compute/VRAM roughly
original.sort((a, b) => {
  if (a.manufacturer !== b.manufacturer) return a.manufacturer.localeCompare(b.manufacturer);
  const getVram = (x) => x.vram_gb || (x.vram_options ? Math.max(...x.vram_options.map(o => o.vram_gb)) : 0);
  return getVram(b) - getVram(a); 
});

const finalData = {
  gpus: original
};

fs.writeFileSync('src/lib/data/gpus.json', JSON.stringify(original, null, 2));

console.log('Successfully expanded GPUs database! Total GPUs:', original.length);
