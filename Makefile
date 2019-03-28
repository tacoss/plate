# current working directory
PWD=$(shell pwd)

# defaults
src := build
from := master
target := gh-pages
message := Release: $(shell date)

# templates
_lib=$(patsubst lib%,lib%,$*)
_page=$(patsubst page%,pages%,$(_lib))
_res=$(patsubst res%,resources%,$(_page))
_src=$(subst @,,src/$(_res))
_dir=$(patsubst %/,%,$(_src)/$(name))
_base=$(dir $(_dir))

# directories
dirname=$(patsubst %/,%,$(_base))
filepath=$(patsubst $(_base),,$(_dir))

# targets
.PHONY: help deps purge dev dist clean deploy has_body

# utils
define iif
  @(($(1) > /dev/null 2>&1) && printf "\r* $(2)\n") || printf "\r* $(3)\n"
endef

# display all targets-with-help in this file
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

deploy: $(src) ## Push built artifacts to github!
	@cd $(src) && git add . && git commit -m "$(message)"
	@git push origin $(target) -f

deps: ## Check for installed dependencies
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

purge: ## Remove all from node_modules/*
	@printf "\r* Removing all dependencies... "
	@rm -rf node_modules/.{bin,cache}
	@rm -rf node_modules/*
	@echo "OK"

add\:%: ## Create files, scripts or resources
	@make -s has_body name_not_$*
	@mkdir -p $(dirname)
	@echo "$(body)" > $(PWD)/$(filepath)
	@printf "\r* File $(filepath) was created\n"

rm\:%: ## Remove **any** stuff from your workspace
	@make -s name_not_$*
	@$(call iif,rm -r $(PWD)/$(filepath),File $(filepath) was deleted,Failed to delete $(filepath))
	@$(call iif,rmdir $(PWD)/$(dirname),Parent directory clear,Parent directory is not empty...)

# input validations
has_body:
ifeq ($(body),)
	@echo "* Missing file contents, e.g. body=TEST" && exit 1
endif

name_not_%:
	@((echo $* $(name) | grep -vE '^(lib|page|res)$$') > /dev/null 2>&1) \
		|| (echo "* Missing file path, e.g. name=TEST" && exit 1)
