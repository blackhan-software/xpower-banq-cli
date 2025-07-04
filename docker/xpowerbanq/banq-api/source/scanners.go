package main

import (
	"database/sql"
	"fmt"
)

// scanDailyAverage scans a DailyAverage result from a database row
func scanDailyAverage(rows *sql.Rows) (interface{}, error) {
	var results []DailyAverage
	for rows.Next() {
		var da DailyAverage
		if err := rows.Scan(&da.AvgUtil, &da.Day, &da.N); err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}
		results = append(results, da)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return results, nil
}

// scanDailyOHLC scans a DailyOHLC result from a database row
func scanDailyOHLC(rows *sql.Rows) (interface{}, error) {
	var results []DailyOHLC
	for rows.Next() {
		var ohlc DailyOHLC
		if err := rows.Scan(&ohlc.Open, &ohlc.High, &ohlc.Low, &ohlc.Close, &ohlc.Day, &ohlc.N); err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}
		results = append(results, ohlc)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return results, nil
}
