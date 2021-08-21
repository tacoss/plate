/* src/app/components/pages/Home.svelte generated by Svelte v3.38.2 */
import {
	SvelteComponent,
	detach,
	element,
	init,
	insert,
	noop,
	safe_not_equal
} from "svelte/internal";

function create_fragment(ctx) {
	let h1;

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "HOME";
		},
		m(target, anchor) {
			insert(target, h1, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(h1);
		}
	};
}

class Home extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment, safe_not_equal, {});
	}
}

export default Home;//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmsvcGxhdGUvcGxhdGUvc3JjL2FwcC9jb21wb25lbnRzL3BhZ2VzL0hvbWUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxoMT5IT01FPC9oMT5cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=