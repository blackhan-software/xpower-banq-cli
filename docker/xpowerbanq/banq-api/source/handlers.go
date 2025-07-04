package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

// validateDate validates ISO date format (YYYY-MM-DD)
func validateDate(date string) bool {
	return dateRegex.MatchString(date)
}

// writeError writes JSON error response
func writeError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

// handleEndpoint handles API endpoints using RouteConfig
func handleEndpoint(w http.ResponseWriter, r *http.Request, pathSuffix string, config *RouteConfig) {
	// Extract database name from URL parameter
	dbName := chi.URLParam(r, "dbName")

	// Validate database name prefix
	if err := dbPrefixed(dbName, config.DBPrefix); err != nil {
		writeError(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Parse query parameters
	var queryArgs []interface{}
	for _, param := range config.QueryParams {
		value, err := dateFrom(r, param)
		if err != nil {
			writeError(w, err.Error(), http.StatusBadRequest)
			return
		}
		queryArgs = append(queryArgs, value)
	}

	// Add maxRows limit to query arguments
	queryArgs = append(queryArgs, maxRows)

	// Open database
	db, dbFileName, err := openDatabase(dbName)
	if err != nil {
		log.Printf("Database error: %v", err)
		writeError(w, "Database not available", http.StatusServiceUnavailable)
		return
	}
	defer db.Close()

	// Execute query
	rows, err := db.Query(config.SQL, queryArgs...)
	if err != nil {
		log.Printf("Query error: %v", err)
		writeError(w, "Query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Scan results using configured scanner
	results, err := config.ResultScanner(rows)
	if err != nil {
		log.Printf("Result scanning error: %v", err)
		writeError(w, "Data processing error", http.StatusInternalServerError)
		return
	}

	// Write response
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Database", dbFileName)
	json.NewEncoder(w).Encode(results)
}

// handleRobots serves robots.txt
func handleRobots(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, "User-agent: *\nDisallow: /\n")
}

// handleHealth serves health check endpoint
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "XPowerBanq API",
	})
}

// handleRoot serves API information
func handleRoot(w http.ResponseWriter, r *http.Request) {
	// Dynamically build endpoints documentation from route registry
	endpoints := make(map[string]interface{})
	for suffix, config := range endpointRoutes {
		// Extract endpoint name from suffix (e.g., "/daily_average.json" -> "daily_average")
		name := strings.TrimSuffix(strings.TrimPrefix(suffix, "/"), ".json")

		// Build parameter string from QueryParams
		var params string
		if len(config.QueryParams) > 0 {
			params = "?"
			for i, param := range config.QueryParams {
				if i > 0 {
					params += "&"
				}
				params += param + "=YYYY-MM-DD"
			}
		}

		endpoints[name] = map[string]string{
			"path":        "/{dbName}" + suffix,
			"description": config.Description,
			"example":     config.Example,
			"params":      params,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"title":       "XPowerBanq Database API",
		"description": "Read-only API for XPowerBanq utilization rates and price quotes",
		"license":     "Apache-2.0",
		"license_url": "https://www.apache.org/licenses/LICENSE-2.0",
		"source":      "xpower-banq-cli",
		"source_url":  "https://github.com/blackhan-software/xpower-banq-cli.git",
		"endpoints":   endpoints,
	})
}

// registerAPIRoutes dynamically registers all API endpoints from endpointRoutes
func registerAPIRoutes(r chi.Router) {
	for suffix, config := range endpointRoutes {
		// Create closure to capture config for this route
		routeConfig := config
		routeSuffix := suffix

		// Register route with URL parameter pattern
		// e.g., "/{dbName}/daily_average.json"
		pattern := "/{dbName}" + suffix
		r.Get(pattern, func(w http.ResponseWriter, r *http.Request) {
			handleEndpoint(w, r, routeSuffix, routeConfig)
		})
	}
}
