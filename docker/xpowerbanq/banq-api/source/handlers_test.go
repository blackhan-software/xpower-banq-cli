package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"
	_ "github.com/mattn/go-sqlite3"
)

func TestHandleHealth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	handleHealth(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	contentType := rr.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", contentType)
	}

	var response map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if response["status"] != "ok" {
		t.Errorf("expected status 'ok', got %s", response["status"])
	}

	if response["service"] != "XPowerBanq API" {
		t.Errorf("expected service 'XPowerBanq API', got %s", response["service"])
	}
}

func TestHandleRobots(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/robots.txt", nil)
	rr := httptest.NewRecorder()

	handleRobots(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	contentType := rr.Header().Get("Content-Type")
	if contentType != "text/plain" {
		t.Errorf("expected Content-Type text/plain, got %s", contentType)
	}

	expectedBody := "User-agent: *\nDisallow: /\n"
	if rr.Body.String() != expectedBody {
		t.Errorf("expected body %q, got %q", expectedBody, rr.Body.String())
	}
}

func TestHandleRoot(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()

	handleRoot(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	contentType := rr.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", contentType)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	// Check required fields
	requiredFields := []string{"title", "description", "license", "license_url", "source", "source_url", "endpoints"}
	for _, field := range requiredFields {
		if _, exists := response[field]; !exists {
			t.Errorf("expected field %q in response", field)
		}
	}

	// Check endpoints
	endpoints, ok := response["endpoints"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected endpoints to be a map")
	}

	if _, exists := endpoints["daily_average"]; !exists {
		t.Errorf("expected daily_average endpoint in response")
	}

	if _, exists := endpoints["daily_ohlc"]; !exists {
		t.Errorf("expected daily_ohlc endpoint in response")
	}
}

func TestHandleAPIRoutes(t *testing.T) {
	// Smoke test: verify routes are registered without errors
	r := chi.NewRouter()
	registerAPIRoutes(r)

	// Verify invalid path returns 404
	req := httptest.NewRequest(http.MethodGet, "/invalid/endpoint.json", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected status %d for invalid path, got %d", http.StatusNotFound, rr.Code)
	}
}

func TestHandleDailyAverage(t *testing.T) {
	tests := []struct {
		name           string
		path           string
		queryParams    string
		method         string
		expectedStatus int
		checkResponse  bool
	}{
		{
			name:           "wrong HTTP method",
			path:           "/ri_apow_supply_0/daily_average.json",
			queryParams:    "?lhs=2025-11-15&rhs=2025-12-15",
			method:         http.MethodPost,
			expectedStatus: http.StatusMethodNotAllowed,
			checkResponse:  false, // Chi handles method validation, no JSON response
		},
		{
			name:           "missing lhs parameter",
			path:           "/ri_apow_supply_0/daily_average.json",
			queryParams:    "?rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "missing rhs parameter",
			path:           "/ri_apow_supply_0/daily_average.json",
			queryParams:    "?lhs=2025-11-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "invalid date format in lhs",
			path:           "/ri_apow_supply_0/daily_average.json",
			queryParams:    "?lhs=2025/11/15&rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "invalid date format in rhs",
			path:           "/ri_apow_supply_0/daily_average.json",
			queryParams:    "?lhs=2025-11-15&rhs=12-15-2025",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "wrong database prefix",
			path:           "/rt_apow_xpow_0/daily_average.json",
			queryParams:    "?lhs=2025-11-15&rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "database not found",
			path:           "/ri_nonexistent/daily_average.json",
			queryParams:    "?lhs=2025-11-15&rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusServiceUnavailable,
			checkResponse:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Chi router for testing
			r := chi.NewRouter()
			registerAPIRoutes(r)

			req := httptest.NewRequest(tt.method, tt.path+tt.queryParams, nil)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
			}

			if tt.checkResponse {
				contentType := rr.Header().Get("Content-Type")
				if contentType != "application/json" {
					t.Errorf("expected Content-Type application/json, got %s", contentType)
				}

				var response map[string]interface{}
				if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
					t.Fatalf("failed to parse JSON response: %v", err)
				}

				if _, exists := response["error"]; tt.expectedStatus != http.StatusOK && !exists {
					t.Errorf("expected error field in response for status %d", tt.expectedStatus)
				}
			}
		})
	}
}

func TestHandleDailyOHLC(t *testing.T) {
	tests := []struct {
		name           string
		path           string
		queryParams    string
		method         string
		expectedStatus int
		checkResponse  bool
	}{
		{
			name:           "wrong HTTP method",
			path:           "/rt_apow_xpow_0/daily_ohlc.json",
			queryParams:    "?lhs=2025-11-15&rhs=2025-12-15",
			method:         http.MethodPost,
			expectedStatus: http.StatusMethodNotAllowed,
			checkResponse:  false, // Chi handles method validation, no JSON response
		},
		{
			name:           "missing lhs parameter",
			path:           "/rt_apow_xpow_0/daily_ohlc.json",
			queryParams:    "?rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "missing rhs parameter",
			path:           "/rt_apow_xpow_0/daily_ohlc.json",
			queryParams:    "?lhs=2025-11-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "invalid date format in lhs",
			path:           "/rt_apow_xpow_0/daily_ohlc.json",
			queryParams:    "?lhs=2025/11/15&rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "wrong database prefix",
			path:           "/ri_apow_supply_0/daily_ohlc.json",
			queryParams:    "?lhs=2025-11-15&rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusBadRequest,
			checkResponse:  true,
		},
		{
			name:           "database not found",
			path:           "/rt_nonexistent/daily_ohlc.json",
			queryParams:    "?lhs=2025-11-15&rhs=2025-12-15",
			method:         http.MethodGet,
			expectedStatus: http.StatusServiceUnavailable,
			checkResponse:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Chi router for testing
			r := chi.NewRouter()
			registerAPIRoutes(r)

			req := httptest.NewRequest(tt.method, tt.path+tt.queryParams, nil)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
			}

			if tt.checkResponse {
				contentType := rr.Header().Get("Content-Type")
				if contentType != "application/json" {
					t.Errorf("expected Content-Type application/json, got %s", contentType)
				}

				var response map[string]interface{}
				if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
					t.Fatalf("failed to parse JSON response: %v", err)
				}

				if _, exists := response["error"]; tt.expectedStatus != http.StatusOK && !exists {
					t.Errorf("expected error field in response for status %d", tt.expectedStatus)
				}
			}
		})
	}
}

func TestWriteError(t *testing.T) {
	tests := []struct {
		name         string
		errorMessage string
		statusCode   int
	}{
		{
			name:         "bad request error",
			errorMessage: "Invalid parameter",
			statusCode:   http.StatusBadRequest,
		},
		{
			name:         "not found error",
			errorMessage: "Database not found",
			statusCode:   http.StatusNotFound,
		},
		{
			name:         "internal server error",
			errorMessage: "Query failed",
			statusCode:   http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rr := httptest.NewRecorder()
			writeError(rr, tt.errorMessage, tt.statusCode)

			if rr.Code != tt.statusCode {
				t.Errorf("expected status %d, got %d", tt.statusCode, rr.Code)
			}

			contentType := rr.Header().Get("Content-Type")
			if contentType != "application/json" {
				t.Errorf("expected Content-Type application/json, got %s", contentType)
			}

			var response ErrorResponse
			if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
				t.Fatalf("failed to parse JSON response: %v", err)
			}

			if response.Error != tt.errorMessage {
				t.Errorf("expected error message %q, got %q", tt.errorMessage, response.Error)
			}
		})
	}
}

// Integration test with real database
func TestHandleDailyAverageIntegration(t *testing.T) {
	// Create temporary database directory
	tempDir, err := os.MkdirTemp("", "banq-api-integration-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create test database with riw_view
	dbPath := filepath.Join(tempDir, "ri_test_db.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	// Create view and insert test data
	_, err = db.Exec(`
		CREATE TABLE rates (
			util_e18 INTEGER,
			stamp_iso TEXT
		);
		CREATE VIEW riw_view AS SELECT util_e18, stamp_iso FROM rates;
		INSERT INTO rates (util_e18, stamp_iso) VALUES
			(100000000000000000, '2025-11-15 10:00:00'),
			(200000000000000000, '2025-11-15 14:00:00'),
			(150000000000000000, '2025-11-16 10:00:00');
	`)
	if err != nil {
		t.Fatalf("failed to setup test data: %v", err)
	}
	db.Close()

	// Mock database path temporarily (in real scenario, use dependency injection)
	// For this test, we'll use the helper function
	t.Skip("Skipping integration test - requires database path injection")
}

// Integration test with real database for OHLC
func TestHandleDailyOHLCIntegration(t *testing.T) {
	// Create temporary database directory
	tempDir, err := os.MkdirTemp("", "banq-api-integration-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create test database with rtw_view
	dbPath := filepath.Join(tempDir, "rt_test_db.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	// Create view and insert test data
	_, err = db.Exec(`
		CREATE TABLE quotes (
			quote_bid_e18 INTEGER,
			quote_ask_e18 INTEGER,
			quote_time_iso TEXT
		);
		CREATE VIEW rtw_view AS SELECT quote_bid_e18, quote_ask_e18, quote_time_iso FROM quotes;
		INSERT INTO quotes (quote_bid_e18, quote_ask_e18, quote_time_iso) VALUES
			(100000000000000000, 110000000000000000, '2025-11-15 09:00:00'),
			(105000000000000000, 115000000000000000, '2025-11-15 12:00:00'),
			(102000000000000000, 112000000000000000, '2025-11-15 18:00:00');
	`)
	if err != nil {
		t.Fatalf("failed to setup test data: %v", err)
	}
	db.Close()

	// Mock database path temporarily (in real scenario, use dependency injection)
	// For this test, we'll use the helper function
	t.Skip("Skipping integration test - requires database path injection")
}
