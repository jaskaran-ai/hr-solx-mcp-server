const API_URL = process.env.MCP_API_URL || "https://api.hr-solx-mobile.com";

export async function makeAPIRequest<T>(url: string, method: string = 'GET', body?: unknown): Promise<T | null> {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making API request:", error);
    return null;
  }
}

export { API_URL };
