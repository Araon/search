import React from 'react'
import SearchIcon from './components/icons/Search.js'
import { EVENTS } from './utils/analyticsConstants.js'
import { usePostHog } from 'posthog-js/react'

const SUGGESTIONS = {
    BORING: [
        'Fairy Tail',
        'Cowboy Bebop',
        'Detective Conan',
        'Naruto',
        'One Piece',
        'High School DxD',
        'Hoshi no Tabi',
    ],
    COOL: [
        'Rich girl joins guild with a flying cat and a dragon slayer',
        'Bounty hunters with a past travel through space.',
        'Detective is transformed into a child and solves cases',
        'A ninja dreams of becoming the strongest in his village while confronting his dark past.',
        'Guy travels to find the ultimate treasure and become the Pirate King.',
        'A high school student gets involved in the world of devils and angels after being resurrected',
        'A journey across the stars to discover new planets and civilizations.',
    ],
}

function App() {
    const [loading, setLoading] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [animes, setanimes] = React.useState([])
    const [isCoolSearchOn, setIsCoolSearchOn] = React.useState(false)

    const ph = usePostHog()

    const fetchMovies = async (q) => {
        try {
            const term = q || searchTerm
            if (!term) return
            setLoading(true)
            if (!isCoolSearchOn) {
                ph?.capture(EVENTS.COOL_SEARCH, { search: term })
                const response = await fetch(`/api/animes/fuzzy?q=${term}`)
                const data = await response.json()
                if (data?.animes && Array.isArray(data.animes)) {
                    setanimes(data.animes)
                }
            } else {
                ph?.capture(EVENTS.SEARCH, { search: term })
                const response = await fetch(
                    `/api/animes/semantic?q=${term}`
                )
                const data = await response.json()
                if (data?.animes && Array.isArray(data.animes)) {
                    setanimes(data.animes)
                }
            }
        } catch (e) {
            //
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        if (!searchTerm) return
        fetchMovies()
    }

    const currentSuggestions = isCoolSearchOn
        ? SUGGESTIONS.COOL
        : SUGGESTIONS.BORING

    return (
        
        <div className="bg-neutral-950 text-white min-h-screen flex flex-col items-center justify-center">
                            <h1 className="text-3xl font-semibold py-20">Anime Search</h1>

            
            <div className="flex gap-2 justify-center mb-4">
                {/* heading here */}

                <p className="text-base font-semibold">Boring Search</p>
                <div className="space-x-3">
                    <label
                        htmlFor="select1"
                        className="relative inline-flex cursor-pointer items-center"
                    >
                        <input
                            type="checkbox"
                            id="select1"
                            className="peer sr-only"
                            onChange={(e) =>
                                setIsCoolSearchOn(e.target.checked)
                            }
                        />
                        <div
                            className={`h-6 w-11 rounded-full ${
                                isCoolSearchOn ? 'bg-blue-500' : 'bg-gray-400'
                            } after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] hover:bg-gray-200 peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-primary-200 peer-disabled:cursor-not-allowed peer-disabled:bg-gray-100 peer-disabled:after:bg-gray-50`}
                        ></div>
                    </label>
                </div>
                <p className="text-base font-semibold">Cool Search</p>
            </div>
            <div className="w-full flex flex-wrap justify-center gap-2 mt-4 mb-6">
                {currentSuggestions.map((suggestion) => (
                    <button
                        key={suggestion}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full cursor-pointer hover:bg-gray-700 text-sm"
                        onClick={() => {
                            setSearchTerm(suggestion)
                            fetchMovies(suggestion)
                        }}
                    >
                        <p>{suggestion}</p>
                    </button>
                ))}
            </div>
            <form
                className="flex gap-4 mb-4"
                onSubmit={(e) => {
                    e.preventDefault()
                    handleSearch()
                }}
            >
                <input
                    type="text"
                    placeholder="Search..."
                    className="flex-grow px-6 py-2 bg-gray-800 border rounded-3xl border-gray-700 focus:outline-none text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    onClick={() => handleSearch()}
                    className="sm:px-6 px-4 py-2 bg-gradient-to-r rounded-3xl from-blue-500 to-blue-700 text-white font-semibold"
                >
                    <span className="sm:block hidden">Search</span>
                    <span className="sm:hidden block">
                        <SearchIcon size={20} />
                    </span>
                </button>
            </form>
            <div className="mt-10 pb-10 flex flex-wrap gap-4 justify-center text-center">
                {loading
                    ? [1, 2, 3, 4].map((x) => (
                          <MovieSkeletonCard key={`skel-${x}`} />
                      ))
                    : null}
                {!loading && animes.length
                    ? animes.map((anime) => (
                          <MovieCard anime={anime} key={anime.id} />
                      ))
                    : !loading && (
                          <div>
                              <span>No animes found.</span>
                              <br />
                              <span className="text-xs leading-3">
                                  Please note that the movie database not
                                  complete and quite old. animes released post
                                  2017 will not be available.
                              </span>
                          </div>
                      )}
            </div>
        </div>
    )
}

const MovieCard = ({ anime }) => {
    const [errored, setErrored] = React.useState(false)
    return (
        <div
            key={anime.id}
            className="w-[150px] border border-gray-700 p-2 rounded-md shadow-md"
        >
            <img
                src={
                    errored || !anime.picture
                        ? 'https://via.placeholder.com/150x210'
                        : anime.picture
                }
                alt={anime.title}
                className="w-full h-auto rounded-md"
                onError={() => setErrored(true)}
            />
            <h3 className="mt-2 font-semibold text-center">{anime.title}</h3>
        </div>
    )
}

const MovieSkeletonCard = () => {
    return (
        <div
            className="w-[150px] border border-gray-700 p-2 pb-4 rounded-md shadow-md animate-pulse"
            style={{ aspectRatio: '150 / 210' }}
        >
            <div className="w-full h-full bg-gray-800 rounded-md" />
            <div className="w-3/4 h-2 bg-gray-700 rounded-md mt-2" />
        </div>
    )
}

export default App
