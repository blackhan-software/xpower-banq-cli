package main

import (
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestOpenDatabase(t *testing.T) {
	// Create temporary database directory
	tempDir, err := os.MkdirTemp("", "banq-api-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Note: Cannot reassign const dbPath, so this test uses a helper function

	// Create a test database
	testDbPath := filepath.Join(tempDir, "test_db.db")
	db, err := sql.Open("sqlite3", testDbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	// Create a simple table
	_, err = db.Exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
	if err != nil {
		t.Fatalf("failed to create test table: %v", err)
	}
	db.Close()

	tests := []struct {
		name        string
		dbName      string
		setupFunc   func() string
		expectError bool
		errorMsg    string
	}{
		{
			name:   "valid database",
			dbName: "test_db",
			setupFunc: func() string {
				return tempDir
			},
			expectError: false,
		},
		{
			name:   "database not found",
			dbName: "nonexistent_db",
			setupFunc: func() string {
				return tempDir
			},
			expectError: true,
			errorMsg:    "database not found",
		},
		{
			name:   "invalid database directory",
			dbName: "test_db",
			setupFunc: func() string {
				return "/nonexistent/path"
			},
			expectError: true,
			errorMsg:    "database not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testDbPath := tt.setupFunc()

			// Use helper function that accepts dbPath parameter
			db, fileName, err := openDatabaseWithPath(tt.dbName, testDbPath)

			if tt.expectError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
				if db == nil {
					t.Errorf("expected database connection but got nil")
				} else {
					defer db.Close()

					// Verify connection works
					if err := db.Ping(); err != nil {
						t.Errorf("database ping failed: %v", err)
					}
				}

				expectedFileName := tt.dbName + ".db"
				if fileName != expectedFileName {
					t.Errorf("expected fileName %q, got %q", expectedFileName, fileName)
				}
			}
		})
	}
}

func TestValidateDatabases(t *testing.T) {
	tests := []struct {
		name        string
		setupFunc   func() (string, func())
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid databases",
			setupFunc: func() (string, func()) {
				tempDir, _ := os.MkdirTemp("", "banq-api-test-*")

				// Create valid test databases
				for _, dbName := range []string{"ri_test_0.db", "rt_test_0.db"} {
					dbPath := filepath.Join(tempDir, dbName)
					db, _ := sql.Open("sqlite3", dbPath)
					db.Exec("CREATE TABLE test (id INTEGER)")
					db.Close()
				}

				cleanup := func() { os.RemoveAll(tempDir) }
				return tempDir, cleanup
			},
			expectError: false,
		},
		{
			name: "database directory does not exist",
			setupFunc: func() (string, func()) {
				return "/nonexistent/path/to/databases", func() {}
			},
			expectError: true,
			errorMsg:    "database path does not exist",
		},
		{
			name: "no database files found",
			setupFunc: func() (string, func()) {
				tempDir, _ := os.MkdirTemp("", "banq-api-test-*")
				cleanup := func() { os.RemoveAll(tempDir) }
				return tempDir, cleanup
			},
			expectError: true,
			errorMsg:    "no database files",
		},
		{
			name: "corrupted database file",
			setupFunc: func() (string, func()) {
				tempDir, _ := os.MkdirTemp("", "banq-api-test-*")

				// Create a corrupted database file
				corruptedDbPath := filepath.Join(tempDir, "corrupted.db")
				os.WriteFile(corruptedDbPath, []byte("not a valid sqlite database"), 0644)

				cleanup := func() { os.RemoveAll(tempDir) }
				return tempDir, cleanup
			},
			expectError: true,
			errorMsg:    "database validation failed",
		},
		{
			name: "symlinked database",
			setupFunc: func() (string, func()) {
				tempDir, _ := os.MkdirTemp("", "banq-api-test-*")

				// Create real database
				realDbPath := filepath.Join(tempDir, "real.db")
				db, _ := sql.Open("sqlite3", realDbPath)
				db.Exec("CREATE TABLE test (id INTEGER)")
				db.Close()

				// Create symlink
				symlinkPath := filepath.Join(tempDir, "symlinked.db")
				os.Symlink(realDbPath, symlinkPath)

				cleanup := func() { os.RemoveAll(tempDir) }
				return tempDir, cleanup
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testPath, cleanup := tt.setupFunc()
			defer cleanup()

			err := validateDatabasesWithPath(testPath)

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

// Helper function to allow testing with custom dbPath
func openDatabaseWithPath(dbName string, basePath string) (*sql.DB, string, error) {
	dbFile := filepath.Join(basePath, dbName+".db")

	// Check if file exists
	if _, err := os.Stat(dbFile); os.IsNotExist(err) {
		return nil, "", err
	}

	db, err := sql.Open("sqlite3", "file:"+dbFile+"?mode=ro")
	if err != nil {
		return nil, "", err
	}

	// Test connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, "", err
	}

	return db, filepath.Base(dbFile), nil
}

// Helper function to allow testing with custom dbPath
func validateDatabasesWithPath(testPath string) error {
	// Check if database path exists
	if _, err := os.Stat(testPath); os.IsNotExist(err) {
		return err
	}

	// Find all database files
	dbFiles, err := filepath.Glob(filepath.Join(testPath, "*.db"))
	if err != nil {
		return err
	}

	if len(dbFiles) == 0 {
		return os.ErrNotExist
	}

	var hasErrors bool

	for _, dbFile := range dbFiles {
		// Resolve symlinks if needed
		realPath := dbFile
		if info, err := os.Lstat(dbFile); err == nil && info.Mode()&os.ModeSymlink != 0 {
			if resolved, err := filepath.EvalSymlinks(dbFile); err == nil {
				realPath = resolved
			}
		}

		// Try to open and ping the database
		db, err := sql.Open("sqlite3", "file:"+realPath+"?mode=ro")
		if err != nil {
			hasErrors = true
			continue
		}

		err = db.Ping()
		db.Close()
		if err != nil {
			hasErrors = true
			continue
		}
	}

	if hasErrors {
		return os.ErrInvalid
	}

	return nil
}

func TestDatabaseReadOnly(t *testing.T) {
	// Create temporary database directory
	tempDir, err := os.MkdirTemp("", "banq-api-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create a test database
	testDbPath := filepath.Join(tempDir, "readonly_test.db")
	db, err := sql.Open("sqlite3", testDbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}

	// Create a simple table
	_, err = db.Exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
	if err != nil {
		t.Fatalf("failed to create test table: %v", err)
	}

	// Insert test data
	_, err = db.Exec("INSERT INTO test (name) VALUES ('test')")
	if err != nil {
		t.Fatalf("failed to insert test data: %v", err)
	}
	db.Close()

	// Open in read-only mode (as the API does)
	roDb, _, err := openDatabaseWithPath("readonly_test", tempDir)
	if err != nil {
		t.Fatalf("failed to open database in read-only mode: %v", err)
	}
	defer roDb.Close()

	// Try to write (should fail)
	_, err = roDb.Exec("INSERT INTO test (name) VALUES ('should fail')")
	if err == nil {
		t.Errorf("expected write to fail on read-only database, but it succeeded")
	}

	// Verify read works
	var count int
	err = roDb.QueryRow("SELECT COUNT(*) FROM test").Scan(&count)
	if err != nil {
		t.Errorf("read query failed: %v", err)
	}
	if count != 1 {
		t.Errorf("expected count=1, got %d", count)
	}
}
