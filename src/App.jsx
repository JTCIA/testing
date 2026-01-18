import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'

// Master tag list - you can customize these tags
const MASTER_TAGS = [
  'Career', 'Personal', 'Health', 'Finance', 'Learning',
  'Relationships', 'Goals', 'Ideas', 'Challenges', 'Wins',
  'Team', 'Strategy', 'Innovation', 'Leadership', 'Planning'
]

function App() {
  const [view, setView] = useState('journal') // 'journal', 'search', 'recap'
  const [journals, setJournals] = useState([])
  const [currentEntry, setCurrentEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    focus: '',
    insights: '',
    sparks: '',
    roadblocks: ''
  })
  const [entryTags, setEntryTags] = useState({
    focus: [],
    insights: [],
    sparks: [],
    roadblocks: []
  })
  const [searchTags, setSearchTags] = useState([])
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState([])

  // Load journals from local storage on startup
  useEffect(() => {
    const saved = localStorage.getItem('productivityJournals')
    if (saved) {
      setJournals(JSON.parse(saved))
    }
  }, [])

  // Save journals to local storage whenever they change
  useEffect(() => {
    if (journals.length > 0) {
      localStorage.setItem('productivityJournals', JSON.stringify(journals))
    }
  }, [journals])

  // Check if there's already an entry for today
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayEntry = journals.find(j => j.date === today)
    if (todayEntry) {
      setCurrentEntry(todayEntry)
      setEntryTags(todayEntry.tags || {
        focus: [],
        insights: [],
        sparks: [],
        roadblocks: []
      })
    }
  }, [])

  const handleInputChange = (section, value) => {
    setCurrentEntry(prev => ({
      ...prev,
      [section]: value
    }))
  }

  const toggleTag = (section, tag) => {
    setEntryTags(prev => ({
      ...prev,
      [section]: prev[section].includes(tag)
        ? prev[section].filter(t => t !== tag)
        : [...prev[section], tag]
    }))
  }

  // Simple keyword-based tag suggestion
  const generateTagSuggestions = () => {
    const allText = `${currentEntry.focus} ${currentEntry.insights} ${currentEntry.sparks} ${currentEntry.roadblocks}`.toLowerCase()

    const suggestions = MASTER_TAGS.filter(tag => {
      const tagLower = tag.toLowerCase()
      // Check if the tag or related keywords appear in the text
      const keywords = {
        'Career': ['career', 'job', 'work', 'professional'],
        'Personal': ['personal', 'myself', 'self'],
        'Health': ['health', 'exercise', 'wellness', 'fitness', 'sleep'],
        'Finance': ['finance', 'money', 'budget', 'financial', 'cost'],
        'Learning': ['learn', 'study', 'course', 'skill', 'training'],
        'Relationships': ['relationship', 'team', 'people', 'colleague'],
        'Goals': ['goal', 'objective', 'target', 'achieve'],
        'Ideas': ['idea', 'thought', 'concept', 'brainstorm'],
        'Challenges': ['challenge', 'problem', 'issue', 'difficult', 'struggle'],
        'Wins': ['win', 'success', 'achieve', 'complete', 'done', 'finished'],
        'Team': ['team', 'collaborate', 'group', 'together'],
        'Strategy': ['strategy', 'plan', 'approach', 'direction'],
        'Innovation': ['innovation', 'new', 'creative', 'improve'],
        'Leadership': ['lead', 'leadership', 'manage', 'direct'],
        'Planning': ['plan', 'schedule', 'organize', 'prepare']
      }

      const relatedWords = keywords[tag] || [tagLower]
      return relatedWords.some(word => allText.includes(word))
    })

    setSuggestedTags(suggestions)
    setShowTagSuggestions(true)
  }

  const applySuggestedTag = (tag) => {
    // Add to all sections that don't already have it
    setEntryTags(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(section => {
        if (currentEntry[section] && !updated[section].includes(tag)) {
          updated[section] = [...updated[section], tag]
        }
      })
      return updated
    })
  }

  const saveJournal = () => {
    const entry = {
      ...currentEntry,
      tags: entryTags,
      savedAt: new Date().toISOString()
    }

    setJournals(prev => {
      const existing = prev.findIndex(j => j.date === entry.date)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = entry
        return updated
      }
      return [...prev, entry]
    })

    alert('Journal saved successfully!')

    // Reset for next entry
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setCurrentEntry({
      date: format(new Date(), 'yyyy-MM-dd'),
      focus: '',
      insights: '',
      sparks: '',
      roadblocks: ''
    })
    setEntryTags({
      focus: [],
      insights: [],
      sparks: [],
      roadblocks: []
    })
    setShowTagSuggestions(false)
  }

  const getFilteredJournals = () => {
    if (searchTags.length === 0) return journals

    return journals.filter(journal => {
      const allJournalTags = Object.values(journal.tags || {}).flat()
      return searchTags.every(searchTag => allJournalTags.includes(searchTag))
    })
  }

  const getWeeklyRecap = () => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const weekJournals = journals.filter(journal => {
      const date = parseISO(journal.date)
      return isWithinInterval(date, { start: weekStart, end: weekEnd })
    })

    // Collect all tags and their frequencies
    const tagFrequency = {}
    const allEntries = {
      focus: [],
      insights: [],
      sparks: [],
      roadblocks: []
    }

    weekJournals.forEach(journal => {
      Object.entries(journal.tags || {}).forEach(([section, tags]) => {
        tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
        })
      })

      Object.keys(allEntries).forEach(section => {
        if (journal[section]) {
          allEntries[section].push(journal[section])
        }
      })
    })

    return { weekJournals, tagFrequency, allEntries }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Productivity Journal</h1>
          <p className="text-gray-600">Track your daily progress and insights</p>

          {/* Navigation */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setView('journal')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'journal'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Daily Journal
            </button>
            <button
              onClick={() => setView('search')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'search'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setView('recap')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'recap'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly Recap
            </button>
          </div>
        </div>

        {/* Journal Entry View */}
        {view === 'journal' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={currentEntry.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Focus Section */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-indigo-900 mb-2">
                Focus for Today
              </label>
              <textarea
                value={currentEntry.focus}
                onChange={(e) => handleInputChange('focus', e.target.value)}
                placeholder="What are your main priorities today?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-24"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {MASTER_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag('focus', tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      entryTags.focus.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Insights Section */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-indigo-900 mb-2">
                Insights for Current Projects
              </label>
              <textarea
                value={currentEntry.insights}
                onChange={(e) => handleInputChange('insights', e.target.value)}
                placeholder="What have you learned or realized about your current work?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-24"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {MASTER_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag('insights', tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      entryTags.insights.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Sparks Section */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-indigo-900 mb-2">
                Sparks for Future Projects
              </label>
              <textarea
                value={currentEntry.sparks}
                onChange={(e) => handleInputChange('sparks', e.target.value)}
                placeholder="What new ideas or opportunities are you thinking about?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-24"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {MASTER_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag('sparks', tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      entryTags.sparks.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Roadblocks Section */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-indigo-900 mb-2">
                Roadblocks
              </label>
              <textarea
                value={currentEntry.roadblocks}
                onChange={(e) => handleInputChange('roadblocks', e.target.value)}
                placeholder="What challenges or obstacles are you facing?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-24"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {MASTER_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag('roadblocks', tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      entryTags.roadblocks.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Suggestions */}
            <div className="mb-6">
              <button
                onClick={generateTagSuggestions}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Suggest Tags
              </button>

              {showTagSuggestions && suggestedTags.length > 0 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-medium text-purple-900 mb-2">Suggested tags based on your entry:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => applySuggestedTag(tag)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showTagSuggestions && suggestedTags.length === 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600">No tag suggestions found. Try adding more details to your entries.</p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={saveJournal}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold text-lg"
            >
              Save Journal
            </button>
          </div>
        )}

        {/* Search View */}
        {view === 'search' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Search Your Journals</h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Filter by tags (select multiple):</p>
              <div className="flex flex-wrap gap-2">
                {MASTER_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      searchTags.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {searchTags.length > 0 && (
                <button
                  onClick={() => setSearchTags([])}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="space-y-4">
              {getFilteredJournals().length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {searchTags.length > 0
                    ? 'No journals found with selected tags'
                    : 'No journals yet. Start writing!'}
                </p>
              ) : (
                getFilteredJournals()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((journal, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-indigo-900">
                          {format(parseISO(journal.date), 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(Object.values(journal.tags || {}).flat())].map(tag => (
                            <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {journal.focus && (
                        <div className="mb-2">
                          <strong className="text-sm text-gray-700">Focus:</strong>
                          <p className="text-gray-900 mt-1">{journal.focus}</p>
                        </div>
                      )}

                      {journal.insights && (
                        <div className="mb-2">
                          <strong className="text-sm text-gray-700">Insights:</strong>
                          <p className="text-gray-900 mt-1">{journal.insights}</p>
                        </div>
                      )}

                      {journal.sparks && (
                        <div className="mb-2">
                          <strong className="text-sm text-gray-700">Sparks:</strong>
                          <p className="text-gray-900 mt-1">{journal.sparks}</p>
                        </div>
                      )}

                      {journal.roadblocks && (
                        <div className="mb-2">
                          <strong className="text-sm text-gray-700">Roadblocks:</strong>
                          <p className="text-gray-900 mt-1">{journal.roadblocks}</p>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Weekly Recap View */}
        {view === 'recap' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Weekly Recap</h2>

            {(() => {
              const { weekJournals, tagFrequency, allEntries } = getWeeklyRecap()

              if (weekJournals.length === 0) {
                return (
                  <p className="text-gray-500 text-center py-8">
                    No journal entries this week yet.
                  </p>
                )
              }

              const topTags = Object.entries(tagFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)

              return (
                <div className="space-y-6">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h3 className="font-bold text-indigo-900 mb-2">Week Summary</h3>
                    <p className="text-gray-700">
                      You completed <strong>{weekJournals.length}</strong> journal entries this week.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-indigo-900 mb-3">Top Themes This Week</h3>
                    <div className="flex flex-wrap gap-2">
                      {topTags.map(([tag, count]) => (
                        <div key={tag} className="px-4 py-2 bg-purple-100 text-purple-900 rounded-lg">
                          <span className="font-medium">{tag}</span>
                          <span className="ml-2 text-sm">({count}x)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {allEntries.focus.length > 0 && (
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2">Focus Areas</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {allEntries.focus.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {allEntries.insights.length > 0 && (
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2">Key Insights</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {allEntries.insights.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {allEntries.sparks.length > 0 && (
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2">Future Ideas</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {allEntries.sparks.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {allEntries.roadblocks.length > 0 && (
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2">Challenges Faced</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {allEntries.roadblocks.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Total Journals: {journals.length}</p>
        </div>
      </div>
    </div>
  )
}

export default App
