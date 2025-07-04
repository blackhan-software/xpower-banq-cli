package main

import (
	"flag"
	"os"
	"os/exec"
	"reflect"
	"strings"
	"testing"
)

func TestCorsOriginsFlag_String(t *testing.T) {
	tests := []struct {
		name    string
		origins map[string]bool
		want    string
	}{
		{
			name:    "nil origins",
			origins: nil,
			want:    "[]",
		},
		{
			name:    "empty origins",
			origins: map[string]bool{},
			want:    "[]",
		},
		{
			name: "single origin",
			origins: map[string]bool{
				"https://example.com": true,
			},
			want: `["https://example.com"]`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &corsOriginsFlag{
				origins: tt.origins,
			}
			got := c.String()
			if got != tt.want {
				t.Errorf("String() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCorsOriginsFlag_Set(t *testing.T) {
	tests := []struct {
		name        string
		value       string
		wantOrigins map[string]bool
		wantErr     bool
	}{
		{
			name:  "valid single origin",
			value: `["https://example.com"]`,
			wantOrigins: map[string]bool{
				"https://example.com": true,
			},
			wantErr: false,
		},
		{
			name:  "valid multiple origins",
			value: `["https://example.com","http://localhost:3000"]`,
			wantOrigins: map[string]bool{
				"https://example.com":   true,
				"http://localhost:3000": true,
			},
			wantErr: false,
		},
		{
			name:        "empty array",
			value:       `[]`,
			wantOrigins: map[string]bool{},
			wantErr:     false,
		},
		{
			name:        "invalid JSON",
			value:       `not-json`,
			wantOrigins: nil,
			wantErr:     true,
		},
		{
			name:        "invalid JSON - not an array",
			value:       `{"key": "value"}`,
			wantOrigins: nil,
			wantErr:     true,
		},
		{
			name:        "invalid JSON - unclosed bracket",
			value:       `["https://example.com"`,
			wantOrigins: nil,
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &corsOriginsFlag{}
			err := c.Set(tt.value)
			if (err != nil) != tt.wantErr {
				t.Errorf("Set() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && !reflect.DeepEqual(c.origins, tt.wantOrigins) {
				t.Errorf("Set() origins = %v, want %v", c.origins, tt.wantOrigins)
			}
		})
	}
}

func TestParseArgs_Defaults(t *testing.T) {
	// Save original values
	origMaxRows := maxRows
	origDbPath := dbPath
	origListenPort := listenPort
	origAllowedOrigins := allowedOrigins
	origArgs := os.Args

	// Restore original values after test
	defer func() {
		maxRows = origMaxRows
		dbPath = origDbPath
		listenPort = origListenPort
		allowedOrigins = origAllowedOrigins
		os.Args = origArgs
		flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)
	}()

	// Reset to defaults
	maxRows = 90
	dbPath = "/srv/db"
	listenPort = "8001"
	allowedOrigins = map[string]bool{
		"https://www.xpowermine.com": true,
		"https://www.xpowerbanq.com": true,
		"http://localhost:5173":      true,
	}

	// Simulate no command-line arguments
	os.Args = []string{"cmd"}
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)

	parseArgs()

	// Verify defaults are maintained
	if maxRows != 90 {
		t.Errorf("maxRows = %v, want 90", maxRows)
	}
	if dbPath != "/srv/db" {
		t.Errorf("dbPath = %v, want /srv/db", dbPath)
	}
	if listenPort != "8001" {
		t.Errorf("listenPort = %v, want 8001", listenPort)
	}
	expectedOrigins := map[string]bool{
		"https://www.xpowermine.com": true,
		"https://www.xpowerbanq.com": true,
		"http://localhost:5173":      true,
	}
	if !reflect.DeepEqual(allowedOrigins, expectedOrigins) {
		t.Errorf("allowedOrigins = %v, want %v", allowedOrigins, expectedOrigins)
	}
}

func TestParseArgs_ShortFlags(t *testing.T) {
	// Save original values
	origMaxRows := maxRows
	origDbPath := dbPath
	origListenPort := listenPort
	origAllowedOrigins := allowedOrigins
	origArgs := os.Args

	// Restore original values after test
	defer func() {
		maxRows = origMaxRows
		dbPath = origDbPath
		listenPort = origListenPort
		allowedOrigins = origAllowedOrigins
		os.Args = origArgs
		flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)
	}()

	// Reset to defaults
	maxRows = 90
	dbPath = "/srv/db"
	listenPort = "8001"
	allowedOrigins = map[string]bool{
		"https://www.xpowermine.com": true,
		"https://www.xpowerbanq.com": true,
		"http://localhost:5173":      true,
	}

	// Simulate command-line arguments with short flags
	os.Args = []string{
		"cmd",
		"-R", "100",
		"-P", "/var/lib/db",
		"-p", "9000",
		"-O", `["https://test.com"]`,
	}
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)

	parseArgs()

	// Verify values were updated
	if maxRows != 100 {
		t.Errorf("maxRows = %v, want 100", maxRows)
	}
	if dbPath != "/var/lib/db" {
		t.Errorf("dbPath = %v, want /var/lib/db", dbPath)
	}
	if listenPort != "9000" {
		t.Errorf("listenPort = %v, want 9000", listenPort)
	}
	expectedOrigins := map[string]bool{
		"https://test.com": true,
	}
	if !reflect.DeepEqual(allowedOrigins, expectedOrigins) {
		t.Errorf("allowedOrigins = %v, want %v", allowedOrigins, expectedOrigins)
	}
}

func TestParseArgs_LongFlags(t *testing.T) {
	// Save original values
	origMaxRows := maxRows
	origDbPath := dbPath
	origListenPort := listenPort
	origAllowedOrigins := allowedOrigins
	origArgs := os.Args

	// Restore original values after test
	defer func() {
		maxRows = origMaxRows
		dbPath = origDbPath
		listenPort = origListenPort
		allowedOrigins = origAllowedOrigins
		os.Args = origArgs
		flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)
	}()

	// Reset to defaults
	maxRows = 90
	dbPath = "/srv/db"
	listenPort = "8001"
	allowedOrigins = map[string]bool{
		"https://www.xpowermine.com": true,
		"https://www.xpowerbanq.com": true,
		"http://localhost:5173":      true,
	}

	// Simulate command-line arguments with long flags
	os.Args = []string{
		"cmd",
		"--max-rows", "50",
		"--db-path", "/data/databases",
		"--port", "8080",
		"--cors-origins", `["https://api.example.com","http://localhost:3000"]`,
	}
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)

	parseArgs()

	// Verify values were updated
	if maxRows != 50 {
		t.Errorf("maxRows = %v, want 50", maxRows)
	}
	if dbPath != "/data/databases" {
		t.Errorf("dbPath = %v, want /data/databases", dbPath)
	}
	if listenPort != "8080" {
		t.Errorf("listenPort = %v, want 8080", listenPort)
	}
	expectedOrigins := map[string]bool{
		"https://api.example.com": true,
		"http://localhost:3000":   true,
	}
	if !reflect.DeepEqual(allowedOrigins, expectedOrigins) {
		t.Errorf("allowedOrigins = %v, want %v", allowedOrigins, expectedOrigins)
	}
}

func TestParseArgs_MixedFlags(t *testing.T) {
	// Save original values
	origMaxRows := maxRows
	origDbPath := dbPath
	origListenPort := listenPort
	origAllowedOrigins := allowedOrigins
	origArgs := os.Args

	// Restore original values after test
	defer func() {
		maxRows = origMaxRows
		dbPath = origDbPath
		listenPort = origListenPort
		allowedOrigins = origAllowedOrigins
		os.Args = origArgs
		flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)
	}()

	// Reset to defaults
	maxRows = 90
	dbPath = "/srv/db"
	listenPort = "8001"
	allowedOrigins = map[string]bool{
		"https://www.xpowermine.com": true,
		"https://www.xpowerbanq.com": true,
		"http://localhost:5173":      true,
	}

	// Simulate command-line arguments with mixed short and long flags
	os.Args = []string{
		"cmd",
		"-R", "75",
		"--db-path", "/custom/path",
		"-p", "7000",
	}
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)

	parseArgs()

	// Verify values were updated
	if maxRows != 75 {
		t.Errorf("maxRows = %v, want 75", maxRows)
	}
	if dbPath != "/custom/path" {
		t.Errorf("dbPath = %v, want /custom/path", dbPath)
	}
	if listenPort != "7000" {
		t.Errorf("listenPort = %v, want 7000", listenPort)
	}
	// CORS origins should remain at default since not specified
	expectedOrigins := map[string]bool{
		"https://www.xpowermine.com": true,
		"https://www.xpowerbanq.com": true,
		"http://localhost:5173":      true,
	}
	if !reflect.DeepEqual(allowedOrigins, expectedOrigins) {
		t.Errorf("allowedOrigins = %v, want %v", allowedOrigins, expectedOrigins)
	}
}

// TestHelpFlag_Short tests the -h flag by building and running the binary
func TestHelpFlag_Short(t *testing.T) {
	// Build a test binary
	tmpBinary := t.TempDir() + "/banq-api-test"
	buildCmd := exec.Command("go", "build", "-o", tmpBinary, ".")
	if err := buildCmd.Run(); err != nil {
		t.Fatalf("Failed to build test binary: %v", err)
	}
	defer os.Remove(tmpBinary)

	// Run with -h flag
	cmd := exec.Command(tmpBinary, "-h")
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Exit code 0 is expected, but exec returns error if exit code != 0
		if exitErr, ok := err.(*exec.ExitError); ok {
			if exitErr.ExitCode() != 0 {
				t.Fatalf("Expected exit code 0, got %d", exitErr.ExitCode())
			}
		}
	}

	outputStr := string(output)

	// Verify help output contains expected sections
	expectedStrings := []string{
		"Usage:",
		"XPowerBanq API Server",
		"Options:",
		"-h, --help",
		"-R, --max-rows",
		"-P, --db-path",
		"-p, --port",
		"-O, --cors-origins",
		"Show this help message and exit",
	}

	for _, expected := range expectedStrings {
		if !strings.Contains(outputStr, expected) {
			t.Errorf("Help output missing expected string: %q\nGot:\n%s", expected, outputStr)
		}
	}
}

// TestHelpFlag_Long tests the --help flag by building and running the binary
func TestHelpFlag_Long(t *testing.T) {
	// Build a test binary
	tmpBinary := t.TempDir() + "/banq-api-test"
	buildCmd := exec.Command("go", "build", "-o", tmpBinary, ".")
	if err := buildCmd.Run(); err != nil {
		t.Fatalf("Failed to build test binary: %v", err)
	}
	defer os.Remove(tmpBinary)

	// Run with --help flag
	cmd := exec.Command(tmpBinary, "--help")
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Exit code 0 is expected
		if exitErr, ok := err.(*exec.ExitError); ok {
			if exitErr.ExitCode() != 0 {
				t.Fatalf("Expected exit code 0, got %d", exitErr.ExitCode())
			}
		}
	}

	outputStr := string(output)

	// Verify help output contains expected sections
	expectedStrings := []string{
		"Usage:",
		"XPowerBanq API Server",
		"Options:",
		"-h, --help",
		"-R, --max-rows",
		"-P, --db-path",
		"-p, --port",
		"-O, --cors-origins",
	}

	for _, expected := range expectedStrings {
		if !strings.Contains(outputStr, expected) {
			t.Errorf("Help output missing expected string: %q\nGot:\n%s", expected, outputStr)
		}
	}

	// Verify defaults are shown correctly
	if !strings.Contains(outputStr, "default: 90") {
		t.Error("Help output missing default value for max-rows")
	}
	if !strings.Contains(outputStr, "default: /srv/db") {
		t.Error("Help output missing default value for db-path")
	}
	if !strings.Contains(outputStr, "default: 8001") {
		t.Error("Help output missing default value for port")
	}
}
