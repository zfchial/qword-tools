function copyOutput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.value || el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyBtn');
    if (btn) {
      const orig = btn.innerText;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = orig, 2000);
    }
  });
}

function clearField(id) {
  const el = document.getElementById(id);
  if (el) el.value = '';
}

function setupTool(type) {
  if (type === 'text-case') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.setCase = function(mode) {
      const val = input.value;
      if (mode === 'upper') output.value = val.toUpperCase();
      else if (mode === 'lower') output.value = val.toLowerCase();
      else if (mode === 'title') {
        output.value = val.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      } else if (mode === 'camel') {
        output.value = val.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
      } else if (mode === 'snake') {
        output.value = val.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('_') || '';
      } else if (mode === 'kebab') {
        output.value = val.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('-') || '';
      } else if (mode === 'pascal') {
        const camel = val.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        output.value = camel.charAt(0).toUpperCase() + camel.slice(1);
      }
    };
  } else if (type === 'word-counter') {
    const input = document.getElementById('input');
    function update() {
      const text = input.value;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s+/g, '').length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const sentences = text.split(/[.!?]+/).filter(Boolean).length;
      const paragraphs = text.split(/\n+/).filter(Boolean).length;
      const readMin = Math.ceil(words / 200);
      document.getElementById('statWords').innerText = words;
      document.getElementById('statChars').innerText = chars;
      document.getElementById('statCharsNoSpace').innerText = charsNoSpace;
      document.getElementById('statSentences').innerText = sentences;
      document.getElementById('statParagraphs').innerText = paragraphs;
      document.getElementById('statReadTime').innerText = readMin + ' min';
    }
    input.addEventListener('input', update);
    update();
  } else if (type === 'lorem') {
    const countIn = document.getElementById('count');
    const output = document.getElementById('output');
    const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(' ');
    window.genLorem = function() {
      const pCount = parseInt(countIn.value) || 3;
      const res = [];
      for (let p = 0; p < pCount; p++) {
        let para = [];
        for (let w = 0; w < 60; w++) {
          para.push(words[Math.floor(Math.random() * words.length)]);
        }
        para[0] = para[0].charAt(0).toUpperCase() + para[0].slice(1);
        res.push(para.join(' ') + '.');
      }
      output.value = res.join('\n\n');
    };
    genLorem();
  } else if (type === 'slugify') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    function update() {
      output.value = input.value.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    input.addEventListener('input', update);
    update();
  } else if (type === 'dedupe-lines') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.cleanLines = function(sort) {
      let lines = input.value.split('\n').map(l => l.trim()).filter(Boolean);
      lines = Array.from(new Set(lines));
      if (sort) lines.sort();
      output.value = lines.join('\n');
    };
  } else if (type === 'line-sort') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.sortLines = function(mode) {
      let lines = input.value.split('\n').filter(Boolean);
      if (mode === 'az') lines.sort((a,b) => a.localeCompare(b));
      else if (mode === 'za') lines.sort((a,b) => b.localeCompare(a));
      else if (mode === 'num') lines = lines.map((l, i) => `${i+1}. ${l}`);
      output.value = lines.join('\n');
    };
  } else if (type === 'find-replace') {
    const input = document.getElementById('input');
    const findIn = document.getElementById('findText');
    const replIn = document.getElementById('replaceText');
    const output = document.getElementById('output');
    window.runReplace = function() {
      const isRegex = document.getElementById('chkRegex').checked;
      const f = findIn.value;
      const r = replIn.value;
      if (!f) return;
      try {
        if (isRegex) {
          const reg = new RegExp(f, 'g');
          output.value = input.value.replace(reg, r);
        } else {
          output.value = input.value.split(f).join(r);
        }
      } catch (e) {
        output.value = 'Error: ' + e.message;
      }
    };
  } else if (type === 'text-reverse') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.reverseChars = () => output.value = input.value.split('').reverse().join('');
    window.reverseWords = () => output.value = input.value.split(/\s+/).reverse().join(' ');
  } else if (type === 'morse-code') {
    const map = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};
    const rev = Object.fromEntries(Object.entries(map).map(([k,v])=>[v,k]));
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.toMorse = () => {
      output.value = input.value.toUpperCase().split('').map(c => map[c] || c).join(' ');
    };
    window.fromMorse = () => {
      output.value = input.value.trim().split(' ').map(c => rev[c] || (c === '/' ? ' ' : '')).join('');
    };
  } else if (type === 'json-formatter') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const err = document.getElementById('errorMsg');
    window.formatJson = function(space) {
      err.innerText = '';
      try {
        const obj = JSON.parse(input.value);
        output.value = JSON.stringify(obj, null, space);
      } catch (e) {
        err.innerText = 'Invalid JSON: ' + e.message;
      }
    };
  } else if (type === 'json-yaml') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.jsonToYaml = function() {
      try {
        const obj = JSON.parse(input.value);
        function toY(o, ind = '') {
          if (typeof o !== 'object' || o === null) return String(o);
          let res = '';
          for (const [k, v] of Object.entries(o)) {
            if (typeof v === 'object' && v !== null) {
              res += `${ind}${k}:\n${toY(v, ind + '  ')}\n`;
            } else {
              res += `${ind}${k}: ${v}\n`;
            }
          }
          return res.trimEnd();
        }
        output.value = toY(obj);
      } catch (e) {
        output.value = 'Invalid JSON: ' + e.message;
      }
    };
  } else if (type === 'base64') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.b64Encode = () => {
      try { output.value = btoa(unescape(encodeURIComponent(input.value))); } catch (e) { output.value = e.message; }
    };
    window.b64Decode = () => {
      try { output.value = decodeURIComponent(escape(atob(input.value.trim()))); } catch (e) { output.value = 'Invalid Base64'; }
    };
  } else if (type === 'url-encode') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.urlEncode = () => output.value = encodeURIComponent(input.value);
    window.urlDecode = () => {
      try { output.value = decodeURIComponent(input.value); } catch(e) { output.value = 'Invalid URL component'; }
    };
  } else if (type === 'html-entities') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.escapeHtml = () => {
      output.value = input.value.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m]));
    };
    window.unescapeHtml = () => {
      const doc = new DOMParser().parseFromString(input.value, 'text/html');
      output.value = doc.body.textContent;
    };
  } else if (type === 'css-tool') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.minifyCss = () => {
      output.value = input.value
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
        .replace(/\;(?=\})/g, '')
        .trim();
    };
    window.formatCss = () => {
      output.value = input.value
        .replace(/\s*\{\s*/g, ' {\n  ')
        .replace(/\s*;\s*/g, ';\n  ')
        .replace(/\s*\}\s*/g, '\n}\n\n')
        .trim();
    };
  } else if (type === 'sql-formatter') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.formatSql = () => {
      const words = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE'];
      let res = input.value;
      for (const w of words) {
        const reg = new RegExp('\\b' + w + '\\b', 'gi');
        res = res.replace(reg, '\n' + w.toUpperCase() + ' ');
      }
      output.value = res.trim();
    };
  } else if (type === 'docker-run-compose') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.convertToCompose = () => {
      const raw = input.value.replace(/\\/g, ' ').replace(/\n/g, ' ');
      const nameMatch = raw.match(/--name\s+([^\s]+)/);
      const name = nameMatch ? nameMatch[1] : 'app';
      const img = raw.trim().split(/\s+/).pop();
      const ports = [...raw.matchAll(/-p\s+([^\s]+)/g)].map(m => `      - "${m[1]}"`);
      const vols = [...raw.matchAll(/-v\s+([^\s]+)/g)].map(m => `      - "${m[1]}"`);
      const envs = [...raw.matchAll(/-e\s+([^\s]+)/g)].map(m => `      - "${m[1]}"`);
      let comp = `version: '3.8'\nservices:\n  ${name}:\n    image: ${img}\n`;
      if (ports.length) comp += `    ports:\n${ports.join('\n')}\n`;
      if (vols.length) comp += `    volumes:\n${vols.join('\n')}\n`;
      if (envs.length) comp += `    environment:\n${envs.join('\n')}\n`;
      comp += `    restart: unless-stopped\n`;
      output.value = comp;
    };
  } else if (type === 'user-agent') {
    document.getElementById('uaRaw').innerText = navigator.userAgent;
    document.getElementById('uaPlatform').innerText = navigator.platform;
    document.getElementById('uaScreen').innerText = `${window.screen.width} x ${window.screen.height}`;
    document.getElementById('uaLang').innerText = navigator.language;
  } else if (type === 'http-status') {
    const input = document.getElementById('statusFilter');
    window.filterStatus = () => {
      const q = input.value.toLowerCase();
      document.querySelectorAll('.status-card').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(q) ? 'block' : 'none';
      });
    };
  } else if (type === 'uuid') {
    const output = document.getElementById('output');
    const countInput = document.getElementById('count');
    window.genUuid = () => {
      const count = parseInt(countInput.value) || 1;
      const list = [];
      for (let i = 0; i < count; i++) list.push(crypto.randomUUID());
      output.value = list.join('\n');
    };
    genUuid();
  } else if (type === 'password-gen') {
    const output = document.getElementById('output');
    const lenInput = document.getElementById('pwLen');
    window.genPassword = () => {
      const len = parseInt(lenInput.value) || 16;
      const upper = document.getElementById('chkUpper').checked ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '';
      const lower = document.getElementById('chkLower').checked ? 'abcdefghijklmnopqrstuvwxyz' : '';
      const num = document.getElementById('chkNum').checked ? '0123456789' : '';
      const sym = document.getElementById('chkSym').checked ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '';
      const chars = upper + lower + num + sym;
      if (!chars) { output.value = 'Please select at least one character set'; return; }
      const arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      let res = '';
      for (let i = 0; i < len; i++) res += chars[arr[i] % chars.length];
      output.value = res;
    };
    genPassword();
  } else if (type === 'hash-gen') {
    const input = document.getElementById('input');
    window.calcHash = async function() {
      const text = input.value;
      const enc = new TextEncoder();
      const data = enc.encode(text);
      for (const alg of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
        const hashBuf = await crypto.subtle.digest(alg, data);
        const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
        const id = 'hash_' + alg.toLowerCase().replace('-', '');
        const target = document.getElementById(id);
        if (target) target.value = hashHex;
      }
    };
    input.addEventListener('input', calcHash);
    calcHash();
  } else if (type === 'jwt-decoder') {
    const input = document.getElementById('input');
    const headerOut = document.getElementById('headerOut');
    const payloadOut = document.getElementById('payloadOut');
    window.decodeJwt = () => {
      try {
        const parts = input.value.trim().split('.');
        if (parts.length < 2) throw new Error('JWT must have at least 2 parts');
        const b64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
        headerOut.value = JSON.stringify(JSON.parse(b64(parts[0])), null, 2);
        payloadOut.value = JSON.stringify(JSON.parse(b64(parts[1])), null, 2);
      } catch (e) {
        headerOut.value = 'Error: ' + e.message;
        payloadOut.value = '';
      }
    };
  } else if (type === 'color-converter') {
    const picker = document.getElementById('picker');
    const hexIn = document.getElementById('hexIn');
    const rgbOut = document.getElementById('rgbOut');
    const hslOut = document.getElementById('hslOut');
    function update(hex) {
      picker.value = hex;
      hexIn.value = hex;
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      rgbOut.value = `rgb(${r}, ${g}, ${b})`;
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
      let h, s, l = (max + min) / 2;
      if (max === min) h = s = 0;
      else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
          case gn: h = (bn - rn) / d + 2; break;
          case bn: h = (rn - gn) / d + 4; break;
        }
        h /= 6;
      }
      hslOut.value = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    picker.addEventListener('input', e => update(e.target.value));
    hexIn.addEventListener('input', e => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) update(e.target.value);
    });
    update('#3b82f6');
  } else if (type === 'timestamp') {
    const epochIn = document.getElementById('epochIn');
    const dateOut = document.getElementById('dateOut');
    const dateIn = document.getElementById('dateIn');
    const epochOut = document.getElementById('epochOut');
    window.convertEpoch = () => {
      let v = parseInt(epochIn.value);
      if (isNaN(v)) return;
      if (v < 10000000000) v *= 1000;
      dateOut.value = new Date(v).toISOString();
    };
    window.convertDate = () => {
      const d = new Date(dateIn.value);
      if (!isNaN(d.getTime())) epochOut.value = Math.floor(d.getTime() / 1000);
    };
    epochIn.value = Math.floor(Date.now() / 1000);
    convertEpoch();
  } else if (type === 'binary-text') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    window.textToBin = () => {
      output.value = Array.from(new TextEncoder().encode(input.value)).map(b => b.toString(2).padStart(8, '0')).join(' ');
    };
    window.binToText = () => {
      try {
        const bytes = input.value.trim().split(/\s+/).map(b => parseInt(b, 2));
        output.value = new TextDecoder().decode(new Uint8Array(bytes));
      } catch (e) {
        output.value = 'Invalid binary input';
      }
    };
  } else if (type === 'base-converter') {
    const decIn = document.getElementById('decIn');
    const hexOut = document.getElementById('hexOut');
    const binOut = document.getElementById('binOut');
    const octOut = document.getElementById('octOut');
    decIn.addEventListener('input', () => {
      try {
        const val = BigInt(decIn.value.trim() || 0);
        hexOut.value = val.toString(16).toUpperCase();
        binOut.value = val.toString(2);
        octOut.value = val.toString(8);
      } catch (e) {
        hexOut.value = binOut.value = octOut.value = 'Invalid';
      }
    });
    decIn.value = '255';
    decIn.dispatchEvent(new Event('input'));
  } else if (type === 'px-rem') {
    const pxIn = document.getElementById('pxIn');
    const baseIn = document.getElementById('baseIn');
    const remOut = document.getElementById('remOut');
    window.calcRem = () => {
      const px = parseFloat(pxIn.value) || 0;
      const base = parseFloat(baseIn.value) || 16;
      remOut.value = (px / base).toFixed(4) + 'rem';
    };
    pxIn.addEventListener('input', calcRem);
    baseIn.addEventListener('input', calcRem);
    calcRem();
  } else if (type === 'byte-converter') {
    const bIn = document.getElementById('bytesIn');
    window.calcBytes = () => {
      const bytes = parseFloat(bIn.value) || 0;
      document.getElementById('resKb').value = (bytes / 1024).toFixed(2) + ' KB';
      document.getElementById('resMb').value = (bytes / (1024**2)).toFixed(2) + ' MB';
      document.getElementById('resGb').value = (bytes / (1024**3)).toFixed(4) + ' GB';
      document.getElementById('resTb').value = (bytes / (1024**4)).toFixed(6) + ' TB';
    };
    bIn.addEventListener('input', calcBytes);
    bIn.value = 1048576;
    calcBytes();
  } else if (type === 'qr-code') {
    const input = document.getElementById('input');
    const img = document.getElementById('qrImg');
    window.generateQr = () => {
      const val = encodeURIComponent(input.value || 'https://qword.tech');
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + val;
    };
    input.addEventListener('input', generateQr);
    generateQr();
  } else if (type === 'svg-placeholder') {
    const wIn = document.getElementById('wIn');
    const hIn = document.getElementById('hIn');
    const textIn = document.getElementById('tIn');
    const output = document.getElementById('output');
    window.genSvg = () => {
      const w = wIn.value || 600;
      const h = hIn.value || 400;
      const t = textIn.value || `${w} x ${h}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#1f2937"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#9ca3af">${t}</text>
</svg>`;
      output.value = svg;
      document.getElementById('svgPreview').innerHTML = svg;
    };
    genSvg();
  } else if (type === 'aspect-ratio') {
    const wIn = document.getElementById('wIn');
    const hIn = document.getElementById('hIn');
    const rW = document.getElementById('rW');
    const rH = document.getElementById('rH');
    window.calcRatio = (from) => {
      const rw = parseFloat(rW.value) || 16;
      const rh = parseFloat(rH.value) || 9;
      if (from === 'w') {
        hIn.value = Math.round((parseFloat(wIn.value) || 0) * (rh / rw));
      } else {
        wIn.value = Math.round((parseFloat(hIn.value) || 0) * (rw / rh));
      }
    };
    calcRatio('w');
  }
}
