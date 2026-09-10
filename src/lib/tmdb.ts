import type { Movie } from "../../shared/types";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "ba3b022d90f86469e4c072c209ca29b5";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  Horror: 27,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
};

export const FALLBACK_MOVIES: Movie[] = [
  {
    id: 693134,
    title: "Dune: Part Two",
    genre: "Sci-Fi · Adventure",
    year: 2024,
    rating: 8.6,
    matchPct: 92,
    img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=380&h=540&fit=crop&auto=format",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    tags: ["Epic", "Visually Stunning", "Sci-Fi"],
  },
  {
    id: 872585,
    title: "Oppenheimer",
    genre: "Drama · History",
    year: 2023,
    rating: 8.9,
    matchPct: 87,
    img: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=380&h=540&fit=crop&auto=format",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    tags: ["Intense", "Award-Winning", "Drama"],
  },
  {
    id: 666277,
    title: "Past Lives",
    genre: "Drama · Romance",
    year: 2023,
    rating: 7.9,
    matchPct: 78,
    img: "https://images.unsplash.com/photo-1518708909080-704599b19972?w=380&h=540&fit=crop&auto=format",
    overview: "Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora's family emigrates from South Korea.",
    tags: ["Emotional", "Beautiful", "Romance"],
  },
  {
    id: 414906,
    title: "The Batman",
    genre: "Action · Crime",
    year: 2022,
    rating: 7.8,
    matchPct: 81,
    img: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=380&h=540&fit=crop&auto=format",
    overview: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family.",
    tags: ["Dark", "Gritty", "Action"],
  },
  {
    id: 545611,
    title: "Everything Everywhere All at Once",
    genre: "Comedy · Sci-Fi",
    year: 2022,
    rating: 8.0,
    matchPct: 89,
    img: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=380&h=540&fit=crop&auto=format",
    overview: "A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence.",
    tags: ["Weird", "Heartwarming", "Multiverse"],
  },
];

interface RawTmdbMovie {
  id: number;
  title?: string;
  name?: string;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
}

export function transformTmdbMovie(m: RawTmdbMovie, index = 0): Movie {
  const genreNames = (m.genre_ids || [])
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);
  const genreStr = genreNames.slice(0, 2).join(" · ") || "Cinema";

  const rawYear = m.release_date || m.first_air_date;
  const year = rawYear ? new Date(rawYear).getFullYear() : new Date().getFullYear();

  const voteAvg = m.vote_average || 7.5;
  const rating = Math.round(voteAvg * 10) / 10;

  // Generate an engaging match percentage
  const matchPct = Math.min(99, Math.max(72, Math.round(voteAvg * 10) + ((index * 3) % 9) - 2));

  const posterImg = m.poster_path
    ? `${TMDB_IMAGE_BASE}${m.poster_path}`
    : "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=380&h=540&fit=crop&auto=format";

  const tags: string[] = [];
  if (genreNames.length > 0) tags.push(...genreNames.slice(0, 2));
  if (rating >= 8.0) tags.push("Must Watch");
  else if (rating >= 7.5) tags.push("Popular");
  if (tags.length < 2) tags.push("Trending");

  return {
    id: m.id,
    title: m.title || m.name || "Untitled Movie",
    genre: genreStr,
    year,
    rating,
    matchPct,
    img: posterImg,
    backdropImg: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : undefined,
    overview: m.overview || "",
    tags: tags.slice(0, 3),
  };
}

export async function fetchTrendingMovies(timeWindow: "day" | "week" = "week"): Promise<Movie[]> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    if (!data.results || !data.results.length) return FALLBACK_MOVIES;
    return (data.results as RawTmdbMovie[])
      .filter((m) => m.poster_path)
      .map((m, idx) => transformTmdbMovie(m, idx));
  } catch (err) {
    console.warn("[TMDB] fetchTrendingMovies failed, using fallback:", err);
    return FALLBACK_MOVIES;
  }
}

export async function fetchPopularMovies(page = 1): Promise<Movie[]> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    if (!data.results || !data.results.length) return FALLBACK_MOVIES;
    return (data.results as RawTmdbMovie[])
      .filter((m) => m.poster_path)
      .map((m, idx) => transformTmdbMovie(m, idx));
  } catch (err) {
    console.warn("[TMDB] fetchPopularMovies failed, using fallback:", err);
    return FALLBACK_MOVIES;
  }
}

export async function fetchMoviesByGenre(genreName: string, page = 1): Promise<Movie[]> {
  if (genreName === "All" || genreName === "Trending") {
    return fetchTrendingMovies("week");
  }

  const genreId = GENRE_NAME_TO_ID[genreName];
  if (!genreId) {
    return fetchTrendingMovies("week");
  }

  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    if (!data.results || !data.results.length) return FALLBACK_MOVIES;
    return (data.results as RawTmdbMovie[])
      .filter((m) => m.poster_path)
      .map((m, idx) => transformTmdbMovie(m, idx));
  } catch (err) {
    console.warn(`[TMDB] fetchMoviesByGenre(${genreName}) failed, using fallback:`, err);
    return FALLBACK_MOVIES;
  }
}

export async function searchMovies(query: string, page = 1): Promise<Movie[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&page=${page}&include_adult=false`);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    if (!data.results || !data.results.length) return [];
    return (data.results as RawTmdbMovie[])
      .filter((m) => m.poster_path)
      .map((m, idx) => transformTmdbMovie(m, idx));
  } catch (err) {
    console.warn("[TMDB] searchMovies failed:", err);
    return [];
  }
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

/**
 * Fetches the YouTube trailer URL for a movie from TMDB.
 * Returns the embed URL (https://www.youtube.com/embed/KEY) or null if none found.
 */
export async function fetchMovieTrailerUrl(movieId: number | string): Promise<string | null> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    const videos: TmdbVideo[] = data.results || [];

    // Prefer official YouTube trailers, then teasers, then any YouTube video
    const officialTrailer = videos.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
    );
    const anyTrailer = videos.find(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    );
    const teaser = videos.find(
      (v) => v.site === "YouTube" && v.type === "Teaser"
    );
    const anyYoutube = videos.find((v) => v.site === "YouTube");

    const chosen = officialTrailer || anyTrailer || teaser || anyYoutube;
    if (chosen) {
      return `https://www.youtube.com/embed/${chosen.key}`;
    }
    return null;
  } catch (err) {
    console.warn("[TMDB] fetchMovieTrailerUrl failed:", err);
    return null;
  }
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProvidersResult {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
}

export async function fetchWatchProviders(movieId: number | string): Promise<WatchProvidersResult | null> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || {};
    const localeData = (results.US || results.IN || results.GB || Object.values(results)[0]) as any;
    if (!localeData) return null;

    return {
      link: localeData.link,
      flatrate: localeData.flatrate || [],
      rent: localeData.rent || [],
      buy: localeData.buy || [],
      free: localeData.free || [],
    };
  } catch (err) {
    console.warn("[TMDB] fetchWatchProviders failed:", err);
    return null;
  }
}

export async function resolveTmdbId(movieId: number | string, title?: string): Promise<number | null> {
  const numId = typeof movieId === "number" ? movieId : parseInt(movieId, 10);
  if (!isNaN(numId) && numId > 100) {
    return numId;
  }
  if (title) {
    const results = await searchMovies(title);
    if (results.length > 0 && typeof results[0].id === "number") {
      return results[0].id;
    }
  }
  return !isNaN(numId) ? numId : null;
}

export interface StreamServer {
  id: string;
  name: string;
  badge: string;
  getUrl: (tmdbId: number | string) => string;
}

export const MOVIE_STREAM_SERVERS: StreamServer[] = [
  {
    id: "vidsrc-pm",
    name: "Server 1",
    badge: "HD · Fast",
    getUrl: (id) => `https://vidsrc.pm/embed/movie/${id}`,
  },
  {
    id: "autoembed",
    name: "Server 2",
    badge: "Auto Player",
    getUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
  },
  {
    id: "123embed",
    name: "Server 3",
    badge: "MultiStream",
    getUrl: (id) => `https://play2.123embed.net/movie/${id}`,
  },
  {
    id: "2embed",
    name: "Server 4",
    badge: "Backup HD",
    getUrl: (id) => `https://2embed.skin/embed/${id}`,
  },
];

