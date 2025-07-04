package main

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	_ "github.com/mattn/go-sqlite3"
)

// TestSQLInjectionPrevention tests that SQL injection attempts are prevented
func TestSQLInjectionPrevention(t *testing.T) {
	// Create temporary database directory
	tempDir, err := os.MkdirTemp("", "banq-api-security-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create test database
	dbPath := filepath.Join(tempDir, "ri_test.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	_, err = db.Exec(`
		CREATE TABLE rates (util_e18 INTEGER, stamp_iso TEXT);
		CREATE VIEW riw_view AS SELECT util_e18, stamp_iso FROM rates;
		INSERT INTO rates VALUES (100, '2025-11-15 10:00:00');
	`)
	if err != nil {
		t.Fatalf("failed to setup test data: %v", err)
	}
	db.Close()

	// SQL injection attempts in date parameters
	injectionTests := []struct {
		name         string
		lhs          string
		rhs          string
		expectedCode int
	}{
		{
			name:         "SQL comment injection in lhs",
			lhs:          "2025-11-15'; DROP TABLE rates; --",
			rhs:          "2025-12-15",
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "SQL comment injection in rhs",
			lhs:          "2025-11-15",
			rhs:          "2025-12-15'; DROP TABLE rates; --",
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "Union injection in lhs",
			lhs:          "2025-11-15' UNION SELECT * FROM rates --",
			rhs:          "2025-12-15",
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "Boolean injection",
			lhs:          "2025-11-15' OR '1'='1",
			rhs:          "2025-12-15",
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "Semicolon injection",
			lhs:          "2025-11-15; DELETE FROM rates;",
			rhs:          "2025-12-15",
			expectedCode: http.StatusBadRequest,
		},
	}

	suffix := "/daily_average.json"
	config := endpointRoutes[suffix]

	for _, tt := range injectionTests {
		t.Run(tt.name, func(t *testing.T) {
			// URL encode the parameters to create a valid request
			urlStr := "/ri_test/daily_average.json?lhs=" + url.QueryEscape(tt.lhs) + "&rhs=" + url.QueryEscape(tt.rhs)
			req := httptest.NewRequest(
				http.MethodGet,
				urlStr,
				nil,
			)
			rr := httptest.NewRecorder()

			handleEndpoint(rr, req, suffix, config)

			if rr.Code != tt.expectedCode {
				t.Errorf("expected status %d for SQL injection attempt, got %d", tt.expectedCode, rr.Code)
			}

			// Verify database is still intact
			db, err := sql.Open("sqlite3", dbPath)
			if err != nil {
				t.Fatalf("failed to open database after injection attempt: %v", err)
			}
			defer db.Close()

			var count int
			err = db.QueryRow("SELECT COUNT(*) FROM rates").Scan(&count)
			if err != nil {
				t.Errorf("database corrupted after injection attempt: %v", err)
			}
			if count != 1 {
				t.Errorf("expected 1 row in rates table, got %d - possible SQL injection success", count)
			}
		})
	}
}

// TestPathTraversalPrevention tests that path traversal attempts are prevented
func TestPathTraversalPrevention(t *testing.T) {
	pathTraversalTests := []struct {
		name         string
		dbName       string
		expectedCode int
	}{
		{
			name:         "parent directory traversal",
			dbName:       "../../../etc/passwd",
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "Windows path traversal",
			dbName:       "..\\..\\..\\windows\\system32",
			expectedCode: http.StatusBadRequest,
		},
		// Null byte injection test removed - impossible in valid HTTP URLs
		{
			name:         "encoded traversal",
			dbName:       "..%2F..%2Fetc%2Fpasswd",
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "absolute path",
			dbName:       "/etc/passwd",
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tt := range pathTraversalTests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Chi router for testing
			r := chi.NewRouter()
			registerAPIRoutes(r)

			req := httptest.NewRequest(
				http.MethodGet,
				"/"+tt.dbName+"/daily_average.json?lhs=2025-11-15&rhs=2025-12-15",
				nil,
			)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			// Should fail validation before attempting file access
			if rr.Code == http.StatusOK {
				t.Errorf("path traversal attempt should not succeed")
			}
		})
	}
}

// TestMaxRowsLimitation tests that the max rows limit is enforced
func TestMaxRowsLimitation(t *testing.T) {
	// This test verifies that maxRows constant is used in queries
	// The actual SQL query includes LIMIT ? with maxRows parameter

	if maxRows != 90 {
		t.Errorf("expected maxRows to be 90, got %d", maxRows)
	}

	// Verify SQL queries include LIMIT parameter
	if !strings.Contains(dailyAverageSQL, "LIMIT ?") {
		t.Errorf("dailyAverageSQL should include LIMIT parameter for security")
	}

	if !strings.Contains(dailyOHLCSQL, "LIMIT ?") {
		t.Errorf("dailyOHLCSQL should include LIMIT parameter for security")
	}
}

// TestDatabaseReadOnlySecurity tests that databases are opened in read-only mode for security
func TestDatabaseReadOnlySecurity(t *testing.T) {
	// Create temporary database directory
	tempDir, err := os.MkdirTemp("", "banq-api-readonly-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create test database
	dbPath := filepath.Join(tempDir, "ri_test.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	_, err = db.Exec("CREATE TABLE test (id INTEGER)")
	if err != nil {
		t.Fatalf("failed to create test table: %v", err)
	}
	db.Close()

	// Open in read-only mode
	db, _, err = openDatabaseWithPath("ri_test", tempDir)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	// Try to write (should fail)
	_, err = db.Exec("INSERT INTO test VALUES (1)")
	if err == nil {
		t.Errorf("expected write operation to fail on read-only database")
	}
}

// TestCORSSecurityHeaders tests that CORS headers are secure
func TestCORSSecurityHeaders(t *testing.T) {
	// Create Chi router with CORS middleware
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   getAllowedOriginsSlice(),
		AllowedMethods:   []string{"GET", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		ExposedHeaders:   []string{"Content-Type", "X-Database"},
		AllowCredentials: false,
		MaxAge:           3600,
	}))
	r.Get("/test", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Test that credentials are disabled
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://www.xpowerbanq.com")

	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	credentials := rr.Header().Get("Access-Control-Allow-Credentials")
	if credentials != "" && credentials != "false" {
		t.Errorf("Access-Control-Allow-Credentials should be 'false' or empty for security, got %q", credentials)
	}

	// Test that only specific origins are allowed
	unauthorizedReq := httptest.NewRequest(http.MethodGet, "/test", nil)
	unauthorizedReq.Header.Set("Origin", "https://evil-site.com")

	unauthorizedRr := httptest.NewRecorder()
	r.ServeHTTP(unauthorizedRr, unauthorizedReq)

	allowOrigin := unauthorizedRr.Header().Get("Access-Control-Allow-Origin")
	if allowOrigin != "" {
		t.Errorf("unauthorized origin should not get CORS headers, got %q", allowOrigin)
	}
}

// TestInputSanitization tests that inputs are properly validated
func TestInputSanitization(t *testing.T) {
	tests := []struct {
		name        string
		path        string
		lhs         string
		rhs         string
		expectError bool
	}{
		{
			name:        "XSS attempt in database name",
			path:        "/ri_<script>alert('xss')</script>/daily_average.json",
			lhs:         "2025-11-15",
			rhs:         "2025-12-15",
			expectError: true,
		},
		{
			name:        "HTML injection in database name",
			path:        "/ri_<h1>test</h1>/daily_average.json",
			lhs:         "2025-11-15",
			rhs:         "2025-12-15",
			expectError: true,
		},
		{
			name:        "Special characters in date",
			path:        "/ri_test/daily_average.json",
			lhs:         "2025-11-15<>",
			rhs:         "2025-12-15",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Chi router for testing
			r := chi.NewRouter()
			registerAPIRoutes(r)

			// URL encode the parameters to create a valid request
			urlStr := tt.path + "?lhs=" + url.QueryEscape(tt.lhs) + "&rhs=" + url.QueryEscape(tt.rhs)
			req := httptest.NewRequest(
				http.MethodGet,
				urlStr,
				nil,
			)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			if tt.expectError && rr.Code == http.StatusOK {
				t.Errorf("expected error for malicious input")
			}
		})
	}
}

// TestDatabasePrefixEnforcement tests that database prefixes are strictly enforced
func TestDatabasePrefixEnforcement(t *testing.T) {
	tests := []struct {
		name        string
		endpoint    string
		dbName      string
		expectError bool
	}{
		{
			name:        "daily_average with wrong prefix rt_",
			endpoint:    "daily_average.json",
			dbName:      "rt_test",
			expectError: true,
		},
		{
			name:        "daily_ohlc with wrong prefix ri_",
			endpoint:    "daily_ohlc.json",
			dbName:      "ri_test",
			expectError: true,
		},
		{
			name:        "daily_average with no prefix",
			endpoint:    "daily_average.json",
			dbName:      "test",
			expectError: true,
		},
		{
			name:        "daily_ohlc with no prefix",
			endpoint:    "daily_ohlc.json",
			dbName:      "test",
			expectError: true,
		},
		{
			name:        "daily_average with correct prefix",
			endpoint:    "daily_average.json",
			dbName:      "ri_test",
			expectError: false,
		},
		{
			name:        "daily_ohlc with correct prefix",
			endpoint:    "daily_ohlc.json",
			dbName:      "rt_test",
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Chi router for testing
			r := chi.NewRouter()
			registerAPIRoutes(r)

			req := httptest.NewRequest(
				http.MethodGet,
				"/"+tt.dbName+"/"+tt.endpoint+"?lhs=2025-11-15&rhs=2025-12-15",
				nil,
			)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			if tt.expectError {
				if rr.Code == http.StatusOK {
					t.Errorf("expected error for wrong database prefix")
				}
			}
		})
	}
}

// TestErrorInformationDisclosure tests that errors don't leak sensitive info
func TestErrorInformationDisclosure(t *testing.T) {
	suffix := "/daily_average.json"
	config := endpointRoutes[suffix]

	// Test that database errors return generic messages
	req := httptest.NewRequest(
		http.MethodGet,
		"/ri_nonexistent/daily_average.json?lhs=2025-11-15&rhs=2025-12-15",
		nil,
	)
	rr := httptest.NewRecorder()

	handleEndpoint(rr, req, suffix, config)

	body := rr.Body.String()

	// Should not expose file paths or detailed error messages
	sensitiveStrings := []string{
		"/srv/db",
		"file:",
		"sqlite",
		".db",
		"no such file",
	}

	for _, sensitive := range sensitiveStrings {
		if strings.Contains(body, sensitive) {
			t.Errorf("error response should not contain sensitive information: %q", sensitive)
		}
	}

	// Should return generic error message
	if !strings.Contains(body, "Database not available") && !strings.Contains(body, "error") {
		t.Errorf("expected generic error message")
	}
}
