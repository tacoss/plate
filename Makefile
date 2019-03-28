# defaults
src := build
from := master
target := gh-pages
message := Release: $(shell date)

define iif
  @(($(1) > /dev/null 2>&1) && printf "\r* $(2)\n") || printf "\r* $(3)\n"
endef

help: Makefile
	@awk -F':.*?##' '/^[a-z\\%!:-]+:.*##/{gsub("%","*",$$1);gsub("\\\\",":*",$$1);printf "\033[36m%8s\033[0m %s\n",$$1,$$2}' $<

dev: deps ## Start development scripts
	@npm run dev

dist: deps ## Build artifact for production
	@(git worktree remove $(src) --force > /dev/null 2>&1) || true
	@git worktree add $(src) $(target)
	@npm run dist

clean: ## Remove cache and generated artifacts
	@$(call iif,rm -r $(src),Built artifacts were deleted,Artifacts already deleted)
	@$(call iif,unlink .tarima,Cache file was deleted,Cache file already deleted)

deploy: $(src)
	@cd $(src) && git add . && git commit -m "$(message)"
	@git push origin $(target) -f

# Ensure dependencies are installed before
.PHONY: help deps purge dev dist clean deploy

deps: ## Check for installed dependencies
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

purge: ## Remove all from node_modules/*
	@printf "\r* Removing all dependencies... "
	@rm -rf node_modules/.{bin,cache}
	@rm -rf node_modules/*
	@echo "OK"
