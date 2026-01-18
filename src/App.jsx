import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'
import ReactMarkdown from 'react-markdown'

// Three tag buckets
const DOMAIN_TAGS = [
  'current-project',
  'team-project',
  'process-improvement',
  'future-idea',
  'people-leadership',
  'career-strategy',
  'risk-or-theme'
]

const CAREER_TAGS = [
  'director-path',
  'methodology',
  'QA-review',
  'audit-analytics',
  'talent-development'
]

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Component: Item Editor
const ItemEditor = ({
  section,
  item,
  index,
  projectTags,
  updateItemText,
  setItemDomainTag,
  toggleItemCareerTag,
  toggleItemProjectTag,
  deleteItem,
  suggestTagsForItem,
  addProjectTag
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState({ domain: [], career: [], project: [], newProjectTags: [] })

  const sectionLabels = {
    focus: 'Focus Item',
    insights: 'Insight',
    sparks: 'Spark',
    roadblocks: 'Roadblock'
  }

  const hasText = item.text.trim().length > 0
  const needsDomainTag = section !== 'focus' && hasText && !item.domainTag
  const isFocus = section === 'focus'

  const handleSuggestTags = () => {
    if (hasText) {
      const suggested = suggestTagsForItem(item.text)
      setSuggestions(suggested)
      setShowSuggestions(true)
    }
  }

  const applySuggestion = (type, tag) => {
    if (type === 'domain') {
      setItemDomainTag(section, item.id, tag)
    } else if (type === 'career') {
      if (!item.careerTags?.includes(tag)) {
        toggleItemCareerTag(section, item.id, tag)
      }
    } else if (type === 'project') {
      if (!item.projectTags?.includes(tag)) {
        toggleItemProjectTag(section, item.id, tag)
      }
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-700">
          {sectionLabels[section]} #{index + 1}
          {needsDomainTag && <span className="ml-2 text-red-600 text-sm">⚠ Domain tag required</span>}
          {isFocus && <span className="ml-2 text-gray-500 text-sm">(todo list - tags optional)</span>}
        </h4>
        <button
          onClick={() => deleteItem(section, item.id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      </div>

      <textarea
        value={item.text}
        onChange={(e) => updateItemText(section, item.id, e.target.value)}
        placeholder={isFocus ? "What do you need to focus on today?" : "Enter your thoughts..."}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-20 mb-3"
      />

      {/* Tag Suggestion Button */}
      {hasText && !isFocus && (
        <div className="mb-3">
          <button
            onClick={handleSuggestTags}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            ✨ Suggest Tags
          </button>

          {showSuggestions && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              {suggestions.domain.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-purple-900 mb-1">Suggested Domain Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.domain.map(tag => (
                      <button
                        key={tag}
                        onClick={() => applySuggestion('domain', tag)}
                        className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600"
                      >
                        + #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {suggestions.career.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-purple-900 mb-1">Suggested Career Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.career.map(tag => (
                      <button
                        key={tag}
                        onClick={() => applySuggestion('career', tag)}
                        className="px-2 py-1 bg-purple-500 text-white rounded-full text-xs hover:bg-purple-600"
                      >
                        + #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {suggestions.project.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-purple-900 mb-1">Suggested Project Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.project.map(tag => (
                      <button
                        key={tag}
                        onClick={() => applySuggestion('project', tag)}
                        className="px-2 py-1 bg-green-500 text-white rounded-full text-xs hover:bg-green-600"
                      >
                        + #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {suggestions.newProjectTags && suggestions.newProjectTags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-purple-900 mb-1">💡 Create New Project Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.newProjectTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          addProjectTag(tag)
                          // Auto-apply the tag after creating it
                          setTimeout(() => {
                            if (!item.projectTags?.includes(tag)) {
                              applySuggestion('project', tag)
                            }
                          }, 100)
                        }}
                        className="px-2 py-1 bg-yellow-500 text-white rounded-full text-xs hover:bg-yellow-600 flex items-center gap-1"
                      >
                        <span>✨ Create #{tag}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 italic">These tags don't exist yet - click to create and apply them</p>
                </div>
              )}
              {suggestions.domain.length === 0 && suggestions.career.length === 0 && suggestions.project.length === 0 && suggestions.newProjectTags.length === 0 && (
                <p className="text-xs text-gray-600">No tag suggestions found. The app will learn from your tagging patterns over time!</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Domain Tags (Required for non-Focus - only one) */}
      {!isFocus && (
        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Domain Tag <span className="text-red-600">*</span> (select one)
          </label>
        <div className="flex flex-wrap gap-2">
          {DOMAIN_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setItemDomainTag(section, item.id, tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                item.domainTag === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
        </div>
      )}

      {/* Career Tags (Optional - multiple) */}
      {!isFocus && (
      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Strategic Career Tags (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {CAREER_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleItemCareerTag(section, item.id, tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                item.careerTags?.includes(tag)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Project Tags (Optional - multiple) */}
      {!isFocus && projectTags.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Project Tags (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {projectTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleItemProjectTag(section, item.id, tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  item.projectTags?.includes(tag)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [view, setView] = useState('journal') // 'journal', 'search', 'recap', 'manage-tags', 'summaries'
  const [journals, setJournals] = useState([])
  const [projectTags, setProjectTags] = useState([]) // User-created project tags
  const [weeklySummaries, setWeeklySummaries] = useState([]) // Saved weekly summaries
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [currentJournal, setCurrentJournal] = useState({
    focus: [],
    insights: [],
    sparks: [],
    roadblocks: []
  })
  const [searchTags, setSearchTags] = useState([])
  const [newProjectTag, setNewProjectTag] = useState('')

  // Helper to convert old format data to new format
  const convertToNewFormat = (data) => {
    if (!data) return []
    if (Array.isArray(data)) return data
    // Old format: single string - convert to array with one item
    if (typeof data === 'string' && data.trim()) {
      return [{
        id: generateId(),
        text: data,
        domainTag: null,
        careerTags: [],
        projectTags: []
      }]
    }
    return []
  }

  // Load data from local storage
  useEffect(() => {
    const savedJournals = localStorage.getItem('productivityJournals')
    if (savedJournals) {
      const parsedJournals = JSON.parse(savedJournals)

      // Migrate old format to new format
      const migratedJournals = parsedJournals.map(journal => {
        const needsMigration =
          (journal.focus && !Array.isArray(journal.focus)) ||
          (journal.insights && !Array.isArray(journal.insights)) ||
          (journal.sparks && !Array.isArray(journal.sparks)) ||
          (journal.roadblocks && !Array.isArray(journal.roadblocks))

        if (needsMigration) {
          return {
            ...journal,
            focus: convertToNewFormat(journal.focus),
            insights: convertToNewFormat(journal.insights),
            sparks: convertToNewFormat(journal.sparks),
            roadblocks: convertToNewFormat(journal.roadblocks)
          }
        }
        return journal
      })

      setJournals(migratedJournals)
      // Save migrated data back to localStorage
      localStorage.setItem('productivityJournals', JSON.stringify(migratedJournals))
    }

    const savedProjectTags = localStorage.getItem('projectTags')
    if (savedProjectTags) {
      setProjectTags(JSON.parse(savedProjectTags))
    }

    const savedSummaries = localStorage.getItem('weeklySummaries')
    if (savedSummaries) {
      setWeeklySummaries(JSON.parse(savedSummaries))
    }
  }, [])

  // Save journals to local storage
  useEffect(() => {
    if (journals.length > 0) {
      localStorage.setItem('productivityJournals', JSON.stringify(journals))
    }
  }, [journals])

  // Save project tags to local storage
  useEffect(() => {
    if (projectTags.length > 0) {
      localStorage.setItem('projectTags', JSON.stringify(projectTags))
    }
  }, [projectTags])

  // Save weekly summaries to local storage
  useEffect(() => {
    if (weeklySummaries.length > 0) {
      localStorage.setItem('weeklySummaries', JSON.stringify(weeklySummaries))
    }
  }, [weeklySummaries])

  // Load journal for current date when date changes
  useEffect(() => {
    const existingJournal = journals.find(j => j.date === currentDate)
    if (existingJournal) {
      setCurrentJournal({
        focus: convertToNewFormat(existingJournal.focus),
        insights: convertToNewFormat(existingJournal.insights),
        sparks: convertToNewFormat(existingJournal.sparks),
        roadblocks: convertToNewFormat(existingJournal.roadblocks)
      })
    } else {
      setCurrentJournal({
        focus: [],
        insights: [],
        sparks: [],
        roadblocks: []
      })
    }
  }, [currentDate, journals])

  // Add a new item to a section
  const addItem = (section) => {
    const newItem = {
      id: generateId(),
      text: '',
      domainTag: null,
      careerTags: [],
      projectTags: []
    }
    setCurrentJournal(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }))
  }

  // Update item text
  const updateItemText = (section, itemId, text) => {
    setCurrentJournal(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === itemId ? { ...item, text } : item
      )
    }))
  }

  // Set domain tag (only one allowed)
  const setItemDomainTag = (section, itemId, tag) => {
    setCurrentJournal(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === itemId ? { ...item, domainTag: tag } : item
      )
    }))
  }

  // Toggle career tag
  const toggleItemCareerTag = (section, itemId, tag) => {
    setCurrentJournal(prev => ({
      ...prev,
      [section]: prev[section].map(item => {
        if (item.id === itemId) {
          const careerTags = item.careerTags.includes(tag)
            ? item.careerTags.filter(t => t !== tag)
            : [...item.careerTags, tag]
          return { ...item, careerTags }
        }
        return item
      })
    }))
  }

  // Toggle project tag
  const toggleItemProjectTag = (section, itemId, tag) => {
    setCurrentJournal(prev => ({
      ...prev,
      [section]: prev[section].map(item => {
        if (item.id === itemId) {
          const projectTags = item.projectTags.includes(tag)
            ? item.projectTags.filter(t => t !== tag)
            : [...item.projectTags, tag]
          return { ...item, projectTags }
        }
        return item
      })
    }))
  }

  // Delete an item
  const deleteItem = (section, itemId) => {
    setCurrentJournal(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== itemId)
    }))
  }

  // Add new project tag
  const addProjectTag = (tagToAdd) => {
    // If called with a parameter (from suggestions), use that; otherwise use the state
    const tag = tagToAdd || newProjectTag
    if (tag.trim() && !projectTags.includes(tag.trim())) {
      setProjectTags(prev => [...prev, tag.trim()])
      if (!tagToAdd) {
        // Only clear the input if it was added from the manual input field
        setNewProjectTag('')
      }
    }
  }

  // Delete project tag
  const deleteProjectTag = (tag) => {
    setProjectTags(prev => prev.filter(t => t !== tag))
  }

  // Validate journal before saving
  const validateJournal = () => {
    const errors = []
    // Focus doesn't require tags - it's just a todo list
    const sections = ['insights', 'sparks', 'roadblocks']

    sections.forEach(section => {
      currentJournal[section].forEach((item, idx) => {
        if (item.text.trim() && !item.domainTag) {
          errors.push(`${section.charAt(0).toUpperCase() + section.slice(1)} item ${idx + 1}: Missing domain tag`)
        }
      })
    })

    return errors
  }

  // Extract words from text (filtering common stop words)
  const extractWords = (text) => {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our',
      'their', 'me', 'him', 'them', 'us', 'am', 'from', 'as', 'by', 'about'
    ])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  }

  // Learn word patterns from historical journal entries for each tag
  const learnTagPatterns = () => {
    const tagPatterns = {
      domain: {},
      career: {}
    }

    // Initialize patterns for all tags
    DOMAIN_TAGS.forEach(tag => {
      tagPatterns.domain[tag] = {}
    })
    CAREER_TAGS.forEach(tag => {
      tagPatterns.career[tag] = {}
    })

    // Analyze all historical journals
    journals.forEach(journal => {
      const sections = ['insights', 'sparks', 'roadblocks']
      sections.forEach(section => {
        journal[section]?.forEach(item => {
          if (!item.text) return

          const words = extractWords(item.text)

          // Learn from domain tags
          if (item.domainTag && tagPatterns.domain[item.domainTag]) {
            words.forEach(word => {
              tagPatterns.domain[item.domainTag][word] =
                (tagPatterns.domain[item.domainTag][word] || 0) + 1
            })
          }

          // Learn from career tags
          item.careerTags?.forEach(careerTag => {
            if (tagPatterns.career[careerTag]) {
              words.forEach(word => {
                tagPatterns.career[careerTag][word] =
                  (tagPatterns.career[careerTag][word] || 0) + 1
              })
            }
          })
        })
      })
    })

    return tagPatterns
  }

  // Calculate relevance score between text and a tag's learned patterns
  const calculateRelevance = (text, tagWordFrequencies) => {
    if (Object.keys(tagWordFrequencies).length === 0) return 0

    const textWords = new Set(extractWords(text))
    let score = 0
    let totalFrequency = 0

    Object.entries(tagWordFrequencies).forEach(([word, frequency]) => {
      totalFrequency += frequency
      if (textWords.has(word)) {
        score += frequency
      }
    })

    // Return normalized score (0-1)
    return totalFrequency > 0 ? score / totalFrequency : 0
  }

  // Extract potential project names from text
  const extractPotentialProjectTags = (text) => {
    const suggestions = []

    // Look for capitalized words/phrases (2-3 words max)
    const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g
    const matches = text.match(capitalizedPattern) || []

    matches.forEach(match => {
      const normalized = match.toLowerCase().replace(/\s+/g, '-')
      // Only suggest if it's not already a project tag and is reasonable length
      if (!projectTags.includes(normalized) && normalized.length >= 3 && normalized.length <= 30) {
        if (!suggestions.includes(normalized)) {
          suggestions.push(normalized)
        }
      }
    })

    // Look for patterns like "working on X", "for the X project", "X initiative"
    const patterns = [
      /(?:working on|focusing on|building|developing)\s+(?:the\s+)?([a-zA-Z0-9\s-]+?)(?:\s+project|\s+initiative|\s+system|$)/gi,
      /(?:for|with)\s+(?:the\s+)?([a-zA-Z][a-zA-Z0-9\s-]+?)\s+(?:project|initiative|program)/gi
    ]

    patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)]
      matches.forEach(match => {
        if (match[1]) {
          const normalized = match[1].trim().toLowerCase().replace(/\s+/g, '-')
          if (!projectTags.includes(normalized) && normalized.length >= 3 && normalized.length <= 30) {
            if (!suggestions.includes(normalized)) {
              suggestions.push(normalized)
            }
          }
        }
      })
    })

    return suggestions.slice(0, 3) // Limit to top 3 suggestions
  }

  // Suggest tags for an item based on learned patterns from history
  const suggestTagsForItem = (text) => {
    const suggestions = {
      domain: [],
      career: [],
      project: [],
      newProjectTags: []
    }

    // If no historical data, return empty suggestions
    if (journals.length === 0) {
      // Still check existing project tags by simple matching
      projectTags.forEach(tag => {
        if (text.toLowerCase().includes(tag.toLowerCase())) {
          suggestions.project.push(tag)
        }
      })
      // Suggest new project tags
      suggestions.newProjectTags = extractPotentialProjectTags(text)
      return suggestions
    }

    // Learn patterns from history
    const tagPatterns = learnTagPatterns()

    // Score each domain tag based on learned patterns
    const domainScores = []
    DOMAIN_TAGS.forEach(tag => {
      const score = calculateRelevance(text, tagPatterns.domain[tag])
      if (score > 0.1) { // Only suggest if relevance is above threshold
        domainScores.push({ tag, score })
      }
    })

    // Sort by score and take top suggestions
    suggestions.domain = domainScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.tag)

    // Score each career tag based on learned patterns
    const careerScores = []
    CAREER_TAGS.forEach(tag => {
      const score = calculateRelevance(text, tagPatterns.career[tag])
      if (score > 0.1) { // Only suggest if relevance is above threshold
        careerScores.push({ tag, score })
      }
    })

    // Sort by score and take top suggestions
    suggestions.career = careerScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.tag)

    // Check existing project tags by matching text
    projectTags.forEach(tag => {
      if (text.toLowerCase().includes(tag.toLowerCase())) {
        suggestions.project.push(tag)
      }
    })

    // Suggest new project tags based on text analysis
    suggestions.newProjectTags = extractPotentialProjectTags(text)

    return suggestions
  }

  // Generate prompt for LLM to summarize the week
  const generateWeeklySummaryPrompt = (weekData) => {
    const { weekJournals, domainTagFrequency, careerTagFrequency, projectTagFrequency } = weekData

    let prompt = `Please analyze my productivity journal entries from this week and provide a thoughtful summary.

**Week Overview:**
- Total entries: ${weekJournals.length}
- Date range: ${format(parseISO(weekJournals[0]?.date || new Date().toISOString()), 'MMMM d, yyyy')} to ${format(parseISO(weekJournals[weekJournals.length - 1]?.date || new Date().toISOString()), 'MMMM d, yyyy')}

**Domain Distribution:**
${Object.entries(domainTagFrequency).map(([tag, count]) => `- ${tag}: ${count} entries`).join('\n')}

**Career Focus:**
${Object.keys(careerTagFrequency).length > 0 ? Object.entries(careerTagFrequency).map(([tag, count]) => `- ${tag}: ${count} entries`).join('\n') : 'None this week'}

**Active Projects:**
${Object.keys(projectTagFrequency).length > 0 ? Object.entries(projectTagFrequency).map(([tag, count]) => `- ${tag}: ${count} entries`).join('\n') : 'None this week'}

**Detailed Entries:**

`

    weekJournals.forEach((journal, idx) => {
      prompt += `\n### ${format(parseISO(journal.date), 'EEEE, MMMM d, yyyy')}\n\n`

      if (journal.focus && journal.focus.length > 0) {
        prompt += `**Focus:**\n`
        journal.focus.forEach(item => {
          prompt += `- ${item.text}\n`
        })
        prompt += '\n'
      }

      if (journal.insights && journal.insights.length > 0) {
        prompt += `**Insights:**\n`
        journal.insights.forEach(item => {
          const tags = [
            item.domainTag ? `#${item.domainTag}` : null,
            ...(item.careerTags || []).map(t => `#${t}`),
            ...(item.projectTags || []).map(t => `#${t}`)
          ].filter(Boolean).join(' ')
          prompt += `- ${item.text} [${tags}]\n`
        })
        prompt += '\n'
      }

      if (journal.sparks && journal.sparks.length > 0) {
        prompt += `**Sparks (Future Ideas):**\n`
        journal.sparks.forEach(item => {
          const tags = [
            item.domainTag ? `#${item.domainTag}` : null,
            ...(item.careerTags || []).map(t => `#${t}`),
            ...(item.projectTags || []).map(t => `#${t}`)
          ].filter(Boolean).join(' ')
          prompt += `- ${item.text} [${tags}]\n`
        })
        prompt += '\n'
      }

      if (journal.roadblocks && journal.roadblocks.length > 0) {
        prompt += `**Roadblocks:**\n`
        journal.roadblocks.forEach(item => {
          const tags = [
            item.domainTag ? `#${item.domainTag}` : null,
            ...(item.careerTags || []).map(t => `#${t}`),
            ...(item.projectTags || []).map(t => `#${t}`)
          ].filter(Boolean).join(' ')
          prompt += `- ${item.text} [${tags}]\n`
        })
        prompt += '\n'
      }
    })

    prompt += `\n**Please provide:**
1. A 2-3 paragraph executive summary of the week
2. Key themes and patterns you notice
3. Wins and accomplishments
4. Areas of concern or focus needed
5. Recommendations for next week`

    return prompt
  }

  // Save a weekly summary
  const saveWeeklySummary = (summary, weekStart, weekEnd) => {
    const newSummary = {
      id: generateId(),
      summary,
      weekStart,
      weekEnd,
      createdAt: new Date().toISOString()
    }

    setWeeklySummaries(prev => [...prev, newSummary])
    alert('Weekly summary saved!')
  }

  // Delete a weekly summary
  const deleteWeeklySummary = (id) => {
    setWeeklySummaries(prev => prev.filter(s => s.id !== id))
  }

  // Save journal
  const saveJournal = () => {
    const errors = validateJournal()
    if (errors.length > 0) {
      alert('Please fix these errors:\n\n' + errors.join('\n'))
      return
    }

    // Remove items with no text
    const cleanedJournal = {
      focus: currentJournal.focus.filter(item => item.text.trim()),
      insights: currentJournal.insights.filter(item => item.text.trim()),
      sparks: currentJournal.sparks.filter(item => item.text.trim()),
      roadblocks: currentJournal.roadblocks.filter(item => item.text.trim())
    }

    const entry = {
      date: currentDate,
      ...cleanedJournal,
      savedAt: new Date().toISOString()
    }

    setJournals(prev => {
      const existing = prev.findIndex(j => j.date === currentDate)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = entry
        return updated
      }
      return [...prev, entry]
    })

    alert('Journal saved successfully!')
  }

  // Get all tags from a journal
  const getAllTagsFromJournal = (journal) => {
    const tags = new Set()
    const sections = ['focus', 'insights', 'sparks', 'roadblocks']

    sections.forEach(section => {
      if (journal[section]) {
        journal[section].forEach(item => {
          if (item.domainTag) tags.add(item.domainTag)
          item.careerTags?.forEach(tag => tags.add(tag))
          item.projectTags?.forEach(tag => tags.add(tag))
        })
      }
    })

    return Array.from(tags)
  }

  // Filter journals by tags
  const getFilteredJournals = () => {
    if (searchTags.length === 0) return journals

    return journals.filter(journal => {
      const journalTags = getAllTagsFromJournal(journal)
      return searchTags.every(searchTag => journalTags.includes(searchTag))
    })
  }

  // Get weekly recap
  const getWeeklyRecap = () => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const weekJournals = journals.filter(journal => {
      const date = parseISO(journal.date)
      return isWithinInterval(date, { start: weekStart, end: weekEnd })
    })

    const tagFrequency = {}
    const domainTagFrequency = {}
    const careerTagFrequency = {}
    const projectTagFrequency = {}

    weekJournals.forEach(journal => {
      const sections = ['focus', 'insights', 'sparks', 'roadblocks']
      sections.forEach(section => {
        journal[section]?.forEach(item => {
          if (item.domainTag) {
            tagFrequency[item.domainTag] = (tagFrequency[item.domainTag] || 0) + 1
            domainTagFrequency[item.domainTag] = (domainTagFrequency[item.domainTag] || 0) + 1
          }
          item.careerTags?.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
            careerTagFrequency[tag] = (careerTagFrequency[tag] || 0) + 1
          })
          item.projectTags?.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
            projectTagFrequency[tag] = (projectTagFrequency[tag] || 0) + 1
          })
        })
      })
    })

    return { weekJournals, tagFrequency, domainTagFrequency, careerTagFrequency, projectTagFrequency }
  }

  // All available tags for search
  const allTags = [...DOMAIN_TAGS, ...CAREER_TAGS, ...projectTags]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Productivity Journal</h1>
          <p className="text-gray-600">Track your daily progress with structured tagging</p>

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
            <button
              onClick={() => setView('manage-tags')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'manage-tags'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Manage Project Tags
            </button>
            <button
              onClick={() => setView('summaries')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'summaries'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly Summaries
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
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Focus Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-900">Focus for Today</h2>
                <button
                  onClick={() => addItem('focus')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  + Add Focus Item
                </button>
              </div>
              {currentJournal.focus.length === 0 ? (
                <p className="text-gray-500 italic">No focus items yet. Click "Add Focus Item" to start.</p>
              ) : (
                currentJournal.focus.map((item, idx) => (
                  <ItemEditor
                    key={item.id}
                    section="focus"
                    item={item}
                    index={idx}
                    projectTags={projectTags}
                    updateItemText={updateItemText}
                    setItemDomainTag={setItemDomainTag}
                    toggleItemCareerTag={toggleItemCareerTag}
                    toggleItemProjectTag={toggleItemProjectTag}
                    deleteItem={deleteItem}
                    suggestTagsForItem={suggestTagsForItem}
                    addProjectTag={addProjectTag}
                  />
                ))
              )}
            </div>

            {/* Insights Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-900">Insights for Current Projects</h2>
                <button
                  onClick={() => addItem('insights')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  + Add Insight
                </button>
              </div>
              {currentJournal.insights.length === 0 ? (
                <p className="text-gray-500 italic">No insights yet. Click "Add Insight" to start.</p>
              ) : (
                currentJournal.insights.map((item, idx) => (
                  <ItemEditor
                    key={item.id}
                    section="insights"
                    item={item}
                    index={idx}
                    projectTags={projectTags}
                    updateItemText={updateItemText}
                    setItemDomainTag={setItemDomainTag}
                    toggleItemCareerTag={toggleItemCareerTag}
                    toggleItemProjectTag={toggleItemProjectTag}
                    deleteItem={deleteItem}
                    suggestTagsForItem={suggestTagsForItem}
                    addProjectTag={addProjectTag}
                  />
                ))
              )}
            </div>

            {/* Sparks Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-900">Sparks for Future Projects</h2>
                <button
                  onClick={() => addItem('sparks')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  + Add Spark
                </button>
              </div>
              {currentJournal.sparks.length === 0 ? (
                <p className="text-gray-500 italic">No sparks yet. Click "Add Spark" to start.</p>
              ) : (
                currentJournal.sparks.map((item, idx) => (
                  <ItemEditor
                    key={item.id}
                    section="sparks"
                    item={item}
                    index={idx}
                    projectTags={projectTags}
                    updateItemText={updateItemText}
                    setItemDomainTag={setItemDomainTag}
                    toggleItemCareerTag={toggleItemCareerTag}
                    toggleItemProjectTag={toggleItemProjectTag}
                    deleteItem={deleteItem}
                    suggestTagsForItem={suggestTagsForItem}
                    addProjectTag={addProjectTag}
                  />
                ))
              )}
            </div>

            {/* Roadblocks Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-900">Roadblocks</h2>
                <button
                  onClick={() => addItem('roadblocks')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  + Add Roadblock
                </button>
              </div>
              {currentJournal.roadblocks.length === 0 ? (
                <p className="text-gray-500 italic">No roadblocks yet. Click "Add Roadblock" to start.</p>
              ) : (
                currentJournal.roadblocks.map((item, idx) => (
                  <ItemEditor
                    key={item.id}
                    section="roadblocks"
                    item={item}
                    index={idx}
                    projectTags={projectTags}
                    updateItemText={updateItemText}
                    setItemDomainTag={setItemDomainTag}
                    toggleItemCareerTag={toggleItemCareerTag}
                    toggleItemProjectTag={toggleItemProjectTag}
                    deleteItem={deleteItem}
                    suggestTagsForItem={suggestTagsForItem}
                    addProjectTag={addProjectTag}
                  />
                ))
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={saveJournal}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-xl"
            >
              Save Journal
            </button>

            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
              <strong>Tip:</strong> You can reopen this journal any time by selecting the same date and adding more items throughout the day!
            </div>
          </div>
        )}

        {/* Search View */}
        {view === 'search' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Search Your Journals</h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Filter by tags (select multiple):</p>

              {/* Domain Tags */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Domain Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_TAGS.map(tag => (
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
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career Tags */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Strategic Career Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {CAREER_TAGS.map(tag => (
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
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Tags */}
              {projectTags.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Project Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {projectTags.map(tag => (
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
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchTags.length > 0 && (
                <button
                  onClick={() => setSearchTags([])}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="space-y-6">
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
                    <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="mb-4">
                        <h3 className="font-bold text-xl text-indigo-900 mb-2">
                          {format(parseISO(journal.date), 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {getAllTagsFromJournal(journal).map(tag => {
                            const isDomain = DOMAIN_TAGS.includes(tag)
                            const isCareer = CAREER_TAGS.includes(tag)
                            const color = isDomain ? 'blue' : isCareer ? 'purple' : 'green'
                            return (
                              <span
                                key={tag}
                                className={`px-2 py-1 bg-${color}-100 text-${color}-800 rounded-full text-xs`}
                              >
                                #{tag}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {['focus', 'insights', 'sparks', 'roadblocks'].map(section => {
                        if (!journal[section] || journal[section].length === 0) return null

                        const sectionTitles = {
                          focus: 'Focus',
                          insights: 'Insights',
                          sparks: 'Sparks',
                          roadblocks: 'Roadblocks'
                        }

                        return (
                          <div key={section} className="mb-4">
                            <h4 className="font-semibold text-gray-700 mb-2">{sectionTitles[section]}</h4>
                            <ul className="space-y-2">
                              {journal[section].map((item, itemIdx) => (
                                <li key={itemIdx} className="pl-4 border-l-2 border-gray-300">
                                  <p className="text-gray-900">{item.text}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.domainTag && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                        #{item.domainTag}
                                      </span>
                                    )}
                                    {item.careerTags?.map(tag => (
                                      <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                        #{tag}
                                      </span>
                                    ))}
                                    {item.projectTags?.map(tag => (
                                      <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
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
              const { weekJournals, tagFrequency, domainTagFrequency, careerTagFrequency, projectTagFrequency } = getWeeklyRecap()

              if (weekJournals.length === 0) {
                return (
                  <p className="text-gray-500 text-center py-8">
                    No journal entries this week yet.
                  </p>
                )
              }

              const topTags = Object.entries(tagFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)

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
                      {topTags.map(([tag, count]) => {
                        const isDomain = DOMAIN_TAGS.includes(tag)
                        const isCareer = CAREER_TAGS.includes(tag)
                        const color = isDomain ? 'blue' : isCareer ? 'purple' : 'green'
                        return (
                          <div key={tag} className={`px-4 py-2 bg-${color}-100 text-${color}-900 rounded-lg`}>
                            <span className="font-medium">#{tag}</span>
                            <span className="ml-2 text-sm">({count}x)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {Object.keys(domainTagFrequency).length > 0 && (
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-3">Domain Distribution</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(domainTagFrequency)
                          .sort((a, b) => b[1] - a[1])
                          .map(([tag, count]) => (
                            <div key={tag} className="px-3 py-2 bg-blue-50 border border-blue-200 rounded">
                              <span className="text-blue-900">#{tag}: </span>
                              <span className="font-bold text-blue-700">{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(careerTagFrequency).length > 0 && (
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-3">Career Focus</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(careerTagFrequency)
                          .sort((a, b) => b[1] - a[1])
                          .map(([tag, count]) => (
                            <div key={tag} className="px-3 py-2 bg-purple-50 border border-purple-200 rounded">
                              <span className="text-purple-900">#{tag}: </span>
                              <span className="font-bold text-purple-700">{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(projectTagFrequency).length > 0 && (
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-3">Active Projects</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(projectTagFrequency)
                          .sort((a, b) => b[1] - a[1])
                          .map(([tag, count]) => (
                            <div key={tag} className="px-3 py-2 bg-green-50 border border-green-200 rounded">
                              <span className="text-green-900">#{tag}: </span>
                              <span className="font-bold text-green-700">{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* LLM Summary Generation */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-bold text-indigo-900 mb-3">Generate AI Summary</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Copy the prompt below and paste it into ChatGPT, Claude, or your preferred AI assistant to generate a comprehensive weekly summary.
                    </p>

                    <button
                      onClick={() => {
                        const weekData = { weekJournals, domainTagFrequency, careerTagFrequency, projectTagFrequency }
                        const prompt = generateWeeklySummaryPrompt(weekData)
                        navigator.clipboard.writeText(prompt)
                        alert('Prompt copied to clipboard! Paste it into your AI assistant.')
                      }}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium mb-4"
                    >
                      📋 Copy Prompt for AI
                    </button>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste AI-generated summary here to save it:
                      </label>
                      <textarea
                        id="summary-input"
                        placeholder="Paste the summary from your AI assistant here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-40 mb-3"
                      />
                      <button
                        onClick={() => {
                          const summaryText = document.getElementById('summary-input').value
                          if (summaryText.trim()) {
                            const now = new Date()
                            const weekStart = startOfWeek(now, { weekStartsOn: 1 })
                            const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
                            saveWeeklySummary(summaryText, weekStart.toISOString(), weekEnd.toISOString())
                            document.getElementById('summary-input').value = ''
                          } else {
                            alert('Please paste a summary first!')
                          }
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        💾 Save Summary
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Manage Project Tags View */}
        {view === 'manage-tags' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Manage Project Tags</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add New Project Tag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectTag}
                  onChange={(e) => setNewProjectTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addProjectTag()}
                  placeholder="Enter tag name (e.g., project-alpha)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={addProjectTag}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Add Tag
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Project Tags</h3>
              {projectTags.length === 0 ? (
                <p className="text-gray-500 italic">No project tags yet. Add one above!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {projectTags.map(tag => (
                    <div
                      key={tag}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => deleteProjectTag(tag)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Tag System Overview</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span className="font-medium text-gray-700">Focus Items:</span> No tags required (simple todo list)</li>
                <li><span className="font-medium text-blue-700">Domain Tags:</span> Required for Insights, Sparks, and Roadblocks (select exactly one)</li>
                <li><span className="font-medium text-purple-700">Strategic Career Tags:</span> Optional (select zero or more)</li>
                <li><span className="font-medium text-green-700">Project Tags:</span> Optional, user-created (select zero or more)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Weekly Summaries View */}
        {view === 'summaries' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Saved Weekly Summaries</h2>

            {weeklySummaries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2">No saved summaries yet.</p>
                <p className="text-sm text-gray-400">Go to "Weekly Recap" to generate and save your first summary!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {weeklySummaries
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map(summary => (
                    <div key={summary.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-indigo-900">
                            Week of {format(parseISO(summary.weekStart), 'MMMM d')} - {format(parseISO(summary.weekEnd), 'MMMM d, yyyy')}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Saved on {format(parseISO(summary.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Delete this summary?')) {
                              deleteWeeklySummary(summary.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>{summary.summary}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Total Journals: {journals.length} | Project Tags: {projectTags.length} | Summaries: {weeklySummaries.length}</p>
        </div>
      </div>
    </div>
  )
}

export default App
