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
    const query = buildQuery(intent, location);

    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", query);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Google Places error:", res.status, text);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch places from Google.",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = (await res.json()) as {
      results?: PlaceResult[];
      status?: string;
      error_message?: string;
    };

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places status:", data.status, data.error_message);
    }

    const results = (data.results ?? []).slice(0, 5);

    const places: DoctorsResponse["places"] = results.map((r) => {
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

