/* eslint-disable no-new */
import { Model } from "./model";
import { Entity, EntityConstructorForType } from "./entity";
let Types: { [name: string]: EntityConstructorForType<Entity> };
function resetModel() {
	Types = {};
	return new Model({
		$namespace: Types as any,
		Person: {
			FirstName: String,
			LastName: String
		},
		Movie: {
			Title: String,
			Director: "Person",
			ReleaseDate: Date,
			Genres: "String[]",
			Cast: "Person[]"
		}
	});
}

const Alien = {
	Title: "Alien",
	Director: { FirstName: "Ridley", LastName: "Scott" },
	Genres: ["science fiction", "action"],
	Cast: [] as string[]
};

describe("Entity", () => {
	beforeEach(() => {
		resetModel();
	});

	describe("construction", () => {
		it("can be extended and constructed", () => {
			const movie = new Types.Movie();

			expect(movie).toBeInstanceOf(Entity);

			expect(movie).toHaveProperty("Title");
			expect(movie).toHaveProperty("Director");
			expect(movie).toHaveProperty("ReleaseDate");
			expect(movie).toHaveProperty("Genres");
		});

		it("can be constructed with provided state", () => {
			const movie = new Types.Movie(Alien) as any;

			expect(movie.Title).toBe(Alien.Title);
			expect(movie.Director.FirstName).toBe(Alien.Director.FirstName);
			expect(movie.Director.LastName).toBe(Alien.Director.LastName);
			// call slice to get rid of observable overrides
			expect(movie.Genres.slice()).toEqual(Alien.Genres);
		});

		it("can be constructed with prebuilt child entities", () => {
			const state = Object.assign({}, Alien, {
				// Instead of a literal object representing the desired state, pass a Person instance
				Director: new Types.Person(Alien.Director)
			});
			const movie = new Types.Movie(state);

			expect(movie.serialize()).toEqual(Alien);
		});
	});

	describe("events", () => {
		describe("property change is not raised when initializing existing entity", () => {
			test("value property", () => {
				const changed = jest.fn();
				Types.Person.meta.getProperty("FirstName").changed.subscribe(changed);
				Types.Person.meta.getProperty("LastName").changed.subscribe(changed);
				new Types.Person("1", Alien.Director);

				expect(changed).not.toBeCalled();
			});

			test("value list property", () => {
				const changed = jest.fn();
				Types.Movie.meta.getProperty("Genres").changed.subscribe(changed);
				new Types.Movie("1", Alien);

				expect(changed).not.toBeCalled();
			});
		});

		describe("property change is raised when initializing new entity", () => {
			test("value property", () => {
				const changed = jest.fn();
				Types.Person.meta.getProperty("FirstName").changed.subscribe(changed);
				Types.Person.meta.getProperty("LastName").changed.subscribe(changed);
				new Types.Person(Alien.Director);

				expect(changed).toBeCalledTimes(2);
			});

			test("value list property", () => {
				const changed = jest.fn();
				Types.Movie.meta.getProperty("Genres").changed.subscribe(changed);
				new Types.Movie(Alien);

				expect(changed).toBeCalled();
			});
		});
	});

	it("can be serialized", () => {
		const movie = new Types.Movie(Alien);

		expect(movie.serialize()).toEqual(Alien);
	});

	describe("default value", () => {
		const _default = {
			Title: "Untitled",
			Director: { FirstName: "John", LastName: "Doe" },
			Genres: [] as string[]
		};

		describe("static", () => {
			beforeAll(() => {
				Types.Person.meta.extend({
					FirstName: { default: _default.Director.FirstName },
					LastName: { default: _default.Director.LastName }
				});

				Types.Movie.meta.extend({
					Title: { default: _default.Title }
				});
			});

			it("does not overwrite provided state of new entity", () => {
				const movie = new Types.Movie(Alien);

				expect(movie.serialize()).toEqual(Alien);
			});

			it("does not overwrite provided state of existing entity", () => {
				const movie = new Types.Movie("1", Alien);

				expect(movie.serialize()).toEqual(Alien);
			});
		});

		describe("rule", () => {
			let calculated = jest.fn();
			beforeEach(() => {
				calculated.mockReset();
			});

			beforeAll(() => {
				Types.Person.meta.extend({
					FirstName: { default: () => _default.Director.FirstName },
					LastName: { default: () => _default.Director.LastName }
				});

				Types.Movie.meta.extend({
					Title: { default: () => _default.Title },
					Director: { default: () => new Types.Person() }
				});
			});

			it("does not overwrite initial state of new entity", () => {
				const movie = new Types.Movie(Alien);

				expect(movie.serialize()).toEqual(Alien);
			});

			it("does not overwrite initial state of existing entity", () => {
				const movie = new Types.Movie("1", Alien);

				const state = movie.serialize();
				expect(state).toEqual(Alien);
			});
		});
	});

	describe("list", () => {
		it("can add/remove primitive items", () => {
			const movie = new Types.Movie(Alien) as any;
			const horror = "horror";

			movie.Genres.push(horror);
			expect(movie.Genres.slice()).toEqual([...Alien.Genres, horror]);

			movie.Genres.pop();
			expect(movie.Genres.slice()).toEqual(Alien.Genres);
		});

		it("can add/remove entity items", () => {
			const movie = new Types.Movie(Alien) as any;
			const sigourney = new Types.Person({ FirstName: "Sigourney", LastName: "Weaver" });
			const john = new Types.Person({ FirstName: "John", LastName: "Hurt" });

			movie.Cast.push(sigourney);
			expect(movie.Cast[0]).toBe(sigourney);

			movie.Cast.push(john);
			expect(movie.Cast[1]).toBe(john);

			movie.Cast.pop();
			expect(movie.Cast.slice()).toEqual([sigourney]);
		});
	});
});
