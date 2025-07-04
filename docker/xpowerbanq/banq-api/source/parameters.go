package main

import (
	"fmt"
	"net/http"
	"strings"
)

// dbPrefixed validates that the database name starts with the expected prefix
func dbPrefixed(dbName string, expectedPrefix string) error {
	if !strings.HasPrefix(dbName, expectedPrefix) {
		return fmt.Errorf("Invalid database name. Must start with %s", expectedPrefix)
	}
	return nil
}

// dateFrom parses and validates a date query parameter (lhs or rhs)
func dateFrom(r *http.Request, paramName string) (string, error) {
	value := r.URL.Query().Get(paramName)
	if value == "" {
		return "", fmt.Errorf("Missing required parameter: %s", paramName)
	}

	if !validateDate(value) {
		return "", fmt.Errorf("Invalid %s date format. Use YYYY-MM-DD", paramName)
	}

	return value, nil
}
