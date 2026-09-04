import { SWIPE_MOVIES } from "./movies.js";

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || "ba3b022d90f86469e4c072c209ca29b5";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const GENRE_MAP = {
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

const GENRE_NAME_TO_ID = {
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

function transformMovie(m, index = 0) {
  const genreNames = (m.genre_ids || []).map((id) => GENRE_MAP[id]).filter(Boolean);
  const genreStr = genreNames.slice(0, 2).join(" · ") || "Cinema";
  const rawYear = m.release_date || m.first_air_date;
  const year = rawYear ? new Date(rawYear).getFullYear() : new Date().getFullYear();
  const voteAvg = m.vote_average || 7.5;
  const rating = Math.round(voteAvg * 10) / 10;
  const matchPct = Math.min(99, Math.max(72, Math.round(voteAvg * 10) + ((index * 3) % 9) - 2));

  const tags = [];
  if (genreNames.length > 0) tags.push(...genreNames.slice(0, 2));
  if (rating >= 8.0) tags.push("Must Watch");
  else if (rating >= 7.5) tags.push("Popular");
  if (tags.length < 2) tags.push("Trending");

  return {
    id: m.id,
    title: m.title || m.name || "Untitled",
    genre: genreStr,
    year,
    rating,
    matchPct,
    img: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=380&h=540&fit=crop&auto=format",
    overview: m.overview || "",
    tags: tags.slice(0, 3),
  };
}

export async function getRoomMovies(genre) {
  try {
    let url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`;
    if (genre && GENRE_NAME_TO_ID[genre]) {
      const genreId = GENRE_NAME_TO_ID[genre];
      url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results
        .filter((m) => m.poster_path)
        .slice(0, 40)
        .map((m, idx) => transformMovie(m, idx));
    }
  } catch (err) {
    console.warn("[server/tmdb] Failed to fetch TMDB movies, using fallback:", err.message);
  }
  return SWIPE_MOVIES;
}
