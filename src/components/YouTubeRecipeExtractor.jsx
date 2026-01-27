import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

// Helper to extract YouTube video ID from various URL formats
const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Fetch YouTube transcript using a proxy approach
const fetchTranscript = async (videoId) => {
  // Try multiple transcript fetching methods

  try {
    const response = await fetch(`https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`)
    if (response.ok) {
      const data = await response.json()
      if (data.transcript) {
        return data.transcript.map(item => item.text).join(' ')
      }
    }
  } catch (e) {
    console.log('Primary transcript method failed:', e)
  }

  try {
    const response = await fetch(`https://api.kome.ai/api/tools/youtube-transcripts?video_id=${videoId}`)
    if (response.ok) {
      const data = await response.json()
      if (data.transcript) {
        return data.transcript
      }
    }
  } catch (e) {
    console.log('Secondary transcript method failed:', e)
  }

  return null
}

// ============================================
// SMART RULE-BASED RECIPE PARSER (NO API NEEDED)
// ============================================

const BBQ_KEYWORDS = {
  meats: [
    'brisket', 'pork butt', 'pork shoulder', 'boston butt', 'ribs', 'baby back',
    'spare ribs', 'st louis', 'beef ribs', 'chuck roast', 'tri-tip', 'tritip',
    'pulled pork', 'pork belly', 'burnt ends', 'chicken', 'turkey', 'wings',
    'thighs', 'drumsticks', 'whole chicken', 'spatchcock', 'salmon', 'prime rib',
    'ribeye', 'tomahawk', 'picanha', 'sirloin', 'flank', 'skirt steak', 'sausage',
    'bratwurst', 'hot dogs', 'burgers', 'meatloaf', 'lamb', 'leg of lamb', 'rack of lamb'
  ],
  woods: [
    'hickory', 'oak', 'post oak', 'red oak', 'white oak', 'mesquite', 'pecan',
    'apple', 'applewood', 'cherry', 'cherrywood', 'maple', 'alder', 'peach',
    'competition blend', 'fruit wood', 'charcoal', 'lump charcoal', 'briquettes'
  ],
  techniques: [
    'wrap', 'texas crutch', 'butcher paper', 'foil', 'aluminum foil', 'unwrap',
    'spritz', 'mop', 'baste', 'inject', 'injection', 'brine', 'dry brine',
    'rest', 'resting', 'carry over', 'carryover', 'probe tender', 'jiggles',
    'bark', 'smoke ring', 'stall', 'fat cap', 'fat side', 'trim', 'trimming',
    'render', 'rendering', 'sear', 'reverse sear', 'crust', 'char',
    'low and slow', 'hot and fast', 'indirect', 'direct heat', '3-2-1', '2-2-1',
    'snake method', 'minion method', 'two zone'
  ],
  seasonings: [
    'rub', 'dry rub', 'seasoning', 'salt', 'kosher salt', 'pepper', 'black pepper',
    '16 mesh', 'coarse ground', 'paprika', 'garlic', 'garlic powder', 'onion powder',
    'cayenne', 'chili powder', 'cumin', 'brown sugar', 'mustard', 'yellow mustard',
    'hot sauce', 'worcestershire', 'apple cider vinegar', 'vinegar', 'olive oil'
  ],
  equipment: [
    'smoker', 'offset', 'pellet', 'traeger', 'recteq', 'pit boss', 'camp chef',
    'weber', 'kettle', 'kamado', 'big green egg', 'akorn', 'drum smoker', 'ugly drum',
    'wsm', 'weber smokey mountain', 'masterbuilt', 'thermometer', 'probe', 'thermoworks',
    'meater', 'instant read', 'water pan', 'drip pan', 'grill grates'
  ]
}

// Extract temperatures from text
const extractTemperatures = (text) => {
  const temps = []
  const patterns = [
    // Fahrenheit patterns
    /(\d{2,3})\s*°?\s*[fF](?:ahrenheit)?/g,
    /(\d{2,3})\s*degrees?\s*[fF]?(?:ahrenheit)?/g,
    // Ranges
    /(\d{2,3})\s*[-–to]+\s*(\d{2,3})\s*°?\s*[fF]?/g,
    // Contextual (when talking about cooking temps)
    /(?:at|to|around|about|set.*?to|running.*?at|hold.*?at|maintain)\s*(\d{2,3})(?!\d)/gi
  ]

  const seen = new Set()

  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const temp1 = parseInt(match[1])
      const temp2 = match[2] ? parseInt(match[2]) : null

      // Filter reasonable BBQ temps (150-700°F)
      if (temp1 >= 150 && temp1 <= 700 && !seen.has(temp1)) {
        temps.push(temp1)
        seen.add(temp1)
      }
      if (temp2 && temp2 >= 150 && temp2 <= 700 && !seen.has(temp2)) {
        temps.push(temp2)
        seen.add(temp2)
      }
    }
  })

  return [...new Set(temps)].sort((a, b) => a - b)
}

// Extract internal meat temperatures
const extractInternalTemps = (text) => {
  const temps = []
  const lowerText = text.toLowerCase()

  const patterns = [
    /internal\s*(?:temp(?:erature)?)?[^\d]*(\d{2,3})/gi,
    /(?:probe|meat)\s*(?:temp(?:erature)?)?[^\d]*(\d{2,3})/gi,
    /(?:pull|pulling)\s*(?:at|when)[^\d]*(\d{2,3})/gi,
    /(?:done|finished|ready)\s*(?:at|when)[^\d]*(\d{2,3})/gi,
    /(\d{2,3})\s*(?:internal|inside)/gi,
    /(?:hits?|reaches?|gets? to)\s*(\d{2,3})/gi
  ]

  const seen = new Set()

  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const temp = parseInt(match[1])
      // Internal temps typically 125-212°F
      if (temp >= 125 && temp <= 212 && !seen.has(temp)) {
        temps.push(temp)
        seen.add(temp)
      }
    }
  })

  return [...new Set(temps)].sort((a, b) => a - b)
}

// Extract cooking times
const extractTimes = (text) => {
  const times = []

  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(hours?|minutes?|mins?|hrs?)/gi,
    /(\d+(?:\.\d+)?)\s*(hours?|minutes?|mins?|hrs?)/gi,
    /(?:about|around|approximately|roughly)\s*(\d+(?:\.\d+)?)\s*(hours?|minutes?|mins?|hrs?)/gi
  ]

  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      if (match[3]) {
        // Range format
        const unit = match[3].toLowerCase().startsWith('h') ? 'hours' : 'minutes'
        times.push(`${match[1]}-${match[2]} ${unit}`)
      } else {
        const unit = match[2].toLowerCase().startsWith('h') ? 'hours' : 'minutes'
        times.push(`${match[1]} ${unit}`)
      }
    }
  })

  return [...new Set(times)]
}

// Find sentences containing keywords
const findRelevantSentences = (text, keywords) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const relevant = []

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase()
    keywords.forEach(keyword => {
      if (lowerSentence.includes(keyword.toLowerCase()) && !relevant.includes(sentence.trim())) {
        relevant.push(sentence.trim())
      }
    })
  })

  return relevant.slice(0, 15) // Limit to 15 most relevant
}

// Find mentioned items from a category
const findMentioned = (text, items) => {
  const lowerText = text.toLowerCase()
  return items.filter(item => lowerText.includes(item.toLowerCase()))
}

// Main rule-based extraction function
const extractRecipeWithRules = (transcript, videoTitle) => {
  const lowerTranscript = transcript.toLowerCase()

  // Extract all data
  const smokerTemps = extractTemperatures(transcript)
  const internalTemps = extractInternalTemps(transcript)
  const cookingTimes = extractTimes(transcript)
  const meats = findMentioned(transcript, BBQ_KEYWORDS.meats)
  const woods = findMentioned(transcript, BBQ_KEYWORDS.woods)
  const techniques = findMentioned(transcript, BBQ_KEYWORDS.techniques)
  const seasonings = findMentioned(transcript, BBQ_KEYWORDS.seasonings)
  const equipment = findMentioned(transcript, BBQ_KEYWORDS.equipment)

  // Find key instructional sentences
  const tempSentences = findRelevantSentences(transcript, ['degree', '°', 'temperature', 'temp'])
  const timeSentences = findRelevantSentences(transcript, ['hour', 'minute', 'until'])
  const tipSentences = findRelevantSentences(transcript, [
    'tip', 'trick', 'secret', 'important', 'key', 'make sure', 'don\'t forget',
    'mistake', 'always', 'never', 'best', 'recommend'
  ])
  const wrapSentences = findRelevantSentences(transcript, ['wrap', 'foil', 'paper', 'crutch'])
  const restSentences = findRelevantSentences(transcript, ['rest', 'resting', 'cool', 'sit'])

  // Build the recipe output
  let recipe = `# ${videoTitle || 'BBQ Recipe'}\n\n`

  // Quick Reference Card
  recipe += `## Quick Reference\n\n`

  if (smokerTemps.length > 0) {
    recipe += `**Smoker/Grill Temp:** ${smokerTemps.map(t => `${t}°F`).join(', ')}\n\n`
  }

  if (internalTemps.length > 0) {
    recipe += `**Target Internal Temp:** ${internalTemps.map(t => `${t}°F`).join(', ')}\n\n`
  }

  if (cookingTimes.length > 0) {
    recipe += `**Cooking Time:** ${cookingTimes.join(', ')}\n\n`
  }

  // Meat/Protein
  if (meats.length > 0) {
    recipe += `## Meat/Protein\n`
    meats.forEach(meat => {
      recipe += `- ${meat.charAt(0).toUpperCase() + meat.slice(1)}\n`
    })
    recipe += `\n`
  }

  // Wood
  if (woods.length > 0) {
    recipe += `## Wood Type\n`
    woods.forEach(wood => {
      recipe += `- ${wood.charAt(0).toUpperCase() + wood.slice(1)}\n`
    })
    recipe += `\n`
  }

  // Seasonings
  if (seasonings.length > 0) {
    recipe += `## Seasonings/Rub\n`
    seasonings.forEach(s => {
      recipe += `- ${s.charAt(0).toUpperCase() + s.slice(1)}\n`
    })
    recipe += `\n`
  }

  // Techniques mentioned
  if (techniques.length > 0) {
    recipe += `## Techniques Used\n`
    techniques.forEach(t => {
      recipe += `- ${t.charAt(0).toUpperCase() + t.slice(1)}\n`
    })
    recipe += `\n`
  }

  // Temperature Details
  if (tempSentences.length > 0) {
    recipe += `## Temperature Notes\n`
    tempSentences.slice(0, 8).forEach(s => {
      recipe += `- "${s.trim()}"\n`
    })
    recipe += `\n`
  }

  // Time Details
  if (timeSentences.length > 0) {
    recipe += `## Timing Notes\n`
    timeSentences.slice(0, 8).forEach(s => {
      recipe += `- "${s.trim()}"\n`
    })
    recipe += `\n`
  }

  // Wrapping
  if (wrapSentences.length > 0) {
    recipe += `## Wrapping Instructions\n`
    wrapSentences.slice(0, 5).forEach(s => {
      recipe += `- "${s.trim()}"\n`
    })
    recipe += `\n`
  }

  // Resting
  if (restSentences.length > 0) {
    recipe += `## Resting Instructions\n`
    restSentences.slice(0, 3).forEach(s => {
      recipe += `- "${s.trim()}"\n`
    })
    recipe += `\n`
  }

  // Tips
  if (tipSentences.length > 0) {
    recipe += `## Pro Tips\n`
    tipSentences.slice(0, 8).forEach(s => {
      recipe += `- "${s.trim()}"\n`
    })
    recipe += `\n`
  }

  // Equipment
  if (equipment.length > 0) {
    recipe += `## Equipment Mentioned\n`
    equipment.forEach(e => {
      recipe += `- ${e.charAt(0).toUpperCase() + e.slice(1)}\n`
    })
    recipe += `\n`
  }

  // If we didn't find much, add a note
  if (smokerTemps.length === 0 && internalTemps.length === 0 && cookingTimes.length === 0) {
    recipe += `\n---\n\n*Note: Limited cooking data was found in this transcript. The video may discuss techniques more than specific temperatures, or the captions may not have captured the details. Try watching the video for visual temperature/time references.*\n`
  }

  return recipe
}

// ============================================
// AI-POWERED EXTRACTION (OPTIONAL)
// ============================================

const extractRecipeWithAI = async (transcript, videoTitle, apiKey, aiProvider) => {
  const systemPrompt = `You are a BBQ and smoking recipe expert. Extract cooking information from video transcripts.

Focus on extracting:
1. **Recipe Name** - The main dish being prepared
2. **Meat/Protein** - Type and cut of meat, weight if mentioned
3. **Grill/Smoker Temperature** - Target cooking temperatures
4. **Internal Meat Temperatures** - Target internal temps for doneness
5. **Cooking Times** - Duration for each phase
6. **Wood Type** - If smoking, what wood is recommended
7. **Rub/Seasoning** - Ingredients for any rubs or marinades
8. **Key Steps** - Important cooking steps in order
9. **Pro Tips** - Special tips, tricks, or warnings mentioned
10. **Rest Time** - How long to rest the meat after cooking

Format the output as a structured recipe with clear sections. Use bullet points for lists.
If any information is not mentioned in the transcript, note it as "Not specified".`

  const userPrompt = `Extract the BBQ/smoking recipe from this video transcript.

Video Title: ${videoTitle || 'Unknown'}

Transcript:
${transcript}

Please extract all cooking temperatures, times, and tips in a well-organized format.`

  if (aiProvider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    return data.choices[0].message.content
  } else if (aiProvider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Anthropic API error')
    }

    const data = await response.json()
    return data.content[0].text
  }

  throw new Error('Invalid AI provider')
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

const convertToPaprikaFormat = (recipe, videoUrl, videoTitle) => {
  const paprikaRecipe = {
    name: videoTitle || 'BBQ Recipe from YouTube',
    source: videoUrl,
    source_url: videoUrl,
    servings: '',
    difficulty: '',
    prep_time: '',
    cook_time: '',
    total_time: '',
    categories: ['BBQ', 'Smoking', 'Grilling'],
    notes: `Extracted from YouTube video: ${videoUrl}\n\n${recipe}`,
    nutritional_info: '',
    directions: recipe,
    ingredients: '',
    photo_data: null,
    photo: null,
    uid: crypto.randomUUID(),
    created: new Date().toISOString(),
    hash: Math.random().toString(36).substring(2, 15)
  }

  return paprikaRecipe
}

const downloadPaprikaRecipe = async (recipe, videoUrl, videoTitle) => {
  const paprikaData = convertToPaprikaFormat(recipe, videoUrl, videoTitle)
  const jsonString = JSON.stringify(paprikaData)

  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${(videoTitle || 'bbq-recipe').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.paprikarecipe`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadAsText = (recipe, videoUrl, videoTitle) => {
  const content = `# ${videoTitle || 'BBQ Recipe'}\n\nSource: ${videoUrl}\n\n${recipe}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${(videoTitle || 'bbq-recipe').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ============================================
// MAIN COMPONENT
// ============================================

const YouTubeRecipeExtractor = ({ onClose }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [recipe, setRecipe] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('input')
  const [savedRecipes, setSavedRecipes] = useState([])
  const [extractionMode, setExtractionMode] = useState('smart') // 'smart' or 'ai'
  const [showTranscript, setShowTranscript] = useState(false)

  // AI settings (optional)
  const [apiKey, setApiKey] = useState('')
  const [aiProvider, setAiProvider] = useState('openai')

  useEffect(() => {
    const savedApiKey = localStorage.getItem('recipe_extractor_api_key')
    const savedProvider = localStorage.getItem('recipe_extractor_provider')
    const savedRecipesList = localStorage.getItem('recipe_extractor_recipes')
    const savedMode = localStorage.getItem('recipe_extractor_mode')

    if (savedApiKey) setApiKey(savedApiKey)
    if (savedProvider) setAiProvider(savedProvider)
    if (savedRecipesList) setSavedRecipes(JSON.parse(savedRecipesList))
    if (savedMode) setExtractionMode(savedMode)
  }, [])

  const saveSettings = () => {
    if (apiKey) localStorage.setItem('recipe_extractor_api_key', apiKey)
    localStorage.setItem('recipe_extractor_provider', aiProvider)
    localStorage.setItem('recipe_extractor_mode', extractionMode)
  }

  const saveRecipeToHistory = (recipeData) => {
    const newRecipe = {
      id: crypto.randomUUID(),
      videoUrl: youtubeUrl,
      videoTitle: videoTitle,
      recipe: recipeData,
      createdAt: new Date().toISOString()
    }

    const updatedRecipes = [newRecipe, ...savedRecipes].slice(0, 20)
    setSavedRecipes(updatedRecipes)
    localStorage.setItem('recipe_extractor_recipes', JSON.stringify(updatedRecipes))
  }

  const fetchVideoTitle = async (videoId) => {
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      if (response.ok) {
        const data = await response.json()
        return data.title || ''
      }
    } catch (e) {
      console.log('Could not fetch title:', e)
    }
    return ''
  }

  const handleExtract = async () => {
    setError('')
    setLoading(true)

    try {
      const videoId = extractVideoId(youtubeUrl)
      if (!videoId) {
        throw new Error('Invalid YouTube URL. Please enter a valid YouTube video link.')
      }

      // Check for AI mode requirements
      if (extractionMode === 'ai' && !apiKey) {
        throw new Error('AI mode requires an API key. Switch to Smart Parser mode or enter an API key.')
      }

      const title = await fetchVideoTitle(videoId)
      setVideoTitle(title)

      setStep('transcript')
      const transcriptText = await fetchTranscript(videoId)

      if (!transcriptText) {
        throw new Error('Could not fetch transcript. The video may not have captions enabled. Try the manual transcript option below.')
      }

      setTranscript(transcriptText)

      setStep('recipe')
      let extractedRecipe

      if (extractionMode === 'ai' && apiKey) {
        extractedRecipe = await extractRecipeWithAI(transcriptText, title, apiKey, aiProvider)
      } else {
        extractedRecipe = extractRecipeWithRules(transcriptText, title)
      }

      setRecipe(extractedRecipe)
      saveRecipeToHistory(extractedRecipe)
      saveSettings()

    } catch (err) {
      setError(err.message)
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const handleManualTranscript = async () => {
    setError('')
    setLoading(true)

    try {
      if (!transcript.trim()) {
        throw new Error('Please paste a transcript first.')
      }

      if (extractionMode === 'ai' && !apiKey) {
        throw new Error('AI mode requires an API key. Switch to Smart Parser mode or enter an API key.')
      }

      setStep('recipe')
      let extractedRecipe

      if (extractionMode === 'ai' && apiKey) {
        extractedRecipe = await extractRecipeWithAI(transcript, videoTitle, apiKey, aiProvider)
      } else {
        extractedRecipe = extractRecipeWithRules(transcript, videoTitle)
      }

      setRecipe(extractedRecipe)
      saveRecipeToHistory(extractedRecipe)
      saveSettings()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setYoutubeUrl('')
    setVideoTitle('')
    setTranscript('')
    setRecipe('')
    setError('')
    setStep('input')
    setShowTranscript(false)
  }

  const deleteRecipe = (id) => {
    const updated = savedRecipes.filter(r => r.id !== id)
    setSavedRecipes(updated)
    localStorage.setItem('recipe_extractor_recipes', JSON.stringify(updated))
  }

  const loadSavedRecipe = (savedRecipe) => {
    setYoutubeUrl(savedRecipe.videoUrl)
    setVideoTitle(savedRecipe.videoTitle)
    setRecipe(savedRecipe.recipe)
    setStep('recipe')
  }

  // Re-extract with different mode
  const reExtract = async (mode) => {
    if (!transcript) return

    setLoading(true)
    setError('')

    try {
      if (mode === 'ai' && !apiKey) {
        throw new Error('AI mode requires an API key.')
      }

      let extractedRecipe
      if (mode === 'ai' && apiKey) {
        extractedRecipe = await extractRecipeWithAI(transcript, videoTitle, apiKey, aiProvider)
      } else {
        extractedRecipe = extractRecipeWithRules(transcript, videoTitle)
      }

      setRecipe(extractedRecipe)
      setExtractionMode(mode)
      saveSettings()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-orange-900">BBQ Recipe Extractor</h2>
          <p className="text-gray-600 text-sm mt-1">
            Extract grill temps, cooking times, and tips from YouTube BBQ videos
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            <span className="text-orange-800">
              {step === 'transcript' ? 'Fetching video transcript...' :
               extractionMode === 'ai' ? 'Extracting recipe with AI...' : 'Analyzing transcript...'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!recipe ? (
        <div className="space-y-6">
          {/* Extraction Mode Toggle */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-gray-800 mb-3">Extraction Method</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setExtractionMode('smart')}
                className={`flex-1 p-3 rounded-lg border-2 transition ${
                  extractionMode === 'smart'
                    ? 'border-orange-500 bg-orange-100 text-orange-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="font-semibold">Smart Parser</div>
                <div className="text-xs mt-1">No API key needed - works instantly</div>
              </button>
              <button
                onClick={() => setExtractionMode('ai')}
                className={`flex-1 p-3 rounded-lg border-2 transition ${
                  extractionMode === 'ai'
                    ? 'border-purple-500 bg-purple-100 text-purple-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="font-semibold">AI-Powered</div>
                <div className="text-xs mt-1">Requires API key - more detailed</div>
              </button>
            </div>
          </div>

          {/* AI Settings (only show if AI mode selected) */}
          {extractionMode === 'ai' && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-3">AI Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Provider
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="openai">OpenAI (GPT-4o-mini)</option>
                    <option value="anthropic">Anthropic (Claude 3.5 Haiku)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <p className="text-xs text-purple-700 mt-2">
                Your API key is stored locally and only sent to the AI provider.
              </p>
            </div>
          )}

          {/* YouTube URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Video URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={handleExtract}
                disabled={loading || !youtubeUrl}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Extract Recipe
              </button>
            </div>
          </div>

          {/* Manual Transcript Option */}
          <div className="border-t pt-6">
            <details className="group">
              <summary className="cursor-pointer text-gray-700 font-medium flex items-center gap-2">
                <span className="text-orange-600 group-open:rotate-90 transition-transform">&#9654;</span>
                Manual Transcript Input (if auto-fetch fails)
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Title (optional)
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g., Perfect Brisket on Offset Smoker"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paste Transcript
                  </label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Copy the transcript from YouTube and paste it here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 min-h-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How to get transcript: Open YouTube video &rarr; Click "..." below video &rarr; Show transcript &rarr; Copy all text
                  </p>
                </div>
                <button
                  onClick={handleManualTranscript}
                  disabled={loading || !transcript.trim()}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50"
                >
                  Extract from Pasted Transcript
                </button>
              </div>
            </details>
          </div>

          {/* Saved Recipes */}
          {savedRecipes.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Recipes</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedRecipes.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => loadSavedRecipe(r)}
                    >
                      <p className="font-medium text-gray-800 truncate">
                        {r.videoTitle || 'Untitled Recipe'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteRecipe(r.id)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Recipe Display */
        <div className="space-y-6">
          {/* Video Info */}
          {videoTitle && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-bold text-orange-900 text-lg">{videoTitle}</h3>
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-800 text-sm underline"
                >
                  Watch on YouTube
                </a>
              )}
            </div>
          )}

          {/* Re-extraction options */}
          {transcript && (
            <div className="flex gap-2 items-center text-sm">
              <span className="text-gray-600">Re-extract with:</span>
              <button
                onClick={() => reExtract('smart')}
                disabled={loading}
                className={`px-3 py-1 rounded ${
                  extractionMode === 'smart'
                    ? 'bg-orange-200 text-orange-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Smart Parser
              </button>
              {apiKey && (
                <button
                  onClick={() => reExtract('ai')}
                  disabled={loading}
                  className={`px-3 py-1 rounded ${
                    extractionMode === 'ai'
                      ? 'bg-purple-200 text-purple-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  AI-Powered
                </button>
              )}
            </div>
          )}

          {/* Recipe Content */}
          <div className="prose prose-orange max-w-none bg-gray-50 p-6 rounded-lg">
            <ReactMarkdown>{recipe}</ReactMarkdown>
          </div>

          {/* Show transcript toggle */}
          {transcript && (
            <div>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                {showTranscript ? 'Hide' : 'Show'} original transcript
              </button>
              {showTranscript && (
                <div className="mt-2 p-4 bg-gray-100 rounded-lg text-sm text-gray-700 max-h-64 overflow-y-auto">
                  {transcript}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              onClick={() => downloadPaprikaRecipe(recipe, youtubeUrl, videoTitle)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Download for Paprika 3
            </button>
            <button
              onClick={() => downloadAsText(recipe, youtubeUrl, videoTitle)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Download as Text
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(recipe)
                alert('Recipe copied to clipboard!')
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition font-medium"
            >
              Extract Another Recipe
            </button>
          </div>

          {/* Paprika Import Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <h4 className="font-semibold text-blue-900 mb-2">Importing to Paprika 3</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Click "Download for Paprika 3" above</li>
              <li>Open Paprika 3 on your device</li>
              <li>Go to File &rarr; Import &rarr; Recipe File</li>
              <li>Select the downloaded .paprikarecipe file</li>
              <li>Edit the recipe to organize ingredients if needed</li>
            </ol>
            <p className="mt-2 text-blue-600">
              <strong>Alternative:</strong> Copy to clipboard and paste into a new Paprika recipe.
            </p>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-semibold text-amber-900 mb-2">Tips for Best Results</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>- Works best with videos that have auto-generated or manual captions</li>
          <li>- BBQ tutorial videos with clear temp/time callouts work great</li>
          <li>- The Smart Parser finds temperatures, times, and BBQ keywords automatically</li>
          <li>- Popular channels: Hey Grill Hey, Meat Church, Mad Scientist BBQ, How To BBQ Right</li>
          <li>- If auto-fetch fails, manually copy the transcript from YouTube</li>
        </ul>
      </div>
    </div>
  )
}

export default YouTubeRecipeExtractor
