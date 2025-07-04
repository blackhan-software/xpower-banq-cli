.PHONY: test test-coverage test-verbose clean

# Run all tests
test:
	@cd source && go test

# Run tests with coverage
test-coverage:
	@cd source && go test -cover

# Run tests with verbose output
test-verbose:
	@cd source && go test -v

# Run specific test
test-run:
	@cd source && go test -v -run $(TEST)

# Generate coverage report
coverage:
	@cd source && go test -coverprofile=../coverage.out
	@cd source && go tool cover -html=../coverage.out -o ../coverage.html
	@echo "Coverage report generated: coverage.html"

# Clean test artifacts
clean:
	@rm -f coverage.out coverage.html
	@echo "Cleaned test artifacts"

help:
	@echo "Available targets:"
	@echo "  make test              - Run all tests"
	@echo "  make test-coverage     - Run tests with coverage"
	@echo "  make test-verbose      - Run tests with verbose output"
	@echo "  make test-run TEST=Foo - Run specific test matching pattern"
	@echo "  make coverage          - Generate HTML coverage report"
	@echo "  make clean             - Clean test artifacts"
