export function renderToolInteractive(tool: { type: string }) {
  const type = tool.type;
  if (type === 'text-case') {
    return `
      <div class="field"><label>Input Text</label><textarea id="input" rows="4" placeholder="Type or paste text to convert..."></textarea></div>
      <div class="actions">
        <button onclick="setCase('upper')">UPPERCASE</button>
        <button onclick="setCase('lower')">lowercase</button>
        <button onclick="setCase('title')">Title Case</button>
        <button onclick="setCase('camel')">camelCase</button>
        <button onclick="setCase('pascal')">PascalCase</button>
        <button onclick="setCase('snake')">snake_case</button>
        <button onclick="setCase('kebab')">kebab-case</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:16px"><label>Output</label><textarea id="output" rows="4" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Output</button>
    `;
  } else if (type === 'word-counter') {
    return `
      <div class="field"><label>Text Content</label><textarea id="input" rows="8" placeholder="Type or paste text to count words, characters, and sentences in real time..."></textarea></div>
      <div class="stats-grid">
        <div class="stat-box"><span id="statWords">0</span><small>Words</small></div>
        <div class="stat-box"><span id="statChars">0</span><small>Characters</small></div>
        <div class="stat-box"><span id="statCharsNoSpace">0</span><small>No Spaces</small></div>
        <div class="stat-box"><span id="statSentences">0</span><small>Sentences</small></div>
        <div class="stat-box"><span id="statParagraphs">0</span><small>Paragraphs</small></div>
        <div class="stat-box"><span id="statReadTime">0 min</span><small>Read Time</small></div>
      </div>
      <style>
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px; margin-top: 16px; }
        .stat-box { background: #1f2937; padding: 14px; border-radius: 8px; text-align: center; }
        .stat-box span { display: block; font-size: 22px; font-weight: 700; color: var(--brand); }
        .stat-box small { color: var(--muted); font-size: 12px; }
      </style>
    `;
  } else if (type === 'lorem') {
    return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <label>Paragraphs:</label><input type="number" id="count" value="3" min="1" max="20" style="width:70px">
        <button onclick="genLorem()">Generate Placeholder</button>
      </div>
      <div class="field"><textarea id="output" rows="8" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Text</button>
    `;
  } else if (type === 'slugify') {
    return `
      <div class="field"><label>Input Title</label><input type="text" id="input" value="10 Best Free Developer Tools for 2026!" style="width:100%"></div>
      <div class="field" style="margin-top:14px"><label>Generated Slug</label><input type="text" id="output" readonly style="width:100%;font-family:monospace"></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Slug</button>
    `;
  } else if (type === 'dedupe-lines') {
    return `
      <div class="field"><label>Input List (one item per line)</label><textarea id="input" rows="6" placeholder="apple&#10;banana&#10;apple&#10;orange"></textarea></div>
      <div class="actions">
        <button onclick="cleanLines(false)">Remove Duplicates</button>
        <button onclick="cleanLines(true)">Remove Duplicates & Sort (A-Z)</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Deduplicated List</label><textarea id="output" rows="6" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'line-sort') {
    return `
      <div class="field"><label>Text Lines</label><textarea id="input" rows="6" placeholder="zebra&#10;apple&#10;mango"></textarea></div>
      <div class="actions">
        <button onclick="sortLines('az')">Sort A &rarr; Z</button>
        <button onclick="sortLines('za')">Sort Z &rarr; A</button>
        <button onclick="sortLines('num')">Add Line Numbers</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Sorted Output</label><textarea id="output" rows="6" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Output</button>
    `;
  } else if (type === 'find-replace') {
    return `
      <div class="field"><label>Input Text</label><textarea id="input" rows="5" placeholder="Enter text here..."></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
        <div><label>Find</label><input type="text" id="findText" placeholder="Search term..." style="width:100%"></div>
        <div><label>Replace With</label><input type="text" id="replaceText" placeholder="Replacement..." style="width:100%"></div>
      </div>
      <div style="margin-bottom:12px"><label><input type="checkbox" id="chkRegex"> Use Regular Expression (RegExp)</label></div>
      <button onclick="runReplace()">Replace All</button>
      <div class="field" style="margin-top:14px"><label>Result</label><textarea id="output" rows="5" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'text-reverse') {
    return `
      <div class="field"><label>Input Text</label><textarea id="input" rows="4" placeholder="Hello World"></textarea></div>
      <div class="actions">
        <button onclick="reverseChars()">Reverse Characters</button>
        <button onclick="reverseWords()">Reverse Words</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Reversed Text</label><textarea id="output" rows="4" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Output</button>
    `;
  } else if (type === 'morse-code') {
    return `
      <div class="field"><label>Text / Morse Code</label><textarea id="input" rows="4" placeholder="SOS or ... --- ..."></textarea></div>
      <div class="actions">
        <button onclick="toMorse()">Text &rarr; Morse</button>
        <button onclick="fromMorse()">Morse &rarr; Text</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Result</label><textarea id="output" rows="4" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'json-formatter') {
    return `
      <div class="field"><label>Input JSON</label><textarea id="input" rows="6" placeholder='{"hello": "world"}'></textarea></div>
      <div class="actions">
        <button onclick="formatJson(2)">Format (2 Spaces)</button>
        <button onclick="formatJson(4)">Format (4 Spaces)</button>
        <button onclick="formatJson(0)">Minify JSON</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <p id="errorMsg" style="color:#ef4444;font-size:13px;margin:8px 0;"></p>
      <div class="field" style="margin-top:8px"><label>Result</label><textarea id="output" rows="8" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'json-yaml') {
    return `
      <div class="field"><label>JSON Input</label><textarea id="input" rows="6" placeholder='{"name": "app", "version": 1}'></textarea></div>
      <div class="actions">
        <button onclick="jsonToYaml()">Convert JSON &rarr; YAML</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:14px"><label>YAML Output</label><textarea id="output" rows="8" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy YAML</button>
    `;
  } else if (type === 'base64') {
    return `
      <div class="field"><label>Input String</label><textarea id="input" rows="4" placeholder="Enter text to encode or decode..."></textarea></div>
      <div class="actions">
        <button onclick="b64Encode()">Encode to Base64</button>
        <button onclick="b64Decode()">Decode from Base64</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:16px"><label>Result</label><textarea id="output" rows="4" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'url-encode') {
    return `
      <div class="field"><label>URL / Parameter Input</label><textarea id="input" rows="4" placeholder="https://example.com/search?q=hello world"></textarea></div>
      <div class="actions">
        <button onclick="urlEncode()">URL Encode</button>
        <button onclick="urlDecode()">URL Decode</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:16px"><label>Result</label><textarea id="output" rows="4" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'html-entities') {
    return `
      <div class="field"><label>HTML Markup</label><textarea id="input" rows="4" placeholder="<div class='container'>Hello & Welcome</div>"></textarea></div>
      <div class="actions">
        <button onclick="escapeHtml()">Escape HTML</button>
        <button onclick="unescapeHtml()">Decode HTML</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Result</label><textarea id="output" rows="4" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'css-tool') {
    return `
      <div class="field"><label>CSS Code</label><textarea id="input" rows="6" placeholder="body { background: #000; color: #fff; }"></textarea></div>
      <div class="actions">
        <button onclick="minifyCss()">Minify CSS</button>
        <button onclick="formatCss()">Beautify CSS</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Output</label><textarea id="output" rows="6" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Output</button>
    `;
  } else if (type === 'sql-formatter') {
    return `
      <div class="field"><label>SQL Query</label><textarea id="input" rows="6" placeholder="select id, name from users where active = 1 order by id desc"></textarea></div>
      <div class="actions">
        <button onclick="formatSql()">Format SQL</button>
        <button class="btn-secondary" onclick="clearField('input')">Clear</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Formatted SQL</label><textarea id="output" rows="8" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy SQL</button>
    `;
  } else if (type === 'docker-run-compose') {
    return `
      <div class="field"><label>docker run Command</label><textarea id="input" rows="4" placeholder="docker run -d --name redis -p 6379:6379 -v /data:/data --restart always redis:alpine"></textarea></div>
      <div class="actions">
        <button onclick="convertToCompose()">Convert to docker-compose.yml</button>
      </div>
      <div class="field" style="margin-top:14px"><label>docker-compose.yml</label><textarea id="output" rows="8" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Compose YAML</button>
    `;
  } else if (type === 'user-agent') {
    return `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div><label>User-Agent String</label><div id="uaRaw" style="background:#1f2937;padding:12px;border-radius:6px;word-break:break-all;font-family:monospace"></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div><label>Operating Platform</label><div id="uaPlatform" style="background:#1f2937;padding:10px;border-radius:6px"></div></div>
          <div><label>Screen Dimensions</label><div id="uaScreen" style="background:#1f2937;padding:10px;border-radius:6px"></div></div>
          <div><label>Navigator Language</label><div id="uaLang" style="background:#1f2937;padding:10px;border-radius:6px"></div></div>
        </div>
      </div>
    `;
  } else if (type === 'http-status') {
    const codes = [
      {c: 200, n: 'OK', d: 'Standard response for successful HTTP requests.'},
      {c: 201, n: 'Created', d: 'The request has been fulfilled, resulting in the creation of a new resource.'},
      {c: 204, n: 'No Content', d: 'The server successfully processed the request and is not returning any content.'},
      {c: 301, n: 'Moved Permanently', d: 'This and all future requests should be directed to the given URI.'},
      {c: 302, n: 'Found', d: 'Tells the client to look at another (temporary) URL.'},
      {c: 304, n: 'Not Modified', d: 'Resource has not been modified since the version specified in If-Modified-Since.'},
      {c: 400, n: 'Bad Request', d: 'The server cannot or will not process the request due to a client error.'},
      {c: 401, n: 'Unauthorized', d: 'Authentication is required and has failed or has not yet been provided.'},
      {c: 403, n: 'Forbidden', d: 'The request contained valid data, but the server refuses action.'},
      {c: 404, n: 'Not Found', d: 'The requested resource could not be found but may be available in the future.'},
      {c: 429, n: 'Too Many Requests', d: 'The user has sent too many requests in a given amount of time (rate limited).'},
      {c: 500, n: 'Internal Server Error', d: 'A generic error message, given when an unexpected condition was encountered.'},
      {c: 502, n: 'Bad Gateway', d: 'The server received an invalid response from the upstream server.'},
      {c: 503, n: 'Service Unavailable', d: 'The server cannot handle the request (due to overload or maintenance).'},
      {c: 504, n: 'Gateway Timeout', d: 'The server did not receive a timely response from the upstream server.'}
    ];
    return `
      <div style="margin-bottom:14px"><input type="text" id="statusFilter" placeholder="Filter code (e.g. 404, 500, Unauthorized)..." oninput="filterStatus()" style="width:100%"></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:12px">
        ${codes.map(x => `<div class="status-card" style="background:#1f2937;padding:14px;border-radius:8px"><b style="color:var(--brand);font-size:18px">${x.c}</b> ${x.n}<p style="color:var(--muted);font-size:12px;margin-top:4px">${x.d}</p></div>`).join('')}
      </div>
    `;
  } else if (type === 'uuid') {
    return `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <label>Quantity:</label><input type="number" id="count" value="5" min="1" max="50" style="width:70px">
        <button onclick="genUuid()">Generate UUIDs</button>
      </div>
      <div class="field"><label>Generated UUID v4</label><textarea id="output" rows="6" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy All</button>
    `;
  } else if (type === 'password-gen') {
    return `
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-bottom:14px">
        <label>Length: <input type="number" id="pwLen" value="16" min="6" max="128" style="width:70px"></label>
        <label><input type="checkbox" id="chkUpper" checked> Uppercase</label>
        <label><input type="checkbox" id="chkLower" checked> Lowercase</label>
        <label><input type="checkbox" id="chkNum" checked> Numbers</label>
        <label><input type="checkbox" id="chkSym" checked> Symbols</label>
        <button onclick="genPassword()">Regenerate</button>
      </div>
      <div class="field"><textarea id="output" rows="2" style="font-size:18px;font-family:monospace;" readonly></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Password</button>
    `;
  } else if (type === 'hash-gen') {
    return `
      <div class="field"><label>Text String</label><input type="text" id="input" value="hello world" style="width:100%"></div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
        <div><label>SHA-1</label><input type="text" id="hash_sha1" readonly style="width:100%;font-family:monospace"></div>
        <div><label>SHA-256</label><input type="text" id="hash_sha256" readonly style="width:100%;font-family:monospace"></div>
        <div><label>SHA-384</label><input type="text" id="hash_sha384" readonly style="width:100%;font-family:monospace"></div>
        <div><label>SHA-512</label><input type="text" id="hash_sha512" readonly style="width:100%;font-family:monospace"></div>
      </div>
    `;
  } else if (type === 'jwt-decoder') {
    return `
      <div class="field"><label>Encoded JWT Token</label><textarea id="input" rows="4" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea></div>
      <div class="actions"><button onclick="decodeJwt()">Decode Claims</button></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
        <div><label>Header</label><textarea id="headerOut" rows="8" readonly style="font-family:monospace;width:100%"></textarea></div>
        <div><label>Payload (Claims)</label><textarea id="payloadOut" rows="8" readonly style="font-family:monospace;width:100%"></textarea></div>
      </div>
    `;
  } else if (type === 'color-converter') {
    return `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <input type="color" id="picker" value="#3b82f6" style="width:60px;height:45px;cursor:pointer;padding:2px">
        <input type="text" id="hexIn" value="#3b82f6" style="width:140px">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label>RGB Format</label><input type="text" id="rgbOut" readonly style="width:100%"></div>
        <div><label>HSL Format</label><input type="text" id="hslOut" readonly style="width:100%"></div>
      </div>
    `;
  } else if (type === 'timestamp') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <label>Epoch Timestamp &rarr; Human Date</label>
          <input type="text" id="epochIn" style="width:100%;margin:8px 0">
          <button onclick="convertEpoch()">Convert</button>
          <input type="text" id="dateOut" readonly style="width:100%;margin-top:8px">
        </div>
        <div>
          <label>Date &rarr; Epoch Timestamp</label>
          <input type="datetime-local" id="dateIn" style="width:100%;margin:8px 0">
          <button onclick="convertDate()">Convert</button>
          <input type="text" id="epochOut" readonly style="width:100%;margin-top:8px">
        </div>
      </div>
    `;
  } else if (type === 'binary-text') {
    return `
      <div class="field"><label>Input Value</label><textarea id="input" rows="4" placeholder="Type text or binary string..."></textarea></div>
      <div class="actions">
        <button onclick="textToBin()">Text &rarr; Binary</button>
        <button onclick="binToText()">Binary &rarr; Text</button>
      </div>
      <div class="field" style="margin-top:14px"><label>Output</label><textarea id="output" rows="4" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Output</button>
    `;
  } else if (type === 'base-converter') {
    return `
      <div class="field"><label>Decimal (Base 10)</label><input type="text" id="decIn" style="width:100%"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:14px">
        <div><label>Hexadecimal (Base 16)</label><input type="text" id="hexOut" readonly style="width:100%;font-family:monospace"></div>
        <div><label>Binary (Base 2)</label><input type="text" id="binOut" readonly style="width:100%;font-family:monospace"></div>
        <div><label>Octal (Base 8)</label><input type="text" id="octOut" readonly style="width:100%;font-family:monospace"></div>
      </div>
    `;
  } else if (type === 'px-rem') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div><label>Pixels (px)</label><input type="number" id="pxIn" value="24" style="width:100%"></div>
        <div><label>Root Base (px)</label><input type="number" id="baseIn" value="16" style="width:100%"></div>
        <div><label>REM Output</label><input type="text" id="remOut" readonly style="width:100%;font-weight:700;color:var(--brand)"></div>
      </div>
    `;
  } else if (type === 'byte-converter') {
    return `
      <div class="field"><label>Raw Bytes</label><input type="number" id="bytesIn" value="1048576" style="width:100%"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
        <div><label>Kilobytes (KB)</label><input type="text" id="resKb" readonly style="width:100%"></div>
        <div><label>Megabytes (MB)</label><input type="text" id="resMb" readonly style="width:100%"></div>
        <div><label>Gigabytes (GB)</label><input type="text" id="resGb" readonly style="width:100%"></div>
        <div><label>Terabytes (TB)</label><input type="text" id="resTb" readonly style="width:100%"></div>
      </div>
    `;
  } else if (type === 'qr-code') {
    return `
      <div class="field"><label>Text or URL</label><input type="text" id="input" value="https://qword.tech" style="width:100%"></div>
      <div style="text-align:center;margin:20px 0;">
        <img id="qrImg" alt="QR Code" style="background:#fff;padding:12px;border-radius:8px;max-width:240px">
      </div>
    `;
  } else if (type === 'svg-placeholder') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:12px;margin-bottom:14px">
        <div><label>Width</label><input type="number" id="wIn" value="600" style="width:100%"></div>
        <div><label>Height</label><input type="number" id="hIn" value="400" style="width:100%"></div>
        <div><label>Label</label><input type="text" id="tIn" value="600 x 400" style="width:100%"></div>
      </div>
      <button onclick="genSvg()">Generate Placeholder</button>
      <div id="svgPreview" style="margin:16px 0;text-align:center"></div>
      <div class="field"><label>SVG Code</label><textarea id="output" rows="4" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy SVG</button>
    `;
  } else if (type === 'uuid-versions') {
    return `<div class="field"><label for="version">UUID version</label><select id="version"><option value="7">Version 7 (sortable)</option><option value="1">Version 1 (time-based)</option></select></div><div class="field" style="margin-top:14px"><label for="count">Quantity (1–100)</label><input id="count" type="number" value="5" min="1" max="100"></div><button onclick="generateVersionedUuids()">Generate UUIDs</button><div class="field" style="margin-top:14px"><label for="output">Generated UUIDs</label><textarea id="output" rows="8" readonly></textarea></div><button id="copyBtn" class="btn-secondary" onclick="copyOutput('output')">Copy UUIDs</button>`;
  } else if (type === 'cron-helper') {
    return `<p>Choose values for the standard five-field cron format. Use * for every value.</p><div class="field"><label for="cronMinute">Minute (0–59)</label><input id="cronMinute" value="0" maxlength="20"></div><div class="field"><label for="cronHour">Hour (0–23)</label><input id="cronHour" value="9" maxlength="20"></div><div class="field"><label for="cronDay">Day of month (1–31)</label><input id="cronDay" value="*" maxlength="20"></div><div class="field"><label for="cronMonth">Month (1–12)</label><input id="cronMonth" value="*" maxlength="20"></div><div class="field"><label for="cronWeekday">Day of week (0–7)</label><input id="cronWeekday" value="1-5" maxlength="20"></div><div class="field" style="margin-top:14px"><label for="cronOutput">Cron expression</label><input id="cronOutput" readonly style="width:100%"></div><p id="cronSummary" aria-live="polite"></p><button id="copyBtn" class="btn-secondary" onclick="copyOutput('cronOutput')">Copy expression</button>`;
  } else if (type === 'regex-tester') {
    return `<div class="field"><label for="regexPattern">Regular expression</label><input id="regexPattern" placeholder="\\b\\w+\\b" style="width:100%"></div><div class="field"><label for="regexFlags">Flags</label><input id="regexFlags" value="g" maxlength="6" style="width:100%"></div><div class="field"><label for="regexText">Test text</label><textarea id="regexText" rows="7" placeholder="Paste sample text..."></textarea></div><p id="regexStatus" aria-live="polite"></p><div class="field"><label for="regexOutput">Matches and capture groups</label><textarea id="regexOutput" rows="7" readonly></textarea></div>`;
  } else if (type === 'markdown-preview') {
    return `<div class="field"><label for="markdownInput">Markdown</label><textarea id="markdownInput" rows="12" placeholder="# Heading\n\nWrite **Markdown** here..."></textarea></div><h2>Preview</h2><article id="markdownPreview" class="markdown-preview"></article><style>.markdown-preview{background:#fff;color:#20242b;padding:20px;border-radius:8px;overflow-wrap:anywhere}.markdown-preview pre{background:#111827;color:#f9fafb;padding:12px;overflow:auto}.markdown-preview code{font-family:monospace}.markdown-preview blockquote{border-left:3px solid #9ca3af;padding-left:12px;color:#4b5563}.markdown-preview img{max-width:100%}.markdown-preview table{border-collapse:collapse}.markdown-preview td,.markdown-preview th{border:1px solid #9ca3af;padding:5px}</style>`;
  } else if (type === 'html-to-text') {
    return `<div class="field"><label for="htmlInput">HTML snippet</label><textarea id="htmlInput" rows="9" placeholder="Paste HTML code here..."></textarea></div><label><input type="checkbox" id="preserveBreaks" checked> Preserve block line breaks</label><div style="margin:12px 0"><button onclick="convertHtmlToText()">Convert to text</button></div><div class="field"><label for="htmlOutput">Plain text</label><textarea id="htmlOutput" rows="9" readonly></textarea></div><button id="copyBtn" class="btn-secondary" onclick="copyOutput('htmlOutput')">Copy text</button>`;
  } else if (type === 'image-converter') {
    return `<div class="field"><label for="imageFile">Choose image</label><input type="file" id="imageFile" accept="image/*"></div><div class="field"><label for="imageFormat">Output format</label><select id="imageFormat"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></div><div class="field"><label for="imageQuality">Quality (JPEG/WebP)</label><input type="range" id="imageQuality" min="10" max="100" value="85"></div><p id="imageStatus" aria-live="polite"></p><button id="imageDownload" disabled>Convert &amp; Download</button>`;
  } else if (type === 'image-resizer') {
    return `<div class="field"><label for="resizeFile">Choose image</label><input type="file" id="resizeFile" accept="image/*"></div><div style="display:flex;gap:12px;flex-wrap:wrap"><div><label for="resizeWidth">Width</label><input type="number" id="resizeWidth" min="1" max="12000" value="800"></div><div><label for="resizeHeight">Height</label><input type="number" id="resizeHeight" min="1" max="12000" value="600"></div></div><label><input type="checkbox" id="resizeLock" checked> Keep aspect ratio</label><div class="field"><label for="resizeFormat">Output</label><select id="resizeFormat"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div><button id="resizeDownload" disabled>Resize &amp; Download</button><p id="resizeStatus" aria-live="polite"></p>`;
  } else if (type === 'json-csv') {
    return `<div class="field"><label for="dataInput">JSON or CSV input</label><textarea id="dataInput" rows="9" placeholder='[{"name":"Ada","age":36}]'></textarea></div><div class="actions"><button onclick="convertDataFormat('json-csv')">JSON to CSV</button><button class="btn-secondary" onclick="convertDataFormat('csv-json')">CSV to JSON</button></div><div class="field" style="margin-top:14px"><label for="dataOutput">Output</label><textarea id="dataOutput" rows="9" readonly></textarea></div><button id="copyBtn" class="btn-secondary" onclick="copyOutput('dataOutput')">Copy output</button><p id="dataStatus" aria-live="polite"></p>`;
  } else if (type === 'xml-json') {
    return `<div class="field"><label for="xmlInput">XML or JSON input</label><textarea id="xmlInput" rows="9" placeholder="&lt;root&gt;&lt;item&gt;value&lt;/item&gt;&lt;/root&gt;"></textarea></div><div class="actions"><button onclick="convertXmlJson('xml-json')">XML to JSON</button><button class="btn-secondary" onclick="convertXmlJson('json-xml')">JSON to XML</button></div><div class="field" style="margin-top:14px"><label for="xmlOutput">Output</label><textarea id="xmlOutput" rows="9" readonly></textarea></div><button id="copyBtn" class="btn-secondary" onclick="copyOutput('xmlOutput')">Copy output</button><p id="xmlStatus" aria-live="polite"></p>`;
  } else if (type === 'text-hex') {
    return `<div class="field"><label for="hexInput">Text or hexadecimal bytes</label><textarea id="hexInput" rows="8" placeholder="Type UTF-8 text here..."></textarea></div><div class="actions"><button onclick="convertTextHex('encode')">Text to Hex</button><button class="btn-secondary" onclick="convertTextHex('decode')">Hex to Text</button></div><div class="field" style="margin-top:14px"><label for="hexOutput">Output</label><textarea id="hexOutput" rows="8" readonly></textarea></div><button id="copyBtn" class="btn-secondary" onclick="copyOutput('hexOutput')">Copy output</button><p id="hexStatus" aria-live="polite"></p>`;
  } else if (type === 'json-yaml') {
    return `<div class="field"><label for="yamlInput">JSON or YAML input</label><textarea id="yamlInput" rows="10" placeholder='{"name":"example","items":[1,2]}'></textarea></div><div class="actions"><button onclick="convertJsonYaml('json-yaml')">JSON to YAML</button><button class="btn-secondary" onclick="convertJsonYaml('yaml-json')">YAML to JSON</button></div><div class="field" style="margin-top:14px"><label for="yamlOutput">Output</label><textarea id="yamlOutput" rows="10" readonly></textarea></div><button id="copyBtn" class="btn-secondary" onclick="copyOutput('yamlOutput')">Copy output</button><p id="yamlStatus" aria-live="polite"></p><p>Supported YAML subset: nested objects and arrays, strings, numbers, booleans, null. Anchors, tags, and advanced block scalars are not supported.</p>`;
  } else if (type === 'tsv-csv') {
    return `<div class="field"><label for="tableInput">CSV or TSV input</label><textarea id="tableInput" rows="10" placeholder="name,city\nAda,London"></textarea></div><div class="actions"><button onclick="convertTsvCsv('tsv-csv')">TSV to CSV</button><button class="btn-secondary" onclick="convertTsvCsv('csv-tsv')">CSV to TSV</button></div><div class="field" style="margin-top:14px"><label for="tableOutput">Output</label><textarea id="tableOutput" rows="10" readonly></textarea></div><button id="copyBtn" class="btn-secondary" onclick="copyOutput('tableOutput')">Copy output</button><p id="tableStatus" aria-live="polite"></p>`;
  } else if (type === 'batch-image') {
    return `<div class="field"><label for="batchFiles">Choose images (up to 20)</label><input type="file" id="batchFiles" accept="image/*" multiple></div><div class="field"><label for="batchFormat">Output format</label><select id="batchFormat"><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></div><div class="field"><label for="batchQuality">Quality</label><input type="range" id="batchQuality" min="10" max="100" value="80"></div><button id="batchConvert" disabled>Convert and download</button><p id="batchStatus" aria-live="polite"></p><ul id="batchResults"></ul>`;
  } else if (type === 'mp4-mp3') {
    return `<div class="field"><label for="mp4File">Choose MP4 video (max 100 MB)</label><input id="mp4File" type="file" accept="video/mp4,.mp4"></div><div class="field"><label for="mp3Bitrate">MP3 bitrate</label><select id="mp3Bitrate"><option value="128k">128 kbps</option><option value="192k" selected>192 kbps</option><option value="256k">256 kbps</option><option value="320k">320 kbps</option></select></div><button id="convertMp4" disabled>Convert to MP3</button><div class="convert-progress" id="mp4Progress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="mp4ProgressFill"></div></div><p class="convert-progress-text" id="mp4ProgressText">Ready.</p></div><p id="mp4Status" aria-live="polite"></p><p>Files are uploaded to the server for conversion. Temporary files are deleted after processing. Avoid confidential videos.</p>`;
  } else if (type === 'doc-convert') {
    return `<div class="field"><label for="docFile">Choose a DOCX or PDF file (max 50 MB)</label><input id="docFile" type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></div><div class="field"><label for="docDirection">Convert</label><select id="docDirection"><option value="docx-pdf">DOCX to PDF</option><option value="pdf-docx">PDF to DOCX</option></select></div><button id="convertDocument" disabled>Convert document</button><div class="convert-progress" id="docProgress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="docProgressFill"></div></div><p class="convert-progress-text" id="docProgressText">Ready.</p></div><p id="docStatus" aria-live="polite"></p><p>Files are processed on this server and deleted after conversion. PDF-to-DOCX may not preserve complex layouts exactly.</p>`;
  } else if (type === 'mp3-mp4') {
    return `<div class="field"><label for="mp3File">Choose an MP3 audio file (max 100 MB)</label><input id="mp3File" type="file" accept="audio/mpeg,.mp3"></div><div class="field"><label for="coverFile">Cover image (optional)</label><input id="coverFile" type="file" accept="image/jpeg,image/png,image/webp"><p>Without an image, the video uses a plain background.</p></div><div class="field"><label for="videoSize">Video size</label><select id="videoSize"><option value="1280x720">720p</option><option value="1920x1080">1080p</option></select></div><button id="convertMp3" disabled>Convert to MP4</button><div class="convert-progress" id="mp3Progress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="mp3ProgressFill"></div></div><p class="convert-progress-text" id="mp3ProgressText">Ready.</p></div><p id="mp3Status" aria-live="polite"></p><p>Audio and optional cover image are uploaded to the server. Temporary files are deleted after processing.</p>`;
  } else if (type === 'aspect-ratio') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div><label>Ratio Width</label><input type="number" id="rW" value="16" style="width:100%"></div>
        <div><label>Ratio Height</label><input type="number" id="rH" value="9" style="width:100%"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div><label>Width (px)</label><input type="number" id="wIn" value="1920" oninput="calcRatio('w')" style="width:100%"></div>
        <div><label>Height (px)</label><input type="number" id="hIn" value="1080" oninput="calcRatio('h')" style="width:100%"></div>
      </div>
    `;
  } else if (type === 'mp4-gif') {
    return `<div class="field"><label for="gifFile">Choose MP4 video (max 100 MB)</label><input id="gifFile" type="file" accept="video/mp4,.mp4"></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px"><div class="field"><label for="gifStart">Start (sec)</label><input id="gifStart" type="number" min="0" max="3600" value="0"></div><div class="field"><label for="gifDuration">Length (sec)</label><input id="gifDuration" type="number" min="1" max="10" value="3"></div><div class="field"><label for="gifWidth">Width (px)</label><select id="gifWidth"><option value="240">240</option><option value="320" selected>320</option><option value="480">480</option></select></div><div class="field"><label for="gifFps">Frame rate</label><select id="gifFps"><option value="5">5 fps</option><option value="10" selected>10 fps</option><option value="15">15 fps</option></select></div></div><button id="convertGif" disabled>Convert to GIF</button><div class="convert-progress" id="gifProgress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="gifProgressFill"></div></div><p class="convert-progress-text" id="gifProgressText">Ready.</p></div><p id="gifStatus" aria-live="polite"></p><p>Files are uploaded to the server for conversion. GIF clips are limited to 10 seconds.</p>`;
  } else if (type === 'mp4-thumbnail') {
    return `<div class="field"><label for="thumbFile">Choose MP4 video (max 100 MB)</label><input id="thumbFile" type="file" accept="video/mp4,.mp4"></div><div class="field"><label for="thumbAt">Capture at (sec)</label><input id="thumbAt" type="number" min="0" max="3600" step="0.5" value="1"></div><button id="convertThumb" disabled>Extract thumbnail</button><div class="convert-progress" id="thumbProgress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="thumbProgressFill"></div></div><p class="convert-progress-text" id="thumbProgressText">Ready.</p></div><p id="thumbStatus" aria-live="polite"></p><p>Files are uploaded to the server. A PNG frame is captured at the chosen timestamp.</p>`;
  } else if (type === 'audio-convert') {
    return `<div class="field"><label for="audioFile">Choose audio (MP3, WAV, or OGG, max 50 MB)</label><input id="audioFile" type="file" accept="audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"></div><div class="field"><label for="audioFormat">Output format</label><select id="audioFormat"><option value="mp3">MP3</option><option value="wav">WAV</option><option value="ogg">OGG</option></select></div><button id="convertAudio" disabled>Convert audio</button><div class="convert-progress" id="audioProgress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="audioProgressFill"></div></div><p class="convert-progress-text" id="audioProgressText">Ready.</p></div><p id="audioStatus" aria-live="polite"></p><p>Files are uploaded to the server for conversion. Temporary files are deleted after processing.</p>`;
  } else if (type === 'pdf-merge') {
    return `<div class="field"><label for="mergeFiles">Choose 2 to 10 PDF files</label><input id="mergeFiles" type="file" accept=".pdf,application/pdf" multiple></div><button id="convertMerge" disabled>Merge PDFs</button><div class="convert-progress" id="mergeProgress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="mergeProgressFill"></div></div><p class="convert-progress-text" id="mergeProgressText">Ready.</p></div><p id="mergeStatus" aria-live="polite"></p><p>Files are merged in selection order. Encrypted PDFs are not supported.</p>`;
  } else if (type === 'images-pdf') {
    return `<div class="field"><label for="imgPdfFiles">Choose up to 20 images (JPG, PNG, WebP)</label><input id="imgPdfFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple></div><button id="convertImgPdf" disabled>Create PDF</button><div class="convert-progress" id="imgpdfProgress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="imgpdfProgressFill"></div></div><p class="convert-progress-text" id="imgpdfProgressText">Ready.</p></div><p id="imgpdfStatus" aria-live="polite"></p><p>One image per page, in selection order. Files are uploaded to the server and deleted after processing.</p>`;
  } else if (type === 'meta-tag') {
    return `
      <div class="field"><label>Page title</label><input id="metaTitle" type="text" placeholder="My Awesome Page" style="width:100%"></div>
      <div class="field"><label>Page description</label><textarea id="metaDesc" rows="3" placeholder="A short summary of the page..."></textarea></div>
      <div class="field"><label>Page URL</label><input id="metaUrl" type="text" placeholder="https://example.com/page" style="width:100%"></div>
      <div class="field"><label>Keywords (comma separated)</label><input id="metaKeywords" type="text" placeholder="tools, converter, online" style="width:100%"></div>
      <div class="actions"><button onclick="genMeta()">Generate tags</button><button class="btn-secondary" onclick="clearField('metaTitle');clearField('metaDesc');clearField('metaUrl');clearField('metaKeywords');document.getElementById('output').value=''">Clear</button></div>
      <p id="metaWarn" style="color:#b45309;font-size:13px;margin:8px 0;"></p>
      <div class="field" style="margin-top:8px"><label>Result</label><textarea id="output" rows="10" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Tags</button>
    `;
  } else if (type === 'keyword-density') {
    return `
      <div class="field"><label>Article text</label><textarea id="input" rows="8" placeholder="Paste your article here..."></textarea></div>
      <div class="actions"><button onclick="checkDensity()">Analyze</button><button class="btn-secondary" onclick="clearField('input');document.getElementById('densityOut').innerHTML=''">Clear</button></div>
      <div id="densityOut" style="margin-top:12px"></div>
    `;
  } else if (type === 'readability') {
    return `
      <div class="field"><label>Text to analyze</label><textarea id="input" rows="8" placeholder="Paste text here..."></textarea></div>
      <div class="actions"><button onclick="checkReadability()">Analyze</button><button class="btn-secondary" onclick="clearField('input');document.getElementById('readOut').innerHTML=''">Clear</button></div>
      <div id="readOut" style="margin-top:12px"></div>
    `;
  } else if (type === 'regex-tester') {
    return `
      <div class="field"><label>Pattern</label><input id="regexPattern" type="text" placeholder="\\b\\w+@\\w+\\.\\w+\\b" style="width:100%;font-family:monospace"></div>
      <div class="field"><label>Flags</label><input id="regexFlags" type="text" value="gi" style="width:100%;font-family:monospace"></div>
      <p id="regexError" style="color:#ef4444;font-size:13px;margin:4px 0;"></p>
      <div class="field"><label>Test text</label><textarea id="input" rows="6" placeholder="Paste text to test against..."></textarea></div>
      <div class="field"><label>Matches (<span id="regexCount">0</span>)</label><div id="regexOut" style="white-space:pre-wrap;word-break:break-word;border:1px solid var(--line);border-radius:10px;padding:12px;min-height:80px"></div></div>
      <div class="field"><label>Capture groups (first match)</label><div id="regexGroups" style="font-family:monospace;font-size:13px"></div></div>
    `;
  } else if (type === 'text-diff') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div class="field"><label>Original text</label><textarea id="diffA" rows="8" placeholder="Old version..."></textarea></div><div class="field"><label>New text</label><textarea id="diffB" rows="8" placeholder="New version..."></textarea></div></div>
      <div class="field"><label style="display:flex;align-items:center;gap:8px"><input id="diffWs" type="checkbox" style="width:auto"> Ignore leading/trailing whitespace</label></div>
      <div class="actions"><button onclick="runDiff()">Compare</button><button class="btn-secondary" onclick="clearField('diffA');clearField('diffB');document.getElementById('diffOut').innerHTML=''">Clear</button></div>
      <p id="diffSummary" style="font-size:13px;margin:8px 0;"></p>
      <div id="diffOut" style="font-family:monospace;font-size:13px;border:1px solid var(--line);border-radius:10px;overflow:hidden"></div>
    `;
  } else if (type === 'markdown-preview') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div class="field"><label>Markdown</label><textarea id="mdIn" rows="14" placeholder="# Hello&#10;&#10;Write **markdown** here..." style="font-family:monospace"></textarea></div><div class="field"><label>Preview</label><div id="mdOut" class="md-preview" style="border:1px solid var(--line);border-radius:10px;padding:12px;min-height:200px"></div></div></div>
      <div class="actions" style="margin-top:12px"><button onclick="copyMd()">Copy HTML</button><button onclick="downloadMd()">Download HTML</button><button class="btn-secondary" onclick="clearField('mdIn');renderMd()">Clear</button></div>
    `;
  } else if (type === 'xml-formatter') {
    return `
      <div class="field"><label>XML Input</label><textarea id="input" rows="8" placeholder="<root><item>value</item></root>" style="font-family:monospace"></textarea></div>
      <div class="actions"><button onclick="formatXml()">Format</button><button onclick="minifyXml()">Minify</button><button class="btn-secondary" onclick="clearField('input')">Clear</button></div>
      <p id="errorMsg" style="color:#ef4444;font-size:13px;margin:8px 0;"></p>
      <div class="field" style="margin-top:8px"><label>Result</label><textarea id="output" rows="10" readonly style="font-family:monospace"></textarea></div>
      <button id="copyBtn" onclick="copyOutput('output')">Copy Result</button>
    `;
  } else if (type === 'dns-lookup') {
    return `<div class="field"><label for="dnsDomain">Domain name</label><input id="dnsDomain" type="text" placeholder="example.com" style="width:100%"></div><div class="actions"><button id="dnsBtn">Look up DNS</button></div><p id="dnsStatus" aria-live="polite"></p><div id="dnsOut" style="margin-top:8px"></div><p>Queries A, AAAA, MX, TXT, NS, CNAME, and SOA records live from the server.</p>`;
  } else if (type === 'whois-lookup') {
    return `<div class="field"><label for="whoisDomain">Domain name</label><input id="whoisDomain" type="text" placeholder="example.com" style="width:100%"></div><div class="actions"><button id="whoisBtn">Look up WHOIS</button></div><p id="whoisStatus" aria-live="polite"></p><div id="whoisOut" style="margin-top:8px"></div><p>Registration data comes from RDAP. Privacy-protected domains hide contact details.</p>`;
  } else if (type === 'http-headers') {
    return `<div class="field"><label for="hdrUrl">URL</label><input id="hdrUrl" type="text" placeholder="https://example.com" style="width:100%"></div><div class="actions"><button id="hdrBtn">Fetch headers</button></div><p id="hdrStatus" aria-live="polite"></p><div id="hdrOut" style="margin-top:8px"></div><p>Follows up to 5 redirects and shows every hop.</p>`;
  } else if (type === 'ssl-checker') {
    return `<div class="field"><label for="sslHost">Hostname</label><input id="sslHost" type="text" placeholder="example.com" style="width:100%"></div><div class="actions"><button id="sslBtn">Check certificate</button></div><p id="sslStatus" aria-live="polite"></p><div id="sslOut" style="margin-top:8px"></div><p>Reads the live TLS certificate directly from the server.</p>`;
  } else if (type === 'website-shot') {
    return `<div class="field"><label for="shotUrl">Page URL</label><input id="shotUrl" type="text" placeholder="https://example.com" style="width:100%"></div><div class="field"><label for="shotDevice">Viewport</label><select id="shotDevice"><option value="desktop">Desktop 1280x800</option><option value="tablet">Tablet 820x1180</option><option value="mobile">Mobile 390x844</option></select></div><button id="convertShot" disabled>Capture screenshot</button><div class="convert-progress" id="shotProgress" hidden><div class="convert-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="convert-progress-fill" id="shotProgressFill"></div></div><p class="convert-progress-text" id="shotProgressText">Ready.</p></div><p id="shotStatus" aria-live="polite"></p><div id="shotPreview" style="margin-top:8px"></div><p>Full-page PNG rendered by headless Chromium on the server. Bot-protected pages may fail.</p>`;
  }
  return `<p>Tool interface ready.</p>`;
}
