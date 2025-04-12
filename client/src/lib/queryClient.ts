import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = res.statusText;
    try {
      // Try to parse the response as JSON to get detailed error messages
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Clone the response before reading the body to avoid consuming it twice
        const clone = res.clone();
        const errorData = await clone.json();
        // Format the error message including any validation errors
        if (errorData.message) {
          errorText = errorData.message;
          if (errorData.errors) {
            errorText += ': ' + JSON.stringify(errorData.errors);
          }
        }
      } else {
        // If not JSON, just get text
        errorText = await res.text() || res.statusText;
      }
    } catch (e) {
      // If parsing fails, use the original status text
      console.error("Error parsing API error response:", e);
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API ${method} Request to ${url}:`, data);
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      console.error(`API Error (${res.status}): ${res.statusText}`);
      
      // Try to get detailed error response for debugging
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Clone to avoid consuming the body
          const clonedRes = res.clone();
          const errorData = await clonedRes.json();
          console.error('API Error Details:', errorData);
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request Error (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
