package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

// getAllowedOriginsSlice converts allowedOrigins map to slice for Chi CORS
func getAllowedOriginsSlice() []string {
	origins := make([]string, 0, len(allowedOrigins))
	for origin := range allowedOrigins {
		origins = append(origins, origin)
	}
	return origins
}

func main() {
	// Configure logger
	log.SetFlags(log.Ldate | log.Ltime)
	log.SetOutput(os.Stderr)

	// Parse command-line arguments
	parseArgs()

	log.Printf("XPowerBanq API starting...")
	log.Printf("Database path: %s", dbPath)
	log.Printf("Max rows per query: %d", maxRows)

	// Validate databases at startup
	if err := validateDatabases(); err != nil {
		log.Fatalf("Database validation failed: %v", err)
	}

	// Create Chi router
	r := chi.NewRouter()

	// Setup CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   getAllowedOriginsSlice(),
		AllowedMethods:   []string{"GET", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		ExposedHeaders:   []string{"Content-Type", "X-Database"},
		AllowCredentials: false,
		MaxAge:           3600,
	}))

	// Register static routes
	r.Get("/health", handleHealth)
	r.Get("/robots.txt", handleRobots)
	r.Get("/", handleRoot)

	// Register dynamic API routes from endpointRoutes map
	registerAPIRoutes(r)

	// Log allowed origins
	log.Println("CORS allowed origins:")
	for origin := range allowedOrigins {
		log.Printf("  - %s", origin)
	}

	// Start server
	addr := ":" + listenPort
	log.Printf("Starting XPowerBanq API server on %s", addr)

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}
