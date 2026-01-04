#!/bin/bash
black .
ruff check . --fix
cd frontend
npx prettier --write .
npx eslint . --fix
