/* node_modules/yrv/build/lib/Router.svelte generated by Svelte v3.32.3 */
import {
	SvelteComponent,
	check_outros,
	component_subscribe,
	create_slot,
	detach,
	empty,
	group_outros,
	init,
	insert,
	safe_not_equal,
	transition_in,
	transition_out,
	update_slot
} from "svelte/internal";

import { baseRouter, addRouter, findRoutes, doFallback } from "./router";
import { CTX_ROUTER, router } from "./utils";
import { writable } from "svelte/store";
import { onMount, onDestroy, getContext, setContext } from "svelte";

function create_if_block(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 32) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment(ctx) {
	let if_block_anchor;
	let current;
	let if_block = !/*disabled*/ ctx[0] && create_if_block(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (!/*disabled*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*disabled*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function unassignRoute(route) {
	try {
		baseRouter.rm(route);
	} catch(e) {
		
	} // 🔥 this is fine...

	findRoutes();
}

function instance($$self, $$props, $$invalidate) {
	let $basePath;
	let $router;
	component_subscribe($$self, router, $$value => $$invalidate(4, $router = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	let cleanup;
	let failure;
	let fallback;
	let { path = "/" } = $$props;
	let { disabled = false } = $$props;
	let { condition = null } = $$props;
	const routerContext = getContext(CTX_ROUTER);
	const basePath = routerContext ? routerContext.basePath : writable(path);
	component_subscribe($$self, basePath, value => $$invalidate(10, $basePath = value));

	const fixedRoot = $basePath !== path && $basePath !== "/"
	? `${$basePath}${path !== "/" ? path : ""}`
	: path;

	function assignRoute(key, route, detail) {
		key = key || Math.random().toString(36).substr(2);

		// consider as nested routes if they does not have any segment
		const nested = !route.substr(1).includes("/");

		const handler = { key, nested, ...detail };
		let fullpath;

		baseRouter.mount(fixedRoot, () => {
			fullpath = baseRouter.add(route, handler);
			fallback = handler.fallback && key || fallback;
		});

		findRoutes();
		return [key, fullpath];
	}

	function onError(err) {
		failure = err;

		if (failure && fallback) {
			doFallback(failure, fallback);
		}
	}

	onMount(() => {
		cleanup = addRouter(fixedRoot, fallback, onError);
	});

	onDestroy(() => {
		if (cleanup) cleanup();
	});

	setContext(CTX_ROUTER, { basePath, assignRoute, unassignRoute });

	$$self.$$set = $$props => {
		if ("path" in $$props) $$invalidate(2, path = $$props.path);
		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
		if ("condition" in $$props) $$invalidate(3, condition = $$props.condition);
		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*condition, $router*/ 24) {
			$: if (condition) {
				$$invalidate(0, disabled = !condition($router));
			}
		}
	};

	return [disabled, basePath, path, condition, $router, $$scope, slots];
}

class Router extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { path: 2, disabled: 0, condition: 3 });
	}
}

export default Router;//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmsvcGxhdGUvcGxhdGUvbm9kZV9tb2R1bGVzL3lydi9idWlsZC9saWIvUm91dGVyLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0IGNvbnRleHQ9XCJtb2R1bGVcIj5cbiAgaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xuICBpbXBvcnQgeyBDVFhfUk9VVEVSLCByb3V0ZXIgfSBmcm9tICcuL3V0aWxzJztcbiAgaW1wb3J0IHtcbiAgICBiYXNlUm91dGVyLCBhZGRSb3V0ZXIsIGZpbmRSb3V0ZXMsIGRvRmFsbGJhY2ssXG4gIH0gZnJvbSAnLi9yb3V0ZXInO1xuPC9zY3JpcHQ+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCB7XG4gICAgb25Nb3VudCwgb25EZXN0cm95LCBnZXRDb250ZXh0LCBzZXRDb250ZXh0LFxuICB9IGZyb20gJ3N2ZWx0ZSc7XG5cbiAgbGV0IGNsZWFudXA7XG4gIGxldCBmYWlsdXJlO1xuICBsZXQgZmFsbGJhY2s7XG5cbiAgZXhwb3J0IGxldCBwYXRoID0gJy8nO1xuICBleHBvcnQgbGV0IGRpc2FibGVkID0gZmFsc2U7XG4gIGV4cG9ydCBsZXQgY29uZGl0aW9uID0gbnVsbDtcblxuXG4gIGNvbnN0IHJvdXRlckNvbnRleHQgPSBnZXRDb250ZXh0KENUWF9ST1VURVIpO1xuICBjb25zdCBiYXNlUGF0aCA9IHJvdXRlckNvbnRleHQgPyByb3V0ZXJDb250ZXh0LmJhc2VQYXRoIDogd3JpdGFibGUocGF0aCk7XG5cbiAgY29uc3QgZml4ZWRSb290ID0gJGJhc2VQYXRoICE9PSBwYXRoICYmICRiYXNlUGF0aCAhPT0gJy8nXG4gICAgPyBgJHskYmFzZVBhdGh9JHtwYXRoICE9PSAnLycgPyBwYXRoIDogJyd9YFxuICAgIDogcGF0aDtcblxuXG4gIGZ1bmN0aW9uIGFzc2lnblJvdXRlKGtleSwgcm91dGUsIGRldGFpbCkge1xuICAgIGtleSA9IGtleSB8fCBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMik7XG5cbiAgICAvLyBjb25zaWRlciBhcyBuZXN0ZWQgcm91dGVzIGlmIHRoZXkgZG9lcyBub3QgaGF2ZSBhbnkgc2VnbWVudFxuICAgIGNvbnN0IG5lc3RlZCA9ICFyb3V0ZS5zdWJzdHIoMSkuaW5jbHVkZXMoJy8nKTtcbiAgICBjb25zdCBoYW5kbGVyID0geyBrZXksIG5lc3RlZCwgLi4uZGV0YWlsIH07XG5cbiAgICBsZXQgZnVsbHBhdGg7XG5cbiAgICBiYXNlUm91dGVyLm1vdW50KGZpeGVkUm9vdCwgKCkgPT4ge1xuICAgICAgZnVsbHBhdGggPSBiYXNlUm91dGVyLmFkZChyb3V0ZSwgaGFuZGxlcik7XG4gICAgICBmYWxsYmFjayA9IChoYW5kbGVyLmZhbGxiYWNrICYmIGtleSkgfHwgZmFsbGJhY2s7XG4gICAgfSk7XG5cbiAgICBmaW5kUm91dGVzKCk7XG5cbiAgICByZXR1cm4gW2tleSwgZnVsbHBhdGhdO1xuICB9XG5cbiAgZnVuY3Rpb24gdW5hc3NpZ25Sb3V0ZShyb3V0ZSkge1xuICAgIHRyeSB7XG4gICAgICBiYXNlUm91dGVyLnJtKHJvdXRlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyDwn5SlIHRoaXMgaXMgZmluZS4uLlxuICAgIH1cbiAgICBmaW5kUm91dGVzKCk7XG4gIH1cblxuICBmdW5jdGlvbiBvbkVycm9yKGVycikge1xuICAgIGZhaWx1cmUgPSBlcnI7XG5cbiAgICBpZiAoZmFpbHVyZSAmJiBmYWxsYmFjaykge1xuICAgICAgZG9GYWxsYmFjayhmYWlsdXJlLCBmYWxsYmFjayk7XG4gICAgfVxuICB9XG5cbiAgb25Nb3VudCgoKSA9PiB7XG4gICAgY2xlYW51cCA9IGFkZFJvdXRlcihmaXhlZFJvb3QsIGZhbGxiYWNrLCBvbkVycm9yKTtcbiAgfSk7XG5cbiAgb25EZXN0cm95KCgpID0+IHtcbiAgICBpZiAoY2xlYW51cCkgY2xlYW51cCgpO1xuICB9KTtcblxuICBzZXRDb250ZXh0KENUWF9ST1VURVIsIHtcbiAgICBiYXNlUGF0aCxcbiAgICBhc3NpZ25Sb3V0ZSxcbiAgICB1bmFzc2lnblJvdXRlLFxuICB9KTtcblxuICAkOiBpZiAoY29uZGl0aW9uKSB7XG4gICAgZGlzYWJsZWQgPSAhY29uZGl0aW9uKCRyb3V0ZXIpO1xuICB9XG48L3NjcmlwdD5cblxueyNpZiAhZGlzYWJsZWR9XG4gIDxzbG90IC8+XG57L2lmfVxuXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O1NBSUksVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsVUFBVSxRQUN4QyxVQUFVO1NBSFIsVUFBVSxFQUFFLE1BQU0sUUFBUSxTQUFTO1NBRG5DLFFBQVEsUUFBUSxjQUFjO1NBU3JDLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFVBQVUsUUFDckMsUUFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs4QkEwRVgsR0FBUTs7Ozs7Ozs7Ozs7OztxQkFBUixHQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0FwQ0gsYUFBYSxDQUFDLEtBQUs7O0VBRXhCLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSztTQUNaLENBQUM7Ozs7Q0FHVixVQUFVOzs7Ozs7OztLQTFDUixPQUFPO0tBQ1AsT0FBTztLQUNQLFFBQVE7T0FFRCxJQUFJLEdBQUcsR0FBRztPQUNWLFFBQVEsR0FBRyxLQUFLO09BQ2hCLFNBQVMsR0FBRyxJQUFJO09BR3JCLGFBQWEsR0FBRyxVQUFVLENBQUMsVUFBVTtPQUNyQyxRQUFRLEdBQUcsYUFBYSxHQUFHLGFBQWEsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUk7OztPQUVqRSxTQUFTLEdBQUcsU0FBUyxLQUFLLElBQUksSUFBSSxTQUFTLEtBQUssR0FBRztNQUNsRCxTQUFTLEdBQUcsSUFBSSxLQUFLLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRTtHQUN2QyxJQUFJOztVQUdDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU07RUFDckMsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7OztRQUcxQyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLEdBQUc7O1FBQ3RDLE9BQU8sS0FBSyxHQUFHLEVBQUUsTUFBTSxLQUFLLE1BQU07TUFFcEMsUUFBUTs7RUFFWixVQUFVLENBQUMsS0FBSyxDQUFDLFNBQVM7R0FDeEIsUUFBUSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU87R0FDeEMsUUFBUSxHQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksR0FBRyxJQUFLLFFBQVE7OztFQUdsRCxVQUFVO1VBRUYsR0FBRyxFQUFFLFFBQVE7OztVQVlkLE9BQU8sQ0FBQyxHQUFHO0VBQ2xCLE9BQU8sR0FBRyxHQUFHOztNQUVULE9BQU8sSUFBSSxRQUFRO0dBQ3JCLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUTs7OztDQUloQyxPQUFPO0VBQ0wsT0FBTyxHQUFHLFNBQVMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLE9BQU87OztDQUdsRCxTQUFTO01BQ0gsT0FBTyxFQUFFLE9BQU87OztDQUd0QixVQUFVLENBQUMsVUFBVSxJQUNuQixRQUFRLEVBQ1IsV0FBVyxFQUNYLGFBQWE7Ozs7Ozs7Ozs7O0dBR2YsQ0FBQyxNQUFNLFNBQVM7b0JBQ2QsUUFBUSxJQUFJLFNBQVMsQ0FBQyxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7In0=