import { Model } from "./model";
import { Entity } from "./entity";
let Types: any;
function resetModel() {
	Types = {};
	return new Model({
		$namespace: Types,
		Person: {
			FirstName: String,
			LastName: String
		},
		Movie: {
			Title: String,
			Director: "Person",
			ReleaseDate: Date
		}
	});
}

describe("Entity", () => {
	beforeAll(() => {
		resetModel();
	});

	it("can be extended and constructed", () => {
		const movie = new Types.Movie();

		expect(movie).toBeInstanceOf(Entity);

		expect(movie).toHaveProperty("Title");
		expect(movie).toHaveProperty("Director");
		expect(movie).toHaveProperty("ReleaseDate");
	});

	const Alien = {
		Title: "Alien",
		Director: { FirstName: "Ridley", LastName: "Scott" }
	};

	it("can be constructed with provided state", () => {
		const movie = new Types.Movie(Alien);

		expect(movie.Title).toBe(Alien.Title);
		expect(movie.Director.FirstName).toBe(Alien.Director.FirstName);
		expect(movie.Director.LastName).toBe(Alien.Director.LastName);
	});

	it("can be constructed with prebuilt child entities", () => {
		const state = Object.assign({}, Alien, {
			Director: new Types.Person(Alien.Director)
		});
		const movie = new Types.Movie(state);

		expect(movie.Title).toBe(Alien.Title);
		expect(movie.Director.FirstName).toBe(Alien.Director.FirstName);
		expect(movie.Director.LastName).toBe(Alien.Director.LastName);
	});

	it("can be serialized", () => {
		const movie = new Types.Movie(Alien);

		expect(movie.serialize()).toEqual(Alien);
	});

	describe("default value", () => {
		const _default = {
			Title: "Untitled",
			Director: { FirstName: "John", LastName: "Doe" }
		};

		describe("static", () => {
			beforeAll(() => {
				resetModel();

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
			beforeAll(() => {
				resetModel();

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

				expect(movie.Title).toBe(Alien.Title);
				expect(movie.Director.FirstName).toBe(Alien.Director.FirstName);
				expect(movie.Director.LastName).toBe(Alien.Director.LastName);
			});
		});
	});
});