import { NextRequest } from "next/server";

type DoctorsRequestBody = {
  location?: string;
  intent?: "gyn" | "sexual-health" | "urgent";
};

type DoctorsResponse = {
  places: {
    name: string;
    address: string;
    mapsUrl: string;
  }[];
};

type NominatimResult = {
  lat: string;
  lon: string;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function geocode(location: string): Promise<{ lat: number; lon: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", location);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "herchat/1.0 (https://github.com/grosssocks/herchat)" },
  });
  const data = (await res.json()) as NominatimResult[];
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function buildOverpassQuery(intent: DoctorsRequestBody["intent"], lat: number, lon: number): string {
  const radius = 5000;
  const around = `(around:${radius},${lat},${lon})`;

  const filters =
    intent === "sexual-health"
      ? [
          `node["healthcare"="sexual_health"]${around};`,
          `way["healthcare"="sexual_health"]${around};`,
          `node["amenity"="clinic"]${around};`,
          `way["amenity"="clinic"]${around};`,
        ]
      : intent === "urgent"
        ? [
            `node["amenity"="hospital"]${around};`,
            `way["amenity"="hospital"]${around};`,
            `node["amenity"="clinic"]${around};`,
            `way["amenity"="clinic"]${around};`,
          ]
        : [
            `node["healthcare"="gynaecologist"]${around};`,
            `way["healthcare"="gynaecologist"]${around};`,
            `node["healthcare"="doctor"]["speciality"="gynaecology"]${around};`,
            `node["amenity"="clinic"]["healthcare"]${around};`,
            `way["amenity"="clinic"]["healthcare"]${around};`,
            `node["amenity"="hospital"]${around};`,
            `way["amenity"="hospital"]${around};`,
          ];

  return `[out:json][timeout:25];\n(\n  ${filters.join("\n  ")}\n);\nout center 10;`;
}

function extractAddress(tags: Record<string, string>): string {
  if (tags["addr:full"]) return tags["addr:full"];
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean);
  return parts.join(", ");
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function fetchOverpass(query: string): Promise<OverpassElement[]> {
  const body = `data=${encodeURIComponent(query)}`;
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "herchat/1.0 (https://github.com/grosssocks/herchat)",
  };
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, { method: "POST", headers, body });
      if (!res.ok) continue;
      const data = (await res.json()) as { elements?: OverpassElement[] };
      return data.elements ?? [];
    } catch (err) {
      console.warn("[Her Chat] Overpass endpoint failed:", endpoint, err);
    }
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as DoctorsRequestBody;
    const location = body.location?.trim();
    const intent = body.intent ?? "gyn";

    if (!location) {
      return new Response(JSON.stringify({ error: "Location is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const coords = await geocode(location);
    if (!coords) {
      console.debug("[Her Chat] Could not geocode location:", location);
      return new Response(JSON.stringify({ places: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = buildOverpassQuery(intent, coords.lat, coords.lon);
    const elements = await fetchOverpass(query);

    const seenIds = new Set<number>();
    const places: DoctorsResponse["places"] = [];

    for (const el of elements) {
      if (seenIds.has(el.id)) continue;
      seenIds.add(el.id);

      const tags = el.tags ?? {};
      const name = tags["name"] ?? tags["operator"] ?? "Clinic";
      const address = extractAddress(tags);
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const mapsUrl =
        lat && lon
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
          : `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${location}`)}`;

      places.push({ name, address, mapsUrl });
      if (places.length >= 5) break;
    }

    if (places.length === 0) {
      console.debug("[Her Chat] No places found via OSM for:", location, intent);
    }

    return new Response(JSON.stringify({ places }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Doctors API error:", message, error);
    // Return 200 with empty places so the frontend shows the search fallback, not an error banner.
    return new Response(JSON.stringify({ places: [], error: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
