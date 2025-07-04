package main

import (
	"reflect"
	"testing"
)

func TestRouteConfigRegistry(t *testing.T) {
	// Verify endpointRoutes is properly initialized
	if endpointRoutes == nil {
		t.Fatal("endpointRoutes is nil")
	}

	expectedRoutes := []string{"/daily_average.json", "/daily_ohlc.json"}

	for _, route := range expectedRoutes {
		config, exists := endpointRoutes[route]
		if !exists {
			t.Errorf("expected route %s to exist in endpointRoutes", route)
			continue
		}

		// Verify config is properly initialized
		if config.DBPrefix == "" {
			t.Errorf("route %s: DBPrefix is empty", route)
		}
		if config.SQL == "" {
			t.Errorf("route %s: SQL is empty", route)
		}
		if len(config.QueryParams) == 0 {
			t.Errorf("route %s: QueryParams is empty", route)
		}
		if config.ResultScanner == nil {
			t.Errorf("route %s: ResultScanner is nil", route)
		}
		if config.Description == "" {
			t.Errorf("route %s: Description is empty", route)
		}
		if config.Example == "" {
			t.Errorf("route %s: Example is empty", route)
		}
	}
}

func TestRouteConfigDailyAverage(t *testing.T) {
	config := endpointRoutes["/daily_average.json"]

	if config.DBPrefix != "ri_" {
		t.Errorf("expected DBPrefix ri_, got %s", config.DBPrefix)
	}

	if config.SQL != dailyAverageSQL {
		t.Error("expected SQL to match dailyAverageSQL")
	}

	expectedParams := []string{"lhs", "rhs"}
	if !reflect.DeepEqual(config.QueryParams, expectedParams) {
		t.Errorf("expected QueryParams %v, got %v", expectedParams, config.QueryParams)
	}

	if config.Description != "Daily average utilization rates" {
		t.Errorf("unexpected Description: %s", config.Description)
	}
}

func TestRouteConfigDailyOHLC(t *testing.T) {
	config := endpointRoutes["/daily_ohlc.json"]

	if config.DBPrefix != "rt_" {
		t.Errorf("expected DBPrefix rt_, got %s", config.DBPrefix)
	}

	if config.SQL != dailyOHLCSQL {
		t.Error("expected SQL to match dailyOHLCSQL")
	}

	expectedParams := []string{"lhs", "rhs"}
	if !reflect.DeepEqual(config.QueryParams, expectedParams) {
		t.Errorf("expected QueryParams %v, got %v", expectedParams, config.QueryParams)
	}

	if config.Description != "Daily OHLC price quotes" {
		t.Errorf("unexpected Description: %s", config.Description)
	}
}
