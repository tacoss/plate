help: Makefile
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-13s\033[0m %s\n", $$1, $$2}'

dev: npm ## Lift dev environment
	@npm run dev

dist: npm ## Build all sources
	@npm run dist

clean: ## Remove built artifacts
	@rm -rf node_modules
	@rm -rf public

# Ensure dependencies are installed before
node_modules: package*.json
	@npm install

npm: node_modules
