/* Image upscale sharpen worker — runs unsharp-mask off the main thread. */
self.onmessage = (e) => {
  const data = e.data || {};
  const id = data.id;
  const width = data.width | 0;
  const height = data.height | 0;
  const strength = Number(data.strength) || 0;
  const buffer = data.buffer;
  if (!id || !width || !height || !buffer) return;
  try {
    const d = new Uint8ClampedArray(buffer);
    const amt = Math.max(0, Math.min(100, strength)) / 100;
    if (amt > 0) {
      const copy = d.slice();
      const w = width, h = height;
      const str = 0.35 + amt * 0.85;
      for (let y = 0; y < h; y++) {
        const yw = y * w;
        const upRow = y > 0 ? yw - w : yw;
        const dnRow = y < h - 1 ? yw + w : yw;
        for (let x = 0; x < w; x++) {
          const xl = x > 0 ? x - 1 : x;
          const xr = x < w - 1 ? x + 1 : x;
          const i = (yw + x) * 4;
          const l = (yw + xl) * 4;
          const r = (yw + xr) * 4;
          const u = (upRow + x) * 4;
          const dn = (dnRow + x) * 4;
          for (let c = 0; c < 3; c++) {
            const blur = (copy[l + c] + copy[r + c] + copy[u + c] + copy[dn + c]) * 0.25;
            d[i + c] = copy[i + c] + (copy[i + c] - blur) * str;
          }
        }
      }
    }
    self.postMessage({ id, buffer: d.buffer }, [d.buffer]);
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
