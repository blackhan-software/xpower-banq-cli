package main

import "database/sql"

// RouteConfig defines the configuration for an API endpoint
type RouteConfig struct {
	DBPrefix      string   // e.g., "ri_" - required database name prefix
	SQL           string   // SQL query to execute
	QueryParams   []string // e.g., ["lhs", "rhs"] - required query parameters
	ResultScanner func(rows *sql.Rows) (interface{}, error)
	Description   string // Human-readable description for API docs
	Example       string // Example path for API docs
}

// DailyAverage represents daily average utilization rate data
type DailyAverage struct {
	AvgUtil float64 `json:"avg_util"`
	Day     string  `json:"day"`
	N       int     `json:"n"`
}

// DailyOHLC represents daily OHLC (Open-High-Low-Close) price quote data
type DailyOHLC struct {
	Open  *float64 `json:"open"`
	High  float64  `json:"high"`
	Low   float64  `json:"low"`
	Close *float64 `json:"close"`
	Day   string   `json:"day"`
	N     int      `json:"n"`
}

// ErrorResponse represents an error response returned by the API
type ErrorResponse struct {
	Error string `json:"error"`
}
