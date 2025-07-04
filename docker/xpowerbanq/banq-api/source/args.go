package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
)

// corsOriginsFlag implements flag.Value for parsing CORS origins as a JSON array
type corsOriginsFlag struct {
	origins map[string]bool
}

func (c *corsOriginsFlag) String() string {
	if c.origins == nil {
		return "[]"
	}
	origins := make([]string, 0, len(c.origins))
	for origin := range c.origins {
		origins = append(origins, origin)
	}
	data, _ := json.Marshal(origins)
	return string(data)
}

func (c *corsOriginsFlag) Set(value string) error {
	var origins []string
	if err := json.Unmarshal([]byte(value), &origins); err != nil {
		return fmt.Errorf("invalid JSON array for CORS origins: %v", err)
	}

	c.origins = make(map[string]bool, len(origins))
	for _, origin := range origins {
		c.origins[origin] = true
	}
	return nil
}

// parseArgs parses command-line arguments and updates the global config variables
func parseArgs() {
	var corsOriginsValue corsOriginsFlag

	// Use existing default CORS origins from config.go
	corsOriginsValue.origins = allowedOrigins

	// Define flags with both short and long forms, using defaults from config.go
	helpPtr := flag.Bool("h", false, "Show help message")
	flag.BoolVar(helpPtr, "help", false, "Show help message")

	maxRowsPtr := flag.Int("R", maxRows, "Maximum number of rows to return per query")
	flag.IntVar(maxRowsPtr, "max-rows", maxRows, "Maximum number of rows to return per query")

	dbPathPtr := flag.String("P", dbPath, "Path to the database directory")
	flag.StringVar(dbPathPtr, "db-path", dbPath, "Path to the database directory")

	listenPortPtr := flag.String("p", listenPort, "HTTP server listen port")
	flag.StringVar(listenPortPtr, "port", listenPort, "HTTP server listen port")

	flag.Var(&corsOriginsValue, "O", `CORS allowed origins as JSON array (e.g., ["https://example.com"])`)
	flag.Var(&corsOriginsValue, "cors-origins", `CORS allowed origins as JSON array (e.g., ["https://example.com"])`)

	// Custom usage message
	flag.Usage = func() {
		// Convert allowedOrigins map to JSON for display
		origins := make([]string, 0, len(allowedOrigins))
		for origin := range allowedOrigins {
			origins = append(origins, origin)
		}
		originsJSON, _ := json.Marshal(origins)

		fmt.Fprintf(os.Stderr, "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "XPowerBanq API Server\n\n")
		fmt.Fprintf(os.Stderr, "Options:\n")
		fmt.Fprintf(os.Stderr, "  -h, --help\n")
		fmt.Fprintf(os.Stderr, "        Show this help message and exit\n")
		fmt.Fprintf(os.Stderr, "  -R, --max-rows int\n")
		fmt.Fprintf(os.Stderr, "        Maximum number of rows to return per query (default: %d)\n", maxRows)
		fmt.Fprintf(os.Stderr, "  -P, --db-path string\n")
		fmt.Fprintf(os.Stderr, "        Path to the database directory (default: %s)\n", dbPath)
		fmt.Fprintf(os.Stderr, "  -p, --port string\n")
		fmt.Fprintf(os.Stderr, "        HTTP server listen port (default: %s)\n", listenPort)
		fmt.Fprintf(os.Stderr, "  -O, --cors-origins string\n")
		fmt.Fprintf(os.Stderr, "        CORS allowed origins as JSON array\n")
		fmt.Fprintf(os.Stderr, "        (default: %s)\n", originsJSON)
		fmt.Fprintf(os.Stderr, "\n")
	}

	// Parse command-line flags
	flag.Parse()

	// Show help if requested
	if *helpPtr {
		flag.Usage()
		os.Exit(0)
	}

	// Update global config variables
	maxRows = *maxRowsPtr
	dbPath = *dbPathPtr
	listenPort = *listenPortPtr
	allowedOrigins = corsOriginsValue.origins
}
