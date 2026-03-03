import { NextRequest } from "next/server";

type DoctorsRequestBody = {
  location?: string;
  intent?: "gyn" | "sexual-health" | "urgent";
};

type PlaceResult = {
  name: string;
  formatted_address?: string;
  place_id?: string;
};

type DoctorsResponse = {
  places: {
    name: string;
    address: string;
    mapsUrl: string;
  }[];
};

function getPlacesApiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not set. Add it to .env.local and restart the dev server.",
    );
  }
  return key;
}

function buildQuery(intent: DoctorsRequestBody["intent"], location: string) {
  const base =
    intent === "sexual-health"
      ? "sexual health clinic"
      : intent === "urgent"
        ? "urgent care"
        : "gynecologist";
  return `${base} in ${location}`;
}

async function fetchPlaces(
  apiKey: string,
  query: string,
): Promise<{ results: PlaceResult[]; status: string; error_message?: string }> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    results?: PlaceResult[];
    status?: string;
    error_message?: string;
  };
  if (!res.ok) {
    console.error("[Her Chat] Places HTTP error:", res.status, data.error_message ?? data);
    return {
      results: [],
      status: "HTTP_ERROR",
      error_message: data.error_message ?? `HTTP ${res.status}`,
    };
  }
  return {
    results: data.results ?? [],
    status: data.status ?? "UNKNOWN",
    error_message: data.error_message,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as DoctorsRequestBody;
    const location = body.location?.trim();
    const intent = body.intent ?? "gyn";

    if (!location) {
      return new Response(
        JSON.stringify({ error: "Location is required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = getPlacesApiKey();
    const primaryQuery = buildQuery(intent, location);

    let data = await fetchPlaces(apiKey, primaryQuery);

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[Her Chat] Google Places API:", data.status, data.error_message);
      return new Response(
        JSON.stringify({
          error: data.error_message ?? "Places API error.",
          places: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let results = data.results;

    if (results.length === 0 && intent === "gyn") {
      const fallbackQueries = [
        `OB-GYN clinic ${location}`,
        `gynecologist ${location}`,
        `women health clinic ${location}`,
      ];
      for (const q of fallbackQueries) {
        const next = await fetchPlaces(apiKey, q);
        if (next.status === "OK" && (next.results?.length ?? 0) > 0) {
          results = next.results;
          console.debug("[Her Chat] Places found with fallback query:", q);
          break;
        }
      }
    }

    if (results.length === 0) {
      console.debug("[Her Chat] No places for location:", location);
    }

    const seenIds = new Set<string>();
    const uniqueResults = results.filter((r) => {
      const id = r.place_id ?? r.name;
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });

    const places: DoctorsResponse["places"] = uniqueResults.slice(0, 5).map((r) => {
      const address = r.formatted_address ?? "";
      const mapsUrl = r.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(r.place_id)}`
        : `https://www.google.com/maps/search/${encodeURIComponent(`${r.name} ${location}`)}`;
      return {
        name: r.name,
        address,
        mapsUrl,
      };
    });

    return new Response(JSON.stringify({ places }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Doctors API error:", message, error);
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

