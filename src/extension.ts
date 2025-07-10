import {
  ExtensionContext,
  WebviewViewProvider,
  WebviewView,
  window,
  workspace,
  commands,
  Webview,
  Uri,
  TextDocumentChangeEvent,
  ViewColumn
} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let jimboViewProvider: JimboViewProvider;

export function activate(ctx: ExtensionContext) {
  jimboViewProvider = new JimboViewProvider(ctx);
  
  const disposable = window.registerWebviewViewProvider('jimboView', jimboViewProvider, {
    webviewOptions: {
      retainContextWhenHidden: true
    }
  });
  ctx.subscriptions.push(disposable);

  ctx.subscriptions.push(
    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
      if (looksLikeCopilotInsertion(e.contentChanges)) {
        const snippet = e.contentChanges.map((c: any) => c.text).join('');
        onCopilotAcceptedWithSnippet(snippet);
      }
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand('jimboCopilot.testReaction', () => {
      onCopilotAcceptedWithSnippet('function testFunction() {\n  console.log("Hello from Jimbo!");\n}');
    })
  );
  ctx.subscriptions.push(
    commands.registerCommand('jimboCopilot.reloadQuotes', () => {
      jimboViewProvider?.postMessage({ type: 'reload-quotes' });
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand('jimboCopilot.openPanel', () => {
      const panel = window.createWebviewPanel(
        'jimboPanel',
        'Jimbo Copilot',
        ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [ctx.extensionUri]
        }
      );
      
      panel.webview.html = jimboViewProvider.getWebviewHtml(panel.webview);
      jimboViewProvider.setWebview(panel.webview);
    })
  );
}

class JimboViewProvider implements WebviewViewProvider {
  private webview?: Webview;

  constructor(private ctx: ExtensionContext) {}

  resolveWebviewView(view: WebviewView) {
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.ctx.extensionUri]
    };
    view.webview.html = this.getWebviewHtml(view.webview);
    this.webview = view.webview;
  }

  setWebview(webview: Webview) {
    this.webview = webview;
  }

  postMessage(msg: any) {
    this.webview?.postMessage(msg);
  }

  getWebviewHtml(webview: Webview): string {
    
    const quotesJsonPath = path.join(this.ctx.extensionUri.fsPath, 'media', 'quotes.json');
    
    let quotesData = {
      copilotAccepted: {
        positive: ["Nice work! That's some clean code."],
        sarcastic: ["That code is so bad it makes me want to cry."]
      },
      clickQuotes: ["Click me for wisdom! 🃏"]
    };
    
    try {
      const quotesContent = fs.readFileSync(quotesJsonPath, 'utf8');
      quotesData = JSON.parse(quotesContent);
    } catch (error) {
    }
    
    const jimboImageUri = webview.asWebviewUri(
      Uri.joinPath(this.ctx.extensionUri, 'media', 'jimbo.png')
    );
    
    const soundUris = Array.from({length: 11}, (_, i) => 
      webview.asWebviewUri(
        Uri.joinPath(this.ctx.extensionUri, 'media', 'jimbovoices', `voice${i + 1}.mp3`)
      ).toString()
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; media-src ${webview.cspSource} data: blob:; fetch-src ${webview.cspSource}; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <title>Jimbo Copilot</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 1rem;
            margin: 0;
        }
        .jimbo-container {
            text-align: center;
            margin-bottom: 1rem;
        }
        .jimbo-face {
            width: 120px;
            height: 120px;
            border-radius: 15px;
            margin: 0 auto;
            position: relative;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: float 3s ease-in-out infinite;
            cursor: pointer;
            overflow: hidden;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        }
        .jimbo-face img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 15px;
        }
        .jimbo-face.talking {
            animation: talk 0.3s ease-in-out;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        @keyframes talk {
            0%, 100% { transform: scale(1) translateY(0px); }
            25% { transform: scale(1.05) translateY(-2px); }
            50% { transform: scale(1.02) translateY(-5px); }
            75% { transform: scale(1.08) translateY(-3px); }
        }
        .speech-bubble {
            position: relative;
            background: var(--vscode-editor-selectionBackground);
            border: 2px solid var(--vscode-textLink-foreground);
            border-radius: 15px;
            padding: 1rem;
            margin-top: 1rem;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        .speech-bubble::before {
            content: '';
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-bottom: 12px solid var(--vscode-textLink-foreground);
        }
        .speech-bubble::after {
            content: '';
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 10px solid var(--vscode-editor-selectionBackground);
        }
        #speech {
            white-space: pre-wrap;
            font-size: 0.9rem;
            line-height: 1.4;
            text-align: center;
        }
        .typing::after {
            content: '|';
            animation: blink 1s infinite;
            color: var(--vscode-textLink-foreground);
        }
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        .status {
            font-style: italic;
            opacity: 0.7;
        }
        .excited {
            color: var(--vscode-textLink-foreground);
            font-weight: bold;
            animation: pulse 1s ease-in-out;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .excited-bubble {
            border-color: #ff6b6b;
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        }
    </style>
</head>
<body>
    <div class="jimbo-container">
        <div class="jimbo-face" id="jimbo-face">
            <img src="${jimboImageUri}" alt="Jimbo the Joker" />
        </div>
    </div>
    <div class="speech-bubble" id="speech-bubble">
        <div id="speech" class="status">Waiting for Copilot to suggest some code</div>
    </div>

    ${soundUris.map((uri, i) => `<audio id="voice${i + 1}" preload="auto"><source src="${uri}" type="audio/mpeg"></audio>`).join('\n    ')}

    <script>
        const vscode = acquireVsCodeApi();
        const speechElement = document.getElementById('speech');
        const speechBubble = document.getElementById('speech-bubble');
        const jimboFace = document.getElementById('jimbo-face');
        
        let lastSoundIndex = -1;
        const soundElements = [${soundUris.map((_, i) => `document.getElementById('voice${i + 1}')`).join(', ')}];
        
        let activeSoundTimeouts = [];
        let activeTypingTimeout = null;
        let isTyping = false;
        
        let lastShownMessage = '';
        let lastMessageTime = 0;
        
        let copilotSessionActive = false;
        let totalLinesAdded = 0;
        let sessionTimeout = null;
        
        function stopSounds() {
            activeSoundTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
            activeSoundTimeouts = [];
            
            soundElements.forEach((sound, index) => {
                if (sound && !sound.paused) {
                    sound.pause();
                    sound.currentTime = 0;
                }
            });
            
            jimboFace.classList.remove('talking');
        }
        
        function stopAllSoundsAndAnimations() {
            stopSounds();
            
            if (activeTypingTimeout) {
                clearTimeout(activeTypingTimeout);
                activeTypingTimeout = null;
            }
            isTyping = false;
        }
        
        function getRandomSoundIndex() {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * 5);
            } while (randomIndex === lastSoundIndex && soundElements.length > 1);
            
            lastSoundIndex = randomIndex;
            return randomIndex;
        }
        
        let quotes = ${JSON.stringify(quotesData)};
        
        function playRandomSound() {
            const soundIndex = getRandomSoundIndex();
            const soundToPlay = soundElements[soundIndex];
            
            if (soundToPlay) {
                soundToPlay.currentTime = 0;
                soundToPlay.volume = 0.7;
                soundToPlay.preload = 'auto';
                
                soundToPlay.play().catch(() => {});
            }
            
            jimboFace.classList.add('talking');
            setTimeout(() => {
                jimboFace.classList.remove('talking');
            }, 300);
        }
        
        function playConsecutiveSounds() {
            stopSounds();
            
            const soundDelay = 150;
            
            for (let i = 0; i < 5; i++) {
                const timeoutId = setTimeout(() => {
                    playRandomSound();
                }, i * soundDelay);
                
                activeSoundTimeouts.push(timeoutId);
            }
        }
        
        function typeText(element, text, speed = 25) {
            if (activeTypingTimeout) {
                clearTimeout(activeTypingTimeout);
            }
            
            isTyping = true;
            element.textContent = '';
            element.classList.add('typing');
            let charIndex = 0;
            
            function typeNextChar() {
                if (charIndex < text.length && isTyping) {
                    element.textContent += text.charAt(charIndex);
                    charIndex++;
                    
                    const randomDelay = Math.max(5, speed + Math.random() * 6 - 3);
                    
                    activeTypingTimeout = setTimeout(typeNextChar, randomDelay);
                } else {
                    element.classList.remove('typing');
                    isTyping = false;
                    activeTypingTimeout = null;
                }
            }
            
            typeNextChar();
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'copilot-accepted') {
                if (isShowingClickQuote) {
                    return;
                }
                
                const gist = message.gist || 'some mysterious code';
                const lineCount = message.lineCount || 0;
                
                totalLinesAdded += lineCount;
                copilotSessionActive = true;
                
                if (sessionTimeout) {
                    clearTimeout(sessionTimeout);
                }
                
                sessionTimeout = setTimeout(() => {
                    if (copilotSessionActive && !isShowingClickQuote) {
                        let quoteArray;
                        if (totalLinesAdded < 5) {
                            quoteArray = quotes.copilotAccepted.positive;
                        } else {
                            quoteArray = quotes.copilotAccepted.sarcastic;
                        }
                        
                        const randomQuote = quoteArray[Math.floor(Math.random() * quoteArray.length)];
                        const displayText = randomQuote + '\\n\\nSummary: ' + gist;
                        
                        speechElement.className = 'excited';
                        speechBubble.className = 'speech-bubble excited-bubble';
                        typeText(speechElement, displayText, 20);
                        
                        playRandomSound();
                        
                        copilotSessionActive = false;
                        totalLinesAdded = 0;
                        
                        setTimeout(() => {
                            if (!isShowingClickQuote && !isTyping) {
                                speechElement.className = 'status';
                                speechBubble.className = 'speech-bubble';
                                typeText(speechElement, 'Waiting for Copilot to suggest some code', 20);
                            }
                        }, 4000);
                    }
                }, 3000);
            }
        });
        
        let isShowingClickQuote = false;
        let clickQuoteTimeout = null;
        
        jimboFace.addEventListener('click', () => {
            stopAllSoundsAndAnimations();
            
            if (clickQuoteTimeout) {
                clearTimeout(clickQuoteTimeout);
            }
            
            isShowingClickQuote = true;
            const randomQuote = quotes.clickQuotes[Math.floor(Math.random() * quotes.clickQuotes.length)];
            
            speechElement.className = 'excited';
            speechBubble.className = 'speech-bubble excited-bubble';
            
            typeText(speechElement, randomQuote, 20);
            
            setTimeout(() => {
                playConsecutiveSounds();
            }, 100);
            
            clickQuoteTimeout = setTimeout(() => {
                isShowingClickQuote = false;
                speechElement.className = 'status';
                speechBubble.className = 'speech-bubble';
                
                typeText(speechElement, 'Waiting for Copilot to suggest some code...', 25);
                
                clickQuoteTimeout = null;
            }, 4000);
        });
        
        soundElements.forEach((sound, index) => {
            if (sound) {
                sound.addEventListener('loadeddata', () => {});
                sound.addEventListener('error', () => {});
                sound.addEventListener('canplaythrough', () => {});
            }
        });
    </script>
</body>
</html>`;
  }
}

function onCopilotAccepted() {
  jimboViewProvider?.postMessage({
    type: 'copilot-accepted',
    snippet: 'Code suggestion accepted!',
    gist: 'accepted a code suggestion'
  });
}

function onCopilotAcceptedWithSnippet(snippet: string) {
  const lines = snippet.split('\n').filter(line => line.trim().length > 0);
  const lineCount = lines.length;
  
  const gist = generateCodeGist(snippet);
  
  jimboViewProvider?.postMessage({
    type: 'copilot-accepted',
    snippet: snippet,
    gist: gist,
    lineCount: lineCount
  });
}

function generateCodeGist(code: string): string {
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const codeType = detectCodeType(code);
  const actions = detectActions(code);
  const complexity = detectComplexity(code, lines.length);
  
  let gist = '';
  
  if (codeType) {
    gist += `Added ${codeType}`;
  } else {
    gist += 'Added code';
  }
  
  if (actions.length > 0) {
    if (actions.length === 1) {
      gist += ` that ${actions[0]}`;
    } else if (actions.length === 2) {
      gist += ` that ${actions[0]} and ${actions[1]}`;
    } else {
      gist += ` that ${actions.slice(0, -1).join(', ')}, and ${actions[actions.length - 1]}`;
    }
  }
  
  return gist;
}

function detectCodeType(code: string): string {
  const patterns = [
    { pattern: /function\s+\w+\s*\(/i, type: 'a function' },
    { pattern: /const\s+\w+\s*=\s*\(/i, type: 'an arrow function' },
    { pattern: /class\s+\w+/i, type: 'a class' },
    { pattern: /interface\s+\w+/i, type: 'an interface' },
    { pattern: /type\s+\w+\s*=/i, type: 'a type definition' },
    { pattern: /import\s+/i, type: 'import statements' },
    { pattern: /export\s+/i, type: 'export statements' },
    { pattern: /const\s+\w+\s*=/i, type: 'a constant' },
    { pattern: /let\s+\w+\s*=/i, type: 'a variable' },
    { pattern: /var\s+\w+\s*=/i, type: 'a variable' },
    { pattern: /if\s*\(/i, type: 'conditional logic' },
    { pattern: /for\s*\(/i, type: 'a loop' },
    { pattern: /while\s*\(/i, type: 'a loop' },
    { pattern: /try\s*{/i, type: 'error handling' },
    { pattern: /catch\s*\(/i, type: 'error handling' },
    { pattern: /async\s+/i, type: 'async code' },
    { pattern: /await\s+/i, type: 'async code' },
    { pattern: /<\w+/i, type: 'JSX/HTML elements' },
    { pattern: /return\s+/i, type: 'a return statement' }
  ];
  
  for (const { pattern, type } of patterns) {
    if (pattern.test(code)) {
      return type;
    }
  }
  
  return '';
}

function detectActions(code: string): string[] {
  const actions: string[] = [];
  
  if (/fetch\(|axios\.|\.get\(|\.post\(/i.test(code)) {
    actions.push('makes API calls');
  }
  
  if (/document\.|getElementById|querySelector|createElement/i.test(code)) {
    actions.push('manipulates the DOM');
  }
  
  if (/addEventListener|onClick|onChange|onSubmit/i.test(code)) {
    actions.push('handles events');
  }
  
  if (/\.map\(|\.filter\(|\.reduce\(|\.forEach\(/i.test(code)) {
    actions.push('processes data');
  }
  
  if (/useState|setState|state\.|dispatch/i.test(code)) {
    actions.push('manages state');
  }
  
  if (/fs\.|readFile|writeFile|path\./i.test(code)) {
    actions.push('handles files');
  }
  
  if (/\.save\(|\.find\(|\.create\(|\.delete\(|query|SELECT|INSERT/i.test(code)) {
    actions.push('interacts with database');
  }
  
  if (/validate|check|verify|test/i.test(code)) {
    actions.push('validates data');
  }
  
  if (/console\.|log\(|debug\(|error\(/i.test(code)) {
    actions.push('logs information');
  }
  
  if (/Math\.|calculate|compute|\+|\-|\*|\/|%/i.test(code)) {
    actions.push('performs calculations');
  }
  
  if (/\.split\(|\.join\(|\.replace\(|\.substring\(|\.trim\(/i.test(code)) {
    actions.push('processes strings');
  }
  
  if (/config|settings|options|params/i.test(code)) {
    actions.push('handles configuration');
  }
  
  return actions;
}

function detectComplexity(code: string, lineCount: number): 'simple' | 'moderate' | 'complex' {
  let complexityScore = 0;
  
  if (lineCount > 20) complexityScore += 2;
  else if (lineCount > 10) complexityScore += 1;
  
  const nestingLevel = (code.match(/{\s*$/gm) || []).length;
  if (nestingLevel > 3) complexityScore += 2;
  else if (nestingLevel > 1) complexityScore += 1;
  
  if (/async|await|Promise|\.then\(/i.test(code)) complexityScore += 1;
  if (/try\s*{|catch\s*\(/i.test(code)) complexityScore += 1;
  if (/class\s+\w+|extends\s+\w+/i.test(code)) complexityScore += 1;
  if (/regex|RegExp|\/.+\/[gimuy]*/i.test(code)) complexityScore += 1;
  if (/for\s*\(|while\s*\(|\.map\(|\.filter\(|\.reduce\(/i.test(code)) complexityScore += 1;
  
  if (complexityScore >= 4) return 'complex';
  if (complexityScore >= 2) return 'moderate';
  return 'simple';
}

function looksLikeCopilotInsertion(changes: readonly any[]): boolean {
  return changes.some((change: any) => {
    const text = change.text;
    const isMultiChar = text.length >= 3;
    
    const hasCodePatterns = text.includes('function') ||
                           text.includes('const') ||
                           text.includes('let') ||
                           text.includes('var') ||
                           text.includes('class') ||
                           text.includes('import') ||
                           text.includes('export') ||
                           text.includes('=>') ||
                           text.includes('if (') ||
                           text.includes('for (') ||
                           text.includes('while (') ||
                           text.includes('return ') ||
                           text.includes('console.') ||
                           text.includes('document.') ||
                           text.includes('window.');
    
    const isSignificant = text.includes('\n') || text.length > 15;
    
    const isInsertion = change.rangeLength === 0;
    
    return isMultiChar && isInsertion && (hasCodePatterns || isSignificant);
  });
}

export function deactivate() {}
