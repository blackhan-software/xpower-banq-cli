package main

import (
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestScanDailyAverage(t *testing.T) {
	// Create temporary database
	tempDir, err := os.MkdirTemp("", "banq-api-routes-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}
	defer db.Close()

	// Create test data
	_, err = db.Exec(`
		CREATE TABLE rates (util_e18 INTEGER, stamp_iso TEXT);
		INSERT INTO rates VALUES
			(100000000000000000, '2025-11-15 10:00:00'),
			(200000000000000000, '2025-11-15 14:00:00'),
			(150000000000000000, '2025-11-16 10:00:00');
	`)
	if err != nil {
		t.Fatalf("failed to setup test data: %v", err)
	}

	// Execute query
	rows, err := db.Query(`
		SELECT avg(util_e18) AS avg_util, date(stamp_iso) AS day, count(*) AS n
		FROM rates
		GROUP BY day
		ORDER BY day
	`)
	if err != nil {
		t.Fatalf("failed to execute query: %v", err)
	}
	defer rows.Close()

	// Test scanDailyAverage
	results, err := scanDailyAverage(rows)
	if err != nil {
		t.Fatalf("scanDailyAverage failed: %v", err)
	}

	dailyAverages, ok := results.([]DailyAverage)
	if !ok {
		t.Fatalf("expected []DailyAverage, got %T", results)
	}

	expectedResults := []DailyAverage{
		{AvgUtil: 150000000000000000, Day: "2025-11-15", N: 2},
		{AvgUtil: 150000000000000000, Day: "2025-11-16", N: 1},
	}

	if len(dailyAverages) != len(expectedResults) {
		t.Errorf("expected %d results, got %d", len(expectedResults), len(dailyAverages))
	}

	for i, expected := range expectedResults {
		if i >= len(dailyAverages) {
			break
		}
		if dailyAverages[i].Day != expected.Day {
			t.Errorf("result %d: expected day %s, got %s", i, expected.Day, dailyAverages[i].Day)
		}
		if dailyAverages[i].N != expected.N {
			t.Errorf("result %d: expected n %d, got %d", i, expected.N, dailyAverages[i].N)
		}
	}
}

func TestScanDailyOHLC(t *testing.T) {
	// Create temporary database
	tempDir, err := os.MkdirTemp("", "banq-api-routes-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}
	defer db.Close()

	// Create test data
	_, err = db.Exec(`
		CREATE TABLE quotes (
			quote_bid_e18 INTEGER,
			quote_ask_e18 INTEGER,
			quote_time_iso TEXT
		);
		INSERT INTO quotes VALUES
			(100000000000000000, 110000000000000000, '2025-11-15 09:00:00'),
			(105000000000000000, 115000000000000000, '2025-11-15 12:00:00'),
			(102000000000000000, 112000000000000000, '2025-11-15 18:00:00');
	`)
	if err != nil {
		t.Fatalf("failed to setup test data: %v", err)
	}

	// Execute simplified OHLC query for testing
	rows, err := db.Query(`
		SELECT
			(quote_bid_e18+quote_ask_e18)/2 AS open,
			MAX((quote_bid_e18+quote_ask_e18)/2) AS high,
			MIN((quote_bid_e18+quote_ask_e18)/2) AS low,
			(quote_bid_e18+quote_ask_e18)/2 AS close,
			date(quote_time_iso) AS day,
			COUNT(*) AS n
		FROM quotes
		GROUP BY day
	`)
	if err != nil {
		t.Fatalf("failed to execute query: %v", err)
	}
	defer rows.Close()

	// Test scanDailyOHLC
	results, err := scanDailyOHLC(rows)
	if err != nil {
		t.Fatalf("scanDailyOHLC failed: %v", err)
	}

	ohlcResults, ok := results.([]DailyOHLC)
	if !ok {
		t.Fatalf("expected []DailyOHLC, got %T", results)
	}

	if len(ohlcResults) != 1 {
		t.Errorf("expected 1 result, got %d", len(ohlcResults))
	}

	if ohlcResults[0].Day != "2025-11-15" {
		t.Errorf("expected day 2025-11-15, got %s", ohlcResults[0].Day)
	}

	if ohlcResults[0].N != 3 {
		t.Errorf("expected n=3, got %d", ohlcResults[0].N)
	}
}
