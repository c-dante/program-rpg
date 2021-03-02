### Ramblings, probably

The result is "watch" a group of actors
- events on add/removal (?)
- efficient gets of the same group/fixed tags
```ts
type Actor = {
	tags: Set<string>
};
type Engine = {
	addActor(actor: Actor),

	// Query Actors by key?
	getByTag(tags: Set<string>): Actor[],
};
```
- Some use ideas are ownership / reacting to targets or allies...
- Query language for actors?
	- Selectors based on distance
	- Selectors based on tags / attributes
	- Maybe an efficient db for tag lookups (what to lucene do? word vectors?)
	- Efficient space db would be a quad tree and work from there
		- Find all within distance of a point
		- Find all inside an area

---

Need to track disposals
- There's cleanup to do
- Things want to react to removal


---

Get quickswitch spells & cycle spells going
(# keys, shoulders)

---
Explore tags as <k, v>
- Might be fine not, since I just don't care order
	that means `owner: some-spawner` is in my system having both tags `'owner', 'some-spawner'`
