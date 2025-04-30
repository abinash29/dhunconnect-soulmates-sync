
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Base URL for JioSaavn unofficial API
const API_BASE_URL = "https://saavn.me/api";

interface RequestParams {
  query?: string;
  limit?: string;
  id?: string;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const params: RequestParams = {};
    
    // Extract query parameters
    url.searchParams.forEach((value, key) => {
      params[key as keyof RequestParams] = value;
    });
    
    let apiUrl = "";
    const limit = params.limit || "20";
    
    if (path === "search") {
      // Handle search request
      if (!params.query) {
        return new Response(JSON.stringify({ error: "Query parameter is required" }), 
          { headers: { "Content-Type": "application/json" }, status: 400 });
      }
      
      apiUrl = `${API_BASE_URL}/search/songs?query=${encodeURIComponent(params.query)}&limit=${limit}`;
    } 
    else if (path === "trending") {
      // Handle trending request
      apiUrl = `${API_BASE_URL}/trending/songs?limit=${limit}`;
    }
    else if (path === "song") {
      // Handle song details request
      if (!params.id) {
        return new Response(JSON.stringify({ error: "ID parameter is required" }), 
          { headers: { "Content-Type": "application/json" }, status: 400 });
      }
      
      apiUrl = `${API_BASE_URL}/songs?id=${params.id}`;
    }
    else {
      return new Response(JSON.stringify({ error: "Invalid endpoint" }), 
        { headers: { "Content-Type": "application/json" }, status: 400 });
    }
    
    console.log(`Making request to JioSaavn API: ${apiUrl}`);
    
    // Make request to JioSaavn unofficial API
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "max-age=60" // Cache results for 60 seconds
      },
    });
    
  } catch (error) {
    console.error("Error in JioSaavn API Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { 
      headers: { "Content-Type": "application/json" },
      status: 500 
    });
  }
})

// To invoke:
// curl -i --location --request GET 'http://localhost:54321/functions/v1/jiosaavn-api/search?query=love'
