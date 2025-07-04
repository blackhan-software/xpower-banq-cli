package main

import (
	"io"
	"log"
	"os"
	"testing"
)

// TestMain runs before all tests and sets up the test environment
func TestMain(m *testing.M) {
	// Suppress log output during tests to avoid confusing error messages
	log.SetOutput(io.Discard)

	// Run tests
	exitCode := m.Run()

	// Exit with the test result code
	os.Exit(exitCode)
}
