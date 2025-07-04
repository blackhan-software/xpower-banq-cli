package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// openDatabase opens a specific database by name
func openDatabase(dbName string) (*sql.DB, string, error) {
	dbFile := filepath.Join(dbPath, dbName+".db")

	// Check if file exists
	if _, err := os.Stat(dbFile); os.IsNotExist(err) {
		return nil, "", fmt.Errorf("database not found: %s", dbName)
	}

	db, err := sql.Open("sqlite3", fmt.Sprintf("file:%s?mode=ro&immutable=1", dbFile))
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

// validateDatabases checks all databases are accessible at startup
func validateDatabases() error {
	// Check if database path exists
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		return fmt.Errorf("database path does not exist: %s", dbPath)
	}

	// Find all database files
	dbFiles, err := filepath.Glob(filepath.Join(dbPath, "*.db"))
	if err != nil {
		return fmt.Errorf("failed to list database files: %v", err)
	}

	if len(dbFiles) == 0 {
		return fmt.Errorf("no database files (*.db) found in %s", dbPath)
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
		db, err := sql.Open("sqlite3", fmt.Sprintf("file:%s?mode=ro&immutable=1", realPath))
		if err != nil {
			log.Printf("[!!] %s", realPath)
			log.Printf("%s", err)
			hasErrors = true
			continue
		}

		err = db.Ping()
		db.Close()
		if err != nil {
			log.Printf("[!!] %s", realPath)
			log.Printf("%s", err)
			hasErrors = true
			continue
		}

		log.Printf("[ok] %s", realPath)
	}

	if hasErrors {
		return fmt.Errorf("database validation failed")
	}

	return nil
}
