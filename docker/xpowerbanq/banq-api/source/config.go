package main

import "regexp"

var (
	// Configuration values (can be set via command-line arguments)
	maxRows    = 90
	dbPath     = "/srv/db"
	listenPort = "8001"

	// CORS allowed origins
	allowedOrigins = map[string]bool{
		"https://www.xpowermine.com": true,
		"https://www.xpowerbanq.com": true,
		"http://localhost:5173":      true,
	}

	// Date validation regex (YYYY-MM-DD)
	dateRegex = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

	// SQL queries hardcoded for security
	dailyAverageSQL = `
		SELECT avg(util_e18) AS avg_util, date(stamp_iso) AS day, count(*) AS n
		FROM riw_view
		WHERE stamp_iso > ? AND stamp_iso <= ? || ' 23:59:59'
		GROUP BY day
		ORDER BY day
		LIMIT ?`

	dailyOHLCSQL = `
		WITH ranked_quotes AS (
			SELECT
				(quote_bid_e18+quote_ask_e18)/2 AS mid,
				date(quote_time_iso) AS day,
				ROW_NUMBER() OVER (PARTITION BY date(quote_time_iso) ORDER BY quote_time_iso ASC) AS rn_beg,
				ROW_NUMBER() OVER (PARTITION BY date(quote_time_iso) ORDER BY quote_time_iso DESC) AS rn_end
			FROM rtw_view
			WHERE quote_time_iso > ? AND quote_time_iso <= ? || ' 23:59:59'
		)
		SELECT
			MAX(CASE WHEN rn_beg = 1 THEN mid END) AS open,
			MAX(mid) AS high,
			MIN(mid) AS low,
			MAX(CASE WHEN rn_end = 1 THEN mid END) AS close,
			day,
			COUNT(*) AS n
		FROM ranked_quotes
		GROUP BY day
		ORDER BY day
		LIMIT ?`

	// API endpoint routes configuration
	endpointRoutes = map[string]*RouteConfig{
		"/daily_average.json": {
			DBPrefix:      "ri_",
			SQL:           dailyAverageSQL,
			QueryParams:   []string{"lhs", "rhs"},
			ResultScanner: scanDailyAverage,
			Description:   "Daily average utilization rates",
			Example:       "/ri_apow_supply_0/daily_average.json?lhs=2025-11-15&rhs=2025-12-15",
		},
		"/daily_ohlc.json": {
			DBPrefix:      "rt_",
			SQL:           dailyOHLCSQL,
			QueryParams:   []string{"lhs", "rhs"},
			ResultScanner: scanDailyOHLC,
			Description:   "Daily OHLC price quotes",
			Example:       "/rt_apow_xpow_0/daily_ohlc.json?lhs=2025-11-15&rhs=2025-12-15",
		},
	}
)
