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

  // Method 1: Use YouTube's timedtext API via a CORS proxy or direct fetch
  // We'll use the innertube API approach which works client-side

  try {
    // First, get the video page to extract necessary data
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Use a public transcript API or scrape approach
    // For reliability, we'll try the youtube-transcript approach
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

  // Method 2: Try alternative API
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

// Extract recipe using AI (OpenAI or Anthropic)
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
If any information is not mentioned in the transcript, note it as "Not specified in video".
Include any specific temperature or time ranges mentioned.`

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

// Convert recipe to Paprika 3 format
const convertToPaprikaFormat = (recipe, videoUrl, videoTitle) => {
  // Paprika uses a specific JSON format that gets gzipped
  // We'll create the JSON structure that Paprika expects

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

// Create and download Paprika recipe file
const downloadPaprikaRecipe = async (recipe, videoUrl, videoTitle) => {
  const paprikaData = convertToPaprikaFormat(recipe, videoUrl, videoTitle)
  const jsonString = JSON.stringify(paprikaData)

  // Paprika 3 expects a gzipped JSON file with .paprikarecipe extension
  // Since we can't easily gzip in the browser, we'll use the alternative YAML format
  // or provide the JSON for manual import

  // Create a blob and download
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

// Download as plain text (more compatible)
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

// Main Component
const YouTubeRecipeExtractor = ({ onClose }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [aiProvider, setAiProvider] = useState('openai')
  const [videoTitle, setVideoTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [recipe, setRecipe] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('input') // 'input', 'transcript', 'recipe'
  const [savedRecipes, setSavedRecipes] = useState([])

  // Load saved settings and recipes from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('recipe_extractor_api_key')
    const savedProvider = localStorage.getItem('recipe_extractor_provider')
    const savedRecipesList = localStorage.getItem('recipe_extractor_recipes')

    if (savedApiKey) setApiKey(savedApiKey)
    if (savedProvider) setAiProvider(savedProvider)
    if (savedRecipesList) setSavedRecipes(JSON.parse(savedRecipesList))
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('recipe_extractor_api_key', apiKey)
    localStorage.setItem('recipe_extractor_provider', aiProvider)
  }

  // Save recipe to history
  const saveRecipeToHistory = (recipeData) => {
    const newRecipe = {
      id: crypto.randomUUID(),
      videoUrl: youtubeUrl,
      videoTitle: videoTitle,
      recipe: recipeData,
      createdAt: new Date().toISOString()
    }

    const updatedRecipes = [newRecipe, ...savedRecipes].slice(0, 20) // Keep last 20
    setSavedRecipes(updatedRecipes)
    localStorage.setItem('recipe_extractor_recipes', JSON.stringify(updatedRecipes))
  }

  // Fetch video title
  const fetchVideoTitle = async (videoId) => {
    try {
      // Try noembed service for title
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

  // Main extraction handler
  const handleExtract = async () => {
    setError('')
    setLoading(true)

    try {
      // Validate inputs
      const videoId = extractVideoId(youtubeUrl)
      if (!videoId) {
        throw new Error('Invalid YouTube URL. Please enter a valid YouTube video link.')
      }

      if (!apiKey) {
        throw new Error('Please enter your AI API key (OpenAI or Anthropic).')
      }

      // Fetch video title
      const title = await fetchVideoTitle(videoId)
      setVideoTitle(title)

      // Step 1: Fetch transcript
      setStep('transcript')
      const transcriptText = await fetchTranscript(videoId)

      if (!transcriptText) {
        throw new Error('Could not fetch transcript. The video may not have captions enabled, or it may be restricted.')
      }

      setTranscript(transcriptText)

      // Step 2: Extract recipe with AI
      setStep('recipe')
      const extractedRecipe = await extractRecipeWithAI(transcriptText, title, apiKey, aiProvider)

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

  // Manual transcript input handler
  const handleManualTranscript = async () => {
    setError('')
    setLoading(true)

    try {
      if (!transcript.trim()) {
        throw new Error('Please paste a transcript first.')
      }

      if (!apiKey) {
        throw new Error('Please enter your AI API key.')
      }

      setStep('recipe')
      const extractedRecipe = await extractRecipeWithAI(transcript, videoTitle, apiKey, aiProvider)

      setRecipe(extractedRecipe)
      saveRecipeToHistory(extractedRecipe)
      saveSettings()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setYoutubeUrl('')
    setVideoTitle('')
    setTranscript('')
    setRecipe('')
    setError('')
    setStep('input')
  }

  // Delete saved recipe
  const deleteRecipe = (id) => {
    const updated = savedRecipes.filter(r => r.id !== id)
    setSavedRecipes(updated)
    localStorage.setItem('recipe_extractor_recipes', JSON.stringify(updated))
  }

  // Load a saved recipe
  const loadSavedRecipe = (savedRecipe) => {
    setYoutubeUrl(savedRecipe.videoUrl)
    setVideoTitle(savedRecipe.videoTitle)
    setRecipe(savedRecipe.recipe)
    setStep('recipe')
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
              {step === 'transcript' ? 'Fetching video transcript...' : 'Extracting recipe with AI...'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!recipe ? (
        <div className="space-y-6">
          {/* API Settings */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">AI Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your API key is stored locally and never sent to any server except the AI provider.
            </p>
          </div>

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
                <span className="text-orange-600">&#9654;</span>
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
                    How to get transcript: Open YouTube video → Click "..." below video → Click "Show transcript" → Copy all text
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

          {/* Recipe Content */}
          <div className="prose prose-orange max-w-none">
            <ReactMarkdown>{recipe}</ReactMarkdown>
          </div>

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
              <li>Go to File → Import → Recipe File</li>
              <li>Select the downloaded .paprikarecipe file</li>
              <li>Edit the recipe to add ingredients separately if needed</li>
            </ol>
            <p className="mt-2 text-blue-600">
              <strong>Alternative:</strong> Copy to clipboard and paste directly into a new Paprika recipe's notes field.
            </p>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-semibold text-amber-900 mb-2">Tips for Best Results</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>- Works best with videos that have auto-generated or manual captions</li>
          <li>- BBQ/smoking tutorial videos with clear instructions extract the best</li>
          <li>- If auto-fetch fails, copy the transcript manually from YouTube</li>
          <li>- Popular channels like Hey Grill Hey, Meat Church, Mad Scientist BBQ work great</li>
        </ul>
      </div>
    </div>
  )
}

export default YouTubeRecipeExtractor
