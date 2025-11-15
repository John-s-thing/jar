\
    // Simple JARVIS-like assistant (browser-only)
    // Features:
    // - Chat UI
    // - Command parser with categories
    // - Web Speech API (SpeechRecognition) for voice input (if available)
    // - Speech Synthesis for voice output
    // - LocalStorage memory
    // - Typing animation

    const STORAGE_KEY = 'jarvis_memory_v1'

    // Minimal command categories / dictionary
    const commands = [
      {pattern: /hello|hi|hey/i, action: (ctx)=> ctx.reply("Hello! How can I help you today?")},
      {pattern: /time|what time/i, action: (ctx)=> ctx.reply(new Date().toLocaleTimeString())},
      {pattern: /open (.+)/i, action: (ctx, m)=> {
        const urlCandidate = m && m[1] ? m[1].trim() : 'https://www.google.com'
        let url = urlCandidate
        if (!/^https?:\/\//i.test(url)) url = 'https://'+url
        ctx.reply("Opening: " + urlCandidate)
        window.open(url, '_blank')
      }},
      {pattern: /remember (.+)/i, action: (ctx, m)=> {
        const note = m[1].trim()
        const mem = ctx.loadMemory()
        mem.notes = mem.notes || []
        mem.notes.push({text: note, time: Date.now()})
        ctx.saveMemory(mem)
        ctx.reply("Okay, I'll remember that.")
      }},
      {pattern: /what did you remember|show memory/i, action: (ctx)=> {
        const mem = ctx.loadMemory()
        const notes = (mem.notes||[]).map(n=>`• ${new Date(n.time).toLocaleString()}: ${n.text}`).join('\n')
        ctx.reply(notes || "I don't have any saved notes.")
      }},
      {pattern: /clear memory|forget everything/i, action: (ctx)=> {
        ctx.saveMemory({})
        ctx.reply("Memory cleared.")
      }},
      {pattern: /joke|tell me a joke/i, action: (ctx)=> {
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs.",
          "I told a programmer to go outside — they said they couldn't find any bugs there either."
        ]
        ctx.reply(jokes[Math.floor(Math.random()*jokes.length)])
      }},
      // fallback handled below
    ]

    function createElement(html){
      const tmp = document.createElement('div')
      tmp.innerHTML = html.trim()
      return tmp.firstChild
    }

    export function initUI(root){
      root.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-6">
        <div class="w-full max-w-3xl glass rounded-2xl p-6 shadow-xl">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center text-slate-900 font-bold">J</div>
            <div>
              <h1 class="text-xl font-semibold">Jarvis — Web Assistant</h1>
              <p class="text-sm text-slate-300">Runs fully in your browser. Deploy on GitHub Pages.</p>
            </div>
            <div class="ml-auto text-sm text-slate-400" id="status">Idle</div>
          </div>

          <div id="chat" class="h-72 overflow-y-auto p-4 bg-slate-800/30 rounded-xl mb-4"></div>

          <div class="flex gap-2 items-center">
            <input id="input" class="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none" placeholder="Type a command, e.g., 'what time' or 'remember Buy milk'"/>
            <button id="micBtn" class="px-4 py-2 bg-emerald-500/80 rounded-lg">🎙️</button>
            <button id="sendBtn" class="px-4 py-2 bg-sky-500/80 rounded-lg">Send</button>
          </div>

          <div class="mt-4 text-xs text-slate-400">
            <strong>Tip:</strong> Try "remember ...", "open example.com", "what time", or "tell me a joke".
          </div>
        </div>
      </div>
      `

      const chat = root.querySelector('#chat')
      const input = root.querySelector('#input')
      const sendBtn = root.querySelector('#sendBtn')
      const micBtn = root.querySelector('#micBtn')
      const status = root.querySelector('#status')

      function addMessage(who, text){
        const el = document.createElement('div')
        el.className = who === 'user' ? 'text-right mb-2' : 'text-left mb-2'
        const bubble = document.createElement('div')
        bubble.className = 'inline-block p-3 rounded-lg max-w-[80%] break-words'
        bubble.style.background = who === 'user' ? 'linear-gradient(90deg,#0ea5a6,#06b6d4)' : 'rgba(255,255,255,0.03)'
        bubble.innerText = text
        el.appendChild(bubble)
        chat.appendChild(el)
        chat.scrollTop = chat.scrollHeight
      }

      function typeReply(text, callback){
        const el = document.createElement('div')
        el.className = 'text-left mb-2'
        const bubble = document.createElement('div')
        bubble.className = 'inline-block p-3 rounded-lg max-w-[80%] break-words'
        bubble.style.background = 'rgba(255,255,255,0.03)'
        el.appendChild(bubble)
        chat.appendChild(el)
        chat.scrollTop = chat.scrollHeight

        let i = 0
        const speed = 18 + Math.random()*25
        const t = setInterval(()=>{
          bubble.innerText = text.slice(0, i++)
          chat.scrollTop = chat.scrollHeight
          if(i > text.length){
            clearInterval(t)
            if(callback) callback()
          }
        }, speed)
      }

      function speak(text){
        if(!('speechSynthesis' in window)) return
        const u = new SpeechSynthesisUtterance(text)
        u.lang = navigator.language || 'en-US'
        speechSynthesis.cancel()
        speechSynthesis.speak(u)
      }

      function loadMemory(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }catch(e){return {}} }
      function saveMemory(obj){ localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)) }

      // Context passed to command actions
      const ctx = {
        reply: (t)=> {
          status.innerText = 'Responding...'
          typeReply(t, ()=> { status.innerText = 'Idle'; speak(t) })
        },
        saveMemory: saveMemory,
        loadMemory: loadMemory
      }

      // Basic command handler
      function handleCommand(text){
        addMessage('user', text)
        status.innerText = 'Thinking...'
        // try pattern commands
        for(const c of commands){
          const m = text.match(c.pattern)
          if(m){
            try{
              c.action(ctx, m)
              return
            }catch(e){
              console.error(e)
              ctx.reply("I had an error running that command.")
              return
            }
          }
        }

        // fallback: small builtin 'AI' responder (rules + random)
        const fallbackReplies = [
          "I'm not sure I understand. Try 'remember ...' or 'open example.com'",
          "I can answer time, open links, store notes, and tell jokes.",
          "Want me to call an external LLM? Add your API key in the README and enable it."
        ]
        ctx.reply(fallbackReplies[Math.floor(Math.random()*fallbackReplies.length)])
      }

      // Send button
      sendBtn.addEventListener('click', ()=>{
        const v = input.value.trim()
        if(!v) return
        input.value = ''
        handleCommand(v)
      })

      input.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){ e.preventDefault(); sendBtn.click() }
      })

      // Speech recognition (optional)
      let recognition = null
      if(window.webkitSpeechRecognition || window.SpeechRecognition){
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        recognition = new SR()
        recognition.lang = navigator.language || 'en-US'
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onstart = ()=> { micBtn.innerText = 'Listening...' }
        recognition.onend = ()=> { micBtn.innerText = '🎙️' }
        recognition.onerror = (e)=> { micBtn.innerText = '🎙️'; console.warn(e) }
        recognition.onresult = (e)=> {
          const t = e.results[0][0].transcript
          handleCommand(t)
        }
      } else {
        micBtn.title = 'Speech recognition not supported in your browser'
      }

      micBtn.addEventListener('click', ()=>{
        if(!recognition){
          // fallback: open prompt
          const v = prompt('Speech recognition not available. Type command instead:')
          if(v) handleCommand(v)
          return
        }
        try{
          recognition.start()
        }catch(e){
          console.warn(e)
        }
      })

      // welcome message
      typeReply("Hello — I'm Jarvis, your web assistant. Try voice or text commands.")

      // expose for debugging
      window.jarvis = { handleCommand, loadMemory, saveMemory }
    }

