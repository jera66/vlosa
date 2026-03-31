/* ========================================================================== */
/* VLOSA — WEB ROOT LAYOUT                                                    */
/* -------------------------------------------------------------------------- */
/* This file wraps EVERY web page in the app.                                   */
/*                                                                            */
/* Responsibilities:                                                           */
/* - Provide React Query (server state cache)                                  */
/* - Provide ThemeProvider (light/dark/system)                                 */
/* ========================================================================== */

// Import React Query providers + client.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // React Query core.

// Import our global theme provider.
import { ThemeProvider } from "@/utils/theme"; // Theme context.

// Create ONE QueryClient for the whole web app.
const queryClient = new QueryClient({
  // Query client config.
  defaultOptions: {
    // Default behaviors.
    queries: {
      // Query-specific defaults.
      staleTime: 1000 * 60 * 5, // Cache data as fresh for 5 minutes.
      cacheTime: 1000 * 60 * 30, // Keep unused cache for 30 minutes.
      retry: 1, // Retry failed requests once.
      refetchOnWindowFocus: false, // Avoid surprising refetches.
    }, // End queries.
  }, // End defaultOptions.
}); // End queryClient.

// Export the root layout component.
export default function RootLayout({ children }) {
  // Root layout wrapper.
  return (
    // Render providers.
    <QueryClientProvider client={queryClient}>
      {" "}
      {/* Provide react-query to the app. */}
      <ThemeProvider>{children}</ThemeProvider>{" "}
      {/* Provide theme + render pages. */}
    </QueryClientProvider> // End QueryClientProvider.
  ); // End return.
}



