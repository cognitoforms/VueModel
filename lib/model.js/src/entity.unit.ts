import { Model } from "./model";
import { Entity } from "./entity";

describe("Entity", () => {
	let Types: any = {};
	beforeAll(() => {
		new Model({
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
		})
	});

	it("can be extended and constructed", () => {
		const movie = new Types.Movie();

		expect(movie).toBeInstanceOf(Entity);

		expect(movie).toHaveProperty("Title");
		expect(movie).toHaveProperty("Director");
		expect(movie).toHaveProperty("ReleaseDate");
	});

	it("can be constructed with initial state", () => {
		const state = {
			Title: "Ace in the Hole",
			Director: { FirstName: "Billy", LastName: "Wilder" }
		};
		const movie = new Types.Movie(state);

		expect(movie.Title).toBe(state.Title);
		expect(movie.Director.FirstName).toBe(state.Director.FirstName);
		expect(movie.Director.LastName).toBe(state.Director.LastName);
	});

	const Alien = {
		Title: "Alien",
		Director: { FirstName: "Ridley", LastName: "Scott" }
	};

	it("can be deserialized", () => {
		const movie = new Types.Movie(Alien);

		expect(movie.serialize()).toEqual(Alien);
	});

	describe("default value", () => {
		const defaultTitle = "Untitled";
		const defaultDirector = { FirstName: "John", LastName: "Doe" };
		beforeAll(() => {
			Types.Person.meta.extend({
				FirstName: { default: () => defaultDirector.FirstName },
				LastName: { default: () => defaultDirector.LastName }
			});

			Types.Movie.meta.extend({
				Title: { default: () => defaultTitle },
				Director: { default: () => new Types.Person() }
			});
		});

		it("overwrites initial state of new entity", () => {
			const movie = new Types.Movie(Alien);

			expect(movie.Title).toBe(defaultTitle);

			expect(movie.Director.FirstName).toBe(defaultDirector.FirstName);
			expect(movie.Director.LastName).toBe(defaultDirector.LastName);
		});

		it("does not overwrite initial state of existing entity", () => {
			const movie = new Types.Movie("1", Alien);

			expect(movie.Title).toBe(Alien.Title);

			expect(movie.Director.FirstName).toBe(Alien.Director.FirstName);
			expect(movie.Director.LastName).toBe(Alien.Director.LastName);
		});
	});
});