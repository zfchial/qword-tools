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

function convertProgress(prefix) {
  const box=document.getElementById(prefix+'Progress'),fill=document.getElementById(prefix+'ProgressFill'),text=document.getElementById(prefix+'ProgressText'),track=box?.querySelector('.convert-progress-track');
  return {
    show(){box.hidden=false;},
    hide(){box.hidden=true;},
    set(percent,label){const p=Math.max(0,Math.min(100,Math.round(percent)));fill.style.width=p+'%';fill.classList.remove('is-busy');track?.setAttribute('aria-valuenow',String(p));if(label)text.textContent=label;},
    busy(label){fill.classList.add('is-busy');if(label)text.textContent=label;},
    done(label){fill.classList.remove('is-busy');fill.style.width='100%';track?.setAttribute('aria-valuenow','100');if(label)text.textContent=label;}
  };
}

function uploadWithProgress(url,body,onUpload,isRaw) {
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST',url,true);
    xhr.responseType='blob';
    xhr.upload.onprogress=(event)=>{if(event.lengthComputable&&event.total>0)onUpload(event.loaded/event.total);};
    xhr.onload=()=>{const type=xhr.getResponseHeader('Content-Type')||'';if(xhr.status>=200&&xhr.status<300)return resolve(xhr.response);if(type.includes('application/json')){const reader=new FileReader();reader.onload=()=>{try{reject(Error(JSON.parse(reader.result).error||('Conversion failed ('+xhr.status+')')))}catch(e){reject(Error('Conversion failed ('+xhr.status+')'))}};reader.onerror=()=>reject(Error('Conversion failed ('+xhr.status+')'));reader.readAsText(xhr.response)}else reject(Error('Conversion failed ('+xhr.status+')'))};
    xhr.onerror=()=>reject(Error('Upload failed. Check your connection and retry.'));
    xhr.ontimeout=()=>reject(Error('Conversion timed out.'));
    xhr.timeout=150000;
    if(isRaw)xhr.setRequestHeader('Content-Type',isRaw);
    xhr.send(body);
  });
}

function downloadBlob(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}

async function convertWithProgress(prefix,button,status,work,filename,doneText,after){
  const progress=convertProgress(prefix);
  button.disabled=true;status.textContent='';
  progress.show();progress.set(1,'Uploading… 0%');
  const started=Date.now();let ticker=null;
  const serverPhase=()=>{if(ticker)return;progress.busy('Converting on the server… 0s');ticker=setInterval(()=>progress.busy('Converting on the server… '+Math.round((Date.now()-started)/1000)+'s'),250);};
  try{
    const blob=await work((ratio)=>{if(ratio<1)progress.set(1+ratio*84,'Uploading… '+Math.round(ratio*100)+'%');else serverPhase();});
    if(ticker)clearInterval(ticker);
    progress.set(97,'Preparing download…');
    downloadBlob(blob,filename);
    progress.done('Done.');
    status.textContent=doneText;
    setTimeout(()=>progress.hide(),4000);
  }catch(e){if(ticker)clearInterval(ticker);progress.hide();status.textContent=e.message;}
  finally{button.disabled=false;if(after)after();}
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
  } else if (type === 'uuid-versions') {
    window.generateVersionedUuids = () => {
      const count = Math.max(1, Math.min(100, Number(document.getElementById('count').value) || 1));
      const version = document.getElementById('version').value;
      const out = [];
      for (let i = 0; i < count; i++) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        if (version === '7') {
          const now = BigInt(Date.now());
          for (let j = 5; j >= 0; j--) bytes[5 - j] = Number((now >> BigInt(j * 8)) & 255n);
          bytes[6] = (bytes[6] & 15) | 112;
        } else {
          const now = BigInt(Date.now()) * 10000n + 122192928000000000n;
          const time = now + BigInt(i);
          const low = Number(time & 0xffffffffn);
          const mid = Number((time >> 32n) & 0xffffn);
          const hi = Number((time >> 48n) & 0x0fffn) | 0x1000;
          bytes.set([low >>> 24, low >>> 16 & 255, low >>> 8 & 255, low & 255, mid >>> 8, mid & 255, hi >>> 8, hi & 255], 0);
        }
        bytes[8] = (bytes[8] & 63) | 128;
        const hex = [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
        out.push(hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20));
      }
      document.getElementById('output').value = out.join('\n');
    };
    window.generateVersionedUuids();
  } else if (type === 'cron-helper') {
    const fields = ['cronMinute','cronHour','cronDay','cronMonth','cronWeekday'];
    const limits = [[0,59],[0,23],[1,31],[1,12],[0,7]];
    function updateCron() {
      const values = fields.map(id => document.getElementById(id).value.trim());
      document.getElementById('cronOutput').value = values.join(' ');
      const ok = values.every((v,i) => v === '*' || v.split(',').every(part => {
        const m = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/\d+)?$/);
        return m && (!m[1].match(/^\d+$/) || Number(m[1]) >= limits[i][0] && Number(m[1]) <= limits[i][1]) && (!m[2] || Number(m[2]) >= limits[i][0] && Number(m[2]) <= limits[i][1]);
      }));
      document.getElementById('cronSummary').textContent = ok ? 'Expression uses standard five-field cron syntax.' : 'Check the values and allowed ranges for this field.';
      document.getElementById('cronSummary').style.color = ok ? '#10b981' : '#f87171';
    }
    fields.forEach(id => document.getElementById(id).addEventListener('input', updateCron));
    updateCron();
  } else if (type === 'regex-tester') {
    const updateRegex = () => {
      const status = document.getElementById('regexStatus');
      const output = document.getElementById('regexOutput');
      try {
        const re = new RegExp(document.getElementById('regexPattern').value, document.getElementById('regexFlags').value);
        const text = document.getElementById('regexText').value;
        const matches = [...text.matchAll(re)].slice(0, 500);
        output.value = matches.map((m,i) => (i+1)+'. '+JSON.stringify(m[0])+(m.length>1?'\n   Groups: '+JSON.stringify(m.slice(1)): '')).join('\n') || 'No matches';
        status.textContent = matches.length+' match(es)';
        status.style.color = '#10b981';
      } catch (e) { output.value = ''; status.textContent = e.message; status.style.color = '#f87171'; }
    };
    ['regexPattern','regexFlags','regexText'].forEach(id => document.getElementById(id).addEventListener('input', updateRegex));
  } else if (type === 'markdown-preview') {
    const input = document.getElementById('markdownInput');
    const preview = document.getElementById('markdownPreview');
    const esc = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const inline = value => esc(value).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" rel="noopener noreferrer">$1</a>');
    const render = () => {
      const lines = input.value.split('\n'); let html = ''; let list = false; let code = false; let codeLines = [];
      const closeList = () => { if (list) { html += '</ul>'; list = false; } };
      for (const line of lines) {
        if (line.startsWith('```')) { closeList(); if (code) { html += '<pre><code>'+esc(codeLines.join('\n'))+'</code></pre>'; codeLines=[]; code=false; } else code=true; continue; }
        if (code) { codeLines.push(line); continue; }
        const h=line.match(/^(#{1,6})\s+(.+)$/); const li=line.match(/^\s*[-*+]\s+(.+)$/);
        if (h) { closeList(); const n=h[1].length; html += '<h'+n+'>'+inline(h[2])+'</h'+n+'>'; }
        else if (li) { if (!list) {html+='<ul>';list=true;} html+='<li>'+inline(li[1])+'</li>'; }
        else if (/^>\s?/.test(line)) {closeList();html+='<blockquote>'+inline(line.replace(/^>\s?/,''))+'</blockquote>';}
        else {closeList(); if(line.trim()) html+='<p>'+inline(line)+'</p>';}
      }
      closeList(); if(code) html+='<pre><code>'+esc(codeLines.join('\n'))+'</code></pre>'; preview.innerHTML=html;
    };
    input.addEventListener('input', render); render();
  } else if (type === 'html-to-text') {
    window.convertHtmlToText = () => {
      const source = document.getElementById('htmlInput').value;
      const preserve = document.getElementById('preserveBreaks').checked;
      const doc = new DOMParser().parseFromString(source, 'text/html');
      doc.querySelectorAll('script,style,template,noscript').forEach(el => el.remove());
      let text = doc.body.textContent || '';
      text = text.replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n');
      text = preserve ? text.replace(/\s*\n\s*/g,'\n').replace(/\n{3,}/g,'\n\n').trim() : text.replace(/\s+/g,' ').trim();
      document.getElementById('htmlOutput').value = text;
    };
  } else if (type === 'image-converter' || type === 'image-resizer') {
    const resize = type === 'image-resizer';
    const fileInput = document.getElementById(resize ? 'resizeFile' : 'imageFile');
    const button = document.getElementById(resize ? 'resizeDownload' : 'imageDownload');
    const status = document.getElementById(resize ? 'resizeStatus' : 'imageStatus');
    let bitmap = null;
    fileInput.addEventListener('change', async () => {
      button.disabled = true;
      if (bitmap) bitmap.close?.();
      const file = fileInput.files?.[0];
      if (!file) return;
      try { bitmap = await createImageBitmap(file); status.textContent = bitmap.width+' × '+bitmap.height+' pixels'; button.disabled = false; }
      catch { status.textContent = 'This image format is not supported by this browser.'; }
    });
    if (resize) {
      const width = document.getElementById('resizeWidth'); const height = document.getElementById('resizeHeight'); const lock = document.getElementById('resizeLock');
      width.addEventListener('input',()=>{if(lock.checked&&bitmap)height.value=Math.max(1,Math.round(Number(width.value)*bitmap.height/bitmap.width))});
      height.addEventListener('input',()=>{if(lock.checked&&bitmap)width.value=Math.max(1,Math.round(Number(height.value)*bitmap.width/bitmap.height))});
      fileInput.addEventListener('change',()=>{if(bitmap){width.value=bitmap.width;height.value=bitmap.height}});
    }
    button.addEventListener('click',()=>{
      if(!bitmap)return;
      const canvas=document.createElement('canvas');
      const w=resize?Math.max(1,Math.min(12000,Number(document.getElementById('resizeWidth').value)||bitmap.width)):bitmap.width;
      const h=resize?Math.max(1,Math.min(12000,Number(document.getElementById('resizeHeight').value)||bitmap.height)):bitmap.height;
      canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
      const mime=document.getElementById(resize?'resizeFormat':'imageFormat').value;
      if(mime==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h)}
      ctx.drawImage(bitmap,0,0,w,h);
      canvas.toBlob(blob=>{if(!blob){status.textContent='Conversion failed: unsupported output format.';return}const a=document.createElement('a');a.href=URL.createObjectURL(blob);const base=(fileInput.files[0].name||'image').replace(/\.[^.]+$/,'');a.download=base+(mime==='image/png'?'.png':mime==='image/webp'?'.webp':'.jpg');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);status.textContent='Converted '+w+' × '+h+' image successfully.'},mime,Number(document.getElementById('imageQuality')?.value||85)/100);
    });
  } else if (type === 'json-csv') {
    window.convertDataFormat = direction => {
      const input=document.getElementById('dataInput').value;const out=document.getElementById('dataOutput');const status=document.getElementById('dataStatus');
      try {
        if(direction==='json-csv'){
          const rows=JSON.parse(input);if(!Array.isArray(rows)||rows.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw Error('Input must be an array of JSON objects.');
          const keys=[...new Set(rows.flatMap(Object.keys))];const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
          out.value=[keys.map(q).join(','),...rows.map(row=>keys.map(k=>q(typeof row[k]==='object'&&row[k]!==null?JSON.stringify(row[k]):row[k])).join(','))].join('\r\n');
        }else{
          const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'&&input[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('CSV has an unclosed quoted cell.');if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}
          const headers=rows.shift()||[];out.value=JSON.stringify(rows.filter(r=>r.some(v=>v!=='')).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??'']))),null,2);
        }status.textContent='Conversion complete.';
      }catch(e){out.value='';status.textContent=e.message;}
    };
  } else if (type === 'xml-json') {
    window.convertXmlJson = direction => {
      const input=document.getElementById('xmlInput').value;const out=document.getElementById('xmlOutput');const status=document.getElementById('xmlStatus');
      try {
        if(direction==='xml-json'){
          const doc=new DOMParser().parseFromString(input,'application/xml');if(doc.querySelector('parsererror'))throw Error('Invalid XML document.');
          const nodeValue=node=>{const obj={};for(const a of node.attributes)obj['@'+a.name]=a.value;for(const child of node.children){const val=nodeValue(child);if(Object.prototype.hasOwnProperty.call(obj,child.tagName))obj[child.tagName]=Array.isArray(obj[child.tagName])?[...obj[child.tagName],val]:[obj[child.tagName],val];else obj[child.tagName]=val}const text=[...node.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.nodeValue.trim()).filter(Boolean).join(' ');if(!Object.keys(obj).length)return text;if(text)obj['#text']=text;return obj};
          out.value=JSON.stringify({[doc.documentElement.tagName]:nodeValue(doc.documentElement)},null,2);
        }else{
          const obj=JSON.parse(input);const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
          const build=(name,value)=>{if(!/^[A-Za-z_][\w.:-]*$/.test(name))throw Error('Invalid XML element name: '+name);if(Array.isArray(value))return value.map(v=>build(name,v)).join('');if(value&&typeof value==='object')return '<'+name+'>'+Object.entries(value).map(([k,v])=>k.startsWith('@')? ' '+k.slice(1)+'="'+esc(v)+'"':k==='#text'?esc(v):build(k,v)).join('')+'</'+name+'>';return '<'+name+'>'+esc(value??'')+'</'+name+'>'};
          const entries=Object.entries(obj);if(entries.length!==1)throw Error('JSON root must contain exactly one property for the XML root element.');out.value='<?xml version="1.0" encoding="UTF-8"?>\n'+build(entries[0][0],entries[0][1]);
        }status.textContent='Conversion complete.';
      }catch(e){out.value='';status.textContent=e.message;}
    };
  } else if (type === 'text-hex') {
    window.convertTextHex = direction => {
      const input=document.getElementById('hexInput').value;const out=document.getElementById('hexOutput');const status=document.getElementById('hexStatus');
      try{if(direction==='encode')out.value=[...new TextEncoder().encode(input)].map(b=>b.toString(16).padStart(2,'0')).join(' ');else{const hex=input.replace(/0x/gi,'').replace(/\s+/g,'');if(!/^(?:[0-9a-f]{2})*$/i.test(hex))throw Error('Provide an even number of hexadecimal digits.');const bytes=new Uint8Array(hex.match(/.{2}/g)?.map(x=>parseInt(x,16))||[]);out.value=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}status.textContent='Conversion complete.'}catch(e){out.value='';status.textContent=e.message}
    };
  } else if (type === 'json-yaml') {
    window.convertJsonYaml=(direction)=>{const input=document.getElementById('yamlInput').value;const out=document.getElementById('yamlOutput');const status=document.getElementById('yamlStatus');
      const dump=(v,indent=0)=>{const pad=' '.repeat(indent);if(Array.isArray(v)){if(!v.length)return pad+'[]';return v.map(x=>{const rendered=dump(x,indent+2).trimStart();return pad+'- '+(x&&typeof x==='object'?(Array.isArray(x)?'\n'+rendered:rendered):rendered)}).join('\n')}if(v&&typeof v==='object'){const entries=Object.entries(v);if(!entries.length)return pad+'{}';return entries.map(([k,x])=>{const key=/^[A-Za-z_][\w.-]*$/.test(k)?k:JSON.stringify(k);if(x&&typeof x==='object'&&Object.keys(x).length)return pad+key+':\n'+dump(x,indent+2);return pad+key+': '+(typeof x==='string'?JSON.stringify(x):JSON.stringify(x))}).join('\n')}return pad+JSON.stringify(v)};
      const parse=text=>{const lines=text.split(/\r?\n/).map((raw,i)=>({indent:(raw.match(/^ */)||[''])[0].length,text:raw.trim(),i})).filter(x=>x.text&&!x.text.startsWith('#'));if(!lines.length)return null;let pos=0;const scalar=x=>{if(x==='null'||x==='~')return null;if(x==='true')return true;if(x==='false')return false;if(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(x))return Number(x);if(x.startsWith('[')||x.startsWith('{'))return JSON.parse(x);if((x.startsWith('"')&&x.endsWith('"'))||(x.startsWith("'")&&x.endsWith("'"))){if(x[0]==='"')return JSON.parse(x);return x.slice(1,-1).replace(/''/g,"'")}return x};
        const read=indent=>{const array=lines[pos].text.startsWith('- ');const out=array?[]:{};while(pos<lines.length&&lines[pos].indent===indent){const line=lines[pos];if(array){if(!line.text.startsWith('-'))throw Error('Mixed sequence and mapping at line '+(line.i+1));const value=line.text.slice(2);pos++;if(!value){if(pos>=lines.length||lines[pos].indent<=indent)out.push(null);else out.push(read(lines[pos].indent))}else{const m=value.match(/^([^:]+):(?:\s*(.*))?$/);if(m){const obj={};obj[m[1].trim()]=m[2]?scalar(m[2]):(pos<lines.length&&lines[pos].indent>indent?read(lines[pos].indent):null);while(pos<lines.length&&lines[pos].indent>indent){const childIndent=lines[pos].indent;const child=read(childIndent);if(!child||Array.isArray(child)||typeof child!=='object')throw Error('Expected mapping at line '+(lines[pos-1].i+1));Object.assign(obj,child)}out.push(obj)}else out.push(scalar(value))}}
          else{if(line.text.startsWith('- '))throw Error('Mixed mapping and sequence at line '+(line.i+1));const m=line.text.match(/^([^:]+):(?:\s*(.*))?$/);if(!m)throw Error('Invalid mapping at line '+(line.i+1));const key=String(scalar(m[1].trim()));if(Object.prototype.hasOwnProperty.call(out,key))throw Error('Duplicate key: '+key);pos++;out[key]=m[2]?scalar(m[2]):(pos<lines.length&&lines[pos].indent>indent?read(lines[pos].indent):null)}}if(pos<lines.length&&lines[pos].indent>indent)throw Error('Invalid indentation at line '+(lines[pos].i+1));return out};const value=read(lines[0].indent);if(pos!==lines.length)throw Error('Could not parse line '+(lines[pos].i+1));return value};
      try{out.value=direction==='json-yaml'?dump(JSON.parse(input)):JSON.stringify(parse(input),null,2);status.textContent='Conversion complete (supported YAML subset).'}catch(e){out.value='';status.textContent=e.message}
    };
  } else if (type === 'tsv-csv') {
    window.convertTsvCsv=direction=>{const input=document.getElementById('tableInput').value;const out=document.getElementById('tableOutput');const status=document.getElementById('tableStatus');const delim=direction==='tsv-csv'?'\t':',';try{const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'&&input[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===delim){row.push(cell);cell=''}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('Unclosed quoted cell.');if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}const target=direction==='tsv-csv'?',':'\t';out.value=rows.map(r=>r.map(v=>/["\r\n]/.test(v)||v.includes(target)?'"'+v.replace(/"/g,'""')+'"':v).join(target)).join('\r\n');status.textContent='Converted '+rows.length+' row(s).'}catch(e){out.value='';status.textContent=e.message}};
  } else if (type === 'batch-image') {
    const files=document.getElementById('batchFiles'),button=document.getElementById('batchConvert'),status=document.getElementById('batchStatus'),results=document.getElementById('batchResults');files.addEventListener('change',()=>{button.disabled=!files.files.length;results.textContent='';status.textContent=files.files.length>20?'Select no more than 20 files.':files.files.length+' file(s) selected.';if(files.files.length>20)button.disabled=true});button.addEventListener('click',async()=>{const selected=[...files.files].slice(0,20),mime=document.getElementById('batchFormat').value,q=Number(document.getElementById('batchQuality').value)/100;button.disabled=true;results.textContent='';let done=0;for(const file of selected){try{const image=await createImageBitmap(file);const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');if(mime==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height)}ctx.drawImage(image,0,0);image.close?.();const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,q));if(!blob)throw Error('Unsupported output');const a=document.createElement('a');a.href=URL.createObjectURL(blob);const base=file.name.replace(/\.[^.]+$/,'');a.download=base+(mime==='image/png'?'.png':mime==='image/jpeg'?'.jpg':'.webp');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);const li=document.createElement('li');li.textContent=file.name+' converted ('+Math.round(file.size/1024)+' KB → '+Math.round(blob.size/1024)+' KB)';results.appendChild(li)}catch(e){const li=document.createElement('li');li.textContent=file.name+': conversion failed ('+e.message+')';results.appendChild(li)}done++;status.textContent='Processed '+done+' of '+selected.length}button.disabled=false});
  } else if (type === 'mp4-mp3') {
    const fileInput=document.getElementById('mp4File'),button=document.getElementById('convertMp4'),status=document.getElementById('mp4Status');
    fileInput.addEventListener('change',()=>{const f=fileInput.files?.[0];button.disabled=!f||f.size>100*1024*1024;status.textContent=!f?'':f.size>100*1024*1024?'File exceeds 100 MB.':'Ready to convert '+f.name});
    button.addEventListener('click',()=>{const file=fileInput.files?.[0];if(!file)return;const bitrate=document.getElementById('mp3Bitrate').value;convertWithProgress('mp4',button,status,(onUpload)=>uploadWithProgress('/api/convert/mp4-mp3?bitrate='+encodeURIComponent(bitrate),file,onUpload,'video/mp4'),file.name.replace(/\.mp4$/i,'')+'.mp3','MP3 conversion complete.')});
  } else if (type === 'doc-convert') {
    const input=document.getElementById('docFile'),direction=document.getElementById('docDirection'),button=document.getElementById('convertDocument'),status=document.getElementById('docStatus');
    const update=()=>{const file=input.files?.[0],ext=direction.value==='docx-pdf'?'.docx':'.pdf';button.disabled=!file||!file.name.toLowerCase().endsWith(ext)||file.size>50*1024*1024;status.textContent=!file?'':file.size>50*1024*1024?'File exceeds 50 MB.':!file.name.toLowerCase().endsWith(ext)?'Choose a '+ext.slice(1).toUpperCase()+' file.':'Ready to convert '+file.name};input.addEventListener('change',update);direction.addEventListener('change',update);
    button.addEventListener('click',()=>{const file=input.files?.[0];if(!file)return;const dir=direction.value,form=new FormData();form.append('file',file);form.append('direction',dir);convertWithProgress('doc',button,status,(onUpload)=>uploadWithProgress('/api/convert/document',form,onUpload),file.name.replace(/\.(docx|pdf)$/i,'')+(dir==='docx-pdf'?'.pdf':'.docx'),'Conversion complete.',update)});
  } else if (type === 'mp3-mp4') {
    const audioInput=document.getElementById('mp3File'),coverInput=document.getElementById('coverFile'),button=document.getElementById('convertMp3'),status=document.getElementById('mp3Status');
    audioInput.addEventListener('change',()=>{const f=audioInput.files?.[0];button.disabled=!f||f.size>100*1024*1024;status.textContent=!f?'':f.size>100*1024*1024?'File exceeds 100 MB.':'Ready to convert '+f.name});
    button.addEventListener('click',()=>{const file=audioInput.files?.[0];if(!file)return;const form=new FormData();form.append('audio',file);if(coverInput.files?.[0])form.append('cover',coverInput.files[0]);form.append('size',document.getElementById('videoSize').value);convertWithProgress('mp3',button,status,(onUpload)=>uploadWithProgress('/api/convert/mp3-mp4',form,onUpload),file.name.replace(/\.mp3$/i,'')+'.mp4','MP4 conversion complete.')});
  } else if (type === 'mp4-gif') {
    const fileInput=document.getElementById('gifFile'),button=document.getElementById('convertGif'),status=document.getElementById('gifStatus');
    fileInput.addEventListener('change',()=>{const f=fileInput.files?.[0];button.disabled=!f||f.size>100*1024*1024;status.textContent=!f?'':f.size>100*1024*1024?'File exceeds 100 MB.':'Ready to convert '+f.name});
    button.addEventListener('click',()=>{const file=fileInput.files?.[0];if(!file)return;const q='?start='+encodeURIComponent(Math.max(0,Number(document.getElementById('gifStart').value)||0))+'&duration='+encodeURIComponent(Math.min(10,Math.max(1,Number(document.getElementById('gifDuration').value)||3)))+'&width='+encodeURIComponent(document.getElementById('gifWidth').value)+'&fps='+encodeURIComponent(document.getElementById('gifFps').value);convertWithProgress('gif',button,status,(onUpload)=>uploadWithProgress('/api/convert/mp4-gif'+q,file,onUpload,'video/mp4'),file.name.replace(/\.mp4$/i,'')+'.gif','GIF conversion complete.')});
  } else if (type === 'mp4-thumbnail') {
    const fileInput=document.getElementById('thumbFile'),button=document.getElementById('convertThumb'),status=document.getElementById('thumbStatus');
    fileInput.addEventListener('change',()=>{const f=fileInput.files?.[0];button.disabled=!f||f.size>100*1024*1024;status.textContent=!f?'':f.size>100*1024*1024?'File exceeds 100 MB.':'Ready to capture from '+f.name});
    button.addEventListener('click',()=>{const file=fileInput.files?.[0];if(!file)return;const at=Math.max(0,Number(document.getElementById('thumbAt').value)||0);convertWithProgress('thumb',button,status,(onUpload)=>uploadWithProgress('/api/convert/mp4-thumbnail?at='+encodeURIComponent(at),file,onUpload,'video/mp4'),file.name.replace(/\.mp4$/i,'')+'-thumb.png','Thumbnail extracted.')});
  } else if (type === 'audio-convert') {
    const fileInput=document.getElementById('audioFile'),button=document.getElementById('convertAudio'),status=document.getElementById('audioStatus');
    fileInput.addEventListener('change',()=>{const f=fileInput.files?.[0];button.disabled=!f||f.size>50*1024*1024;status.textContent=!f?'':f.size>50*1024*1024?'File exceeds 50 MB.':'Ready to convert '+f.name});
    button.addEventListener('click',()=>{const file=fileInput.files?.[0];if(!file)return;const format=document.getElementById('audioFormat').value,form=new FormData();form.append('audio',file);form.append('format',format);const base=file.name.replace(/\.[^.]+$/,'');convertWithProgress('audio',button,status,(onUpload)=>uploadWithProgress('/api/convert/audio',form,onUpload),base+'.'+format,'Audio conversion complete.')});
  } else if (type === 'pdf-merge') {
    const fileInput=document.getElementById('mergeFiles'),button=document.getElementById('convertMerge'),status=document.getElementById('mergeStatus');
    fileInput.addEventListener('change',()=>{const n=fileInput.files?.length||0;button.disabled=n<2||n>10;status.textContent=!n?'':n<2?'Select at least 2 PDFs.':n>10?'Select no more than 10 PDFs.':n+' PDF(s) selected.'});
    button.addEventListener('click',()=>{const files=[...(fileInput.files||[])];if(files.length<2)return;const form=new FormData();files.slice(0,10).forEach((f)=>form.append('files',f));convertWithProgress('merge',button,status,(onUpload)=>uploadWithProgress('/api/convert/pdf-merge',form,onUpload),'qword-merged.pdf','PDFs merged.')});
  } else if (type === 'images-pdf') {
    const fileInput=document.getElementById('imgPdfFiles'),button=document.getElementById('convertImgPdf'),status=document.getElementById('imgpdfStatus');
    fileInput.addEventListener('change',()=>{const n=fileInput.files?.length||0;button.disabled=!n||n>20;status.textContent=!n?'':n>20?'Select no more than 20 images.':n+' image(s) selected.'});
    button.addEventListener('click',()=>{const files=[...(fileInput.files||[])];if(!files.length)return;const form=new FormData();files.slice(0,20).forEach((f)=>form.append('images',f));convertWithProgress('imgpdf',button,status,(onUpload)=>uploadWithProgress('/api/convert/images-pdf',form,onUpload),'qword-images.pdf','PDF created.')});
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
  } else if (type === 'meta-tag') {
    window.genMeta = () => {
      const title=document.getElementById('metaTitle').value.trim(),desc=document.getElementById('metaDesc').value.trim(),url=document.getElementById('metaUrl').value.trim(),kw=document.getElementById('metaKeywords').value.trim(),warn=document.getElementById('metaWarn');
      const warns=[];
      if(title.length>60)warns.push('Title is '+title.length+' chars (aim under 60).');
      if(desc.length>160)warns.push('Description is '+desc.length+' chars (aim under 160).');
      warn.textContent=warns.join(' ');
      const esc=(s)=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      let out='';
      if(title)out+='<title>'+esc(title)+'</title>\n<meta name="title" content="'+esc(title)+'">\n';
      if(desc)out+='<meta name="description" content="'+esc(desc)+'">\n';
      if(kw)out+='<meta name="keywords" content="'+esc(kw)+'">\n';
      out+='<meta name="robots" content="index, follow">\n';
      if(url){out+='<link rel="canonical" href="'+esc(url)+'">\n<meta property="og:url" content="'+esc(url)+'">\n';}
      if(title)out+='<meta property="og:title" content="'+esc(title)+'">\n<meta name="twitter:title" content="'+esc(title)+'">\n';
      if(desc)out+='<meta property="og:description" content="'+esc(desc)+'">\n<meta name="twitter:description" content="'+esc(desc)+'">\n';
      out+='<meta property="og:type" content="website">\n<meta name="twitter:card" content="summary_large_image">\n';
      document.getElementById('output').value=out;
    };
  } else if (type === 'keyword-density') {
    window.checkDensity = () => {
      const text=document.getElementById('input').value,out=document.getElementById('densityOut');
      const stop=new Set('a,an,the,and,or,but,if,then,else,for,to,of,in,on,at,by,with,from,as,is,are,was,were,be,been,being,have,has,had,do,does,did,will,would,can,could,should,it,its,this,that,these,those,i,you,he,she,we,they,them,his,her,our,your,their,my,me,him,us,not,no,so,very,just,than,too,also,into,over,after,before,between,through,about,yang,dan,atau,dengan,dari,untuk,pada,adalah,itu,ini,yang,tidak,akan'.split(','));
      const words=text.toLowerCase().replace(/[^a-z0-9'\s-]/g,' ').split(/\s+/).filter((w)=>w.length>2&&!stop.has(w));
      if(!words.length){out.innerHTML='<p>No keywords found. Paste a longer text.</p>';return;}
      const one={},two={},three={};
      words.forEach((w)=>{one[w]=(one[w]||0)+1;});
      for(let i=0;i<words.length-1;i++){const p=words[i]+' '+words[i+1];two[p]=(two[p]||0)+1;}
      for(let i=0;i<words.length-2;i++){const p=words[i]+' '+words[i+1]+' '+words[i+2];three[p]=(three[p]||0)+1;}
      const total=words.length;
      const top=(obj,n)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n);
      const row=(k,c)=>'<tr><td style="padding:6px 10px;border-bottom:1px solid var(--line)">'+k.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</td><td style="padding:6px 10px;border-bottom:1px solid var(--line)">'+c+'</td><td style="padding:6px 10px;border-bottom:1px solid var(--line)">'+(c/total*100).toFixed(2)+'%</td></tr>';
      let html='<p><strong>'+total+'</strong> keywords analyzed.</p>';
      [['Top words',top(one,10)],['Top 2-word phrases',top(two,5)],['Top 3-word phrases',top(three,5)]].forEach(([h,rows])=>{if(!rows.length)return;html+='<h4 style="margin:12px 0 4px">'+h+'</h4><table style="border-collapse:collapse;font-size:13px"><tr><th style="text-align:left;padding:6px 10px">Keyword</th><th style="text-align:left;padding:6px 10px">Count</th><th style="text-align:left;padding:6px 10px">Density</th></tr>'+rows.map(([k,c])=>row(k,c)).join('')+'</table>';});
      out.innerHTML=html;
    };
  } else if (type === 'readability') {
    window.checkReadability = () => {
      const text=document.getElementById('input').value,out=document.getElementById('readOut');
      const words=(text.match(/[A-Za-z0-9'-]+/g)||[]);
      const sentences=(text.match(/[^.!?]+[.!?]+/g)||[]).length||(words.length?1:0);
      const countSyllables=(w)=>{w=w.toLowerCase().replace(/[^a-z]/g,'');if(!w)return 0;if(w.length<=3)return 1;const m=w.replace(/(?:[^laeiouy]|ed|es|e)$/,'').replace(/^y/,'').match(/[aeiouy]{1,2}/g);return m?m.length:1;};
      const syllables=words.reduce((n,w)=>n+countSyllables(w),0);
      if(!words.length){out.innerHTML='<p>Paste some text to analyze.</p>';return;}
      const wps=words.length/sentences,spw=syllables/words.length;
      const ease=206.835-1.015*wps-84.6*spw,grade=0.39*wps+11.8*spw-15.59;
      const label=ease>=90?'Very easy':ease>=80?'Easy':ease>=70?'Fairly easy':ease>=60?'Plain English':ease>=50?'Fairly difficult':ease>=30?'Difficult':'Very difficult';
      out.innerHTML='<table style="border-collapse:collapse;font-size:14px"><tr><td style="padding:6px 12px"><strong>Flesch Reading Ease</strong></td><td style="padding:6px 12px">'+ease.toFixed(1)+' ('+label+')</td></tr><tr><td style="padding:6px 12px"><strong>Grade level</strong></td><td style="padding:6px 12px">'+Math.max(0,grade).toFixed(1)+'</td></tr><tr><td style="padding:6px 12px"><strong>Words</strong></td><td style="padding:6px 12px">'+words.length+'</td></tr><tr><td style="padding:6px 12px"><strong>Sentences</strong></td><td style="padding:6px 12px">'+sentences+'</td></tr><tr><td style="padding:6px 12px"><strong>Syllables</strong></td><td style="padding:6px 12px">'+syllables+'</td></tr><tr><td style="padding:6px 12px"><strong>Words per sentence</strong></td><td style="padding:6px 12px">'+wps.toFixed(1)+'</td></tr></table>';
    };
  } else if (type === 'regex-tester') {
    const escHtml=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const run=()=>{
      const pattern=document.getElementById('regexPattern').value,flags=document.getElementById('regexFlags').value.replace(/[^dgimsuvy]/g,''),text=document.getElementById('input').value,err=document.getElementById('regexError'),out=document.getElementById('regexOut'),groups=document.getElementById('regexGroups'),count=document.getElementById('regexCount');
      let re;
      try{re=new RegExp(pattern,flags.includes('g')?flags:flags+'g');err.textContent='';}
      catch(e){err.textContent='Invalid regex: '+e.message;out.textContent=text;groups.textContent='';count.textContent='0';return;}
      const matches=[...text.matchAll(re)];
      count.textContent=String(matches.length);
      if(!matches.length){out.textContent=text||'(no matches)';groups.textContent='';return;}
      let html='',last=0;
      matches.forEach((m)=>{const i=m.index??0;html+=escHtml(text.slice(last,i))+'<mark style="background:#365314;color:#ecfccb;border-radius:3px;padding:0 2px">'+escHtml(m[0])+'</mark>';last=i+m[0].length;});
      out.innerHTML=html+escHtml(text.slice(last));
      const first=matches[0];
      groups.innerHTML=first.length>1?first.slice(1).map((g,i)=>'Group '+(i+1)+': '+(g===undefined?'<em>no match</em>':escHtml(g))).join('<br>'):'(no capture groups)';
    };
    ['regexPattern','regexFlags','input'].forEach((id)=>document.getElementById(id).addEventListener('input',run));
    run();
  } else if (type === 'text-diff') {
    window.runDiff = () => {
      const norm=(s)=>document.getElementById('diffWs').checked?s.split('\n').map((l)=>l.trim()):s.split('\n');
      const a=norm(document.getElementById('diffA').value),b=norm(document.getElementById('diffB').value);
      const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));
      for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
      let i=0,j=0,added=0,removed=0,html='';
      const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')||' ';
      while(i<n&&j<m){if(a[i]===b[j]){html+='<div style="padding:4px 12px;color:var(--muted)">  '+esc(a[i])+'</div>';i++;j++;}else if(dp[i+1][j]>=dp[i][j+1]){html+='<div style="padding:4px 12px;background:#3f1d1d;color:#fecaca">- '+esc(a[i])+'</div>';removed++;i++;}else{html+='<div style="padding:4px 12px;background:#14532d;color:#bbf7d0">+ '+esc(b[j])+'</div>';added++;j++;}}
      while(i<n){html+='<div style="padding:4px 12px;background:#3f1d1d;color:#fecaca">- '+esc(a[i])+'</div>';removed++;i++;}
      while(j<m){html+='<div style="padding:4px 12px;background:#14532d;color:#bbf7d0">+ '+esc(b[j])+'</div>';added++;j++;}
      document.getElementById('diffOut').innerHTML=html;
      document.getElementById('diffSummary').textContent=added+' line(s) added, '+removed+' line(s) removed.';
    };
  } else if (type === 'markdown-preview') {
    const escHtml=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const inline=(s)=>escHtml(s).replace(/`([^`]+)`/g,'<code style="background:var(--hover);padding:1px 5px;border-radius:4px">$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|\W)\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
    window.renderMd = () => {
      const lines=document.getElementById('mdIn').value.split('\n'),out=document.getElementById('mdOut');
      let html='',inList='',inCode=false,inTable=false;
      const closeList=()=>{if(inList){html+='</'+inList+'>';inList='';}};
      const closeTable=()=>{if(inTable){html+='</tbody></table>';inTable=false;}};
      for(const line of lines){
        if(line.trim().startsWith('```')){closeList();closeTable();html+=inCode?'</code></pre>':'<pre style="background:var(--hover);padding:10px;border-radius:8px;overflow:auto"><code>';inCode=!inCode;continue;}
        if(inCode){html+=escHtml(line)+'\n';continue;}
        if(/^\|.*\|$/.test(line.trim())&&line.includes('---')){continue;}
        const tableRow=line.trim().match(/^\|(.*)\|$/);
        if(tableRow&&lines.some((l)=>/^\|[\s|:-]+\|$/.test(l.trim()))){closeList();if(!inTable){html+='<table style="border-collapse:collapse;margin:8px 0"><tbody>';inTable=true;}html+='<tr>'+tableRow[1].split('|').map((c)=>'<td style="border:1px solid var(--line);padding:6px 10px">'+inline(c.trim())+'</td>').join('')+'</tr>';continue;}
        closeTable();
        const h=line.match(/^(#{1,6})\s+(.*)/);
        if(h){closeList();const lvl=h[1].length;html+='<h'+lvl+' style="margin:10px 0 6px">'+inline(h[2])+'</h'+lvl+'>';continue;}
        if(/^\s*---+\s*$/.test(line)){closeList();html+='<hr style="border-color:var(--line);margin:10px 0">';continue;}
        const ul=line.match(/^\s*[-*]\s+(.*)/),ol=line.match(/^\s*\d+[.)]\s+(.*)/);
        if(ul||ol){const tag=ul?'ul':'ol';if(inList!==tag){closeList();html+='<'+tag+' style="margin:6px 0;padding-left:22px">';inList=tag;}html+='<li>'+inline((ul||ol)[1])+'</li>';continue;}
        closeList();
        const quote=line.match(/^\s*>\s?(.*)/);
        if(quote){html+='<blockquote style="border-left:3px solid var(--brand);margin:8px 0;padding:4px 12px;color:var(--muted)">'+inline(quote[1])+'</blockquote>';continue;}
        if(!line.trim()){html+='';continue;}
        html+='<p style="margin:6px 0">'+inline(line)+'</p>';
      }
      closeList();closeTable();
      out.innerHTML=html||'<p style="color:var(--muted)">Preview appears here.</p>';
    };
    window.copyMd = async () => {try{await navigator.clipboard.writeText(document.getElementById('mdOut').innerHTML);alert('HTML copied.')}catch(e){alert('Copy failed.')}};
    window.downloadMd = () => {const blob=new Blob(['<!DOCTYPE html><html><head><meta charset="utf-8"><title>Export</title></head><body>'+document.getElementById('mdOut').innerHTML+'</body></html>'],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='markdown-export.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);};
    document.getElementById('mdIn').addEventListener('input',()=>window.renderMd());
    window.renderMd();
  } else if (type === 'xml-formatter') {
    const input=document.getElementById('input'),output=document.getElementById('output'),err=document.getElementById('errorMsg');
    window.formatXml = () => {
      err.textContent='';
      try{
        const doc=new DOMParser().parseFromString(input.value,'text/xml');
        if(doc.getElementsByTagName('parsererror').length)throw Error(doc.getElementsByTagName('parsererror')[0].textContent);
        const xs=new XMLSerializer().serializeToString(doc);
        const pretty=xs.replace(/>\s*</g,'>\n<').split('\n');
        let depth=0;
        output.value=pretty.map((line)=>{const t=line.trim();if(/^<\//.test(t))depth=Math.max(0,depth-1);const ind='  '.repeat(depth);if(/^<[^!?/][^>]*[^/]>$/.test(t))depth++;return ind+t;}).join('\n');
      }catch(e){err.textContent='Invalid XML: '+e.message;}
    };
    window.minifyXml = () => {err.textContent='';try{const doc=new DOMParser().parseFromString(input.value,'text/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('parse error');output.value=new XMLSerializer().serializeToString(doc).replace(/>\s+</g,'><').trim();}catch(e){err.textContent='Invalid XML: '+e.message;}};
  }
}
