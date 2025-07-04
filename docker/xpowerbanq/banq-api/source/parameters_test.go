package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestDbPrefixed(t *testing.T) {
	tests := []struct {
		name           string
		dbName         string
		expectedPrefix string
		expectError    bool
	}{
		{
			name:           "valid ri_ prefix",
			dbName:         "ri_apow_supply_0",
			expectedPrefix: "ri_",
			expectError:    false,
		},
		{
			name:           "valid rt_ prefix",
			dbName:         "rt_apow_xpow_0",
			expectedPrefix: "rt_",
			expectError:    false,
		},
		{
			name:           "invalid prefix - wrong database type",
			dbName:         "ri_apow_supply_0",
			expectedPrefix: "rt_",
			expectError:    true,
		},
		{
			name:           "invalid prefix - no prefix",
			dbName:         "apow_supply_0",
			expectedPrefix: "ri_",
			expectError:    true,
		},
		{
			name:           "invalid prefix - empty database name",
			dbName:         "",
			expectedPrefix: "ri_",
			expectError:    true,
		},
		{
			name:           "case sensitive prefix check",
			dbName:         "RI_apow_supply_0",
			expectedPrefix: "ri_",
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := dbPrefixed(tt.dbName, tt.expectedPrefix)

			if tt.expectError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			}
		})
	}
}

func TestDateFrom(t *testing.T) {
	tests := []struct {
		name         string
		queryParams  map[string]string
		paramName    string
		expectedDate string
		expectError  bool
	}{
		{
			name:         "valid date - lhs",
			queryParams:  map[string]string{"lhs": "2025-11-15"},
			paramName:    "lhs",
			expectedDate: "2025-11-15",
			expectError:  false,
		},
		{
			name:         "valid date - rhs",
			queryParams:  map[string]string{"rhs": "2025-12-15"},
			paramName:    "rhs",
			expectedDate: "2025-12-15",
			expectError:  false,
		},
		{
			name:         "valid leap year date",
			queryParams:  map[string]string{"lhs": "2024-02-29"},
			paramName:    "lhs",
			expectedDate: "2024-02-29",
			expectError:  false,
		},
		{
			name:         "missing parameter",
			queryParams:  map[string]string{},
			paramName:    "lhs",
			expectedDate: "",
			expectError:  true,
		},
		{
			name:         "invalid date format - wrong separator",
			queryParams:  map[string]string{"lhs": "2025/11/15"},
			paramName:    "lhs",
			expectedDate: "",
			expectError:  true,
		},
		{
			name:         "invalid date format - missing day",
			queryParams:  map[string]string{"lhs": "2025-11"},
			paramName:    "lhs",
			expectedDate: "",
			expectError:  true,
		},
		{
			name:         "invalid date format - extra characters",
			queryParams:  map[string]string{"lhs": "2025-11-15T00:00:00"},
			paramName:    "lhs",
			expectedDate: "",
			expectError:  true,
		},
		{
			name:         "invalid date format - not ISO format",
			queryParams:  map[string]string{"lhs": "11-15-2025"},
			paramName:    "lhs",
			expectedDate: "",
			expectError:  true,
		},
		{
			name:         "empty date string",
			queryParams:  map[string]string{"lhs": ""},
			paramName:    "lhs",
			expectedDate: "",
			expectError:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Build query string using url.Values
			query := url.Values{}
			for k, v := range tt.queryParams {
				query.Set(k, v)
			}
			req := httptest.NewRequest(http.MethodGet, "/?"+query.Encode(), nil)
			date, err := dateFrom(req, tt.paramName)

			if tt.expectError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
				if date != tt.expectedDate {
					t.Errorf("expected date %q, got %q", tt.expectedDate, date)
				}
			}
		})
	}
}

func TestValidateDate(t *testing.T) {
	tests := []struct {
		name     string
		date     string
		expected bool
	}{
		{"valid date", "2025-11-15", true},
		{"valid date - leap year", "2024-02-29", true},
		{"valid date - year boundary", "2025-12-31", true},
		{"valid date - year start", "2025-01-01", true},
		{"invalid - wrong separator", "2025/11/15", false},
		{"invalid - missing day", "2025-11", false},
		{"invalid - missing month", "2025--15", false},
		{"invalid - extra characters", "2025-11-15 00:00:00", false},
		{"invalid - US format", "11-15-2025", false},
		{"invalid - alphabetic month", "2025-Nov-15", false},
		{"invalid - single digit month", "2025-1-15", false},
		{"invalid - single digit day", "2025-11-5", false},
		{"invalid - three digit year", "025-11-15", false},
		{"invalid - empty string", "", false},
		{"invalid - only separators", "--", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validateDate(tt.date)
			if result != tt.expected {
				t.Errorf("validateDate(%q) = %v, expected %v", tt.date, result, tt.expected)
			}
		})
	}
}
