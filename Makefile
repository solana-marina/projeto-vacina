.PHONY: db-up db-down backend-run backend-migrate backend-seed backend-test frontend-run frontend-test e2e

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

backend-run:
	cd backend && python manage.py runserver 8000

backend-migrate:
	cd backend && python manage.py migrate

backend-seed:
	cd backend && python manage.py seed_demo --reset

backend-test:
	cd backend && pytest -q

frontend-run:
	cd frontend && npm start

frontend-test:
	cd frontend && npm run test:unit

e2e:
	cd frontend && npm run e2e
