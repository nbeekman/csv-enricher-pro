# Testing Guide for CSV Enricher Pro

## Overview

This document provides a comprehensive guide to testing the CSV Enricher Pro application. The test suite covers unit tests, integration tests, component tests, and end-to-end tests to ensure the application works correctly.

## Test Structure

```
src/test/
├── setup.ts                    # Test environment setup
├── runTests.ts                 # Test runner script
├── unit/                       # Unit tests
│   ├── dataExtractor.test.ts   # Data extraction logic tests
│   └── enformionService.test.ts # API service tests
├── integration/                # Integration tests
│   └── enrichmentWorkflow.test.ts # Workflow integration tests
├── components/                 # Component tests
│   ├── CSVUploader.test.tsx    # CSV upload component tests
│   ├── DataTable.test.tsx      # Data table component tests
│   └── EnrichmentControls.test.tsx # Controls component tests
└── e2e/                        # End-to-end tests
    └── enrichmentWorkflow.test.tsx # Complete workflow tests
```

## Test Categories

### 1. Unit Tests

#### Data Extractor Tests (`dataExtractor.test.ts`)
- **Purpose**: Test data extraction logic from API responses
- **Coverage**:
  - Contact Enrichment API response parsing
  - Person Search API response parsing
  - Data merging functionality
  - Error handling for malformed responses
  - Edge cases (empty data, missing fields)

#### EnformionService Tests (`enformionService.test.ts`)
- **Purpose**: Test API service functionality
- **Coverage**:
  - Service initialization and validation
  - Contact Enrichment API calls
  - Person Search API calls
  - Combination search logic
  - Error handling and fallbacks
  - Cost calculation
  - Identity score threshold logic

### 2. Integration Tests

#### Enrichment Workflow Tests (`enrichmentWorkflow.test.ts`)
- **Purpose**: Test complete enrichment workflows
- **Coverage**:
  - Contact Enrichment only workflow
  - Person Search only workflow
  - Combination search workflow
  - Data merging from multiple sources
  - Error handling across the workflow
  - Data quality prioritization

### 3. Component Tests

#### CSVUploader Tests (`CSVUploader.test.tsx`)
- **Purpose**: Test CSV file upload functionality
- **Coverage**:
  - File selection and drag-and-drop
  - File validation (type, size, format)
  - CSV parsing and data extraction
  - Error handling for invalid files
  - Loading states and user feedback

#### DataTable Tests (`DataTable.test.tsx`)
- **Purpose**: Test data display and interaction
- **Coverage**:
  - Data rendering and formatting
  - Sorting and filtering
  - Export functionality
  - Responsive design
  - Pagination for large datasets
  - Enrichment status indicators

#### EnrichmentControls Tests (`EnrichmentControls.test.tsx`)
- **Purpose**: Test enrichment control interface
- **Coverage**:
  - API key input and validation
  - Search type selection
  - Enrichment start/stop functionality
  - Progress tracking
  - Export controls
  - Form validation and error handling

### 4. End-to-End Tests

#### Complete Workflow Tests (`enrichmentWorkflow.test.tsx`)
- **Purpose**: Test complete user workflows
- **Coverage**:
  - Full enrichment process from CSV upload to export
  - Combination search workflow
  - Error handling and recovery
  - Multiple contact batch processing
  - Data export functionality

## Running Tests

### Prerequisites

Install test dependencies:
```bash
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test dataExtractor.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Test Environment Setup

The test environment is configured in `vitest.config.ts` and `src/test/setup.ts`:

- **Test Framework**: Vitest
- **Testing Library**: React Testing Library
- **Environment**: jsdom (browser simulation)
- **Mocking**: Global fetch, console, and browser APIs
- **Coverage**: V8 provider with HTML, JSON, and text reports

## Test Data

### Mock API Responses

Tests use realistic mock data based on actual API responses:

```typescript
// Contact Enrichment Response
{
  person: {
    name: { firstName: "John", middleName: "A", lastName: "Doe" },
    age: "35",
    addresses: [...],
    phones: [...],
    emails: [...]
  },
  identityScore: 95,
  message: "",
  pagination: {...}
}

// Person Search Response
{
  person: {
    name: { firstName: "John", middleName: "A", lastName: "Doe" },
    age: 35,
    addresses: [...],
    phoneNumbers: [...],
    emailAddresses: [...]
  },
  identityScore: 95,
  message: "",
  pagination: {...}
}
```

### Test CSV Data

```csv
firstName,lastName,city,state
John,Doe,New York,NY
Jane,Smith,Chicago,IL
```

## Test Scenarios

### 1. Happy Path Scenarios
- ✅ Successful CSV upload and parsing
- ✅ Successful enrichment with Contact Enrichment API
- ✅ Successful enrichment with Person Search API
- ✅ Successful combination search workflow
- ✅ Successful data export (CSV and JSON)

### 2. Error Scenarios
- ❌ Invalid CSV file format
- ❌ Missing required columns
- ❌ API authentication failures
- ❌ Network errors
- ❌ Malformed API responses
- ❌ Empty or invalid data

### 3. Edge Cases
- 🔄 Empty CSV files
- 🔄 Single row CSV files
- 🔄 Large CSV files (100+ contacts)
- 🔄 Special characters in data
- 🔄 Missing optional fields
- 🔄 Duplicate contacts

### 4. Data Quality Scenarios
- 📊 Prioritizing connected emails/phones
- 📊 Merging data from multiple sources
- 📊 Handling different data formats
- 📊 Identity score threshold logic
- 📊 Cost calculation accuracy

## Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **Component Tests**: 85%+ coverage
- **E2E Tests**: 70%+ coverage

## Continuous Integration

Tests are designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run test:run
    npm run test:coverage
```

## Debugging Tests

### Common Issues

1. **Mock Not Working**: Ensure mocks are properly set up in `beforeEach`
2. **Async Issues**: Use `waitFor` for async operations
3. **Component Not Rendering**: Check if all required props are provided
4. **API Calls Not Mocked**: Verify fetch is properly mocked

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test with debug info
npm test -- --run dataExtractor.test.ts

# Run tests in debug mode
npm test -- --inspect-brk
```

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: Each test should test one thing
4. **Mock External Dependencies**: Don't make real API calls in tests
5. **Test Edge Cases**: Include error scenarios and edge cases

### Test Data

1. **Realistic Data**: Use data that matches real API responses
2. **Minimal Data**: Use only necessary data for each test
3. **Consistent Format**: Maintain consistent data structure
4. **Edge Cases**: Include empty, null, and malformed data

### Maintenance

1. **Update Tests**: Keep tests in sync with code changes
2. **Remove Dead Tests**: Remove tests for removed functionality
3. **Refactor Tests**: Keep tests DRY and maintainable
4. **Monitor Coverage**: Track coverage trends over time

## Troubleshooting

### Test Failures

1. **Check Console Output**: Look for error messages
2. **Verify Mocks**: Ensure all mocks are properly configured
3. **Check Async Operations**: Use proper async/await patterns
4. **Validate Test Data**: Ensure test data is correct

### Performance Issues

1. **Parallel Tests**: Run tests in parallel when possible
2. **Mock Heavy Operations**: Mock expensive operations
3. **Clean Up**: Properly clean up after each test
4. **Optimize Setup**: Minimize setup/teardown overhead

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD principles
2. **Update Test Documentation**: Keep this guide current
3. **Add Integration Tests**: Test new workflows end-to-end
4. **Update Coverage Goals**: Adjust coverage targets if needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event Testing](https://testing-library.com/docs/user-event/intro/)
