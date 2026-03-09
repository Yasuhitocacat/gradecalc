# GradeCalc

A soft, clean, minimal, and professional academic management dashboard and grade calculator.

## Features

- **Dashboard** -- Overview of your academic progress with quick stats for GPA, courses, and assignments
- **Grade Calculator** -- Spreadsheet-style grade entry with weighted categories, assignment tracking, and real-time grade computation
- **Academic Programs** -- Track your enrolled programs, institutions, credit progress, and expected completion dates
- **GPA Overview** -- Cumulative and per-course GPA breakdown with a standard grading scale reference
- **Data Management** -- Export/import your data as JSON, reset, and configure settings

## How It Works

1. **Add a course** from the Grade Calculator view
2. **Define grade categories** (e.g. Homework 20%, Exams 40%, Final 40%)
3. **Add assignments** with scores under each category
4. Grades are calculated automatically using weighted averages
5. GPA is computed from course grades and credit hours

## Grading Scale

| Letter | Percentage | GPA |
|--------|-----------|-----|
| A+     | 97-100%   | 4.0 |
| A      | 93-96%    | 4.0 |
| A-     | 90-92%    | 3.7 |
| B+     | 87-89%    | 3.3 |
| B      | 83-86%    | 3.0 |
| B-     | 80-82%    | 2.7 |
| C+     | 77-79%    | 2.3 |
| C      | 73-76%    | 2.0 |
| C-     | 70-72%    | 1.7 |
| D+     | 67-69%    | 1.3 |
| D      | 63-66%    | 1.0 |
| D-     | 60-62%    | 0.7 |
| F      | 0-59%     | 0.0 |

## Tech Stack

- Pure HTML, CSS, and JavaScript (no frameworks or build tools)
- Data persisted in `localStorage`
- Responsive design with mobile sidebar navigation
- Google Fonts (Inter)

## Getting Started

Open `index.html` in any modern browser. No server or build step required.

## Data

All data is stored locally in your browser via `localStorage`. Use the Settings page to export or import your data as JSON.
